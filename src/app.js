const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const httpStatus = require("http-status");
const Server = require("socket.io");
const http = require("http");
const path = require("path");
const morgan = require("./config/morgan");
const { errorConverter, errorHandler } = require("./middleware/error");
const { authLimiter } = require("./middleware/rateLimiter");
const ApiError = require("./utils/ApiError");
const routeIndex = require("./route/index");
const corsConfig = require("./utils/corsConfig");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  cors({
    origin: "*",
    methods: corsConfig.methods,
    allowedHeaders: corsConfig.headers,
    credentials: true,
  })
);

// app.options("*", cors());
app.use(morgan.successHandler);
app.use(morgan.errorHandler);

const server = http.createServer(app);
const io = Server(server, {
  cors: {
    origin: corsConfig.allowedOrigins,
    methods: corsConfig.methods,
  },
});

app.use((req, res, next) => {
  console.log("url", req.url);

  req.io = io;
  next();
});

app.use("/v1/auth", authLimiter);
app.use("/v1", routeIndex);


app.use((req, res, next) => {
  console.log("url", req.url);
  if (req.accepts("html")) {
    res
      .status(httpStatus.NOT_FOUND)
      .sendFile(path.join(__dirname, "utils", "404.html"));
  } else if (req.accepts("json")) {
    next(new ApiError(httpStatus.NOT_FOUND, "API not found"));
  } else {
    res.status(httpStatus.NOT_FOUND).type("txt").send("404 - Not Found");
  }
});

require("aws-sdk/lib/maintenance_mode_message").suppress = true;

app.use(errorConverter);
app.use(errorHandler);

module.exports = { server, io };
