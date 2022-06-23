const express = require("express");
const router = express.Router();
const service = require("../services/product-fees/product-fees.service");
const testData = require("../services/product-fees/product-fees-test-data");

// *****************************************************************
//                      ProductFees SP-API ROUTE
//  endpoint: product-fees
// *****************************************************************
// Amazon's SP-API ProductFees API retrieves fee detail for a single
// ASIN, a single SKU, or a combination of these. Must pass in information
// about each ASIN/SKU, such as listng price, shipping (if any), etc.

// *****************************************************************
//  API: ProductFees

// Get fees for list of items (max 20)
router.post("/", async (req, res, next) => {
  try {
    const items = req.body;
    if (!Array.isArray(items) || Object.keys(items).length === 0) {
      return res.status(400).send({
        message: `Incoming list of items must be an array with at least one item.`,
      });
    }
    if (items.length > 20) {
      return res.status(400).send({
        message: `Incoming list of ${items.length} items exceeded maximum of 20 items allowed.`,
      });
    }
    const response = await service.getFees({ items });
    return res.status(200).send({ response });
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
});

// Get fees for a single asin
router.post("/asin", async (req, res, next) => {
  try {
    const response = await service.getFeesForAsin({ item: req.body });
    return res.status(200).send({ response });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

// Get fees for a single sku
router.post("/sku", async (req, res, next) => {
  try {
    const response = await service.getFeesForSku({ item: req.body });
    return res.status(200).send({ response });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

// // Get fees test data
// router.post("/test-data", async (req, res, next) => {
//   try {
//     const response = await testData.createData();
//     return res.status(200).send({ response });
//   } catch (err) {
//     return res.status(400).send({ error: err.message });
//   }
// });

module.exports = router;
