const SellingPartnerAPI = require("amazon-sp-api");
const config = require("../../../config");
const spUtils = require("../../utils/sp-api-utils");

// Endpoints and versions
//   "listingsRestrictions": {
//     "__versions": ["2021-08-01"],
//     "__operations": ["getListingsRestrictions"],
//     "2021-08-01": {}
//   },

module.exports = class ListingsRestrictionsApi {
  constructor(props) {
    const { asins, store, conditionType } = props;
    // Validate input
    if (!asins) {
      throw new Error("Asin is required for ListingsRestritionsApi");
    }
    if (!store) {
      throw new Error("Store is required for CatalogItemsApi");
    }
    // Input ok
    this.asins = asins;
    this.store = store;
    this.conditionType = conditionType || "new_new";
    log.category = "listings";

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
      endpointVersions: { listingsRestrictions: "2021-08-01" },
    });
    this.marketplaceIds = spObj.marketplaceIds;
    this.sp = spObj.sp;
    this.sellerId = spObj.sellerId;
  }

  /**
   * Entry point into class methods. Retrieve restrictions data from SP-API
   * @returns Writes data out to files in filesystem
   */
  async getRestrictions() {
    let tryCount = config.app.maxErrorRetryCount;
    let errCount = 1;
    do {
      try {
        const res = await this.getRestrictionsHelper();
        return res;
        return;
      } catch (err) {
        if (errCount < tryCount) {
          log.error(
            `Error getting restrictions data. Holding for ${config.app.waitTimeBetweenErrors} seconds before trying again (${errCount} of ${tryCount}). ${err}`
          );
          await dateUtils.sleep(config.app.waitTimeBetweenErrors * 1000);
          errCount++;
        } else {
          // Too many errors
          log.error(
            `Error getting restrictions data. Try ${errCount} of ${tryCount}. ${err}`
          );
          throw new Error(err);
        }
      }
    } while (1 === 1);
    return;
  }

  async getRestrictionsHelper() {
    const parms = config.listingsRestrictions;
    // Loop through asin list if more than one
    let results = [];
    const maxSize = parms.restrictionsBatchSize;
    // Only take up to maxSize
    const chunk =
      this.asins.length > maxSize ? this.asins.slice(0, maxSize) : this.asins;
    log.info(
      `Downloading Restrictions for ${chunk.length} ${
        this.asins.length > 1 ? "Asins" : "Asin"
      }`
    );
    for (let asin of chunk) {
      const res = await this.callApi();
      const result = {
        asin,
        result: res.restrictions.length === 0 ? "Ok" : res,
      };
      results = [...results, result];
    }
    // Save response
    return {
      results,
      numberOfResults: results.length,
      conditionType: this.conditionType,
      store: this.store,
    };

    return results;
  }

  // ***************************************
  // ***************************************
  //   API CALL METHODS
  // ***************************************

  // Call api for new condition passing in parameters
  async callApi() {
    let res = await this.sp.callAPI({
      operation: "listingsRestrictions.getListingsRestrictions",
      query: {
        asin: this.asins[0],
        marketplaceIds: this.marketplaceIds,
        sellerId: this.sellerId,
        conditionType: this.conditionType,
      },
    });
    return res;
  }
};
