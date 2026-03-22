const crypto = require("crypto");

const generateOTP = () => {
    return crypto.randomBytes(3).toString("hex");
};



module.exports = generateOTP;