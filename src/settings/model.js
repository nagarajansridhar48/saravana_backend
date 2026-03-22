const mongoose = require("mongoose");
const createSchema = require("../persistence/createSchema");
const { schemaFields } = require("./payload");

const schema = createSchema(schemaFields, {
  timestamps: true,
});

const HomePageBanner =
  mongoose.models.Banner || mongoose.model("Banner", schema);

module.exports = {
  HomePageBanner,
};
