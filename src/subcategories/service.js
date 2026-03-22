const { categoryModel } = require('../categories/model');
const { uploadToR2 } = require('../middleware/multer');
const ApiError = require('../utils/ApiError');
const Model = require('./model');

const createSubCategories = async (req) => {
    const body = req.body;
    const file = req.uploadedFile;

    if (!body || !file) {
        throw new ApiError(400, "Please enter all fileds");
    };

    const exitCategories = await categoryModel.findById(body.categoryId);
    if (!exitCategories) throw new ApiError(400, "category not found");

    const uploadedUrl = await uploadToR2(file, "subcategories", body.categoryTitle);
    const data = {
        ...body,
        subCategoryImage: uploadedUrl
    };

    const response = await Model.subCategoryModel.create(data);
    if (!response) throw new ApiError(500, "Something Wrong! Try Again Later...");
    return response;
};

const getAllSubCategories = async () => {
    const response = await Model.subCategoryModel.find({ isActive: true, isDeleted: false })
  .sort({ createdAt: -1 });;

    if (!response || response.length === 0)
        throw new ApiError(404, "No subcategories found");

    return response;
};

const getSubCategoryById = async (req) => {
    const { id } = req.params;

    const response = await Model.subCategoryModel.findById(id);

    if (!response)
        throw new ApiError(404, "Subcategory not found");

    return response;
};

const updateSubCategory = async (req) => {
   const body = req.body;
    const { id } = req.params;
    const file = req.uploadedFile || null;

    const subcategory = await Model.subCategoryModel.findById(id);
    if (!subcategory) {
        throw new ApiError(404, "Category not found");
    }
    console.log(file,"file");

    let updatedImageUrl = subcategory.subCategoryImage;

    if (file) {
        updatedImageUrl = await uploadToR2(file, "categories", body.categoryTitle || category.categoryTitle);
    }

    const updateData = {
        ...body,
        subCategoryImage: updatedImageUrl
    };

    const updated = await Model.subCategoryModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
    );

    return {
        success: true,
        message: "Subcategory updated successfully",
        data: updated
    };
};


const deleteSubCategory = async (req) => {
    const { id } = req.params;

    const exitSubcategories = await Model.subCategoryModel.findById(id);

    if (!exitSubcategories)
        throw new ApiError(404, "Subcategory not found or deletion failed");

  

    exitSubcategories.isDeleted = true;
    exitSubcategories.deletedAt = new Date();
    exitSubcategories.isActive = false;

    await exitSubcategories.save();

    return {
        success: true,
        message: "Subcategory deleted successfully (soft delete)"
    };
    return response;
};


module.exports = {
    createSubCategories,
    getAllSubCategories,
    getSubCategoryById,
    updateSubCategory,
    deleteSubCategory,
};