import productModel from "../models/product.model.js";
import imagekitService from "../services/imagekit.service.js";

const createProduct = async (req, res) => {
  try {
    const { title, description, price } = req.body;
    const seller = req.user.id;

    // Handle both nested price format (from multipart) and flat format
    const price_amount = price?.amount || req.body.price_amount;
    const price_currency = price?.currency || req.body.price_currency;

    if (!title || !description || !price_amount || !price_currency) {
      return res.status(400).json({
        message:
          "Missing required fields: title, description, price (with amount & currency)",
      });
    }
    const images = [];
    console.log(req.files);
    const files = await Promise.all(
      (req.files || []).map(async (file) => {
        const image = await imagekitService.uploadImage({
          buffer: file.buffer,
          filename: file.originalname,
        });
        return image;
      }),
    );

    images.push(...files);

    console.time("mongo-create");

    const newProduct = await productModel.create({
      title,
      description,
      price: {
        amount: parseFloat(price_amount),
        currency: price_currency,
      },
      seller,
      images,
    });

    console.timeEnd("mongo-create");

    return res.status(201).json({
      message: "product create successfully",
      product: newProduct,
    });
  } catch (err) {
    return res.status(500).json({
      message: "internal server error during product creation",
      error: err.message || err,
    });
  }
};
const getProducts = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    // Validate if id is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "invalid product ID format",
      });
    }

    const product = await productModel.findById(id);

    // Check if product exists
    if (!product) {
      return res.status(404).json({
        message: "product not found",
      });
    }

    return res.status(200).json({
      message: "product fetched successfully",
      product,
    });
  } catch (err) {
    return res.status(500).json({
      message: "internal server error during fetching products",
      error: err.message || err,
    });
  }
};
const getProductsBySearch = async (req, res) => {
  try {
    const {
      query,
      category,
      minPrice,
      maxPrice,
      skip = 0,
      limit = 15,
    } = req.query;
    if (!query) {
      return res.status(400).json({
        message: "search query is required",
      });
    }
    const filter = {};
    filter.$text = { $search: query };
    if (category) {
      filter.category = category;
    }
    if (minPrice || maxPrice) {
      filter["price.amount"] = {};
      if (minPrice) {
        filter["price.amount"].$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        filter["price.amount"].$lte = parseFloat(maxPrice);
      }
    }
    const products = await productModel
      .find(filter)
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 20));

    return res.status(200).json({
      message: "products fetched successfully",
      products,
    });
  } catch (err) {
    return res.status(500).json({
      message: "internal server error during product search",
      error: err.message || err,
    });
  }
};
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price } = req.body;
    const seller = req.user.id;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "invalid product ID format",
      });
    }

    const product = await productModel.findById(id);

    // Check if product exists
    if (!product) {
      return res.status(404).json({
        message: "product not found",
      });
    }

    // Check if the authenticated user is the seller of the product
    if (product.seller.toString() !== seller) {
      return res.status(403).json({
        message: "you are not authorized to update this product",
      });
    }

    // Update the product fields
    if (title) product.title = title;
    if (description) product.description = description;
    if (price) {
      const price_amount = price?.amount || req.body.price_amount;
      const price_currency = price?.currency || req.body.price_currency;

      if (price_amount) product.price.amount = parseFloat(price_amount);
      if (price_currency) product.price.currency = price_currency;
    }
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = await Promise.all(
        req.files.map(async (file) => {
          const image = await imagekitService.uploadImage({
            buffer: file.buffer,
            filename: file.originalname,
          });
          return image;
        }),
      );
      product.images.push(...uploadedImages);
    }

    await product.save();

    return res.status(200).json({
      message: "product updated successfully",
      product,
    });
  } catch (err) {
    return res.status(500).json({
      message: "internal server error during product update",
      error: err.message || err,
    });
  }
};
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = req.user.id;

    // Validate if id is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "invalid product ID format",
      });
    }

    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({
        message: "product not found",
      });
    }
    console.log(product.seller);
    if (!product.seller) {
      return res.status(500).json({
        message: "product seller is missing from the database record",
      });
    }
    if (product.seller.toString() !== seller) {
      return res.status(403).json({
        message: "you are not authorized to delete this product",
      });
    }
    await product.deleteOne();
    return res.status(200).json({
      message: "product deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "internal server error during product deletion",
      error: err.message || err,
    });
  }
};
const getProductsBySeller = async (req, res) => {
  try {
    const seller = req.user.id;
    const {
      skip = 0,
      limit = 15,
      sortBy = "createdAt",
      sortOrder = "desc",
      category,
      searchQuery,
    } = req.query;

    // Build filter
    const filter = { seller };
    if (category) {
      filter.category = category;
    }
    if (searchQuery) {
      filter.$text = { $search: searchQuery };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Get products with sorting and filtering
    const products = await productModel
      .find(filter)
      .sort(sortObj)
      .skip(parseInt(skip))
      .limit(Math.min(parseInt(limit), 20));

    // Get total count
    const count = await productModel.countDocuments(filter);

    return res.status(200).json({
      message: "seller products fetched successfully",
      products,
      count,
    });
  } catch (err) {
    return res.status(500).json({
      message: "internal server error during fetching products by seller",
      error: err.message || err,
    });
  }
};
export default {
  createProduct,
  getProducts,
  getProductsBySearch,
  updateProduct,
  deleteProduct,
  getProductsBySeller,
};
