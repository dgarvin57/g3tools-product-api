const express = require("express");
const router = express.Router();
const service = require("../services/listings-restrictions/restrictions.service");
const config = require("../../config");
const { max } = require("moment");

// *****************************************************************
//                      ListingsRestrictions SP-API ROUTE
//  endpoint: restrictions
// *****************************************************************
// Amazon's SP-API ListingsRestrictions returns restricted status of
// a passed in ASIN. Only handles one asin at a time.

// *****************************************************************
//  API: ListingsRestrictions

// Get fees for list of items (max 20)
router.post("/", async (req, res, next) => {
  try {
    const maxSize = config.listingsRestrictions.restrictionsBatchSize;
    const items = req.body.asins;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).send({
        message: `Must include a list with only one asin.`,
      });
    }
    if (items.length > maxSize) {
      log.warn(
        `Only ${maxSize} asins allowed in list. Processing first ${maxSize} only and ignoring the rest.`
      );
    }
    const response = await service.getRestrictions(req.body);
    return res.status(200).send({ response });
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
});

module.exports = router;
