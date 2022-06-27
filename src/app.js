const express = require("express");
const app = express();
require("../logger");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const productFeesRoute = require("./routes/product-fees.route");
const catalogItemsRoute = require("./routes/catalog-items.route");
const restrictionsRoute = require("./routes/restrictions.route");
const productPricingRoute = require("./routes/product-pricing.route");

// **************************************************************************
// Change log
// 06/21/22: v00.01 - Initial create
// 06/22/22: v00.02 - Finished product-fees endpoint
// 06/27/22: Moved all code into g3tools-api new endpoints. Archiving this code.
// **************************************************************************

app.use(express.static(path.join(__dirname, "static")));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());
// app.use(
//   cors({
//     credentials: true,
//     origin: [
//       "https://g3tools-ui.herokuapp.com",
//       "https://www.g3tools.co",
//       "www.g3tools.co",
//       "http://localhost:8080",
//     ],
//   })
// );
//app.options("*", cors());

// Routes
app.use("/restrictions", restrictionsRoute);
app.use("/product-fees", productFeesRoute);
app.use("/catalog-items", catalogItemsRoute);
app.use("/product-pricing", productPricingRoute);

/* Error handler middleware */
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_TYPES") {
    res.status(422).json({ error: "Only images are allowed" });
    return;
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(422).json({
      error: `File too large to upload. Max size is ${
        config.fileUploads.MAX_SIZE / 1000 / 1000
      }MB`,
    });
    return;
  }
  log.debug(`app.js, error middleware - err: ${err}`);
  const statusCode = err.statusCode || 500;
  log.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });

  return;
});

module.exports = app;
