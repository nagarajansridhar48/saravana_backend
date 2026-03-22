const cloudinary = require('cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name : "dxuywwewt",
    api_key : "267783535434936",
    api_secret : "3HX_KOODSF5SM_5FwgwoaBf5sHg",
});

const storage = multer.memoryStorage();

const ImageuploadUtil = async(file) =>{
    const result = await cloudinary.uploader.upload(file,{
        resource_type : 'auto'
    });
    return result;
};

const upload = multer({storage});

module.exports = {upload,ImageuploadUtil}