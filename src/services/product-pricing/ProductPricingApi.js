const config = require("../../../config");
const spUtils = require("../../utils/sp-api-utils");
const dateUtils = require("../../utils/date-utils");

// "productPricing": {
//   "__versions": ["v0"],
//   "__operations": [
//     "getPricing",
//     "getCompetitivePricing", (may need this)
//     "getListingOffers",
//     "getItemOffers",
//     "getItemOffersBatch",  (use this with passing asins)
//     "getListingOffersBatch" (Pass in skus, but this has problems)
//   ],
//   "v0": {}
// },

/**
 * Purpose: Given a store, a list (max 20) of ASINs or UPCs, and an id type,
 * return pricing  information.
 * @param  {String} store           Amazon store (required).
 * @param  {Object} ids             CSV list of items to check (required).
 * @param  {String} idType          Valid options: ASIN, UPC, SKU, (required).
 * @param  {string} itemCondition   Product condition code, like new_new (optional)
 * @param  {string} customerType    Customer type, like Consumer or Business (optional)
 * @return {JSON}                   Catalog information as specified by includedData
 */
module.exports = class ProductPricingApi {
  constructor(props) {
    const { store, ids, idType, itemCondition, customerType } = props;
    const parms = config.productPricing;
    // Validate input
    if (!store) {
      throw new Error("Store is required for ProductPricingApi");
    }
    // Verify ids exist
    if (!ids || ids.length === 0) {
      throw new Error("List of id's cannot be empty for ProductPricingApi");
    }
    // Verify passed in ids array is less than batchsize;
    if (ids?.length > parms.productPricingBatchSize) {
      throw new Error(
        `The list of ids (${ids.length}) exceeds the maximum allowed batch size (${parms.productPricingBatchSize})`
      );
    }
    if (!idType) {
      throw new Error(
        "IdType is required for ProductPricingApi. Expected values: ASIN, SKU, or UPC"
      );
    }

    // Set property defaults
    (this.store = store), (this.ids = ids);
    this.idType = idType;
    this.itemCondition = itemCondition;
    this.customerType = customerType;
    log.category = "product-pricing";

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
      endpointVersions: { productPricing: "v0" },
    });
    this.marketplaceIds = spObj.marketplaceIds;
    this.sp = spObj.sp;
    this.sellerId = spObj.sellerId;
  }

  /**
   * Entry point into class methods. Retrieve restrictions data from SP-API
   * @returns Writes data out to files in filesystem
   */
  async getProductPricing() {
    let tryCount = config.app.maxErrorRetryCount;
    let errCount = 1;
    do {
      try {
        const res = await this.getProductPricingHelper();
        return res;
      } catch (err) {
        if (errCount < tryCount) {
          log.error(
            `Error getting product pricing data. Holding for ${config.app.waitTimeBetweenErrors} seconds before trying again (${errCount} of ${tryCount}). ${err}`
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
  async getProductPricingHelper() {
    const parms = config.productPricing;
    let results = [];
    let numberOfResults = 0;
    log.info(`Downloading product pricing by for store: ${this.store}`);
    // Main loop for SP-API calls: Keep calling as long as nextToken exists
    do {
      // Download from SP-API until done
      const response = await this.getItemOffersBatch();
      this.nextToken = response.nextToken || undefined;
      numberOfResults = response.responses.length;
      // Save response
      results = [...results, ...response.responses];
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
      }
      // If not more data, return
      if (!this.nextToken) break;
      counter++;
    } while (this.nextToken);
    // *********************
    // Return results
    return {
      results,
      numberOfResults: results.length,
      conditionType: this.conditionType,
      store: this.store,
    };
  }

  // ***************************************
  // ***************************************
  //   API CALL METHODS
  // ***************************************

  // ***************************************
  // getItemOffersBatch: Returns the lowest priced offers for a batch of items based on ASIN (up to 20)
  async getItemOffersBatch() {
    // Build requests object
    let requests = [];
    for (let asin of this.ids) {
      const request = {
        uri: `/products/pricing/v0/items/${asin}/offers`,
        method: "GET",
        queryParams: {
          MarketplaceId: this.marketplaceIds,
          ItemCondition: this.itemCondition,
          CustomerType: this.customerType,
        },
      };
      requests.push(request);
    }
    // Call API
    let res = await this.sp.callAPI({
      operation: "productPricing.getItemOffersBatch",
      body: {
        requests,
      },
    });
    return res;
  }

  // ***************************************
  // getPricing: Get pricing for one or more ASINs or SKUs (up to 20 item id's)
  async getPricing() {
    let res = await this.sp.callAPI({
      operation: "productPricing.getPricing",
      query: {
        MarketplaceId: this.marketplaceIds,
        Asins: this.idType === "Asin" ? this.ids : null,
        Skus: this.idType === "Sku" ? this.ids : null,
        ItemType: this.idType,
        ItemCondition: this.itemCondition,
      },
    });
    return res;
    // Can't get this to work for multiple asins or skus as doc indicates (max 20).
    // But can get it to work with single asin or sku as a string array withone member.
  }

  // ***************************************
  // getCompetitivePricing: Returns competitive pricing information for a seller's
  // offer listings based on seller SKU or ASIN.
  async getCompetitivePricing() {
    let res = await this.sp.callAPI({
      operation: "productPricing.getCompetitivePricing",
      query: {
        MarketplaceId: this.marketplaceIds,
        Asins: this.idType === "Asin" ? this.ids : null,
        Skus: this.idType === "Sku" ? this.ids : null,
        ItemType: this.idType,
      },
    });
    return res;
  }

  // ***************************************
  // getListingOffers: Get lowest price offers for a single SKU
  async getListingOffers(props) {
    let res = await this.sp.callAPI({
      operation: "productPricing.getListingOffers",
      path: {
        SellerSKU: this.ids[0],
      },
      query: {
        MarketplaceId: this.marketplaceIds,
        ItemCondition: this.itemCondition,
      },
    });
    return res;
  }

  // ***************************************
  // getItemOffers: Get lowest price offers for a single ASIN
  async getItemOffers(props) {
    let res = await this.sp.callAPI({
      operation: "productPricing.getItemOffers",
      path: {
        Asin: this.ids[0],
      },
      query: {
        MarketplaceId: this.marketplaceIds,
        ItemCondition: this.itemCondition,
      },
    });
    return res;
  }
};
