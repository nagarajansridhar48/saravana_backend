const Service = require("./service");
const catchAsync = require("../utils/catchAsync");

const createBanner = catchAsync(async (req, res) => {
  const data = await Service.updateHomeBanner(req);
  res.send(data);
});

const getBanner = catchAsync(async (req, res) => {
  const data = await Service.getBanner(req);
  res.send(data);
});
module.exports = {
  createBanner,
  getBanner,
};
