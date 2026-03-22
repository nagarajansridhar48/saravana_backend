const AWS = require('aws-sdk');
const config = require("../config/config");

const s3 = new AWS.S3({
    endpoint: new AWS.Endpoint(config.doSpaces.endpoint),
    useAccelerateEndpoint: false,
    s3ForcePathStyle: false,
    region: "us-east-1",
    credentials: new AWS.Credentials(
        config.doSpaces.accessKeyId,
        config.doSpaces.secretAccessKey
    )
});


const uploadFileToS3 = async (file, folderName, bucketName = "facesync") => {
    const params = {
        Bucket: bucketName,
        Key: `${folderName}/${file.originalname}`,
        Body: file.buffer,
        ACL: "public-read",
    };

    return new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.Location);
            }
        });
    });
};


const deleteFolderFromS3 = async (folderName, bucketName = "facesync") => {
    const params = {
        Bucket: bucketName,
        Prefix: folderName
    };

    const listAllObjects = async (params) => {
        let data;
        do {
            data = await s3.listObjectsV2(params).promise();
            if (data.Contents.length === 0) break;

            const deleteParams = {
                Bucket: bucketName,
                Delete: { Objects: [] }
            };

            data.Contents.forEach(({ Key }) => {
                deleteParams.Delete.Objects.push({ Key });
            });

            await s3.deleteObjects(deleteParams).promise();

            params.ContinuationToken = data.NextContinuationToken;
        } while (data.IsTruncated);
    };

    await listAllObjects(params);
};


const deleteFileFromS3 = async (fileUrl, bucketName = "facesync") => {
    const params = {
        Bucket: bucketName,
        Key: fileUrl,
    };

    await s3.deleteObject(params).promise();
   
};


const calculateFolderSize = async (folderName) => {
    let totalSize = 0;
    const bucketName = "facesync";
    const params = {
        Bucket: bucketName,
        Prefix: folderName
    };

    const listAllObjects = async (params) => {
        let data;
        do {
            data = await s3.listObjectsV2(params).promise();
            data.Contents.forEach((obj) => {
                totalSize += obj.Size;
            });
            params.ContinuationToken = data.NextContinuationToken;
        } while (data.IsTruncated);
    };

    await listAllObjects(params);
    return totalSize;
};



const convertSize = (sizeInBytes) => {
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let size = sizeInBytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return {
        size: parseFloat(size.toFixed(2)),
        unit: units[unitIndex]
    };
};


module.exports = {
    s3,
    uploadFileToS3,
    calculateFolderSize,
    convertSize,
    deleteFolderFromS3,
    deleteFileFromS3
};
