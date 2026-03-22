const mongoose = require("mongoose");
const { schemaFields } = require('./payload');
const createSchema = require("../persistence/createSchema");

const schema = createSchema(schemaFields, {
    timestamps: true
});

const categoryModel = mongoose.model("categorie", schema);

module.exports = {
    categoryModel
};
