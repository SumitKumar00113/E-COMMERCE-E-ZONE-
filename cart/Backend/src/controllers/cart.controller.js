import mongoose from "mongoose";
import cartModel from "../models/cart.model.js";

const getCartItems = async (req, res) => {
  try {
    const user = req.user;
  
    const cart = await cartModel.findOne({ user: user.id });
    return res.status(200).json({
      message: "cart fetch successfully",
      items: cart?.items ?? [],
    });
  } catch (err) {
    return res.status(500).json({
      message: "internal server error during getCartItems",
    });
  }
};

const addItemToCart = async (req, res) => {
  try {
   
    const { productId, quantity = 1, size, color } = req.body;
    if (!productId) {
      return res.status(400).json({
        message: "productId is required",
      });
    }

    const user = req.user;
    const userId = user._id || user.id;

    let cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      cart = new cartModel({ user: userId, items: [] });
    }

    // Remove any malformed items that are missing required productId.
    cart.items = cart.items.filter((item) => item.productId);

    if (typeof productId === "string" && !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        message: "productId must be a valid ObjectId",
      });
    }

    const normalizedProductId =
      typeof productId === "string"
        ? new mongoose.Types.ObjectId(productId)
        : productId;

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.productId &&
        item.productId.toString() === normalizedProductId.toString(),
    );

    if (existingItemIndex !== -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId: normalizedProductId,
        quantity,
        size,
        color,
      });
    }

    await cart.save();

    return res.status(200).json({
      message: "item added to cart",
      cart,
    });
  } catch (err) {
    return res.status(500).json({
      message: "internal server error during addItemToCart",
      error: err.message,
      stack: err.stack,
    });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, size, color } = req.body;
    const user = req.user;
    const userId = user._id || user.id;

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        message: "cart item not found",
      });
    }

    const item = cart.items.find(
      (item) => item.productId?.toString() === productId,
    );
    if (!item) {
      return res.status(404).json({
        message: "cart item not found",
      });
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        cart.items = cart.items.filter(
          (cartItem) => cartItem.productId?.toString() !== productId,
        );
      } else {
        item.quantity = quantity;
      }
    }
    if (size) {
      item.size = size;
    }
    if (color) {
      item.color = color;
    }

    if (cart.items.length === 0) {
      await cartModel.findOneAndDelete({ user: userId });
    } else {
      await cart.save();
    }

    return res.status(200).json({
      message: "cart update successfully",
      cart,
    });
  } catch (err) {
    return res.status(500).json({
      message: "internal server error during updateCartItem",
      error: err.message,
      stack: err.stack,
    });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = req.user;
    const userId = user._id || user.id;

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        message: "cart not found",
      });
    }

    const originalLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId?.toString() !== productId,
    );

    if (cart.items.length === originalLength) {
      return res.status(404).json({
        message: "cart item not found",
      });
    }

    if (cart.items.length === 0) {
      await cartModel.findOneAndDelete({ user: userId });
    } else {
      await cart.save();
    }

    return res.status(200).json({
      message: "cart delete successfully",
      cart,
    });
  } catch (err) {
    return res.status(500).json({
      message: "internal server error during deleteCartItem",
      error: err.message,
      stack: err.stack,
    });
  }
};

const deleteAllCart = async (req, res) => {
  try {
    const user = req.user;
    const userId = user._id || user.id;
    const cart = await cartModel.findOneAndDelete({ user: userId });
    if (!cart)
      return res.status(404).json({
        message: "cart not found",
      });
    return res.status(200).json({
      message: "delete cart successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "internal server error during deleteAllCart",
      error: err.message,
      stack: err.stack,
    });
  }
};

export default {
  getCartItems,
  addItemToCart,
  updateCartItem,
  deleteCartItem,
  deleteAllCart,
};
