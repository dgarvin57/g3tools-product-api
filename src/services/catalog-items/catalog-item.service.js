const CatalogItemsApi = require("./CatalogItemsApi");
const CatalogItemApi = require("./CatalogItemsApi");

//  * @param  {String} store           Store to use in checking fees. Required.
//  * @param  {String} idType          Valid options: ASIN, UPC. Required.
//  * @param  {Object} ids             CSV list of items to check. Required.
//  * @param  {Array}  includedData    Data to return. Optional.
//  * @param  {Array}  brandNames      Brand names to find matching items. Optional.
//  * @param  {Array}  keywords        Keywords to use to find matching items. Optional.
//  * @return {JSON}                   Catalog information as specified by includedData

// Get catalog item info by keywords
exports.getCatalogItemsByKeywords = async (props) => {
  const apiClass = new CatalogItemsApi({ ...props, using: "keywords" });
  // Return response to caller
  return apiClass.getCatalogItems();
};

// Get catalog item info by brand name
exports.getCatalogItemsByBrandNames = async (props) => {
  const apiClass = new CatalogItemsApi({ ...props, using: "brand names" });
  // Return response to caller
  return apiClass.getCatalogItems();
};

// Get catalog item info by asins
exports.getCatalogItemsByAsin = async (props) => {
  const apiClass = new CatalogItemsApi({
    ...props,
    idType: "ASIN",
    using: "asins",
  });
  // Return response to caller
  return apiClass.getCatalogItems();
};

// Get catalog item info by upc
exports.getCatalogItemsByUpc = async (props) => {
  const apiClass = new CatalogItemsApi({
    ...props,
    idType: "UPC",
    using: "UPC",
  });
  // Return response to caller
  return apiClass.getCatalogItems();
};

// Get catalog item info by sku
exports.getCatalogItemsBySku = async (props) => {
  const apiClass = new CatalogItemsApi({
    ...props,
    idType: "SKU",
    using: "sku",
  });
  // Return response to caller
  return apiClass.getCatalogItems();
};
