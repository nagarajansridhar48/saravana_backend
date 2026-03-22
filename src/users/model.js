const mongoose = require('mongoose');
const createSchema = require('../persistence/createSchema');
const { getInTouchSchemaFields, userschemaFields,enquirySchemaFields, cartSchemaFields, wishlistSchemaFields, reviewSchemaFields } = require('./payload');

//get in touch model

const getintouchSchema = createSchema(getInTouchSchemaFields,{timestamps:true});
const getInTouchModel = mongoose.model('getintouch', getintouchSchema);

// user model

const userschema = createSchema(userschemaFields,{timestamps:true});
const userModel = mongoose.model('user',userschema);

// enquiry model

const enquirySchema = createSchema(enquirySchemaFields,{timestamps:true});
const enquiryModel = mongoose.model("enquirie",enquirySchema);

// cart model

const cartSchema = createSchema(cartSchemaFields,{timestamps:true});
const cartModel = mongoose.model('cart',cartSchema);

// wishist model

const wishlistSchema = createSchema(wishlistSchemaFields,{timestamps:true});
const wishlistModel = mongoose.model('wishlist',wishlistSchema);


// rating schema

const reviewSchema = createSchema(reviewSchemaFields,{timestamps:true});
const reviewModel = mongoose.model('review',reviewSchema);

module.exports = {
  getInTouchModel,
  userModel,
  enquiryModel,
  cartModel,
  wishlistModel,
  reviewModel,
};