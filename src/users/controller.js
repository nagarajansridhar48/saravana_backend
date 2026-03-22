const catchAsync = require("../utils/catchAsync");
const Service = require("./service");

const registerUser = catchAsync(async (req, res) => {
  const data = await Service.registerUser(req);
  res.send(data);
});

const getProfile = catchAsync(async (req, res) => {
  const data = await Service.getProfile(req);
  res.send(data);
});

const updateProfile = catchAsync(async (req, res) => {
  const data = await Service.updateProfile(req);
  res.send(data);
});

const trackOrder = catchAsync(async (req, res) => {
  const response = await Service.getTrack(req);
  res.send(response);
});

// const addAddress = async(req,res) =>{
//     const data = await Service.addAdderss(req);
//     res.send(data);
// }
const addAddress = catchAsync(async (req, res) => {
  const data = await Service.addAdderss(req);
  res.send(data);
});

const getAddress = catchAsync(async (req, res) => {
  const data = await Service.getAddressesService(req);
  res.send(data);
});

const updateAddress = catchAsync(async (req, res) => {
  const data = await Service.updateAddressService(req);
  res.send(data);
});

const deleteAddress = catchAsync(async (req, res) => {
  const data = await Service.deleteAddressService(req);
  res.send(data);
});

const getInTouch = catchAsync(async (req, res) => {
  const data = await Service.createGetInTouch(req);
  res.send(data);
});

const userEnquiry = catchAsync(async (req, res) => {
  const data = await Service.createEnquiry(req);
  res.send(data);
});

//cart

const addToCart = catchAsync(async (req, res) => {
  const data = await Service.createCart(req);
  res.send(data);
});

const addAddressToCart = catchAsync(async (req, res) => {
  const data = await Service.addAddressToCart(req);
  res.send(data);
});

const getCart = catchAsync(async (req, res) => {
  const data = await Service.getCart(req);
  res.send(data);
});

const editCart = catchAsync(async (req, res) => {
  const data = await Service.editCart(req);
  res.send(data);
});

const deleteCart = catchAsync(async (req, res) => {
  const data = await Service.deleteCart(req);
  res.send(data);
});

// wishlist

const addToWishlist = catchAsync(async (req, res) => {
  const data = await Service.addWishlist(req);
  res.send(data);
});

const getWishlist = catchAsync(async (req, res) => {
  const data = await Service.getWishlist(req);
  res.send(data);
});

const removeToWishlist = catchAsync(async (req, res) => {
  const data = await Service.deleteWishlist(req);
  res.send(data);
});

const homeServices = catchAsync(async (req, res) => {
  const data = await Service.homeService(req);
  res.send(data);
});

const searchService = catchAsync(async (req, res) => {
  const data = await Service.searchProductsService(req);
  res.send(data);
});

const addReview = catchAsync(async (req, res) => {
  const data = await Service.createRating(req);
  res.send(data);
});

const getUserReview = catchAsync(async (req, res) => {
  const data = await Service.getUserReviewRating(req);
  res.send(data);
});

const newArrivals = async (req, res) => {
  const data = await Service.newArrivalsApi(req);
  res.send(data);
};

const checkout = catchAsync(async (req, res) => {
  const data = await Service.getcheckout(req);
  res.send(data);
});
module.exports = {
  getInTouch,
  registerUser,
  addAddress,
  getAddress,
  updateAddress,
  deleteAddress,
  userEnquiry,
  addToCart,
  editCart,
  getCart,
  deleteCart,
  addToWishlist,
  getWishlist,
  removeToWishlist,
  addAddressToCart,
  getProfile,
  trackOrder,
  updateProfile,
  homeServices,
  searchService,
  newArrivals,
  addReview,
  getUserReview,
  checkout,
};
