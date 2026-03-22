const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const buildJoiSchema = require("./buildJoiSchema");

function validateSchema(payload, queryPayload = null, paramsPayload = null) {
  return (req, res, next) => {
    const isPutMethod = req.method === "PUT";
    const bodySchema = payload
      ? buildJoiSchema(isPutMethod ? makeFieldsOptional(payload) : payload)
      : null;
    const querySchema = queryPayload ? buildJoiSchema(queryPayload) : null;
    const paramsSchema = paramsPayload ? buildJoiSchema(paramsPayload) : null;

    const errors = [];

    if (bodySchema) {
      const { error } = bodySchema.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(
          ...error.details.map(
            (detail) => `Body: ${detail.message.replace(/["]/g, "")}`
          )
        );
      }
    }

    if (querySchema) {
      const { error } = querySchema.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(
          ...error.details.map(
            (detail) => `Query: ${detail.message.replace(/["]/g, "")}`
          )
        );
      }
    }

    if (paramsSchema) {
      const { error } = paramsSchema.validate(req.params, {
        abortEarly: false,
      });
      if (error) {
        errors.push(
          ...error.details.map(
            (detail) => `Params: ${detail.message.replace(/["]/g, "")}`
          )
        );
      }
    }

    if (errors.length > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, errors.join(", "));
    }

    next();
  };
}

const makeFieldsOptional = (payload) => {
  const updatedPayload = { ...payload };

  for (const key in updatedPayload) {
    if (updatedPayload[key].required) {
      updatedPayload[key] = { ...updatedPayload[key], required: false };
    }
  }

  return updatedPayload;
};

module.exports = validateSchema;
