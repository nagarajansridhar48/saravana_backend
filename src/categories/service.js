const Model = require("./model");
const ApiError = require("../utils/ApiError");
const { uploadToR2 } = require("../middleware/multer");

const createCategory = async (req) => {
  const body = req.body;
  console.log("body", body);
  const file = req.uploadedFile;
  console.log("file", file);
  if (!body || !file) {
    throw new ApiError(400, "Please enter all fileds");
  }

  console.log("file", file);
  const uploadedUrl = await uploadToR2(file, "categories", body.categoryTitle);
  if (!uploadedUrl) throw new (500, "Image Not uploaded")();

  console.log("uploadedUrl", uploadedUrl);

  const data = {
    ...body,
    categoryImage: uploadedUrl,
  };
  const response = await Model.categoryModel.create(data);
  if (!response) throw new ApiError(500, "Something Wrong! Try Again Later...");
  return response;
};

const getAllCategories = async () => {
  const categories = await Model.categoryModel
  .find({ isActive: true, isDeleted: false })
  .sort({ createdAt: -1 });
  return {
    success: true,
    count: categories.length,
    data: categories,
  };
};

const getCategoryById = async (req) => {
  console.log(req.params);
  const { id } = req.params;
  const category = await Model.categoryModel.findById(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return {
    success: true,
    data: category,
  };
};

const updateCategory = async (req) => {
  const body = req.body;
  const { id } = req.params;
  const file = req.uploadedFile || null;

  const category = await Model.categoryModel.findById(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  let updatedImageUrl = category.categoryImage;

  if (file) {
    updatedImageUrl = await uploadToR2(
      file,
      "categories",
      body.categoryTitle || category.categoryTitle,
    );
  }

  const updateData = {
    ...body,
    categoryImage: updatedImageUrl,
  };

  const updated = await Model.categoryModel.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  return {
    success: true,
    message: "Category updated successfully",
    data: updated,
  };
};

const deleteCategory = async (req) => {
  const { id } = req.params;

  const category = await Model.categoryModel.findById(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  category.isDeleted = true;
  category.deletedAt = new Date();
  category.isActive = false;

  await category.save();

  return {
    success: true,
    message: "Category deleted successfully (soft delete)",
  };
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
