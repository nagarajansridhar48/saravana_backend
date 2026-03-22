const { uploadToR2 } = require("../middleware/multer");
const ApiError = require("../utils/ApiError");
const { HomePageBanner } = require("./model");

const uploadSection = async (files = [], folder) => {
  return Promise.all(files.map((file) => uploadToR2(file, folder)));
};

const groupFilesBySection = (files = []) => {
  const grouped = {
    hero: [],
    middle: [],
    feature: [],
    newArrivals: [],
  };

  for (const file of files) {
    const name = file.fieldname;

    if (name.startsWith("heroBanners")) grouped.hero.push(file);
    if (name.startsWith("middleBanner")) grouped.middle.push(file);
    if (name.startsWith("featureBanner")) grouped.feature.push(file);
    if (name.startsWith("newArrivals")) grouped.newArrivals.push(file);
  }

  return grouped;
};

const updateHomeBanner = async (req) => {
  console.log("🔵 [HOME BANNER API] Request Received");

  const allFiles = req.files || [];

  const files = groupFilesBySection(allFiles);

  let homeBanner = await HomePageBanner.findOne();
  if (!homeBanner) {
    homeBanner = new HomePageBanner();
  }

  /* ================= HERO ================= */
  if (req.body.heroBanners) {
    const heroInput = req.body.heroBanners;

    if (!Array.isArray(heroInput)) {
      throw new ApiError(400, "heroBanners must be an array");
    }

    const heroUrls = await uploadSection(files.hero, "homepage/hero");

    if (heroUrls.length !== heroInput.length) {
      throw new ApiError(400, "Hero images count mismatch");
    }

    homeBanner.heroBanners = heroInput.map((item, i) => ({
      image: heroUrls[i],
      route: item.route,
      buttonText: item.buttonText,
    }));
  }

  /* ================= MIDDLE ================= */
  if (req.body.middleBanner) {
    const middleInput = req.body.middleBanner;

    if (!Array.isArray(middleInput)) {
      throw new ApiError(400, "middleBanner must be an array");
    }

    const middleUrls = await uploadSection(files.middle, "homepage/middle");

    if (middleUrls.length !== middleInput.length) {
      throw new ApiError(400, "Middle images count mismatch");
    }

    homeBanner.middleBanner = middleInput.map((item, i) => ({
      image: middleUrls[i],
      route: item.route,
      buttonText: item.buttonText,
    }));
  }

  /* ================= NEW ARRIVALS ================= */
  if (req.body.newArrivals) {
    const newInput = req.body.newArrivals;

    if (!Array.isArray(newInput)) {
      throw new ApiError(400, "newArrivals must be an array");
    }

    const newUrls = await uploadSection(
      files.newArrivals,
      "homepage/new-arrivals",
    );

    if (newUrls.length !== newInput.length) {
      throw new ApiError(400, "New arrivals images count mismatch");
    }

    homeBanner.newArrivals = newInput.map((item, i) => ({
      image: newUrls[i],
      route: item.route,
      buttonText: item.buttonText,
    }));
  }

  /* ================= FEATURE ================= */
  if (req.body.featureBanner) {
    const { productIds } = req.body.featureBanner;

    if (!Array.isArray(productIds)) {
      throw new ApiError(400, "productIds must be array");
    }

    if (!files.feature.length) {
      throw new ApiError(400, "Feature image required");
    }

    const [featureUrl] = await uploadSection(files.feature, "homepage/feature");

    homeBanner.featureBanner = {
      image: featureUrl,
      productIds,
    };
  }

  await homeBanner.save();

  return {
    success: true,
    message: "Home banner updated successfully",
    data: homeBanner,
  };
};

module.exports = { updateHomeBanner };
