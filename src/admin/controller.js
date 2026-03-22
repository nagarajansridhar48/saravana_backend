const catchAsync = require("../utils/catchAsync");
const Service = require("./service");

const adminRegister = catchAsync(async (req, res) => {
  const data = await Service.createAdmin(req);
  res.send(data);
});

const fetchAdmin = catchAsync(async(req,res)=>{
  const data = await Service.getAdmin();
  res.send(data);
})

const changeStatus = catchAsync(async (req, res) => {
  const data = await Service.changeStatus(req);
  res.send(data);
});

const updateAdmin = catchAsync(async (req, res) => {
  const response = await Service.updateAdminProfile(req);
  res.send(response);
})

const getUsers = catchAsync(async (req, res) => {
  const data = await Service.getAllUser();
  res.send(data);
});

const getMessages = catchAsync(async (req, res) => {
  const data = await Service.getAllMessages();
  res.send(data);
});

const deleteMessage = catchAsync(async (req, res) => {
  const data = await Service.deleteMessage(req);
  res.send(data);
});

const getEnquiries = catchAsync(async (req, res) => {
  const data = await Service.getAllEnquiries();
  res.send(data);
});

const getEnquiryById = catchAsync(async (req, res) => {
  const data = await Service.getEnquiryById(req);
  res.send(data);
});

const deleteEnquiry = catchAsync(async (req, res) => {
  const data = await Service.deleteEnquiry(req);
  res.send(data);
});

const getAllReview = catchAsync(async (req, res) => {
  const data = await Service.getReviewRatings(req);
  res.send(data);
});

const removeReview = catchAsync(async (req, res) => {
  const data = await Service.deleteReview(req);
  res.send(data);
});

module.exports = {
  adminRegister,
  fetchAdmin,
  changeStatus,
  updateAdmin,
  getUsers,
  getMessages,
  deleteMessage,
  getEnquiries,
  getEnquiryById,
  deleteEnquiry,
  getAllReview,
  removeReview,
};
