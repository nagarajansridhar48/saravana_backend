const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:5174",
];

const headers = ["Content-Type", "Authorization"];

const methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];

module.exports = {
  allowedOrigins,
  headers,
  methods,
};
