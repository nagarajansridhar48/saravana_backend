const { v4 } = require("uuid");
const { SchemaFieldBuilder } = require("../validation/schemaFieldBuild");

const bannerObject = {
  image: new SchemaFieldBuilder(String).required().build(),
  route: new SchemaFieldBuilder(String).required().build(),
  buttonText: new SchemaFieldBuilder(String).required().build(),
};

const schemaFields = {
  _id: new SchemaFieldBuilder(String).default(v4).build(),

  heroBanners: new SchemaFieldBuilder([bannerObject]).default([]).build(),

  middleBanner: new SchemaFieldBuilder([bannerObject]).default([]).build(),

  featureBanner: new SchemaFieldBuilder({
    image: new SchemaFieldBuilder(String).required().build(),
    productIds: new SchemaFieldBuilder([String]).required().build(),
  }).build(),

  newArrivals: new SchemaFieldBuilder([bannerObject]).required().build(),
};

module.exports = {
  schemaFields,
};
