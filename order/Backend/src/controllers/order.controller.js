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
        axios.get(
          `http://localhost:3001/api/get/product/${item.productId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
      )
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
      }
    );

const addresses = addressResponse.data.data;

const address = addresses.find(addr => addr.isDefault) || addresses[0];

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

console.log(shippingAddress);
    console.log(address)
console.log(shippingAddress)
    // =========================
    // Charges
    // =========================
    const shippingCharge = 0;
    const taxAmount = 0;

    const finalAmount =
      totalAmount + shippingCharge + taxAmount;

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

export default {
  createOrder,
};