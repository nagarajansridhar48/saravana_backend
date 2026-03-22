const catchAsync = require("../utils/catchAsync");
const Service = require("./service");

const adminlogin = catchAsync(async (req, res) => {
  const data = await Service.adminloginService(req, res);
  res.send(data);
});

const userLogin = catchAsync(async(req,res) =>{
  const data = await Service.userloginService(req, res);
  res.send(data);
});

const createNewAccessToken = catchAsync(async (req, res) => {
  const respose = await Service.refreshAccessToken(req);
  res.send(respose);
});

const firebaseLogin = catchAsync(async (req,res)=>{
  const respose = await Service.firebaseLoginService(req);
  res.send(respose);
})


module.exports = {
  adminlogin,
  userLogin,
  createNewAccessToken,
  firebaseLogin
};
