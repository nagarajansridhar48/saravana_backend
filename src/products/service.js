const ApiError = require("../utils/ApiError");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require("../cloud/s3Client");
const { ProductModel } = require("./model");
const config = require("../config/config");
const { uploadToR2 } = require("../middleware/multer");
// CREATE PRODUCT
// CREATE PRODUCT (supports both variant & nonVariant)
const createProduct = async (req, res) => {
  console.log("✅ Incoming request to create product");

  // body may be form-data (strings) — parse carefully
  const rawBody = req.body || {};
  const files = req.uploadedFiles || {}; // ensure defined
 

  // If variants were sent as JSON string (common with form-data), parse them
  let body = { ...rawBody };
  if (body.variants && typeof body.variants === "string") {
    try {
      body.variants = JSON.parse(body.variants);
    } catch (err) {
      // If parse fails, try simple fallback (comma separated) — but usually JSON is expected
      console.warn("⚠️ Failed to JSON.parse(body.variants).", err);
      body.variants = [];
    }
  }

  // Normalize boolean/number fields that may come as strings from form-data
  const normalizeBoolean = (v) =>
    v === true || v === "true" || v === "1" || v === 1;
  const normalizeNumber = (v, fallback = undefined) => {
    if (v === undefined || v === null || v === "") return fallback;
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
  };

  // Normalize productImages (files.productImages may be single file or array)
  const normalizeFilesArray = (f) => {
    if (!f) return [];
    return Array.isArray(f) ? f : [f];
  };

  // 1) Upload main product images (if any)
  const productImageFiles = normalizeFilesArray(files.productImages);
  let productImages = [];
  if (productImageFiles.length > 0) {
    productImages = await Promise.all(
      productImageFiles.map(async (file) => {
        return await uploadToR2(
          file,
          "products",
          body.productName || "product"
        );
      })
    );
  }

  // 2) Decide flow: nonVariant => skip variants; variant => process variants
  const productType = body.productType || rawBody.productType; // could be present as string

  if (productType === "nonVariant") {
    // Prepare non-variant payload (ensure numeric/boolean types)
    const productPayload = {
      ...body,
      productImages,
      variants: [], // explicitly empty
      stockCount: normalizeNumber(body.stockCount, 0),
      purchaseLimit: normalizeNumber(body.purchaseLimit, 1),
      costPrice: normalizeNumber(body.costPrice),
      salePrice: normalizeNumber(body.salePrice),
      discount: normalizeNumber(body.discount, 0),
      tax: normalizeNumber(body.tax, 0),
      isFeatured: normalizeBoolean(body.isFeatured),
      isTrending: normalizeBoolean(body.isTrending),
      isNewArrival: normalizeBoolean(body.isNewArrival),
      isDiscounted: normalizeBoolean(body.isDiscounted),
      assemblyRequired: normalizeBoolean(body.assemblyRequired),
      foldable: normalizeBoolean(body.foldable),
      adjustableHeight: normalizeBoolean(body.adjustableHeight),
      swivelFunction: normalizeBoolean(body.swivelFunction),
      armrest: normalizeBoolean(body.armrest),
    };

    const product = await ProductModel.create(productPayload);
    console.log("🟢 Created non-variant product:", product._id);
    return { success: true, product };
  }

  // If we reach here, treat as variant product
  // Ensure variants is an array
  if (!Array.isArray(body.variants)) body.variants = [];

  // Loop through variants and upload their images
  for (let i = 0; i < body.variants.length; i++) {
    const variant = body.variants[i] || {};

    // Support when variant fields come as strings (numbers/booleans)
    variant.stockCount = normalizeNumber(variant.stockCount, 0);
    variant.purchaseLimit = normalizeNumber(variant.purchaseLimit, 1);
    variant.costPrice = normalizeNumber(variant.costPrice);
    variant.salePrice = normalizeNumber(variant.salePrice);
    variant.discount = normalizeNumber(variant.discount, 0);
    variant.tax = normalizeNumber(variant.tax, 0);

    // Key convention for form-data files: variantImages_0, variantImages_1, ...
    const key = `variantImages_${i}`;
    const variantFiles = normalizeFilesArray(files[key]);

    if (variantFiles.length === 0) {
      // no files uploaded for this variant — set empty array
      body.variants[i].variantImages = [];
      console.log(`ℹ️ No images uploaded for variant index ${i}`);
      continue;
    }

    const productSlug = body.productName || "product";
    const variantSlug = variant.variantName || `variant-${i + 1}`;

    const uploadedVariantImages = await Promise.all(
      variantFiles.map(async (file) => {
        return await uploadToR2(
          file,
          "variants",
          `${productSlug}/${variantSlug}`
        );
      })
    );

    body.variants[i].variantImages = uploadedVariantImages;
  }

  // 3) Final product payload normalization (common fields)
  const finalPayload = {
    ...body,
    productImages,
    stockCount: normalizeNumber(body.stockCount, 0),
    purchaseLimit: normalizeNumber(body.purchaseLimit, 1),
    costPrice: normalizeNumber(body.costPrice),
    salePrice: normalizeNumber(body.salePrice),
    discount: normalizeNumber(body.discount, 0),
    tax: normalizeNumber(body.tax, 0),
    isFeatured: normalizeBoolean(body.isFeatured),
    isTrending: normalizeBoolean(body.isTrending),
    isNewArrival: normalizeBoolean(body.isNewArrival),
    isDiscounted: normalizeBoolean(body.isDiscounted),
    assemblyRequired: normalizeBoolean(body.assemblyRequired),
    foldable: normalizeBoolean(body.foldable),
    adjustableHeight: normalizeBoolean(body.adjustableHeight),
    swivelFunction: normalizeBoolean(body.swivelFunction),
    armrest: normalizeBoolean(body.armrest),
  };

  const product = await ProductModel.create(finalPayload);
  console.log("🟢 Created variant product:", product._id);
  return { success: true, product };
};

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  const products = await ProductModel.find({
    isDeleted: false,
    productStatus: "active",
  }).sort({ createdAt: -1 });

  return {
    products,
  };
};

// GET SINGLE PRODUCT BY ID
const getProductById = async (req, res) => {
  const { _id } = req.params;

  const product = await ProductModel.findOne({
    _id,
    isDeleted: false,
    productStatus: "active",
  });

  if (!product) {
    throw new ApiError(404, "Product not found or inactive/deleted");
  }

  return {
    product,
  };
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  const { _id } = req.params;
  const body = req.body.data;
  const files = req.uploadedFiles || {};

  const existingProduct = await ProductModel.findById(_id);
  if (!existingProduct) {
    throw new ApiError(404, "Product not found");
  }

  // 🖼️ Upload new main images if available
  let productImages = existingProduct.productImages;
  if (files.productImages?.length) {
    const uploadedImages = await Promise.all(
      files.productImages.map(async (file) => {
        return await uploadToR2(
          file,
          "products",
          body.productName || existingProduct.productName
        );
      })
    );
    productImages = [...productImages, ...uploadedImages];
  }

  // 🧩 Update variant images if provided
  for (let i = 0; i < (body.variants || []).length; i++) {
    const key = `variantImages_${i}`;
    const variant = body.variants[i];
    const productSlug = body.productName || existingProduct.productName;
    const variantSlug = variant.variantName || `variant-${i + 1}`;

    if (files[key]?.length) {
      const uploadedVariantImages = await Promise.all(
        files[key].map(async (file) => {
          return await uploadToR2(
            file,
            "variants",
            `${productSlug}/${variantSlug}`
          );
        })
      );
      body.variants[i].variantImages = uploadedVariantImages;
    }
  }

  const updatedProduct = await ProductModel.findByIdAndUpdate(
    _id,
    { ...body, productImages },
    { new: true }
  );

  return { product: updatedProduct };
};

// 🗑️ DELETE PRODUCT
const deleteProduct = async (req, res) => {
  const { _id } = req.params;

  const product = await ProductModel.findById(_id);
  if (!product) throw new ApiError(404, "Product not found");

  product.isDeleted = true;
  product.deletedAt = new Date();
  product.productStatus = "inactive";

  await product.save();

  return {
    message: "Product deleted and marked as inactive successfully",
  };
};


const getProductDetails = async (req) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Product ID is required");

  const product = await ProductModel.findById(id)
    .select(
      "productName productImages category subCategory variants price stockCount shortDescription detailedDescription"
    )
    .lean();

  if (!product) throw new ApiError(404, "Product not found");

  const relatedProducts = await ProductModel.find({
    category: product.category,
    _id: { $ne: id },
  })
    .select("productName productImages category subCategory variants price stockCount shortDescription detailedDescription")
    .limit(4)
    .lean();

  return {
    product: product,
    relatedProducts: relatedProducts
  };
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductDetails,
};
