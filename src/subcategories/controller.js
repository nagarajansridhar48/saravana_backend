const catchAsync = require('../utils/catchAsync');
const Service = require('./service');


const create_SubCategories = catchAsync(async(req,res) =>{
    const data = await Service.createSubCategories(req);
    res.send(data);
});

const get_AllSubCategories = catchAsync(async (_, res) => {
    const data = await Service.getAllSubCategories();
    res.send(data);
});

const get_SubCategoryById = catchAsync(async (req, res) => {
    const data = await Service.getSubCategoryById(req);
    res.send(data);
});

const update_SubCategory = catchAsync(async (req, res) => {
    const data = await Service.updateSubCategory(req);
    res.send(data);
});

const delete_SubCategory = catchAsync(async (req, res) => {
    const data = await Service.deleteSubCategory(req);
    res.send(data);
});


module.exports = {
    create_SubCategories,
    get_AllSubCategories,
    get_SubCategoryById,
    update_SubCategory,
    delete_SubCategory,
}