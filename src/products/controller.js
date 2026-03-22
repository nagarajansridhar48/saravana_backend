const Service = require("./service");
const catchAsync = require("../utils/catchAsync");

const createProduct = catchAsync(async (req, res) => {
  const data = await Service.createProduct(req);
  res.send(data);
});

const getAllProducts = catchAsync(async (req, res) => {
  const data = await Service.getProducts(req);
  res.send(data);
});

const getProductById = catchAsync(async (req, res) => {
  const data = await Service.getProductById(req);
  res.send(data);
});

const updatedProduct = catchAsync(async (req, res) => {
  const data = await Service.updateProduct(req);
  res.send(data);
});

const deleteProduct = catchAsync(async (req, res) => {
  const data = await Service.deleteProduct(req);
  res.send(data);
});


const getProductDetails = catchAsync(async(req,res)=>{
  const data = await Service.getProductDetails(req);
  res.send(data);
}) 

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updatedProduct,
  deleteProduct,
  getProductDetails,
};
