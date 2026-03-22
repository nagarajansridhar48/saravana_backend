const ApiError = require("../utils/ApiError");
const { comparePassword } = require("../utils/hashPwd");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../middleware/authToken");
const { adminModel } = require("../admin/model");
const { userModel } = require("../users/model");
const admin = require("../utils/fireBaseAdmin");

const adminloginService = async (req) => {
  const { email, password } = req.body;

  console.log(email, password, " email, password ");

  if (!email || !password) {
    throw new ApiError(400, "Please enter all fileds");
  }

  const existUser = await adminModel.findOne({ email: email });

  if (!existUser) {
    throw new ApiError(400, "Invalid credentials");
  }

  const Comparedresult = await comparePassword(
    password,
    existUser.hashedPassword,
  );

  if (!Comparedresult) {
    throw new ApiError(400, "Invalid credentials");
  }

  // ✅ Update last login time
  await adminModel.findByIdAndUpdate(existUser._id, {
    lastLoginAt: new Date(),
  });

  const Userdata = {
    id: existUser._id,
    email: existUser.email,
    role: existUser.role,
  };

  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(Userdata),
    generateRefreshToken(Userdata),
  ]);

  return {
    success: true,
    message: "Login Successfull",
    token: { accessToken, refreshToken },
  };
};

const userloginService = async (req) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please enter all fileds");
  }
  const existUser = await userModel.findOne({ email: email });

  if (!existUser) {
    throw new ApiError(400, "Invalid credentials");
  }

  const Comparedresult = await comparePassword(
    password,
    existUser.hashedPassword,
  );
  if (!Comparedresult) {
    throw new ApiError(400, "Invalid credentials");
  }

  const Userdata = {
    id: existUser._id,
    email: existUser.email,
    role: existUser.role,
  };

  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(Userdata),
    generateRefreshToken(Userdata),
  ]);

  return {
    success: true,
    message: "Login Successfull",
    token: { accessToken, refreshToken },
  };
};

const refreshAccessToken = async (req) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new ApiError(401, "No refresh token provided");
  }

  const verifyToken = verifyRefreshToken(refreshToken);
  if (!verifyToken) {
    throw new ApiError(403, "Invalid or expired refresh token");
  }

  const { iat, exp, ...restof } = verifyToken;
  const newAccessToken = await generateAccessToken(restof);

  return {
    success: true,
    message: "New access token created successfully",
    accessToken: newAccessToken,
  };
};

const firebaseLoginService = async (req) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, "Token required");
  }

  // 🔐 Verify Firebase token
  const decoded = await admin.auth().verifyIdToken(token);

  const {
    email,
    name,
    picture,
    uid,
    firebase: { sign_in_provider },
  } = decoded;

  if (!email) {
    throw new ApiError(400, "Email not found from provider");
  }

  // Determine provider
  let provider = "local";

  if (sign_in_provider === "google.com") {
    provider = "google";
  } else if (sign_in_provider === "facebook.com") {
    provider = "facebook";
  }

  let user = await userModel.findOne({ email });

  if (!user) {
    user = await userModel.create({
      fullName: name,
      email,
      profileImage: picture,
      provider,
      googleId: provider === "google" ? uid : undefined,
      facebookId: provider === "facebook" ? uid : undefined,
      role: "user",
      status: "active",
    });
  }

  // 🚫 If user exists but is inactive
  if (user.status === "inactive") {
    throw new ApiError(403, "User account is inactive");
  }

  // 🔐 Prepare JWT payload
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  // 🎟 Generate tokens
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return {
    success: true,
    message: "OAuth Login Successful",
    token: { accessToken, refreshToken },
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
    },
  };
};

module.exports = {
  adminloginService,
  userloginService,
  refreshAccessToken,
  firebaseLoginService,
};
