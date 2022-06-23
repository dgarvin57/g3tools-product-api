const fs = require("fs").promises;
const fsSync = require("fs");
const readline = require("readline");
const path = require("path");
const config = require("../../config");
const awsFileUtils = require("./aws-file-utils");
const csv = require("csvtojson");
const compress = require("../utils/compress");
const glob = require("glob");

/**
 * Based on config setting, read from local filesystem or from S3
 * @param {string} filepath Path of file to be read
 */
exports.readFile = async function (filepath, options) {
  if (config.app.writeToPlatform === "filesystem") {
    // Read from local filesystem
    const path = filepath;
    log.info(`Reading file ${path} from local filesystem`);
    return fsSync.readFileSync(path, options);
  } else if (config.app.writeToPlatform === "s3") {
    // Read from AWS S3
    log.info(`Reading file ${filepath} from AWS S3`);
    return await awsFileUtils.readFile(filepath);
  }
};

exports.readDir = async function (path) {
  if (config.app.writeToPlatform === "filesystem") {
    const files = await fs.readdir(path);
    return files;
  } else if (config.app.writeToPlatform === "s3") {
    // TODO S3 read dir
  }
};

exports.saveFile = async function (filepath, data) {
  if (config.app.writeToPlatform === "filesystem") {
    // Write file to local filesystem
    const path = filepath;
    log.debug(`Writing file ${path} to local filesystem`);
    exports.saveToFileSync(path, data);
  } else if (config.app.writeToPlatform === "s3") {
    // Write file to S3
    log.debug(`Writing file ${filepath} to AWS S3`);
    await awsFileUtils.saveFile(filepath, data);
  }
};

/**
 * Save a stringified Json object to a file asynchronously
 * @param data {object} json object to save
 * @param path {string} file path to save to
 */
exports.saveJsonToFile = async function (path, data) {
  try {
    if (config.app.writeToPlatform === "filesystem") {
      // Save to filesystem
      await exports.saveFile(path, JSON.stringify(data, null, 2));
      return true;
    } else if (config.app.writeToPlatform === "s3") {
      // Save to s3
      //TODO Do s3 version
    }
  } catch (err) {
    throw err;
  }
};

exports.deleteFile = async function (filepath) {
  try {
    if (config.app.writeToPlatform === "filesystem") {
      // Delete file from local filesystem
      const base = __basedir.replace(/\\/g, "/");
      const path = `${base}/data/${filepath}`;
      log.info(`Deleting file ${path} from local filesystem`);
      fsSync.unlinkSync(path);
    } else if (config.app.writeToPlatform === "s3") {
      // Write file to S3
      log.info(`Deleting file ${filepath} from AWS S3`);
      await awsFileUtils.deleteFile(filepath);
    }
  } catch (err) {
    log.error(`Error deleting file '${filepath}: ${err}`);
  }
};

//
/**
 * Delete all files that match path asynchronously. Allows us to delete files that match a wildcard, like AZN-LAP-*.json, to delete all files starting with AZN-LAP.
 * @param path {string} Path of file to delete
 */
exports.deleteFiles = function (path) {
  try {
    if (config.app.writeToPlatform === "filesystem") {
      // Delete file from local filesystem
      let files = glob.sync(path);
      files.map(async (f) => await fs.unlink(f));
    } else if (config.app.writeToPlatform === "s3") {
      // Delete files in S3
    }
  } catch (e) {
    throw e;
  }
};

exports.appendFile = async function (filepath, data) {
  try {
    if (config.app.writeToPlatform === "filesystem") {
      // Write file to local filesystem
      const base = __basedir.replace(/\\/g, "/");
      const path = `${base}/data/${filepath}`;
      //log.info(`Appending file ${path} to local filesystem`);
      fsSync.appendFileSync(path, data, "utf8");
    } else if (config.app.writeToPlatform === "s3") {
      // Append file to S3
      //log.info(`Writing file ${filepath} to AWS S3`);
      await awsFileUtils.appendFile(filepath, data);
    }
  } catch (err) {
    log.error(`Error appending file '${filepath}: ${err}`);
  }
};

exports.resultsFile = async function (data, blank) {
  log.info(data);
  if (blank) {
    data = `${data}\r\n\r\n`;
  } else {
    data = `${data}\r\n`;
  }
  const filepath = config.informed.resultsFilename;
  await exports.appendFile(filepath, data);
};

// /**
//  * Read text file sychronously and return as is
//  * @param filePath {string} Path of file to read
//  * @returns {string} File contents returned as a string
//  */
// exports.readFileSync = function (filePath, options) {
//   try {
//     const data = fsSync.readFileSync(filePath, "utf8");
//     return data;
//   } catch (err) {
//     throw err;
//   }
// };

// Save data to file synchronously
exports.saveToFileSync = function (filename, data, flags) {
  try {
    if (flags != undefined) {
      fsSync.writeFileSync(filename, data, flags);
    } else {
      fsSync.writeFileSync(filename, data);
    }
    return true;
  } catch (err) {
    throw err;
  }
};

/**
 * Create directory if not exists
 * @param {string} folder The folder that should be created
 */
exports.createFolder = async function (folder) {
  try {
    return await fsSync.mkdirSync(folder);
  } catch (error) {
    if (error.code != "EEXIST") {
      throw error;
    }
  }
};

/**
 * Reads first line of text file
 * @param {string} pathToFile Path of file to be read
 * @returns ?
 */
exports.readFirstLine = async function (filepath) {
  if (config.app.writeToPlatform === "filesystem") {
    try {
      // Read from filesystem
      const base = __basedir.replace(/\\/g, "/");
      const path = `${base}/data/${filepath}`;
      const readable = fsSync.createReadStream(path);
      const reader = readline.createInterface({ input: readable });
      const line = await new Promise((resolve) => {
        reader.on("line", (line) => {
          reader.close();
          resolve(line);
        });
      });
      readable.close();
      return line;
    } catch (err) {
      log.error("Error reading first line of file from filesystem: ", err);
    }
  } else if (config.app.writeToPlatform === "s3") {
    // Read from S3
    return await awsFileUtils.readFirstLine(filepath);
  }
};

exports.readFileToJson = async function (filepath) {
  try {
    const data = await exports.readFile(filepath);
    const jsonData = JSON.parse(data);
    return jsonData;
  } catch (err) {
    throw err;
  }
};

exports.readCsvFileToJson = async function (filepath) {
  if (config.app.writeToPlatform === "filesystem") {
    // From filesystem
    const base = __basedir.replace(/\\/g, "/");
    const path = `${base}/data/${filepath}`;
    return await csv().fromFile(path);
  } else if (config.app.writeToPlatform === "s3") {
    // From s3
    return await awsFileUtils.readCsvToJson(filepath);
  }
};

exports.getFileLastModified = function (filepath) {
  if (config.app.writeToPlatform === "filesystem") {
    const stats = fsSync.statSync(filepath);
    return stats.mtime;
  } else if (config.app.writeToPlatform === "filesystem") {
    // TODO Do s3 version of this
  }
};

/**
 * Read text file asychronously and return as is
 * @param filePath {string} Path of file to read
 * @returns {Promise<string>} File contents returned as a string
 */
exports.readTxtFile = async function (filePath) {
  try {
    if (config.app.writeToPlatform === "filesystem") {
      // Filesystem
      const data = await exports.readFile(filePath, "utf8");
      return data;
    } else if (config.app.writeToPlatform === "s3") {
      // S3 platform
      // TODO Need to complete S3 empty folder
    }
  } catch (err) {
    throw err;
  }
};

/**
 * Delete all files within folder synchronously
 * @param folder {string} Path of folder from which to delete all files
 */
exports.emptyFolder = async function (folder) {
  try {
    if (config.app.writeToPlatform === "filesystem") {
      // Filesystem
      const files = await fs.readdir(folder);
      for (const file of files) {
        if (fsSync.statSync(`${folder}/${file}`).isDirectory()) {
          // This is a folder
          await fs.rmdir(`${folder}/${file}`, { recursive: true });
        } else {
          // Normal file
          await fs.unlink(path.join(folder, file));
        }
      }
    } else if (config.app.writeToPlatform === "s3") {
      // S3 platform
      // TODO Need to complete S3 empty folder
    }
  } catch (err) {
    throw err;
  }
};

/**
 * Delete all files within folder synchronously
 * @param folder {string} Path of folder from which to delete all files
 */
exports.exists = function (folder) {
  try {
    if (config.app.writeToPlatform === "filesystem") {
      // Filesystem
      if (fsSync.existsSync(folder)) {
        return true;
      } else {
        return false;
      }
    } else if (config.app.writeToPlatform === "s3") {
      // S3 platform
      // TODO Need to complete S3 check if folder exists
    }
  } catch (err) {
    throw err;
  }
};

// try {
//   if (fs.existsSync("./directory-name")) {
//     console.log("Directory exists.");
//   } else {
//     console.log("Directory does not exist.");
//   }
// } catch (e) {
//   console.log("An error occurred.");
// }

/**
 * Delete all files within a given folder older than a given number of days
 * @param {string} folder The path of the folder to be searched
 * @param {days} days Number of days old before a file is deleted
 */
exports.deleteFilesOlderThan = async function (folder, days) {
  try {
    if (config.app.writeToPlatform === "filesystem") {
      const files = await fs.readdir(folder);
      for (let file of files) {
        const filepath = `${folder}/${file}`;
        if (!fsSync.statSync(filepath).isDirectory()) {
          // This is a file, not a folder
          const diff =
            new Date().getTime() - exports.getFileLastModified(filepath);
          if (diff > days * 24 * 60 * 60 * 1000) {
            //            await fs.unlink(path.join(folder, file));
            if (module.exports.exists(filepath)) {
              await fs.unlink(filepath);
            }
          }
        }
      }
    } else if (config.app.writeToPlatform === "s3") {
      // TODO Finish s3 delete folders older than...
    }
  } catch (err) {
    log.error(err);
    throw err;
  }
};

/**
 * Create directory if not exists (synchronous version)
 * @param {string} folder The folder that should be created
 */
exports.createFolderSync = function (folder) {
  try {
    if (config.app.writeToPlatform === "filesystem") {
      if (module.exports.exists(folder)) return;
      // Folder doesn't exist. Create it
      fsSync.mkdirSync(folder);
      log.info(`Created data folder: ${folder}`);
    } else if (config.app.writeToPlatform === "s3") {
      // TODO Finish s3 create folders ...
    }
  } catch (e) {
    if (e.code != "EEXIST") throw e;
  }
};

exports.buildFolders = async function () {
  try {
    // Delete old log files
    let base = __basedir.replace(/\\/g, "/");
    const logFolder = `${base}/logs`;
    await exports.deleteFilesOlderThan(logFolder, 7);

    // FINANCES
    // Finances data folder
    let parms = config.finances;
    // Create base finances folder
    let folder = `${base}${parms.baseFolder}`;
    module.exports.createFolderSync(folder);
    // Create finance data folder
    const dataFolder = `${base}${parms.financesDatafolder}`;
    module.exports.createFolderSync(dataFolder);
    // Create finance archive folder
    const archiveFolder = `${base}${parms.archiveFolder}`;
    module.exports.createFolderSync(archiveFolder);
    // Archive past finance downloads
    await compress.archiveFiles(dataFolder, archiveFolder, "finances");

    // INBOUND SHIPMENTS AND ITEMS
    // Inbound Shipments data folders
    parms = config.inboundShipment;
    // Create base inbound-shipments folder
    folder = `${base}${parms.baseFolder}`;
    module.exports.createFolderSync(folder);
    // SHIPMENTS
    // Create inbound shipments data folder
    const shipmentDataFolder = `${base}${parms.shipmentDataFolder}`;
    module.exports.createFolderSync(shipmentDataFolder);
    // Inbound archive folders
    folder = `${base}${parms.parentArchiveFolder}`;
    module.exports.createFolderSync(folder);
    const shipmentArchiveFolder = `${base}${parms.shipmentArchiveFolder}`;
    module.exports.createFolderSync(folder);
    await compress.archiveFiles(
      shipmentDataFolder,
      shipmentArchiveFolder,
      "inbound-shipments"
    );
    // SHIPMENT ITEMS
    const itemDataFolder = `${base}${parms.itemDataFolder}`;
    module.exports.createFolderSync(itemDataFolder);
    const itemArchiveFolder = `${base}${parms.itemArchiveFolder}`;
    module.exports.createFolderSync(itemArchiveFolder);
    // Archive shipment items
    await compress.archiveFiles(
      itemDataFolder,
      itemArchiveFolder,
      "inbound-shipments"
    );

    // REPORTS
    // Reports data folder
    parms = config.reports;
    // Create base reports folder
    folder = `${base}${parms.baseFolder}`;
    module.exports.createFolderSync(folder);
    // Reports data folder
    const reportsDataFolder = `${base}${parms.reportsDataFolder}`;
    module.exports.createFolderSync(reportsDataFolder);
    // // Reports list folder
    const reportsListFolder = `${base}${parms.reportsListFolder}`;
    module.exports.createFolderSync(reportsListFolder);
    // Report archive folder
    const reportsArchiveFolder = `${base}${parms.archiveFolder}`;
    module.exports.createFolderSync(reportsArchiveFolder);
    // Archive reports data files
    await compress.archiveFiles(
      reportsDataFolder,
      reportsArchiveFolder,
      "reports"
    );
    // Archive reports list files
    await compress.archiveFiles(
      reportsListFolder,
      reportsArchiveFolder,
      "reports"
    );

    // PRODUCTS
    // Products data folder
    parms = config.product;
    // Create base folder
    folder = `${base}${parms.baseFolder}`;
    module.exports.createFolderSync(folder);
    // Products data folder
    const productDataFolder = `${base}${parms.productDataFolder}`;
    module.exports.createFolderSync(productDataFolder);
    // Products archive folder
    const productArchiveFolder = `${base}${parms.archiveFolder}`;
    module.exports.createFolderSync(productArchiveFolder);
    // Archive reports list files
    await compress.archiveFiles(
      productArchiveFolder,
      productArchiveFolder,
      "products"
    );

    // FBA INVENTORY
    // FBA inventory data folder
    parms = config.fbaInventory;
    // Create base folder
    folder = `${base}${parms.baseFolder}`;
    module.exports.createFolderSync(folder);
    // Data folder
    const fbaInventoryDataFolder = `${base}${parms.dataFolder}`;
    module.exports.createFolderSync(fbaInventoryDataFolder);
    // Archive folder
    const fbaInventoryArchiveFolder = `${base}${parms.archiveFolder}`;
    module.exports.createFolderSync(fbaInventoryArchiveFolder);
    // Archive files
    await compress.archiveFiles(
      fbaInventoryDataFolder,
      fbaInventoryArchiveFolder,
      "products"
    );
    await exports.deleteFilesOlderThan(fbaInventoryArchiveFolder, 7);
  } catch (err) {
    throw new Error(err);
  }
};
