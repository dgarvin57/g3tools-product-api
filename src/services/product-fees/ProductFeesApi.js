const SellingPartnerAPI = require("amazon-sp-api");
const fileUtils = require("../../utils/file-utils");
const config = require("../../../config");
const spUtils = require("../../utils/sp-api-utils");
const dateUtils = require("../../utils/date-utils");

// "productFees": {
//   "__versions": ["v0"],
//   "__operations": [
//     "getMyFeesEstimateForSKU",
//     "getMyFeesEstimateForASIN",
//     "getMyFeesEstimates"
//   ],
//   "v0": {}
// },

// Input model for single item (asin or seller sku):
// {
//     "MarketplaceId": "ATVPDKIKX0DER",
//     "IsAmazonFulfilled": true,
//     "ListingPrice": 22.00,
//     "ListingPriceCurrencyCode": "USD",
//     "Shipping": 0.00,
//     "ShippingCurrencyCode": "USD",
//     "Identifier": "B08C78Q6CB"
// }
//
// Input model for a list of items:
// [
//   {
//     "MarketplaceId": "ATVPDKIKX0DER",
//     "IsAmazonFulfilled": true,
//     "ListingPrice": 43.22,
//     "ListingPriceCurrencyCode": "USD",
//     "Shipping": 0,
//     "ShippingCurrencyCode": "USD",
//     "Identifier": "B07YT5Q51Y",
//     "IdType": "ASIN"
//   },
// ]

module.exports = class ProductFeesApi {
  constructor(props) {
    const { idType, ids, store } = props;
    const arrIds = Array.isArray(ids) ? ids : [ids];
    // Validate input
    switch (idType.toLowerCase()) {
      case "asin":
      case "sku":
        // Ensure we have only one object if asin or sku
        if (!arrIds || arrIds.length !== 1) {
          throw new Error(
            `Must provide a single id object in 'ids' array if id type is '${idType}'.`
          );
        }
        // Ensure we have identifier
        if (!ids.Identifier) {
          throw new Error(
            `Please provide the following Identifier: '${idType}'.`
          );
        }
      case "items":
        // Ensure we have at least one object in ids array
        if (!arrIds.length === 0) {
          throw new Error(
            `Must provide an at least one id object in 'ids' array if id type is '${idType}'.`
          );
        }
    }
    // Input ok
    this.items = arrIds;
    this.idType = idType;
    this.store = store || config.stores[0];
    this.nextToken = "";
    log.category = "product-fees";
    this.sp;

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
      endpointVersions: { productFees: "v0" },
    });
    this.marketplaceIds = spObj.marketplaceIds;
    this.sp = spObj.sp;

    // Delete data files for this store
    // let base = __basedir.replace(/\\/g, "/");
    // let folder = config.product.productDataFolder;
    // let filenamePart = "product-fees";
    // let path = `${base}${folder}/${this.store}-${filenamePart}*.json`;
    // fileUtils.deleteFiles(path);
  }

  // Main loop: Download product fees (keep calling if nextToken exists)
  async getProductFees() {
    const parms = config.productFees;
    let result = [];
    log.info(`Downloading ${this.type} from Amazon store: ${this.store}`);
    let counter = 1;
    do {
      // Download from MWS
      const response = await this.getMyFeesEstimates();
      this.nextToken = response?.NextToken || undefined;
      // Save response
      result = [...result, ...response];
      // Pause
      await dateUtils.sleep(parms.waitTimeBetweenApiCalls * 1000);
      // If not more data, return
      if (!this.nextToken) return result;
      counter++;
    } while (this.nextToken);
    // Fallback return
    return result;
  }

  // ***************************************
  // ***************************************
  //   API CALL METHODS
  // ***************************************

  // ***************************************
  // getMyFeesEstimates: Get fees for multiple identifiers
  async getMyFeesEstimates() {
    // Use default store and default marketplace id from config file if not provided in items
    this.defaultMarketplaceId = config.stores[0].MARKETPLACE_ID;
    let body = [];
    for (let item of this.items) {
      const bodyItem = {
        FeesEstimateRequest: {
          MarketplaceId: item.MarketplaceId || this.defaultMarketplaceId,
          IsAmazonFulfilled: item.IsAmazonFulfilled,
          PriceToEstimateFees: {
            ListingPrice: {
              CurrencyCode: item.ListingPriceCurrencyCode,
              Amount: item.ListingPrice,
            },
            Shipping: {
              CurrencyCode: item.ShippingCurrencyCode,
              Amount: item.Shipping,
            },
          },
          Identifier: item.Identifier,
        },
        IdType: item.IdType || this.idType,
        IdValue: item.Identifier,
      };
      body.push(bodyItem);
    }
    let res = await this.sp.callAPI({
      operation: "productFees.getMyFeesEstimates",
      body,
    });
    return res;
  }

  // getMyFeesEstimateByASIN: Get fees for single ASIN
  async getMyFeesEstimateForASIN() {
    const item = this.items[0];
    const asin = item.Identifier;
    const body = {
      FeesEstimateRequest: {
        MarketplaceId: item.MarketplaceId,
        IsAmazonFulfilled: item.IsAmazonFulfilled, // Different fees depending on fba or merchant
        PriceToEstimateFees: {
          ListingPrice: {
            CurrencyCode: item.ListingPriceCurrencyCode,
            Amount: item.ListingPrice,
          },
          Shipping: {
            CurrencyCode: item.ShippingCurrencyCode,
            Amount: item.Shipping,
          },
        },
        Identifier: asin,
      },
    };
    // Call SP-API
    let res = await this.sp.callAPI({
      operation: "productFees.getMyFeesEstimateForASIN",
      path: {
        Asin: asin,
      },
      body,
    });
    return res;
  }

  // ***************************************
  // getMyFeesEstimateBySKU: Get fees for single SKU
  async getMyFeesEstimateForSKU() {
    const item = this.items[0];
    const sku = item.Identifier;
    const body = {
      FeesEstimateRequest: {
        MarketplaceId: item.MarketplaceId,
        IsAmazonFulfilled: item.IsAmazonFulfilled, // Different fees depending on fba or merchant
        PriceToEstimateFees: {
          ListingPrice: {
            CurrencyCode: item.ListingPriceCurrencyCode,
            Amount: item.ListingPrice,
          },
          Shipping: {
            CurrencyCode: item.ShippingCurrencyCode,
            Amount: item.Shipping,
          },
        },
        Identifier: sku,
      },
    };
    // Call SP-API
    let res = await this.sp.callAPI({
      operation: "productFees.getMyFeesEstimateForSKU",
      path: {
        SellerSKU: sku,
      },
      body,
    });
    return res;
  }
};
