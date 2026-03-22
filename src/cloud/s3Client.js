const { S3Client } = require("@aws-sdk/client-s3");
const config = require("../config/config");

const s3Client = new S3Client({
  region: "auto",
  endpoint: config.r2Cloud.endpoint,
  credentials: {
    accessKeyId: config.r2Cloud.accessKey,
    secretAccessKey: config.r2Cloud.secretKey,
  },
});

module.exports = s3Client;
