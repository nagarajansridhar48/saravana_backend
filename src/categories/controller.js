const catchAsync = require('../utils/catchAsync');
const Service = require('./service');

const create_Category = catchAsync(async(req,res)=>{
    const data = await Service.createCategory(req);
    res.send(data);    
});

const getAllCategories = catchAsync(async(_,res) =>{
    const data = await Service.getAllCategories();
    res.send(data);
});

const getCategoryById = catchAsync(async(req,res) =>{
    const data = await Service.getCategoryById(req);
    res.send(data);
});

const updateCategory = catchAsync(async(req,res) =>{
    const data = await Service.updateCategory(req);
    res.send(data);
});

const deleteCategoryById = catchAsync(async(req,res) =>{
    const data = await Service.deleteCategory(req);
    res.send(data);
});


module.exports = {
    create_Category,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategoryById,
}