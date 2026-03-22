const connectToDatabase = require("./connection");
const config = require("../config/config");

let options = {
    minPoolSize: 5,
    maxPoolSize: 50,
    // replicaSet: "myReplicaSet", 
    // readPreference: "secondaryPreferred",
};

const privateDB = connectToDatabase(config.mongoose.url, "PrivateDB", options);

module.exports = { privateDB };