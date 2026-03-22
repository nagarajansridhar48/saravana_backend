const { v4 } = require("uuid");
const { SchemaFieldBuilder } = require("../validation/schemaFieldBuild");

const schemaFields = {
  _id : new SchemaFieldBuilder(String).default(v4).build(),
  fullName: new SchemaFieldBuilder(String).required().build(),
  email: new SchemaFieldBuilder(String).required().build(),
  phone: new SchemaFieldBuilder(String).required().build(),
  role: new SchemaFieldBuilder(String).default('admin').build(),
  password: new SchemaFieldBuilder(String).required().build(),
  hashedPassword: new SchemaFieldBuilder(String).build(), // backend only
   lastLoginAt: new SchemaFieldBuilder(Date).build(),
};



module.exports = {
  schemaFields,
};