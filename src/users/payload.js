const { v4 } = require("uuid");
const { SchemaFieldBuilder } = require("../validation/schemaFieldBuild");


// Get in touch

const getInTouchSchemaFields = {
  _id: new SchemaFieldBuilder(String).default(v4).build(),
  username: new SchemaFieldBuilder(String).required().build(),
  email: new SchemaFieldBuilder(String).required().build(),
  description: new SchemaFieldBuilder(String).required().build(),
  userId: new SchemaFieldBuilder(String).required().build(),
};

// addresses

const addressSchemaFields = {
  _id: new SchemaFieldBuilder(String).default(v4).build(),
  firstName: new SchemaFieldBuilder(String).required().build(),
  lastName: new SchemaFieldBuilder(String).required().build(),
  email: new SchemaFieldBuilder(String).required().lowercase().trim().build(),
  phone: new SchemaFieldBuilder(String).trim().build(),
  street: new SchemaFieldBuilder(String).build(),
  city: new SchemaFieldBuilder(String).build(),
  state: new SchemaFieldBuilder(String).build(),
  pincode: new SchemaFieldBuilder(String).max(6).min(6).build(),
};


const addressObjectFields = {
  street: new SchemaFieldBuilder(String).build(),
  city: new SchemaFieldBuilder(String).build(),
  state: new SchemaFieldBuilder(String).build(),
  pincode: new SchemaFieldBuilder(String).build(),
};
// user

const userschemaFields = {
  _id: new SchemaFieldBuilder(String).default(v4).build(),
  fullName: new SchemaFieldBuilder(String).required().build(),
  email: new SchemaFieldBuilder(String).required().build(),
  phone: new SchemaFieldBuilder(String).build(),
  dob: new SchemaFieldBuilder(String).build(),
  role: new SchemaFieldBuilder(String).default("user").build(),
  password: new SchemaFieldBuilder(String).build(),
  hashedPassword: new SchemaFieldBuilder(String).build(),
   address: new SchemaFieldBuilder(addressObjectFields).default({}).build(),
  status: new SchemaFieldBuilder(String)
    .enum(["active", "inactive"])
    .default("active")
    .build(),
  addresses: new SchemaFieldBuilder([addressSchemaFields]).default([]).build(),
  profileImage: new SchemaFieldBuilder(String).build(),
  provider: new SchemaFieldBuilder(String)
    .enum(["local", "google", "facebook"])
    .default("local")
    .build(),

  googleId: new SchemaFieldBuilder(String).build(),
  facebookId: new SchemaFieldBuilder(String).build(),
};

// user enquiry

const enquirySchemaFields = {
  _id: new SchemaFieldBuilder(String).default(v4).build(),
  username: new SchemaFieldBuilder(String).required().build(),
  email: new SchemaFieldBuilder(String).required().build(),
  phone: new SchemaFieldBuilder(String).required().build(),
  description: new SchemaFieldBuilder(String).build(),
  userId: new SchemaFieldBuilder(String).required().build(), // or ObjectId if you're linking users
  productId: new SchemaFieldBuilder(String).required().build(), // or ObjectId if linking products
};

//cart

const cartSchemaFields = {
  _id: new SchemaFieldBuilder(String).default(v4).build(),

  userId: new SchemaFieldBuilder(String).required().build(),

  items: [
    {
      _id: new SchemaFieldBuilder(String).default(v4).build(),

      productId: new SchemaFieldBuilder(String).required().build(),
      variantId: new SchemaFieldBuilder(String).build(), // optional
      productType: new SchemaFieldBuilder(String).required().build(),
      variantType: new SchemaFieldBuilder(String).build(), // optional

      quantity: new SchemaFieldBuilder(Number)
        .default(1)
        .min(1)
        .required()
        .build(),
    },
  ],

  // ✅ Address fields added (as per mongoose schema)
  deliveryAddressId: new SchemaFieldBuilder(String).build(),
  billingAddressId: new SchemaFieldBuilder(String).build(),
};

//wishlist

const wishlistSchemaFields = {
  _id: new SchemaFieldBuilder(String).default(v4).build(),
  userId: new SchemaFieldBuilder(String).required().build(),
  items: [
    {
      _id: new SchemaFieldBuilder(String).default(v4).build(),
      productId: new SchemaFieldBuilder(String).required().build(),
      variantId: new SchemaFieldBuilder(String).build(),
      productType: new SchemaFieldBuilder(String).required().build(),
      variantType: new SchemaFieldBuilder(String).build(),
    },
  ],
};

// reviews
const reviewSchemaFields = {
  _id: new SchemaFieldBuilder(String).default(v4).build(),
  userId: new SchemaFieldBuilder(String).required().build(),
  productId: new SchemaFieldBuilder(String).required().ref("products").build(),
  variantId: new SchemaFieldBuilder(String).ref("products").build(),
  productType: new SchemaFieldBuilder(String)
    .required()
    .ref("products")
    .build(),
  review: new SchemaFieldBuilder(String).required().build(),
  rating: new SchemaFieldBuilder(Number).required().build(),
  reviewImages: new SchemaFieldBuilder(Array).items(String).required().build(),
};

module.exports = {
  getInTouchSchemaFields,
  userschemaFields,
  enquirySchemaFields,
  cartSchemaFields,
  wishlistSchemaFields,
  reviewSchemaFields,
};
