const fs = require("fs").promises;
const { zip } = require("zip-a-folder");
const findRemoveSync = require("find-remove");
const config = require("../../config");
const du = require("./date-utils");
const fileUtils = require("./file-utils");

/**
 * @param {string} folderToArhive The folder we want to archive the contents of (without /)
 * @param {string} targetFolder The folder to write the zip file to (without /)
 * @param {string} archiveName Name to use to describe the kind of archive (used in target file name)
 */
exports.archiveFiles = async function (
  folderToArchive,
  targetFolder,
  archiveName
) {
  try {
    // Create archive folder under given folder
    fileUtils.createFolderSync(targetFolder);
    const zipFilePath = `${targetFolder}/${archiveName}-${du.fileTimestamp()}.zip`;

    // See if any files in folder
    const files = await fileUtils.readDir(folderToArchive);
    if (files.length === 0) return;

    // Compress files in folder and save in archive folder
    await zip(folderToArchive, zipFilePath);

    // Delete any files older than archive days
    //const archiveDays = config.app.archiveDays;
    // findRemoveSync(archiveFolder, { age: { seconds: 3600 } });
    //findRemoveSync(targetFolder, { age: { days: archiveDays } });
    fileUtils.deleteFilesOlderThan(targetFolder, config.app.archiveDays);
  } catch (err) {
    throw new Error(err);
  }
};
