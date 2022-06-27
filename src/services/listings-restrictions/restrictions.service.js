const ListingsRestrictionsApi = require("./ListingsRestrictionsApi");

// Get restriction status for asin
exports.getRestrictions = async (props) => {
  const apiClass = new ListingsRestrictionsApi(props);
  // Return response to caller
  return apiClass.getRestrictions();
};
