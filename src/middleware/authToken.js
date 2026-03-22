const jwt = require("jsonwebtoken");
const Config = require("../config/config");
const httpStatus = require("http-status");
const Admin = require("../admin/model");
const logger = require("../config/logger");
const User = require("../users/model");

const generateAccessToken = (data) => {
  let token = jwt.sign(data, Config.jwt.secret_access, {
    expiresIn: `${Config.jwt.accessExpirationMinutes}m`,
  });

  return token;
};

const generateRefreshToken = (data) => {
  let token = jwt.sign(data, Config.jwt.secret_refresh, {
    expiresIn: `${Config.jwt.refreshExpirationDays}d`,
  });

  return token;
};

const verifyRefreshToken = (data) => {
  const decode = jwt.verify(data, Config.jwt.secret_refresh);
  if (!decode) {
    throw new ApiError(403, "Invalid or expired refresh token");
  } else {
    return decode;
  }
};

const VerifyUserAuthToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).send({
        message: "User must be logged in",
      });
    }
    const payload = jwt.verify(token, Config.jwt.secret_access);
    const findUser = await User.userModel.findById(payload.id);
    if (!findUser) {
      return res.status(httpStatus.UNAUTHORIZED).send({
        message: "User not available",
      });
    }
    if (!findUser.status)
      return (
        httpStatus.FORBIDDEN,
        "Your account is inactive, please contact your admin"
      );
    req.user = findUser;
    next();
  } catch (error) {
    logger.info(error.message);
    return res.status(httpStatus.UNAUTHORIZED).send({
      message: "Invalid access token",
    });
  }
};

const VerifyAdminAuthToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).send({
        message: "User must be logged in",
      });
    }
    const payload = jwt.verify(token, Config.jwt.secret_access);
    const findUser = await Admin.adminModel.findById(payload.id);
    if (!findUser) {
      return res.status(httpStatus.UNAUTHORIZED).send({
        message: "User not available",
      });
    }
    req.user = findUser;
    next();
  } catch (error) {
    logger.info(error.message);
    return res.status(httpStatus.UNAUTHORIZED).send({
      message: "Invalid access token",
    });
  }
};

module.exports = {
  // generateAdminAuthToken,
  VerifyAdminAuthToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  VerifyUserAuthToken,
};
