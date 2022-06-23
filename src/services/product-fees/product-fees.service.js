const ProductFeesApi = require("./ProductFeesApi");

// Get product fees for an array of item objects
// Or, get product fees for a single ASIN
// Or, get product fees for a single SKU

// Expecting object:
//   {
//     "MarketplaceId": "ATVPDKIKX0DER",
//     "IsAmazonFilfilled": 1,
//     "ListingPrice": 43.22,
//     "ListingPriceCurrencyCode": "USD",
//     "Shipping": 0,
//     "ShippingCurrencyCode": "USD",
//     "Identifier": "B07YT5Q51Y",
//     "IdType": "ASIN"
//   },

// Get product fees for a single Asin
exports.getFeesForAsin = async (props) => {
  const { item } = props;
  // Request fees for asin from SP-API
  const productFeesApi = new ProductFeesApi({ idType: "ASIN", ids: item });
  // Return response to caller
  return productFeesApi.getMyFeesEstimateForASIN();
};

// Get product fees for a single Sku
exports.getFeesForSku = async (props) => {
  const { item } = props;
  // Request fees for sku from SP-API
  const productFeesApi = new ProductFeesApi({ idType: "SellerSKU", ids: item });
  // Return response to caller
  return productFeesApi.getMyFeesEstimateForSKU();
};

// Get product fees for up to 20 asins or skus
// Expecting an array of the above object
exports.getFees = async (props) => {
  const { items } = props;
  // Request fees for sku from SP-API
  const productFeesApi = new ProductFeesApi({ idType: "", ids: items });
  // Return response to caller
  return productFeesApi.getProductFees();
};
