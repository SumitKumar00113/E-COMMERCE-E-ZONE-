import axios from "axios";
import orderModel from "../models/order.model.js";

// =========================
// Order Controller
// =========================
const createOrder = async (req, res) => {
  try {
    const user = req.user;
    const accessToken = req.accessToken;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    // =========================
    // Get Cart Items
    // =========================
    const cartResponse = await axios.get("http://localhost:3002/cart", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const cartItems = cartResponse.data.items;

    if (!cartItems.length) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    // =========================
    // Get Products
    // =========================
    const productResponse = await Promise.all(
      cartItems.map((item) =>
        axios.get(`http://localhost:3001/api/get/product/${item.productId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      ),
    );

    const products = productResponse.map((res) => res.data.product);

    // =========================
    // Create Order Items
    // =========================
    let totalAmount = 0;

    const orderItems = products.map((product, index) => {
      const cartItem = cartItems[index];

      if (product.stock < cartItem.quantity) {
        throw new Error(`${product.title} is out of stock`);
      }

      const subtotal = product.price.amount * cartItem.quantity;

      totalAmount += subtotal;

      return {
        productId: product._id,
        name: product.title,
        image: product.images?.[0]?.url || "",

        price: {
          amount: product.price.amount,
          currency: product.price.currency,
        },

        quantity: cartItem.quantity,
        size: cartItem.size,
        color: cartItem.color,
      };
    });

    // =========================
    // Get Address
    // =========================
    const addressResponse = await axios.get(
      "http://localhost:3004/api/get/address",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const addresses = addressResponse.data.data;

    const address = addresses.find((addr) => addr.isDefault) || addresses[0];

    const shippingAddress = {
      fullName: `${user.fullName.firstName} ${user.fullName.lastName}`,
      phone: address.mobileNo,
      address: [
        address.houseNumber,
        address.street,
        address.area,
        address.landmark,
        address.city,
        address.state,
        address.country,
        address.pincode,
      ].filter(Boolean),
    };

    // =========================
    // Charges
    // =========================
    const shippingCharge = 0;
    const taxAmount = 0;

    const finalAmount = totalAmount + shippingCharge + taxAmount;

    // =========================
    // Save Order
    // =========================
    const order = await orderModel.create({
      userId: user.id,
      items: orderItems,
      shippingAddress,

      paymentMethod: "COD",

      totalAmount,
      shippingCharge,
      taxAmount,
      finalAmount,
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err,
    });
  }
};
const getOrder = async (req, res) => {
  try {
    const user = req.user;
    const orderId = req.params.id;
    if (!user)
      return res.status(401).json({
        message: "unauthorized user required",
      });
    const order = await orderModel.findById({ _id: orderId });
    if (!order) {
      return res.status(404).json({
        message: "order not found",
      });
    }
    return res.status(200).json({
      message: "order fetch successfully",
      order,
    });
  } catch (err) {
    return res.status(500).json({
      message: "internal server error",
      errors: err,
    });
  }
};
const getPaginatedOrders = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({
        message: "unauthorized user required",
      });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const order = await orderModel
      .find({ userId: user.id })
      .skip(skip)
      .limit(limit);
    return res.status(200).json({
      message: "orders fetched successfully",
      orders: order,
    });
  } catch (err) {
    return res.status(500).json({
      message: "internal server error",
      errors: err,
    });
  }
};
const cancelOrder = async (req, res) => {
  const user = req.user;
  const orderId = req.params.id;
  if (!user) {
    return res.status(401).json({
      message: "unauthorized user is required",
    });
  }
  if (!orderId) {
    return res.status(401).json({
      message: "unauthorized order id is required",
    });
  }
  const order = await orderModel.findById(orderId);
  if (!order) {
    return res.status(404).json({
      message: "order not found",
    });
  }
  if (order.userId.toString() !== user.id) {
    return res.status(403).json({
      message: "you are not authorized to cancel this order",
    });
  }
  if (order.orderStatus === "CANCELLED") {
    return res.status(400).json({
      message: "order is already cancelled",
    });
  }
  if (order.orderStatus === "PENDING" || order.orderStatus === "PROCESSING") {
    order.orderStatus = "CANCELLED";
  }
  await order.save();
  return res.status(200).json({
    message: "order cancelled successfully",
    order,
  });
};
const updateAddressOfOrder = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized user required",
      });
    }

    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const shippingAddress = order.shippingAddress;

    const {
      fullName,
      phone,
      address: {
        houseNumber,
        street,
        area,
        landmark,
        city,
        state,
        country,
        pincode,
      } = {},
    } = req.body;

    if (fullName) {
      shippingAddress.fullName = fullName;
    }

    if (phone) {
      shippingAddress.phone = phone;
    }

    let updatedAddress = [...shippingAddress.address];

    if (houseNumber) updatedAddress[0] = houseNumber;
    if (street) updatedAddress[1] = street;
    if (area) updatedAddress[2] = area;
    if (landmark) updatedAddress[3] = landmark;
    if (city) updatedAddress[4] = city;
    if (state) updatedAddress[5] = state;
    if (country) updatedAddress[6] = country;
    if (pincode) updatedAddress[7] = pincode;

    shippingAddress.address = updatedAddress;

    order.shippingAddress = shippingAddress;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Shipping address updated successfully",
      order,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
export default {
  createOrder,
  getOrder,
  getPaginatedOrders,
  cancelOrder,
  updateAddressOfOrder,
};
