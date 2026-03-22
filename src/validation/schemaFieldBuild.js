class SchemaFieldBuilder {
  constructor(type) {
    this.field = { type };
  }

  required(isRequired = true) {
    this.field.required = isRequired;
    return this;
  }

  ref(model) {
    this.field.ref = model;
    return this;
  }

  min(value) {
    this.field.min = value;
    return this;
  }

  max(value) {
    this.field.max = value;
    return this;
  }

  match(pattern) {
    this.field.match = pattern;
    return this;
  }

  enum(values) {
    this.field.enum = values;
    return this;
  }

  optional(value = true) {
    this.field.optional = value;
    return this;
  }

  lowercase(value = true) {
    if (this.field.type === String) {
      this.field.lowercase = value;
    }
    return this;
  }

  uppercase(value = true) {
    if (this.field.type === String) {
      this.field.uppercase = value;
    }
    return this;
  }

  trim(value = true) {
    if (this.field.type === String) {
      this.field.trim = value;
    }
    return this;
  }

  default(value) {
    this.field.default = value;
    return this;
  }

  index(value = true) {
    this.field.index = value;
    return this;
  }

  unique(value = true) {
    this.field.unique = value;
    return this;
  }

  sparse(value = true) {
    this.field.sparse = value;
    return this;
  }

  immutable(value = true) {
    this.field.immutable = value;
    return this;
  }

  items(schema) {
    if (this.field.type === Array) {
      this.field.items = schema;
    }
    return this;
  }

  schema(schema) {
    if (this.field.type === Object) {
      this.field.schema = schema;
    }
    return this;
  }

  number() {
    this.field.type = Number;
    return this;
  }

  build() {
    return { ...this.field };
  }
}

module.exports = { SchemaFieldBuilder };
