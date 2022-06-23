const config = require("../../config");
var AWS = require("aws-sdk");
//AWS.config.update({region: 'REGION'});
const fs = require("fs").promises;
const path = require("path");

// Create S3 service object
s3 = new AWS.S3({ apiVersion: "2006-03-01" });

async function bucketExists() {
  // See if bucket exists
  try {
    const bucket = config.awsS3.BUCKET;
    const buckets = await listBuckets();
    if (!buckets) return false;
    const findAny = buckets.find((x) => x.Name === bucket);
    return findAny !== undefined && findAny !== false;
    //return result
  } catch (err) {
    log.error("Error checking if S3 bucket exists: ", err);
  }
}

async function createBucket() {
  try {
    const params = {
      Bucket: config.awsS3.BUCKET,
      CreateBucketConfiguration: {
        LocationConstraint: config.awsS3.REGION,
      },
    };
    const exists = await bucketExists();
    if (exists) return;
    // Bucket doesn't exist: create it
    const result = await s3.createBucket(params).promise();
  } catch (err) {
    log.error("Error creating S3 bucket: ", err);
  }
}

async function listBuckets() {
  try {
    // Call S3 to list the buckets
    const results = await s3.listBuckets({}).promise();
    return results.Buckets;
  } catch (err) {
    log.error("Error listing S3 buckets: ", err);
  }
}

async function fileExists(filename) {
  const params = {
    Bucket: config.awsS3.BUCKET,
    Key: filename,
  };
  try {
    await await s3.headObject(params).promise();
    return true;
  } catch (err) {
    return false;
  }
}

// List all files in bucket (folder)
async function listFiles(bucket, prefix) {
  try {
    var params = {
      Bucket: bucket,
      // Delimiter: "STRING_VALUE",
      // EncodingType: url,
      // ExpectedBucketOwner: "STRING_VALUE",
      // Marker: "STRING_VALUE",
      // MaxKeys: "NUMBER_VALUE",
      Prefix: prefix || "",
      // RequestPayer: requester,
    };
    const results = await s3.listObjects(params).promise();
    return results.Contents;
  } catch (err) {
    log.error("Error occurred listing S3 objects: ", err);
  }
}
async function saveFile(filename, data) {
  // call S3 to retrieve upload file to specified bucket
  const params = {
    Bucket: config.awsS3.BUCKET,
    Key: filename,
    Body: data,
  };
  try {
    const stored = await s3.upload(params).promise();
    return stored;
  } catch (err) {
    log.error("Error deleting files: ", err);
  }
}

async function readFileToJson(filename) {
  try {
    const params = { Bucket: config.awsS3.BUCKET, Key: filename };
    const exists = await fileExists(filename);
    log.debug("readFileToJson: filename, exists", filename, exists);
    if (!exists) {
      return false;
    }
    const result = await s3.getObject(params).promise();
    const json = JSON.parse(result.Body.toString());
    return json;
  } catch (err) {
    log.error(`Error reading file ${filename} from s3: `, err);
  }
}

async function readFile(filename) {
  try {
    const params = { Bucket: config.awsS3.BUCKET, Key: filename };
    const result = await s3.getObject(params).promise();
    return result.Body.toString("ascii");
  } catch (err) {
    log.error("Error reading a text file from s3: ", err);
  }
}

// Delete file from application bucket
async function deleteFile(filename) {
  try {
    const params = { Bucket: config.awsS3.BUCKET, Key: filename };
    const result = await s3.deleteObject(params).promise();
    return result;
  } catch (err) {
    log.error("Error deleting file from s3: ", err);
  }
}

// Delete file from bucket indicated
async function deleteFileByBucket(props) {
  try {
    const params = { Bucket: props.fromBucket, Key: props.filename };
    const result = await s3.deleteObject(params).promise();
    return result;
  } catch (err) {
    log.error("Error deleting file from s3: ", err);
  }
}

// Delete files given a pattern
async function deleteFilesByPattern(bucket, pattern) {
  try {
    const files = await listFiles(bucket, pattern);
    //filesToDelete = files.filter(file => file.includes(pattern))
    const deletedFiles = await Promise.all(
      files.map((file) =>
        deleteFileByBucket({ fromBucket: bucket, filename: file.Key })
      )
    );
    return deletedFiles;
  } catch (err) {
    log.error("Error deleting files: ", err);
  }
}

// Move file from one bucket to another, keeping same folder structure
// This is used, for example to soft delete a screen shot or restoring it
async function moveFile(props) {
  try {
    // Copy object (file) from one bucket to another
    let params = {
      CopySource: encodeURI(`${props.fromBucket}/${props.filename}`),
      Bucket: props.toBucket,
      Key: props.filename,
      ACL: "public-read",
    };
    await s3.copyObject(params).promise();
    // Delete file from source bucket
    params = { Bucket: props.fromBucket, Key: props.filename };
    await s3.deleteObject(params).promise();
  } catch (err) {
    log.error("Error moving file: ", err.message);
  }
}

// Move file from one bucket to another, but with new path.
// This is used, for example, to move an image from a newly-created record into a permanent location.
async function moveFile1(props) {
  try {
    // Copy object (file) from one bucket to another
    const copyParams = {
      CopySource: encodeURI(`${props.fromBucket}/${props.fromFilename}`),
      Bucket: props.toBucket,
      Key: props.toFilename,
      ACL: props.acl,
    };
    await s3.copyObject(copyParams).promise();
    // Delete file from source bucket
    const deleteParams = { Bucket: props.fromBucket, Key: props.fromFilename };
    await s3.deleteObject(deleteParams).promise();
  } catch (err) {
    log.error("Error moving file: ", err.message);
  }
}

module.exports = {
  createBucket,
  deleteFile,
  deleteFileByBucket,
  deleteFilesByPattern,
  fileExists,
  listBuckets,
  listFiles,
  moveFile,
  moveFile1,
  readFile,
  readFileToJson,
  saveFile,
};
