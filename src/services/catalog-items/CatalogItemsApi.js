const config = require("../../../config");
const spUtils = require("../../utils/sp-api-utils");
const dateUtils = require("../../utils/date-utils");

// Endpoints and versions
// "catalogItems": {
//   "__versions": ["v0", "2020-12-01", "2022-04-01"],
//   "__operations": [
//     "listCatalogItems",       // Not found
//     "getCatalogItem",         // Don't use this
//     "listCatalogCategories",  // Not found
//     "searchCatalogItems"      // Use this
//   ],
//   "v0": {},
//   "2020-12-01": {},
//   "2022-04-01": {}
// },

// Expected model for passed in ids:
//   738420093004, 738420095008, 600549049173, 600549049241

/**
 * Purpose: Given a store, a list (max 20) of ASINs or UPCs, and an id type,
 * return catalog item information.
 *
 */
/**
 * Class to get catalog item information from Amazon's SP-API
 * @param  {String} store           Store to use in checking fees. Required.
 * @param  {String} idType          Valid options: ASIN, UPC, SKU, UPC. Required.
 * @param  {Object} ids             CSV list of items to check. Required.
 * @param  {Array}  includedData    Data to return. Optional.
 * @param  {Array}  brandNames      Brand names to find matching items. Optional.
 * @param  {Array}  keywords        Keywords to use to find matching items. Optional.
 * @param  {string} using           How are we searching for catalog items (keywords, brandNames, Asins, UPCs)
 * @param  {string} nextToken       Pass in nextToken to retrieve next page of data (all other parameters ignored)
 * @return {JSON}                   Catalog information as specified by includedData
 */
module.exports = class CatalogItemsApi {
  constructor(props) {
    const {
      using,
      store,
      idType,
      ids,
      includedData,
      brandNames,
      keywords,
      nextToken,
    } = props;
    const parms = config.catalogItems;
    // Validate input
    if (!using) {
      throw new Error("Using parameter is required for CatalogItemsApi");
    }
    if (!store) {
      throw new Error("Store is required for CatalogItemsApi");
    }
    // Must have keywords, brandNames, or ids
    if (!ids && !brandNames && !keywords) {
      throw new Error(
        "Must include a list of key words, brand names, or item ids (Asins or UPCs)"
      );
    }
    // Must have keywords if using brandNames
    if (brandNames & !keywords) {
      throw new Error("Must also use keywords if searching by brand names");
    }
    if (ids) {
      if (!idType) {
        throw new Error(
          "IdType is required for CatalogItemsApi. Expected values: ASIN, UPC"
        );
      }
      // Verify ids and idType at the point we are wanting using them
      if (!ids || ids.length === 0) {
        throw new Error("List of id's cannot be empty for CatalogItemsApi");
      }
      // Verify passed in ids array is less than batchsize;
      if (ids?.length > parms.catalogBatchSize) {
        throw new Error(
          `The list of ids (${ids.length}) exceeds the maximum allowed batch size (${parms.catalogBatchSize})`
        );
      }
    }
    // Input ok
    this.nextToken = nextToken ? nextToken : "";
    this.using = using;
    this.store = store;
    this.ids = ids;
    this.idType = idType;
    this.includedData = includedData || [
      "attributes",
      "dimensions",
      "identifiers",
      "images",
      "productTypes",
      "relationships",
      "salesRanks",
      "summaries",
    ];
    this.brandNames = brandNames;
    this.keywords = keywords;
    log.category = "product";

    this.initialize();
  }

  // ***************************************
  // ***************************************
  //   METHODS
  // ***************************************

  async initialize() {
    // Get selling partner and marketplace ids from config for this store
    const spObj = spUtils.getSellingPartner({
      store: this.store,
      endpointVersions: { catalogItems: "2022-04-01" },
    });
    this.marketplaceIds = spObj.marketplaceIds;
    this.sp = spObj.sp;
    this.sellerId = spObj.sellerId;
  }

  /**
   * Entry point into class methods. Retrieve restrictions data from SP-API
   * @returns Writes data out to files in filesystem
   */
  async getCatalogItems() {
    let tryCount = config.app.maxErrorRetryCount;
    let errCount = 1;
    do {
      try {
        const res = await this.getCatalogItemsHelper();
        return res;
        return;
      } catch (err) {
        if (errCount < tryCount) {
          log.error(
            `Error getting catalog item data. Holding for ${config.app.waitTimeBetweenErrors} seconds before trying again (${errCount} of ${tryCount}). ${err}`
          );
          await dateUtils.sleep(config.app.waitTimeBetweenErrors * 1000);
          errCount++;
        } else {
          // Too many errors
          log.error(
            `Error getting catelog item data. Try ${errCount} of ${tryCount}. ${err}`
          );
          throw new Error(err);
        }
      }
    } while (1 === 1);
    return;
  }

  // Entry point into class methods. Retrieve catalog item data from SP-API
  // Download catalog items data
  async getCatalogItems() {
    const parms = config.catalogItems;
    let results = [];
    let counter = 1;
    let logMaxExceeded = false;
    let pagination = {};
    let numberOfResults = 0;
    log.info(
      `Downloading catalog info by '${this.using}' using store: ${this.store}`
    );
    // Main loop for SP-API calls: Keep calling as long as nextToken exists
    do {
      // Download from SP-API until done
      const response = await this.searchCatalogItems();
      this.nextToken = response?.pagination?.nextToken || undefined;
      if (counter === 1 && response?.pagination?.previousToken) {
        // Save the first previousToken if exists
        pagination.previousToken = response?.pagination?.previousToken;
      }
      if (this.nextToken) {
        // Save nextToken if exists
        pagination.nextToken = this.nextToken;
      }
      numberOfResults = response.numberOfResults;
      // Save response
      results = [...results, ...response.items];
      // Pause
      //await dateUtils.sleep(parms.waitTimeBetweenApiCalls * 1000);
      // How many downloads to expect?
      let expectedBatches = numberOfResults / parms.catalogBatchSize;
      if (numberOfResults > parms.maxItemsReturned) {
        // More than one page
        expectedBatches = Math.ceil(
          parms.maxItemsReturned / parms.catalogBatchSize
        );
        if (expectedBatches < 1) {
          expectedBatches = 1;
        }
        if (!logMaxExceeded) {
          log.info(
            `Number of results (${numberOfResults}) exceed maximum allowed (${parms.maxItemsReturned}). Call with nextToken to retrieve more.`
          );
          logMaxExceeded = true;
        }
      }
      log.debug(
        `Downloaded ${counter} of ${expectedBatches} Catalog Item batches`
      );
      //}
      // If not more data, return
      if (!this.nextToken) break;
      // If we reached our max size of response, return with next token
      if (results.length >= parms.maxItemsReturned) break;
      counter++;
    } while (this.nextToken);
    // *********************
    // Return results
    log.debug(`pagination: ${Object.keys(pagination)}`);
    // Calculate page number and position
    const totalPages = Math.ceil(numberOfResults / parms.maxItemsReturned);
    return {
      results,
      pagination,
      numberOfResults: numberOfResults,
      totalPages: totalPages,
      pageSize: parms.maxItemsReturned,
      searchBy: this.using,
      store: this.store,
    };
  }

  // ***************************************
  // ***************************************
  //   API CALL METHODS
  // ***************************************

  // ***************************************
  // searchCatalogItems: Get item matching a either a list of identifiers or keywords (up to 20 identifiers)
  // TODO: Handle "Invalid ASIN" error.
  // TODO: Maybe mark progress internally using database table. Then, move the batching of the ids into groups of 20 into this class.
  async searchCatalogItems() {
    let res = await this.sp.callAPI({
      operation: "catalogItems.searchCatalogItems",
      query: {
        marketplaceIds: this.marketplaceIds,
        identifiers: this.ids?.join(","),
        identifiersType: this.idType, // SKU, ASIN, UPC
        sellerId: this.sellerId,
        brandNames: this.brandNames,
        keywords: this.keywords,
        includedData: this.includedData,
        pageSize: 20,
        pageToken: this.nextToken,
      },
    });
    return res;
  }
};
