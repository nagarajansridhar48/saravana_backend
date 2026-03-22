const Joi = require("joi");

function buildJoiSchema(payload) {
  const buildField = (properties) => {
    let joiField = null;

    switch (properties.type) {
      case String:
        joiField = Joi.string();
        if (properties.lowercase) joiField = joiField.lowercase();
        if (properties.trim) joiField = joiField.trim();
        if (properties.min) joiField = joiField.min(properties.min);
        if (properties.max) joiField = joiField.max(properties.max);
        if (properties.match)
          joiField = joiField.pattern(new RegExp(properties.match));
        if (properties.enum) joiField = joiField.valid(...properties.enum);
        break;

      case Number:
        joiField = Joi.number();
        if (properties.min) joiField = joiField.min(properties.min);
        if (properties.max) joiField = joiField.max(properties.max);
        if (properties.enum) joiField = joiField.valid(...properties.enum);
        break;

      case Boolean:
        joiField = Joi.boolean();
        break;

      case Array:
        joiField = Joi.array();
        if (properties.items)
          joiField = joiField.items(buildField(properties.items));
        break;

      case Object:
        joiField = Joi.object(buildJoiSchema(properties.schema));
        break;

      default:
        throw new Error(`Unsupported type for field: ${properties.type}`);
    }

    if (properties.required) joiField = joiField.required();
    return joiField;
  };

  const schema = {};
  for (const [key, properties] of Object.entries(payload)) {
    schema[key] = buildField(properties);
  }

  return Joi.object(schema).options({ abortEarly: false });
}

module.exports = buildJoiSchema;
