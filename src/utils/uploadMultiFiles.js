const { s3 } = require("./uploadFileToS3");
const config = require("../config/config");

const uploadMultiFiles = async (
  uploadedFiles,
  folderId,
  bucketName = "facesync",
) => {
  const fileURLs = {};

  const uploadPromises = [];

  for (const [fieldName, files] of Object.entries(uploadedFiles)) {
    const fileUploadPromise = files.map((file) => {
      const params = {
        Bucket: bucketName,
        Key: `${config.doSpaces.folderPath}${folderId}/${file.originalname}`,
        Body: file.buffer,
        ACL: "public-read",
      };

      return new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {            
          if (err) {
            reject(err);
          } else {
            resolve({ fieldName, url: `${config.doSpaces.spaceUrl}${data.Key}` });
          }
        });
      });
    });

    uploadPromises.push(...fileUploadPromise);
  }

  const uploadResults = await Promise.all(uploadPromises);

  uploadResults.forEach(({ fieldName, url }) => {
    if (!fileURLs[fieldName]) {
      fileURLs[fieldName] = [];
    }
    fileURLs[fieldName].push(url);
  });

  Object.keys(fileURLs).forEach((fieldName) => {
    if (fileURLs[fieldName].length === 1) {
      fileURLs[fieldName] = fileURLs[fieldName][0];
    }
  });

  return fileURLs;
};

module.exports = uploadMultiFiles;
