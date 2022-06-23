const app = require("./app");
const awsFileUtils = require("./utils/aws-file-utils.js");

const currDate = new Date();
const port = process.env.PORT !== undefined ? process.env.PORT : 3000;
global.__basedir = __dirname;

// Create S3 bucket for files, since Heroku doesn't have a usable file system
awsFileUtils.createBucket();

// Start server
app.listen(port, () => {
  console.log(`g3tools-product-api on port ${port} at ${currDate}`);
  log.info(`g3tools-product-api on port ${port} at ${currDate}`);
});

// const currDate = new Date()
// const port = process.env.PORT !== undefined ? process.env.PORT : 3000

// Default route
app.get("/", (req, res) =>
  res.json({
    status: "ok",
    message: `g3tools-product-api listening at ${currDate}...`,
  })
);

// Default route
app.get("/test", (req, res) =>
  res.json({
    status: "ok",
    message: `test received ${currDate}...`,
  })
);
