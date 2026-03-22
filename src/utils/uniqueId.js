const crypto = require("crypto");

const generateOTP = () => {
  return crypto.randomBytes(3).toString("hex");
};

const generateFolderId = (userName) => {
  const nameHash = crypto
    .createHash("md5")
    .update(userName)
    .digest("hex")
    .slice(0, 6);
  const timestamp = Date.now().toString(36);
  return `${nameHash}${timestamp}`;
};

const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

async function generateOrderId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `ORD${timestamp}${random}`;
}

module.exports = {
  generateOTP,
  generateFolderId,
  generateToken,
  hashToken,
  generateOrderId,
};
