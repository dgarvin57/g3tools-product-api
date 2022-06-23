const config = require("../../../config");
const sqlUtils = require("../../utils/sql-utils");
const fileUtils = require("../../utils/file-utils");

// Get 20 asins from database and format into product-fees FeesEstimateRequest json
// Model
// {
//     "MarketplaceId": "ATVPDKIKX0DER",
//     "IsAmazonFulfilled": true,
//     "ListingPrice": 22.00,
//     "ListingPriceCurrencyCode": "USD",
//     "Shipping": 0.00,
//     "ShippingCurrencyCode": "USD",
//     "Identifier": "B08C78Q6CB"
//     "IdType": "ASIN"   (ASIN or SellerSKU)
// }

exports.createData = async () => {
  // Get data from db
  const sql = `SELECT 
  CAST(CASE WHEN iss.fulfillment = 'FBA' THEN TRUE ELSE FALSE END AS SIGNED) AS \`IsAmazonFulfilled\`,
  iss.price AS \`ListingPrice\`,
  'USD' AS \`ListingPriceCurrencyCode\`,
  0.00 AS \`Shipping\`,
  'USD' AS \`ShippingCurrencyCode\`,
  iss.amazon_asin AS \`Identifier\`,
  'ASIN' AS \`IdType\`
  FROM g3tools.inventory_snapshot iss WHERE iss.qty_available > 0 ORDER BY id DESC LIMIT 20;
`;
  const testData = await sqlUtils.queryAsync(sql);
  // Construct request list
  const requestList = [];
  for (let item of testData) {
    const request = {
      MarketplaceId: config.stores[0].MARKETPLACE_ID,
      IsAmazonFilfilled: item.IsAmazonFulfilled,
      ListingPrice: Number(item.ListingPrice),
      ListingPriceCurrencyCode: item.ListingPriceCurrencyCode,
      Shipping: Number(item.Shipping),
      ShippingCurrencyCode: item.ShippingCurrencyCode,
      Identifier: item.Identifier,
      IdType: item.IdType,
    };
    // Add to list
    requestList.push(request);
  }
  // Write out to file
  const filepath = `${__basedir}/services/product-fees/product-fees-test-data.json`;
  await fileUtils.saveFile(filepath, JSON.stringify(requestList));
  return `Successfully saved test data into ${filepath}`;
};
