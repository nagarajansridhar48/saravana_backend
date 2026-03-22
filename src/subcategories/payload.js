const { v4 } = require("uuid");
const { SchemaFieldBuilder } = require("../validation/schemaFieldBuild");

const schemaFields = {
  _id: new SchemaFieldBuilder(String).default(v4).build(),
  subCategoryTitle: new SchemaFieldBuilder(String).required().build(),
  subCategoryImage: new SchemaFieldBuilder(String).required().build(),
  subCategoryDescription: new SchemaFieldBuilder(String).required().build(),
  categoryTitle: new SchemaFieldBuilder(String).required().build(),
  categoryId: new SchemaFieldBuilder(String).required().build(),
  isActive: new SchemaFieldBuilder(Boolean).default(true).build(),
    isDeleted : new SchemaFieldBuilder(Boolean).default(false).build(),
    deletedAt : new SchemaFieldBuilder(Date).default(null).build(),
};



module.exports = {
  schemaFields,
};
