const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

const handleMongooseError = (err, doc,next) => {
    if(err.name === "ValidationError"){
        const errorMessages = Object.values(err.errors).map((e) => {
            return `${e.path.charAt(0).toUpperCase() + e.path.slice(1)} is required`
        });
        next(new ApiError(httpStatus.BAD_REQUEST,errorMessages.join(", ")));
    } else if(err.code && err.code === 11000){
        const fieldName = Object.keys(err.keyValue)[0]
        const fieldValue = err.keyValue[fieldName]
        const errorMessage = `The ${fieldName} '${fieldValue}' already exists`;
        next(new ApiError(httpStatus.BAD_REQUEST , errorMessage))
    }else {
        next(err)
    }

}


module.exports = handleMongooseError