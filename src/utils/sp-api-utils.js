const SellingPartnerAPI = require("amazon-sp-api");
const config = require("../../config");
const stringUtils = require("../utils/string-utils");
const fileUtils = require("../utils/file-utils");

function getSellingPartner(props) {
  const { store, endpointVersions } = props;
  // Get store creds from config file
  const storeConfig = config.stores.find((x) => x.store === store.store);
  if (!storeConfig) {
    throw new Error(`Store ${store} not found in config file.`);
  }
  const marketplaceIds = storeConfig.MARKETPLACE_IDS;
  const sellerId = storeConfig.SELLER_ID;

  // Get sp-api creds
  const sp = new SellingPartnerAPI({
    region: "na",
    refresh_token: storeConfig.SP_API_REFRESH_TOKEN,
    credentials: {
      SELLING_PARTNER_APP_CLIENT_ID: storeConfig.SP_APP_CLIENT_ID,
      SELLING_PARTNER_APP_CLIENT_SECRET: storeConfig.SP_APP_CLIENT_SECRET,
      AWS_ACCESS_KEY_ID: process.env.AWS_SELLING_PARTNER_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SELLING_PARTNER_SECRET_ACCESS_KEY,
      AWS_SELLING_PARTNER_ROLE: process.env.AWS_SELLING_PARTNER_ROLE,
    },
    endpoints_versions: endpointVersions,
  });

  return { store, marketplaceIds, sp, sellerId };
}

// Parse response and save to disk
async function saveResponse(props) {
  const {
    dataFolder,
    filenamePart,
    batchNumber,
    idType,
    response,
    sequence,
    logit,
  } = props;
  // Save response to file
  const folder = `${__basedir}${dataFolder}`;
  const useSequence = sequence ? stringUtils.zeroFill(sequence, 3) : "";
  const useBatchNumber = batchNumber
    ? `${stringUtils.zeroFill(this.batchNumber, 3)}-`
    : "";
  const useType = idType ? `${idType}-` : "";
  const filename = `${folder}/${filenamePart}-${useType}${useBatchNumber}${useSequence}.json`;
  if (response.length === 0) return;
  const responseData = JSON.stringify(response);
  // File sequence as part of name
  if (logit) {
    log.info("    Saving file: " + filename);
  } else {
    log.debug("Saving file: " + filename);
  }
  await fileUtils.saveFile(filename, responseData);
}

module.exports = { getSellingPartner, saveResponse };
