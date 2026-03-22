const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

// insert

const create = async (model, data, errorProps = null) => {
  console.log("m", model, data);
  const newData = await model.create(data);
  if (!newData && errorProps)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      errorProps.message || "Data Not Inserted"
    );
  return newData;
};

const createMany = async (model, data, errorProps = null) => {
  const newData = await model.insertMany(data);
  if (!newData && errorProps)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      errorProps.message || "Data Not Inserted"
    );
  return newData;
};

// read

const getAll = async (
  model,
  query = {},
  projection = {},
  errorProps = null,
  skip,
  limit
) => {
  const data = await model
    .find(query, projection)
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();
  if ((!data || data.length === 0) && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "Data Not Found"
    );
  return data;
};

const getById = async (model, id, projection = {}, errorProps = null) => {
  const data = await model.findById(id, projection);
  if ((!data || data.length === 0) && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "Data Not Found"
    );
  return data;
};

const getOne = async (
  model,
  query = {},
  projection = {},
  errorProps = null
) => {
  const data = await model.findOne(query, projection);
  if (!data && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "Data Not Found"
    );
  return data;
};

const count = async (model, query = {}, errorProps = null) => {
  const count = await model.countDocuments(query);
  if (count === 0 && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "No Documents Found"
    );
  return count;
};

const exists = async (model, query = {}, errorProps = null) => {
  const doesExist = await model.exists(query);
  if (!doesExist && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "Data Not Found"
    );
  return !!doesExist;
};

// update

const update = async (model, query, data, errorProps = null) => {
  const updatedData = await model.findOneAndUpdate(query, data, { new: true });
  if (!updatedData && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "Data Not Found"
    );
  return updatedData;
};

const updateOne = async (model, query, data, errorProps = null) => {
  const result = await model.updateOne(query, data);
  if (result.matchedCount === 0 && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "Data Not Found"
    );
  return result;
};

const updateAll = async (model, query, data, errorProps = null) => {
  const result = await model.updateMany(query, data);
  if (result.matchedCount === 0 && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "Data Not Found"
    );
  return result;
};

const replace = async (model, query, data, errorProps = null) => {
  const replacedData = await model.replaceOne(query, data);
  if (replacedData.matchedCount === 0 && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "Data Not Found"
    );
  return replacedData;
};

const updateById = async (model, query, data, errorProps = null) => {
  const updatedData = await model.findOneAndUpdate(query, data, { new: true });
  if (!updatedData && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "Data Not Found"
    );
  return updatedData;
};

const bulkUpdate = async (model, updates, errorProps = null) => {
  const bulkOps = updates.map(({ filter, update }) => ({
    updateOne: {
      filter,
      update,
    },
  }));
  const result = await model.bulkWrite(bulkOps);
  if (result.matchedCount === 0 && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "No Records Updated"
    );
  return result;
};

// delete

const remove = async (model, query, errorProps = null) => {
  const deletedData = await model.findOneAndDelete(query);
  if (!deletedData && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "Data Not Found"
    );
  return deletedData;
};

const removeMany = async (model, query, errorProps = null) => {
  const deleteResult = await model.deleteMany(query);
  if (deleteResult.deletedCount === 0 && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "No Records Found to Delete"
    );
  return deleteResult;
};

const removeById = async (model, id, errorProps = null) => {
  const deletedData = await model.findByIdAndDelete(id);
  if (!deletedData && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "Data Not Found"
    );
  return deletedData;
};

const removeOne = async (model, query, errorProps = null) => {
  const deleteResult = await model.deleteOne(query);
  if (deleteResult.deletedCount === 0 && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "No Record Found to Delete"
    );
  return deleteResult;
};

const bulkRemove = async (model, queries, errorProps = null) => {
  const bulkOps = queries.map((filter) => ({
    deleteOne: { filter },
  }));
  const result = await model.bulkWrite(bulkOps);
  if (result.deletedCount === 0 && errorProps)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      errorProps.message || "No Records Found to Delete"
    );
  return result;
};

module.exports = {
  create,
  createMany,
  getById,
  getAll,
  getOne,
  count,
  exists,
  update,
  updateOne,
  updateAll,
  updateById,
  bulkUpdate,
  replace,
  remove,
  removeMany,
  removeById,
  removeOne,
  bulkRemove,
};
