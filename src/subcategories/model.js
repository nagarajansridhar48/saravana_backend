const mongoose = require("mongoose");
const createSchema = require('../persistence/createSchema');
const {schemaFields} = require('./payload');


const schema = createSchema(schemaFields,{
    timestamps: true
});

const subCategoryModel = mongoose.model("subCategorie",schema);

module.exports = {
    subCategoryModel
}