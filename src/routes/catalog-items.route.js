const express = require("express");
const router = express.Router();
const service = require("../services/catalog-items/catalog-item.service");

// *****************************************************************
//                      CatalogItems SP-API ROUTE
//  endpoint: catalog-items
// *****************************************************************
// Amazon's SP-API CatalogItems API retrieves catalog info for a given
// list of Asins or UPCs. Can also pass in a list of brand names or
// keywords. Will return json based based on includedData array or all
// catalog information if no includedData is provided

// *****************************************************************
//  API: CatalogItems

// Get catalog info for one asin

// Get catalog info

// Get catalog info for one upc

// Get catalog info

//  * Class to get catalog item information from Amazon's SP-API
//  * @param  {String} idType          Valid options: ASIN, UPC. Required.
//  * @param  {Object} ids             CSV list of items to check. Required.
//  * @param  {String} store           Store to use in checking fees. Required.
//  * @param  {Array}  includedData    Data to return. Optional.
//  * @param  {Array}  brandNames      Brand names to find matching items. Optional.
//  * @param  {Array}  keywords        Keywords to use to find matching items. Optional.

// Default endpoint: Invalid
router.post("/", async (req, res, next) => {
  try {
    return res
      .status(400)
      .send({ message: "API call catalog-items has no default endpoint" });
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
});

// Search for items by keywords and return catalog item info (max 20)
router.post("/keyword", async (req, res, next) => {
  try {
    const response = await service.getCatalogItemsByKeywords(req.body);
    return res.status(200).send({ response });
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
});

// Refine keyword search by including brand names and return catalog item info (max 20)
router.post("/brand-name", async (req, res, next) => {
  try {
    const response = await service.getCatalogItemsByBrandNames(req.body);
    return res.status(200).send({ response });
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
});

// Get catalog items for one or more asins
router.post("/asin", async (req, res, next) => {
  try {
    const response = await service.getCatalogItemsByAsin(req.body);
    return res.status(200).send({ response });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

// Get catalog items for one or more upc
router.post("/upc", async (req, res, next) => {
  try {
    const response = await service.getCatalogItemsByUpc(req.body);
    return res.status(200).send({ response });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

// Get catalog items for one or more sku
router.post("/sku", async (req, res, next) => {
  try {
    const response = await service.getCatalogItemsBySku(req.body);
    return res.status(200).send({ response });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

module.exports = router;

// ASIN	Amazon Standard Identification Number.
// EAN	European Article Number.
// GTIN	Global Trade Item Number.
// ISBN	International Standard Book Number.
// JAN	Japanese Article Number.
// MINSAN	Minsan Code.
// SKU	Stock Keeping Unit, a seller-specified identifier for an Amazon listing. Note: Must be accompanied by sellerId.
// UPC	Universal Product Code.
