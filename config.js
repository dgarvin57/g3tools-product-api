const dotenv = require("dotenv");
dotenv.config();

const config = {
  app: {
    writeToPlatform: "filesystem", // filesystem Or s3
  },
  currEnv: process.env.NODE_ENV,
  port: process.env.PORT || 3000,
  dbLoadBatchSize: 10000,
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DATABASE,
    user: process.env.USER,
    password: process.env.PASSWORD,
    connectionLimit: 10,
  },
  stores: [
    {
      store: "AZN-LAP",
      SELLER_ID: process.env.LAP_SELLER_ID,
      MARKETPLACE_ID: process.env.LAP_MARKETPLACE_ID,
      SP_APP_CLIENT_ID: process.env.LAP_SELLING_PARTNER_APP_CLIENT_ID,
      SP_APP_CLIENT_SECRET: process.env.LAP_SELLING_PARTNER_APP_CLIENT_SECRET,
      SP_API_REFRESH_TOKEN: process.env.LAP_SP_API_REFRESH_TOKEN,
    },
    {
      store: "AZN-SBS",
      SELLER_ID: process.env.SBS_SELLER_ID,
      MARKETPLACE_ID: process.env.SBS_MARKETPLACE_ID,
      SP_APP_CLIENT_ID: process.env.SBS_SELLING_PARTNER_APP_CLIENT_ID,
      SP_APP_CLIENT_SECRET: process.env.SBS_SELLING_PARTNER_APP_CLIENT_SECRET,
      SP_API_REFRESH_TOKEN: process.env.SBS_SP_API_REFRESH_TOKEN,
    },
  ],
  awsS3: {
    BUCKET: "g3tools-product-api",
    STATIC_BUCKET: "g3tools-product-api-static",
    STATIC_BUCKET_DELETED: "g3tools-product-api-static-deleted",
    REGION: "us-west-2",
    AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  },
  fileUploads: {
    MAX_SIZE: 20000000,
    FILE_TYPES: ["image/jpeg", "image/png", "image/gif", "video/mp4"],
  },
  productFees: {
    waitTimeBetweenApiCalls: 2,
  },
  listPerPage: 50,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  accessTokenExpiresInMinutes: 35,
  refreshTokenExpiresInHours: 23,
  sendGridApiKey: process.env.SENDGRID_API_KEY,
  notifyEmail: "dgarvin57@gmail.com",
  pruneExpiredTokensHours: 12,
  skipFieldsOnDbUpdate: [
    "id",
    "ts",
    "created_on",
    "createdOn",
    "created_by",
    "createdBy",
    "modified_on",
    "modifiedOn",
    "modified_by",
    "modifiedBy",
    "$logEvent",
  ],
  skipFieldsforLogs: ["version", "lastEditedBy", "lastUpdatedDate"],
  mws: {
    throttleWaitTimeInSeconds: 120,
    throttleLimit: 20,
    batchPauseSeconds: 1.5,
  },
};

module.exports = config;
