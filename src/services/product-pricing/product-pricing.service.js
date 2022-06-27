const ProductPricingApi = require("./ProductPricingApi");

//  * @param  {String} store           Amazon store (required).
//  * @param  {Object} ids             CSV list of items to check (required).
//  * @param  {String} idType          Valid options: ASIN, UPC, SKU, (required).
//  * @param  {string} itemCondition   Product condition code, like new_new (optional)
//  * @param  {string} customerType    Customer type, like Consumer or Business (optional)

// Get item offer information for list of asins only (20 max)
exports.getProductPricing = async (props) => {
  const apiClass = new ProductPricingApi({ ...props });
  // Return response to caller
  return apiClass.getProductPricing();
};

// Get item offer information (using getPricing alternative method) for a sinle asin of sku
exports.getPricing = async (props) => {
  const apiClass = new ProductPricingApi({ ...props });
  // Return response to caller
  return apiClass.getPricing();
};

// Get competitive pricing info for single asin/sku
exports.getCompetitivePricing = async (props) => {
  const apiClass = new ProductPricingApi({ ...props });
  // Return response to caller
  return apiClass.getCompetitivePricing();
};

// Get lowest offers for single asin
exports.getItemOffers = async (props) => {
  const apiClass = new ProductPricingApi({ ...props, idType: "ASIN" });
  // Return response to caller
  return apiClass.getItemOffers();
};

// Get lowest offers for single sku
exports.getListingOffers = async (props) => {
  const apiClass = new ProductPricingApi({ ...props, idType: "SellerSKU" });
  // Return response to caller
  return apiClass.getListingOffers();
};
