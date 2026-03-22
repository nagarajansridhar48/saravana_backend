const mongoose = require("mongoose");
const { v4 } = require("uuid");

const variantSchema = new mongoose.Schema(
  {
     _id:{
      type:String,
      default:v4,
    },
    variantType: {
      type: String,
      enum: ["color", "dimension", "material"],
      required: true,
    },
    variantName: {
      type: String,
      required: true,
    },
    colorName: {
      type: String,
      required: function () {
        return this.variantType === "color";
      },
    },
    colorCode: {
      type: String,
      required: function () {
        return this.variantType === "color";
      },
    },
    dimensions: {
      length: {
        type: Number,
        required: function () {
          return this.variantType === "dimension";
        },
      },
      width: {
        type: Number,
        required: function () {
          return this.variantType === "dimension";
        },
      },
      height: {
        type: Number,
        required: function () {
          return this.variantType === "dimension";
        },
      },
      unit: {
        type: String,
        default: "cm",
      },
    },
    materialType: {
      type: String,
      required: function () {
        return this.variantType === "material";
      },
    },
    variantImages: {
      type: [String],
      default: [],
    },
    skuCode: {
      type: String,
      required: true,
    },
    stockCount: {
      type: Number,
      required: true,
      default: 0,
    },
    purchaseLimit: {
      type: Number,
      default: 1,
    },
    shortDescription: String,
    detailedDescription: String,
    costPrice: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
  },
);

const dimensionSchema = new mongoose.Schema({
  length: Number,
  width: Number,
  height: Number,
  unit: {
    type: String,
    default: "cm",
  },
});

const productSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: v4,
    },
    productImages: {
      type: [String],
      required: true,
      default: [],
    },
    productName: {
      type: String,
      required: true,
    },
    productCode: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    availabilityType: {
      type: String,
      enum: ["online", "enquiry"],
      default: "online",
    },
    productStatus: {
      type: String,
      enum: ["active", "inactive", "outOfStock"],
      default: "active",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    productType: {
      type: String,
      enum: ["variant", "nonVariant"],
      required: true,
    },
    variants: [variantSchema],
    skuCode: String,
    stockCount: {
      type: Number,
      default: 0,
    },
    purchaseLimit: {
      type: Number,
      default: 1,
    },
    shortDescription: String,
    detailedDescription: String,
    costPrice: Number,
    salePrice: Number,
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    material: String,
    finish: String,
    style: String,
    furnitureType: String,
    dimensions: dimensionSchema,
    weight: Number,
    loadCapacity: Number,
    warranty: String,
    materialCare: String,
    features: {
      type: [String],
      default: [],
    },
    usageType: String,
    roomType: String,
    assemblyRequired: {
      type: Boolean,
      default: false,
    },
    assemblyType: String,
    foldable: {
      type: Boolean,
      default: false,
    },
    adjustableHeight: {
      type: Boolean,
      default: false,
    },
    swivelFunction: {
      type: Boolean,
      default: false,
    },
    armrest: {
      type: Boolean,
      default: false,
    },
    backSupportType: String,
    cushionType: String,
    chairType: String,
    origin: String,
    safetyCertification: String,
    waterResistant: {
      type: Boolean,
      default: false,
    },
    fireResistant: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isDiscounted: {
      type: Boolean,
      default: false,
    },

    // 🔹 Meta Info
    createdBy: {
      type: String,
      ref: "users",
    },
    updatedBy: {
      type: String,
      ref: "users",
    },
  },
  {
    timestamps: true,
    collection: "products",
  }
);

const ProductModel = mongoose.model("products", productSchema);
module.exports = { ProductModel };
