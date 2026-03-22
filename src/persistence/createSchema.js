const mongoose = require("mongoose");
const handleMongooseError = require("./handleError");


const createSchema = (schemaDefinition, options = {}) => {
  const schema = new mongoose.Schema(
    {
      ...schemaDefinition,
      __v: { type: Number, select: false },
    },
    { timestamps: true, ...options },
  );

  schema.post("save", handleMongooseError)
  schema.post("insertMany", handleMongooseError)
  schema.post("update", handleMongooseError)
  schema.post("updateOne", handleMongooseError)
  schema.post("updateMany", handleMongooseError)
  schema.post("findOneAndUpdate", handleMongooseError)
  schema.post("findByIdAndUpdate", handleMongooseError)
  return schema
}

module.exports = createSchema 