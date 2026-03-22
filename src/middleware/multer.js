const multer = require("multer");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const s3Client = require("../cloud/s3Client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const config = require("../config/config");

const storage = multer.memoryStorage();

const upload = multer({ storage }).any();

const dynamicUpload = (req, res, next) => {
  upload(req, res, function (err) {
    if (err) {
      throw new ApiError(httpStatus.BAD_REQUEST, "File upload failed");
    }

    req.uploadedFiles = {};

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.buffer && file.size > 0) {
          if (!req.uploadedFiles[file.fieldname]) {
            req.uploadedFiles[file.fieldname] = [];
          }
          req.uploadedFiles[file.fieldname].push(file);
        }
      });
    }

    next();
  });
};

const singleFileUpload = (req, res, next) => {
  console.log(req.file,"req.file");
  const upload = multer({ storage }).single("image");
  upload(req, res, (err) => {
    if (err) throw new ApiError(httpStatus.BAD_REQUEST, "File upload failed");
    req.uploadedFile = null;
    if (req.file && req.file.buffer) {
      req.uploadedFile = req.file;
    }
    next();
  });
};

const uploadToR2 = async (file, folder, title = "untitled") => {
  console.log(file, "upploadtor2");
  const timestamp = Date.now();
  const extension = file.originalname.split(".").pop();
  const fileKey = `${folder}/${title}-${timestamp}.${extension}`;

  console.log("fileKey", fileKey);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.r2Cloud.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return `${config.r2Cloud.bucketUrl}/${fileKey}`;
};

module.exports = { dynamicUpload, singleFileUpload, uploadToR2 };
