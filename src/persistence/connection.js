const mongoose = require("mongoose");
const logger = require("../config/logger");

module.exports = (uri, name, options = {}) => {
  mongoose.set("strictQuery", true);
  const connection = mongoose.createConnection(uri, options);
  //   connection.on("connected", () =>
  //     logger.info(`${name} connected successfully`)
  //   );
  connection.on("error", (error) => {
    logger.info(`MongoDB connection error on ${name}: ${error}`);
  });
  connection.on("disconnected", () =>
    logger.info(`MongoDB disconnected from ${name}`)
  );
  process.on("SIGINT", () => {
    connection.close(() => {
      logger.info(`MongoDB disconnected from ${name} through app termination`);
      process.exit(0);
    });
  });

  return connection;
};
