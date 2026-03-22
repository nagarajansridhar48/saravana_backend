const { userModel, enquiryModel, getInTouchModel, reviewModel } = require('../users/model');
const ApiError = require('../utils/ApiError');
const { HashPassword } = require('../utils/hashPwd');
const Model = require('./model');

const createAdmin = async (req) => {
  const { fullName, email, phone, password, conformPassword } = req.body;

  if (!fullName || !email || !phone || !password || !conformPassword) {
    throw new ApiError(400, "Please enter all fields");
  }

  if (password !== conformPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  const exitUser = await Model.adminModel.findOne({ email });
  if (exitUser) {
    throw new ApiError(400, "This Email Already Registered");
  }

  const hashedPassword = await HashPassword(password);
  if (!hashedPassword) {
    throw new ApiError(500, "Password hashing failed");
  }

  const request = {
    fullName,
    email,
    phone,
    password: hashedPassword,
  };

  const response = await Model.adminModel.create(request);
  if (!response) {
    throw new ApiError(500, "Failed to create admin");
  }

  return response;
};

// get admin 

const getAdmin = async () =>{
  const admin = await Model.adminModel.find();
  console.log(admin)
  return admin[0];
}

const changeStatus = async (req) => {
  const { userId, status } = req.query;

  if (!userId || !status) {
    throw new ApiError(400, "Missing userId or status");
  }

  if (!["active", "inactive"].includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  const updatedUser = await userModel.findByIdAndUpdate(
    userId,
    { status },
    { new: true }
  );

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return updatedUser;
};

const getAllMessages = async () => {
  const messages = await getInTouchModel.find().sort({ createdAt: -1 });

  if (!messages || messages.length === 0) {
    throw new ApiError(404, "No messages found");
  }

  return messages;
};

const deleteMessage = async (req) => {
  const { id } = req.params;

  const deleted = await getInTouchModel.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "Message not found");
  }

  return deleted;
};

const getAllUser = async () => {
  const response = await userModel.find();

  if (!response || response.length === 0) {
    throw new ApiError(404, "No users found");
  }

  return response;
};

const updateAdminProfile = async (req) => {
  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized");
  }

  const adminId = req.user._id;

  const { fullName, email, phone, password, conformPassword } = req.body;

  const updateData = {
    fullName,
    email,
    phone,
  };

  // Handle password update
  if (password) {
    if (password !== conformPassword) {
      throw new ApiError(400, "Passwords do not match");
    }

    const hashedPassword = await HashPassword(password);

    updateData.password = password;
    updateData.hashedPassword = hashedPassword;
  }

  const updatedAdmin = await Model.adminModel
    .findByIdAndUpdate(adminId, { $set: updateData }, { new: true, runValidators: true })
    .select("-password -hashedPassword");

  if (!updatedAdmin) {
    throw new ApiError(404, "Admin not found");
  }

  return updatedAdmin;
};


const getAllEnquiries = async () => {
  const enquiries = await enquiryModel
    .find()
    .populate("userId", "fullName email")
    .populate("productId", "productName price");

  if (!enquiries || enquiries.length === 0) {
    throw new ApiError(404, "No enquiries found");
  }

  return enquiries;
};

const getEnquiryById = async (req) => {
  const { id } = req.params;

  const enquiry = await enquiryModel.findById(id);
  if (!enquiry) {
    throw new ApiError(404, "Enquiry not found");
  }

  return enquiry;
};

const deleteEnquiry = async (req) => {
  const { id } = req.params;

  const deleted = await enquiryModel.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "Enquiry not found");
  }

  return deleted;
};

const getReviewRatings = async () => {
  const reviewRatings = await reviewModel.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: { path: "$productInfo" } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: { path: "$userDetails" } },
    {
      $group: {
        _id: "$productId",
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        product: { $first: "$productInfo" },
        reviews: {
          $push: {
            reviewId: "$_id",
            userName: "$userDetails.name",
            rating: "$rating",
            review: "$review",
            reviewImages: "$reviewImages",
            createdAt: "$createdAt",
          },
        },
      },
    },
  ]);

  if (!reviewRatings || reviewRatings.length === 0) {
    throw new ApiError(404, "No reviews available");
  }

  return {
    success: true,
    message: "Reviews and ratings fetched successfully",
    data: reviewRatings,
  };
};

const deleteReview = async (req) => {
  const { reviewId } = req.params;

  if (!reviewId) {
    throw new ApiError(400, "Review ID is required");
  }

  const deleted = await reviewModel.findByIdAndDelete(reviewId);
  if (!deleted) {
    throw new ApiError(404, "Review not found");
  }

  return {
    success: true,
    message: "Review deleted",
  };
};

module.exports = {
  createAdmin,
  getAdmin,
  changeStatus,
  getAllMessages,
  deleteMessage,
  updateAdminProfile,
  getAllUser,
  getAllEnquiries,
  getEnquiryById,
  deleteEnquiry,
  getReviewRatings,
  deleteReview,
};