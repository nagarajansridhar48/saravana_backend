const ApiError = require("../utils/ApiError");
const { HashPassword } = require("../utils/hashPwd");
const {
  getInTouchModel,
  userModel,
  enquiryModel,
  cartModel,
  wishlistModel,
  reviewModel,
} = require("./model");
const { ProductModel } = require("../products/model");
const httpStatus = require("http-status");
const { OrderModel } = require("../orders/model");
const { HomePageBanner } = require("../settings/model");
// const { OrderModel } = require("../orders/model");
const { categoryModel } = require("../categories/model");
const { uploadToR2 } = require("../middleware/multer");

// register user

const registerUser = async (req) => {
  const { fullName, email, phone, password, conformPassword } = req.body;

  if (!fullName || !email || !phone || !password || !conformPassword) {
    throw new ApiError(400, "Please enter all fileds");
  }

  const exitUser = await userModel.findOne({ email });

  if (exitUser) {
    throw new ApiError(400, "This Email Already Registered");
  }

  const hashedPassword = await HashPassword(password);

  const request = {
    fullName,
    email,
    password,
    phone,
    hashedPassword: hashedPassword,
  };
  const response = await userModel.create(request);
  return response;
};

// get profile

const getProfile = async (req) => {
  const userId = req.user._id;
  const profileData = await userModel
    .findById(userId)
    .select("fullName email phone address dob profileImage _id");
  if (!profileData) throw new ApiError(404, "User not found");
  return profileData;
};

// updateprofile

const updateProfile = async (req) => {
  const { body, file } = req;
  const userId = req.user._id;

  if (!body) {
    throw new ApiError(400, "Please enter all fields");
  }

  const { street, city, state, zipcode, ...rest } = body;


 
  const userProfile = {
    ...rest,
  };

  // Handle address object
  if (street || city || state || pincode) {
    userProfile.address = {
      street: street || "",
      city: city || "",
      state: state || "",
      pincode: zipcode || "",
    };
  }

  // Upload image if provided
  if (file) {
    const uploadedUrl = await uploadToR2(file, "profileImage");

    if (!uploadedUrl) {
      throw new ApiError(500, "Image not uploaded");
    }

    userProfile.profileImage = uploadedUrl;
  }

  const updatedProfile = await userModel.findByIdAndUpdate(
    userId,
    { $set: userProfile },
    { new: true, runValidators: true },
  );

  if (!updatedProfile) {
    throw new ApiError(404, "User not found");
  }

  return {
    message: "Your Profile Updated!",
    updatedProfile,
  };
};

// track_order

const getTrack = async (req) => {
  const userId = req.user._id;
  if (!userId) throw new ApiError(401, "Invalid User");

  const response = await OrderModel.aggregate([
    {
      $match: { userId: userId },
    },
  ]);
  if (!response) throw new ApiError(404, "Order Not Found");
  return response;
};

//  Add Address

const addAdderss = async (req) => {
  const userId = req.user._id;
  const newAddress = req.body;

  const getUserData = await userModel.findById(userId);
  if (!getUserData) throw new ApiError(404, "User not found");

  getUserData.addresses.push(newAddress);

  await getUserData.save();
  return getUserData;
};

// get address

const getAddressesService = async (req) => {
  const userId = req.user._id;

  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  return user.addresses || [];
};

// update the address

const updateAddressService = async (req) => {
  const userId = req.user._id;
  const { id } = req.params;
  const updateData = req.body;

  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const index = user.addresses.findIndex((addr) => addr._id === id);

  if (index === -1) throw new ApiError(404, "Address not found");

  user.addresses[index] = {
    ...updateData,
  };

  await user.save();

  return user.addresses;
};

// delete the address

const deleteAddressService = async (req) => {
  const userId = req.user._id;
  const { id } = req.params;

  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const filtered = user.addresses.filter((addr) => addr._id.toString() !== id);

  if (filtered.length === user.addresses.length)
    throw new ApiError(404, "Address not found");

  user.addresses = filtered;

  await user.save();

  return user.addresses;
};

// get in touch

const createGetInTouch = async (req) => {
  const { username, email, description } = req.body;

  const userId = req.user?._id;
  if (!username || !email || !description) {
    throw new ApiError(404, "All fields are required.");
  }

  const newMessage = new getInTouchModel({
    userId,
    username,
    email,
    description,
  });

  await newMessage.save();

  return newMessage;
};

// create enquiry

const createEnquiry = async (req) => {
  const { username, email, phone, description, userId, productId } = req.body;

  if (!username || !email || !phone || !userId || !productId) {
    throw new ApiError(400, "Required fields are missing");
  }

  const newEnquiry = new enquiryModel({
    username,
    email,
    phone,
    description,
    userId,
    productId,
  });

  const savedEnquiry = await newEnquiry.save();
  return savedEnquiry;
};

//cart

const createCart = async (req) => {
  const { quantity = 1 } = req.body;
  const { productId, variantId } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "User must be login first");
  }

  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product Not Found");
  }

  const { productType, variants } = product;

  let selectedVariant;

  if (productType === "variant") {
    selectedVariant = variants.find((v) => String(v._id) === String(variantId));

    if (!selectedVariant) {
      throw new ApiError(404, "Variant not found");
    }

    if (selectedVariant.stockCount < quantity) {
      throw new ApiError(400, "Insufficient stock for this variant");
    }
  } else if (productType === "nonVariant") {
    if (product.stockCount < quantity) {
      throw new ApiError(400, "Insufficient stock for this product");
    }

    selectedVariant = null;
  } else {
    throw new ApiError(400, "Invalid product type");
  }

  let userCart = await cartModel.findOne({ userId });
  console.log(userCart);
  if (!userCart) {
    const newItem = {
      productId,
      productType,
      quantity,
      ...(productType === "variant" && { variantId }),
    };

    userCart = await cartModel.create({
      userId,
      items: [newItem],
    });

    return {
      success: true,
      message: "Product added to cart successfully",
      data: userCart,
    };
  }

  const item = userCart.items.find((i) => {
    if (productType === "variant") {
      return (
        String(i.productId) === String(productId) &&
        String(i.variantId) === String(variantId)
      );
    } else {
      return String(i.productId) === String(productId);
    }
  });

  if (item) {
    item.quantity = quantity;
  } else {
    const newItem = {
      productId,
      productType,
      quantity,
      ...(productType === "variant" && { variantId }),
    };

    userCart.items.push(newItem);
  }

  const updatedCart = await userCart.save();

  return {
    success: true,
    message: item
      ? "Cart updated successfully"
      : "Product added to cart successfully",
    data: updatedCart,
  };
};

const getCart = async (req) => {
  const userId = req?.user?._id;
  if (!userId) throw new ApiError(400, "User must login first");

  const cartData = await cartModel.aggregate([
    // 1️⃣ Match user cart
    { $match: { userId } },

    // 2️⃣ Unwind individual cart items
    { $unwind: "$items" },

    // 3️⃣ Lookup product details
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product",
      },
    },

    // 4️⃣ Unwind product
    { $unwind: "$product" },

    // 5️⃣ Pick selected variant (if productType === 'variant')
    {
      $addFields: {
        selectedVariant: {
          $cond: {
            if: { $eq: ["$items.productType", "variant"] },
            then: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$product.variants",
                    as: "v",
                    cond: {
                      $eq: [
                        { $toString: "$$v._id" },
                        { $toString: "$items.variantId" },
                      ],
                    },
                  },
                },
                0,
              ],
            },
            else: null,
          },
        },
      },
    },

    // 6️⃣ Extract salePrice / costPrice from product or variant
    {
      $addFields: {
        salePrice: {
          $cond: {
            if: { $eq: ["$items.productType", "variant"] },
            then: "$selectedVariant.salePrice",
            else: "$product.salePrice",
          },
        },
        costPrice: {
          $cond: {
            if: { $eq: ["$items.productType", "variant"] },
            then: "$selectedVariant.costPrice",
            else: "$product.costPrice",
          },
        },
      },
    },

    // 7️⃣ Compute item total
    {
      $addFields: {
        quantity: { $toInt: "$items.quantity" },
        totalItemPrice: {
          $multiply: [
            {
              $cond: {
                if: { $gt: ["$salePrice", 0] },
                then: "$salePrice",
                else: 0,
              },
            },
            { $toInt: "$items.quantity" },
          ],
        },
      },
    },

    // 8️⃣ Pick correct product image
    {
      $addFields: {
        productImage: {
          $cond: {
            if: { $eq: ["$items.productType", "variant"] },
            then: { $arrayElemAt: ["$selectedVariant.variantImages", 0] },
            else: { $arrayElemAt: ["$product.productImages", 0] },
          },
        },
      },
    },

    // 9️⃣ Format output item
    {
      $project: {
        _id: 0,
        userId: 1,
        productId: "$items.productId",
        variantId: "$items.variantId",
        quantity: 1,

        productName: "$product.productName",
        productType: "$items.productType",
        productStatus: "$product.productStatus",

        productImage: 1,

        priceBreakdown: {
          salePrice: "$salePrice",
          costPrice: "$costPrice",
          totalItemPrice: "$totalItemPrice",
        },
      },
    },

    // 🔟 Group complete cart
    {
      $group: {
        _id: "$userId",
        items: { $push: "$$ROOT" },
        subtotal: { $sum: "$priceBreakdown.totalItemPrice" },
      },
    },
  ]);

  // 🧮 Empty cart handling
  if (!cartData.length) {
    return {
      success: false,
      message: "No products in cart",
      items: [],
      totalPrice: 0,
      totalCostPrice: 0,
      totalSalePrice: 0,
      totalSavings: 0,
    };
  }

  const userCart = cartData[0];
  const items = userCart.items || [];

  // 🧮 Calculate totals
  const totalSalePrice = items.reduce(
    (sum, i) => sum + (i.priceBreakdown.salePrice || 0) * (i.quantity || 1),
    0,
  );

  const totalCostPrice = items.reduce(
    (sum, i) => sum + (i.priceBreakdown.costPrice || 0) * (i.quantity || 1),
    0,
  );

  const totalSavings = totalCostPrice - totalSalePrice;

  return {
    success: true,
    message: "Cart fetched successfully",

    totalPrice: userCart.subtotal,
    totalSalePrice,
    totalCostPrice,
    totalSavings,

    items,
  };
};

const editCart = async (req) => {
  const userId = req.user._id;
  const { variantId, productId, quantity } = req.body;

  if (!userId) {
    throw new ApiError(httpStatus.NOT_FOUND, "UserId not provided");
  }

  if (!variantId && !productId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "VariantId or ProductId required",
    );
  }

  const findCart = await cartModel.findOne({ userId });

  if (!findCart) {
    throw new ApiError(httpStatus.NOT_FOUND, "No cart found");
  }

  let itemIndex = -1;

  if (variantId) {
    itemIndex = findCart.items.findIndex((item) => item.variantId == variantId);
  }

  if (!variantId && productId) {
    itemIndex = findCart.items.findIndex((item) => item.productId == productId);
  }

  if (itemIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, "Item not found in cart");
  }

  findCart.items[itemIndex].quantity = quantity;

  await findCart.save();

  return {
    success: true,
    message: "Cart updated successfully",
    data: findCart,
  };
};

const deleteCart = async (req) => {
  const userId = req?.user?._id;
  const { id } = req.params;

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User ID missing from request");
  }
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Cart item ID is required");
  }

  const findCart = await cartModel.findOne({ userId });

  if (!findCart) {
    throw new ApiError(httpStatus.NOT_FOUND, "Cart not found");
  }

  const updatedItems = findCart.items.filter((item) => {
    const variantMatch = item.variantId?.toString() === id;
    const productMatch = item.productId?.toString() === id;
    return !(variantMatch || productMatch);
  });

  if (updatedItems.length === findCart.items.length) {
    throw new ApiError(httpStatus.NOT_FOUND, "Item not found in cart");
  }

  findCart.items = updatedItems;
  await findCart.save();

  return {
    success: true,
    message: "Product removed from cart successfully",
    data: findCart,
  };
};

// wishlist

const addWishlist = async (req) => {
  const userId = req?.user?._id;
  const { productId, variantId, variantType } = req.body;

  if (!userId)
    throw new ApiError(httpStatus.BAD_REQUEST, "User must login first");
  if (!productId)
    throw new ApiError(httpStatus.BAD_REQUEST, "Product ID is required");

  const findProduct = await ProductModel.findById(productId);
  if (!findProduct)
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");

  let matchedVariant = null;
  console.log(findProduct, "---------");
  if (findProduct.productType === "variant") {
    if (!variantType)
      throw new ApiError(httpStatus.BAD_REQUEST, "Variant type is required");
    if (!variantId)
      throw new ApiError(httpStatus.BAD_REQUEST, "Variant ID is required");

    matchedVariant = findProduct.variants.find(
      (v) => v.variantType === variantType && v._id.toString() === variantId,
    );

    if (!matchedVariant) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Variant not found for this product",
      );
    }
  }

  let userWishlist = await wishlistModel.findOne({ userId });

  if (!userWishlist) {
    userWishlist = await wishlistModel.create({
      userId,
      items: [
        {
          productId,
          productType: findProduct.productType,
          ...(findProduct.productType === "variant" && {
            variantId,
            variantType,
          }),
        },
      ],
    });

    return {
      success: true,
      message: "Product added to wishlist successfully",
      data: userWishlist,
    };
  }

  const alreadyExists = userWishlist.items.some((item) => {
    if (findProduct.productType === "variant" && item.variantId) {
      return (
        item.productId?.toString() === productId &&
        item.variantId?.toString() === variantId
      );
    }
    return item.productId?.toString() === productId;
  });

  if (alreadyExists) {
    return {
      success: false,
      message: "Product already in wishlist",
      data: userWishlist,
    };
  }

  userWishlist.items.push({
    productId,
    productType: findProduct.productType,
    ...(findProduct.productType === "variant" && {
      variantId,
      variantType,
    }),
  });

  const updatedWishlist = await userWishlist.save();

  return {
    success: true,
    message: "Wishlist updated successfully",
    data: updatedWishlist,
  };
};

const getWishlist = async (req) => {
  const userId = req?.user?._id;
  if (!userId) throw new ApiError(400, "User must login");

  const wishlistItems = await wishlistModel.aggregate([
    { $match: { userId } },
    { $unwind: "$items" },

    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },

    {
      $lookup: {
        from: "carts",
        let: {
          productId: "$items.productId",
          variantId: "$items.variantId",
        },
        pipeline: [
          { $match: { $expr: { $eq: ["$userId", userId] } } },
          { $unwind: "$items" },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$items.productId", "$$productId"] },
                  { $eq: ["$items.variantId", "$$variantId"] },
                ],
              },
            },
          },
        ],
        as: "cartMatch",
      },
    },

    {
      $addFields: {
        isInCart: { $gt: [{ $size: "$cartMatch" }, 0] },
      },
    },

    {
      $addFields: {
        selectedVariant: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$product.variants",
                as: "v",
                cond: {
                  $eq: [{ $toString: "$$v._id" }, "$items.variantId"],
                },
              },
            },
            0,
          ],
        },
      },
    },

    // 🎯 Clean final response
    {
      $project: {
        _id: 0,
        productId: "$product._id",
        productName: "$product.productName",
        productImages: "$product.productImages",
        productType: "$items.productType",
        variantId: "$items.variantId",
        variantType: "$items.variantType",
        selectedVariant: 1,
        isInCart: 1,
      },
    },
  ]);

  return {
    success: true,
    message: "Wishlist fetched successfully",
    data: wishlistItems,
  };
};

const deleteWishlist = async (req) => {
  const userId = req.user?._id;
  const { id } = req.params;

  if (!userId) throw new ApiError(400, "User must login first");

  if (!id) throw new ApiError(400, "Wishlist item ID is required");

  const findWishList = await wishlistModel.findOne({ userId });

  if (!findWishList) throw new ApiError(404, "No wishlist found");

  if (!findWishList.items.length) throw new ApiError(404, "Wishlist is empty");

  const updatedItems = findWishList.items.filter((item) => {
    const variantMatch = item.variantId?.toString() === id;
    const productMatch = item.productId?.toString() === id;
    return !(variantMatch || productMatch);
  });

  if (updatedItems.length === findWishList.items.length) {
    throw new ApiError(httpStatus.NOT_FOUND, "Item not found in cart");
  }

  findWishList.items = updatedItems;
  await findWishList.save();

  return {
    success: true,
    message: "Product removed from wishlist successfully",
    data: findWishList,
  };
};

const addAddressToCart = async (req) => {
  const { deliveryAddress, billingAddress } = req.body;
  console.log(req.body, "htsnfuw sajdnja");

  const address = {};
  if (deliveryAddress) {
    address.deliveryAddressId = deliveryAddress;
  }

  if (billingAddress) {
    address.billingAddressId = billingAddress;
  }
  const userId = req.user._id;

  const updateCartAddress = await cartModel.findOneAndUpdate(
    { userId: userId },
    address,
    { new: true },
  );

  return { success: true, message: "Address Updated", data: updateCartAddress };
};

const homeService = async (req) => {
  const bannerDoc = await HomePageBanner.findOne().lean();

  const topBanner = bannerDoc?.heroBanners || [];
  const middleBanner = bannerDoc?.middleBanner || [];
  const featureBanner = bannerDoc?.featureBanner || null;

  let featureProducts = [];

  if (
    featureBanner &&
    Array.isArray(featureBanner.productIds) &&
    featureBanner.productIds.length
  ) {
    featureProducts = await ProductModel.find({
      _id: { $in: featureBanner.productIds },
      isDeleted: false,
      productStatus: "active",
    }).lean();

    featureProducts.sort(
      (a, b) =>
        featureBanner.productIds.indexOf(a._id.toString()) -
        featureBanner.productIds.indexOf(b._id.toString()),
    );
  }

  const topDeals = await OrderModel.aggregate([
    { $unwind: "$orderDetails" },
    { $unwind: "$orderDetails.products" },

    {
      $group: {
        _id: "$orderDetails.products.productId",
        totalSold: { $sum: "$orderDetails.products.quantity" },
        totalRevenue: { $sum: "$orderDetails.products.subtotal" },
      },
    },

    { $sort: { totalSold: -1 } },
    { $limit: 10 },

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },

    { $unwind: "$product" },

    {
      $match: {
        "product.isDeleted": false,
        "product.productStatus": "active",
      },
    },

    // 🔥 Extract first available variant (you can customize logic)
    {
      $addFields: {
        firstVariant: {
          $cond: [
            { $eq: ["$product.productType", "variant"] },
            { $arrayElemAt: ["$product.variants", 0] },
            null,
          ],
        },
      },
    },

    {
      $project: {
        _id: 0,
        id: "$_id",
        totalSold: 1,
        totalRevenue: 1,

        name: "$product.productName",
        image: {
          $ifNull: [
            { $arrayElemAt: ["$product.productImages", 0] },
            { $arrayElemAt: ["$firstVariant.variantImages", 0] },
          ],
        },

        price: {
          $cond: [
            { $eq: ["$product.productType", "variant"] },
            "$firstVariant.salePrice",
            "$product.salePrice",
          ],
        },

        originalPrice: {
          $cond: [
            { $eq: ["$product.productType", "variant"] },
            "$firstVariant.costPrice",
            "$product.costPrice",
          ],
        },

        discount: {
          $cond: [
            { $eq: ["$product.productType", "variant"] },
            "$firstVariant.discount",
            "$product.discount",
          ],
        },

        stockCount: {
          $cond: [
            { $eq: ["$product.productType", "variant"] },
            "$firstVariant.stockCount",
            "$product.stockCount",
          ],
        },

        isTrending: "$product.isTrending",
        isFeatured: "$product.isFeatured",
        reviews: "$totalSold",
      },
    },
  ]);

  const categories = await categoryModel.find({ isActive: true }).lean();

  const newArrivals = await ProductModel.aggregate([
    {
      $match: {
        isDeleted: false,
        productStatus: "active",
      },
    },

    { $sort: { createdAt: -1 } },
    { $limit: 10 },

    {
      $project: {
        _id: 1,
        productName: 1,
        productImages: 1,
        salePrice: 1,
        discount: 1,
        productType: 1,
        variants: 1,
        isTrending: 1,
        isFeatured: 1,
        createdAt: 1,
      },
    },
  ]);

  return {
    success: true,
    data: {
      topBanner,
      middleBanner,

      featureBanner: featureBanner
        ? {
            ...featureBanner,
            products: featureProducts, // ✅ populated products
          }
        : null,

      topDeals,
      categories,
      newArrivals,
    },
  };
};

const searchProductsService = async (req) => {
  const {
    q,
    category,
    subCategory,
    minPrice,
    maxPrice,
    sortBy = "latest",
    page = 1,
    limit = 12,
  } = req.query;

  console.log(req.query, "sssssssssssssssssssss");
  const pageNum = Number(page);
  const limitNum = Number(limit);

  /* ================= MATCH FILTER ================= */
  const matchStage = {
    isDeleted: false,
    productStatus: "active",
  };

  if (q) {
    matchStage.productName = {
      $regex: q,
      $options: "i",
    };
  }

  if (category) matchStage.category = category;
  if (subCategory) matchStage.subCategory = subCategory;

  /* ================= SORT LOGIC ================= */
  let sortStage = { createdAt: -1 }; // default: latest

  if (sortBy === "priceLow") {
    sortStage = { displayPrice: 1 };
  }

  if (sortBy === "priceHigh") {
    sortStage = { displayPrice: -1 };
  }

  /* ================= AGGREGATION ================= */
  const pipeline = [
    { $match: matchStage },

    // Calculate display price
    {
      $addFields: {
        displayPrice: {
          $cond: [
            { $eq: ["$productType", "variant"] },
            {
              $ifNull: [{ $min: "$variants.salePrice" }, 0],
            },
            "$salePrice",
          ],
        },
      },
    },
  ];

  /* ================= PRICE FILTER ================= */
  if (minPrice || maxPrice) {
    pipeline.push({
      $match: {
        displayPrice: {
          ...(minPrice && { $gte: Number(minPrice) }),
          ...(maxPrice && { $lte: Number(maxPrice) }),
        },
      },
    });
  }

  /* ================= SORT + PAGINATION ================= */
  pipeline.push(
    { $sort: sortStage },
    { $skip: (pageNum - 1) * limitNum },
    { $limit: limitNum },

    {
      $project: {
        _id: 1,
        productName: 1,
        productImages: 1,
        displayPrice: 1,
        discount: 1,
        productType: 1,
        variants: 1,
        isTrending: 1,
        isFeatured: 1,
        isNewArrival: 1,
        stockCount: 1,
      },
    },
  );

  /* ================= QUERY ================= */
  const products = await ProductModel.aggregate(pipeline);

  /* ================= TOTAL COUNT ================= */
  const countPipeline = [...pipeline];

  // Remove pagination for count
  countPipeline.splice(
    countPipeline.findIndex((p) => p.$skip),
    2,
  );

  const countResult = await ProductModel.aggregate([
    ...countPipeline,
    { $count: "total" },
  ]);

  const totalCount = countResult[0]?.total || 0;

  /* ================= RESPONSE ================= */
  return {
    success: true,
    data: products,

    pagination: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  };
};

const newArrivalsApi = async (req, res) => {
  const banner = await HomePageBanner.findOne().lean();
  const newArrivalsBanner = banner?.newArrivals || [];

  const newArrivals = await ProductModel.aggregate([
    {
      $match: {
        isDeleted: false,
        productStatus: "active",
      },
    },

    { $sort: { createdAt: -1 } },
    { $limit: 10 },

    {
      $project: {
        _id: 1,
        productName: 1,
        productImages: 1,
        salePrice: 1,
        discount: 1,
        productType: 1,
        variants: 1,
        isTrending: 1,
        isFeatured: 1,
        createdAt: 1,
      },
    },
  ]);

  return {
    success: true,
    data: {
      newArrivalsBanner,
      newArrivals,
    },
  };
};

const createRating = async (req) => {
  const { review, rating, existingImageUrls } = req.body;

  let reviewImages = [];

  if (req.files) {
    reviewImages = req.files;
  } else if (req.file) {
    reviewImages.push(req.file);
  } else {
    reviewImages = [];
  }

  const userId = req.user._id;

  const { productId, variantId } = req.params;

  let existingUrls = [];
  if (req.body.existingImageUrls) {
    try {
      existingUrls = JSON.parse(req.body.existingImageUrls);
    } catch (err) {
      existingUrls = [req.body.existingImageUrls];
    }
  }

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No userId provided");
  }

  if (!productId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No productId provided");
  }

  const product = await ProductModel.findById(productId);
  const productType = product.productType;

  const reviewRating = await reviewModel.findOne({ userId, variantId });

  let uploadedUrls = [];

  if (reviewRating) {
    const data = { ...req.body, reviewImages: existingUrls, productType };
    console.log(data, "data");
    if (reviewImages.length > 0) {
      try {
        uploadedUrls = await Promise.all(
          reviewImages.map((img) => uploadToR2(img, "review")),
        );
      } catch (err) {
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Image upload failed",
        );
      }

      data.reviewImages = [...(existingUrls || []), ...uploadedUrls];
    }

    const updatedReviewRating = await reviewModel.findOneAndUpdate(
      { userId, variantId },
      { $set: data },
      { new: true },
    );

    return {
      success: true,
      message: "Review and Rating updated",
      updatedReviewRating,
    };
  }

  console.log(reviewImages, "reviewImages");
  try {
    uploadedUrls = await Promise.all(
      reviewImages.map((img) => uploadToR2(img, "review")),
    );
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Image upload failed");
  }

  const createdReviewRating = await reviewModel.create({
    ...req.body,
    userId,
    productId,
    variantId,
    productType,
    reviewImages: uploadedUrls,
  });

  return {
    success: true,
    message: "Review and Rating added",
    createdReviewRating,
  };
};

const getUserReviewRating = async (req) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, `No UserID provided`);
  }

  const userReviewRating = await reviewModel.aggregate([
    {
      $match: { userId: userId },
    },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: {
        path: "$product",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        selectedVariant: {
          $cond: {
            if: { $eq: ["$productType", "variant"] },
            then: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$product.variants", // array to filter
                    as: "itemVar", // alias used *inside* cond
                    cond: {
                      $eq: [{ $toString: "$$itemVar._id" }, "$variantId"],
                    },
                  },
                },
                0,
              ],
            },
            else: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$product.nonVariant",
                    as: "itemNv",
                    cond: {
                      $eq: [{ $toString: "$$itemNv._id" }, "$variantId"],
                    },
                  },
                },
                0,
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        selectedVariant: 1,
        userId: 1,
        reviewImages: 1,
        productImages: { $ifNull: ["$product.productImages", []] },
        rating: 1,
        review: 1,
      },
    },
  ]);

  if (!userReviewRating) {
    throw new ApiError(httpStatus.NOT_FOUND, "No Reviews ratings provided");
  }

  return {
    success: true,
    message: "Fetching of Review Rating Successfull",
    userReviewRating,
  };
};

// const getReviewRatingBasedOnProduct = async (req, res) => {
//   const { variantId } = req.query;
//   const userId = req.user._id;

//   if (!variantId) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "No variantId provided");
//   }

//   const productReview = await reviewsRatings.aggregate([
//     {
//       $match: { userId: userId, variantId: variantId },
//     },
//     {
//       $lookup: {
//         from: "product",
//         localField: "productId",
//         foreignField: "_id",
//         as: "product",
//       },
//     },
//     {
//       $unwind: {
//         path: "$product",
//         preserveNullAndEmptyArrays: true,
//       },
//     },
//     {
//       $addFields: {
//         selectedVariant: {
//           $cond: {
//             if: { $eq: ["$productType", "variation"] },
//             then: {
//               $arrayElemAt: [
//                 {
//                   $filter: {
//                     input: "$product.varient", // array to filter
//                     as: "itemVar", // alias used *inside* cond
//                     cond: {
//                       $eq: [{ $toString: "$$itemVar._id" }, "$variantId"],
//                     },
//                   },
//                 },
//                 0,
//               ],
//             },
//             else: {
//               $arrayElemAt: [
//                 {
//                   $filter: {
//                     input: "$product.nonVarient",
//                     as: "itemNv",
//                     cond: {
//                       $eq: [{ $toString: "$$itemNv._id" }, "$variantId"],
//                     },
//                   },
//                 },
//                 0,
//               ],
//             },
//           },
//         },
//       },
//     },
//     {
//       $project: {
//         selectedVariant: 1,
//         userId: 1,
//         "product.productImage": 1,
//         rating: 1,
//         review: 1,
//         reviewImages: 1,
//       },
//     },
//   ]);

//   if (!productReview) {
//     throw new ApiError(httpStatus.NOT_FOUND, "No Reviews or ratings");
//   }

//   return { success: true, message: "Fetched product Review", productReview };
// };

const getcheckout = async (req) => {
  const userId = req.user._id;

  // 1️⃣ Get user
  const user = await userModel.findById(userId).lean();

  if (!user) {
    throw new Error("User not found");
  }

  // 2️⃣ Get cart
  const cart = await cartModel.findOne({ userId }).lean();

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const checkoutItems = [];
  let totalAmount = 0;
  let totalTax = 0;
  let totalOriginalPrice = 0; // ✅ FIXED

  // 3️⃣ Loop cart items
  for (const item of cart.items) {
    const product = await ProductModel.findById(item.productId).lean();

    if (!product) continue;

    let variant = null;

    if (item.productType === "variant" && item.variantId) {
      variant = product.variants.find(
        (v) => v._id.toString() === item.variantId.toString(),
      );
    }

    const price = variant ? variant.salePrice : product.salePrice;
    const costPrice = variant ? variant.costPrice : product.costPrice || price; // ✅ FIXED
    const taxPercent = variant ? variant.tax : product.tax || 0;

    const quantity = Number(item.quantity);

    const originalSubtotal = costPrice * quantity;
    const subtotal = price * quantity;
    const taxAmount = (subtotal * taxPercent) / 100;
    const total = subtotal + taxAmount;

    totalOriginalPrice += originalSubtotal; // ✅ FIXED
    totalAmount += total;
    totalTax += taxAmount;

    checkoutItems.push({
      productId: product._id,
      productName: product.productName,

      productImage: variant?.variantImages?.[0] || product.images?.[0] || null,

      variantId: variant?._id || null,
      variantName: variant?.variantName || null,

      price,
      costPrice, // ✅ FIXED
      taxPercent,

      quantity,
      subtotal,
      taxAmount,
      total,
    });
  }

  return {
    user: {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.addresses?.[0] || null,
    },

    items: checkoutItems,

    summary: {
      totalOriginalPrice, // ✅ FIXED
      totalTax,
      totalAmount,
      grandTotal: totalAmount,
    },
  };
};

module.exports = {
  createGetInTouch,
  registerUser,
  addAdderss,
  getAddressesService,
  updateAddressService,
  deleteAddressService,
  createEnquiry,
  createCart,
  getCart,
  editCart,
  deleteCart,
  addWishlist,
  getWishlist,
  deleteWishlist,
  updateProfile,
  getProfile,
  getTrack,
  addAddressToCart,
  homeService,
  searchProductsService,
  getUserReviewRating,
  createRating,
  newArrivalsApi,
  getcheckout,
};
