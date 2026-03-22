const mongoose = require("mongoose");
const dns = require("dns");

const { server, io } = require("./app");
const config = require("./config/config");
const logger = require("./config/logger");

/* Fix MongoDB Atlas SRV DNS issue */
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const port = config.port || 4000;
const MONGODB_URI = config.mongoose.url;

let serverStarted = false;
let serverInstance = null;

/* MongoDB Connection */
mongoose
  .connect(MONGODB_URI, {
    minPoolSize: 5,
    maxPoolSize: 50,
  })
  .then(() => {
    logger.info("Connected to MongoDB");

    if (!serverStarted) {
      serverInstance = server.listen(port, () => {
        serverStarted = true;
        logger.info("Socket.IO server initialized");
        logger.info(`Server is running on port ${port}`);
      });
    }
  })
  .catch((error) => {
    logger.error("Error connecting to MongoDB:", error);
    process.exit(1);
  });

/* Graceful Exit */
const exitHandler = () => {
  if (serverInstance) {
    serverInstance.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

/* Unexpected Error Handler */
const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (serverInstance) {
    serverInstance.close();
  }
});