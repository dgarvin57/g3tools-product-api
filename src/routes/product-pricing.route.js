const express = require("express");
const router = express.Router();
const service = require("../services/product-pricing/product-pricing.service");

// *****************************************************************
//                      ProductPricing SP-API ROUTE
//  endpoint: product-pricing
// *****************************************************************
// Amazon's SP-API ProductPricing API retrieves product pricing and
// offer information for Amazon Marketplace products.

// *****************************************************************

// Default endpoint: Invalid
router.post("/", async (req, res, next) => {
  try {
    const response = await service.getProductPricing(req.body);
    return res.status(200).send({ response });
    // .status(400)
    // .send({ message: "API call product-pricing has no default endpoint" });
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
});

// Get pricing for a single asin/sku (calls getPricing alternative method)
router.post("/pricing", async (req, res, next) => {
  try {
    const response = await service.getPricing(req.body);
    return res.status(200).send({ response });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

// Get competitive pricing for a list of asins (calls getCompetitivePricing)
router.post("/competitive-pricing", async (req, res, next) => {
  try {
    const response = await service.getCompetitivePricing(req.body);
    return res.status(200).send({ response });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

// Get lowest offers for a single asin
router.post("/item-offers", async (req, res, next) => {
  try {
    const response = await service.getItemOffers(req.body);
    return res.status(200).send({ response });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

// Get lowest offers for a single sku
router.post("/listing-offers", async (req, res, next) => {
  try {
    const response = await service.getListingOffers(req.body);
    return res.status(200).send({ response });
  } catch (err) {
    return res.status(400).send({ error: err.message });
  }
});

module.exports = router;
