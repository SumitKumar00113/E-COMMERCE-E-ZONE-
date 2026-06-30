import { jest, describe, beforeEach, test, expect } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";

// -------------------------------------
// Helpers
// -------------------------------------

const createId = () => new mongoose.Types.ObjectId();

const authenticatedUser =
  (userId = createId()) =>
  () =>
  (req, res, next) => {
    req.user = {
      id: userId,
      fullName: {
        firstName: "John",
        lastName: "Doe",
      },
    };

    req.accessToken = "mock-token";
    next();
  };

const createOrder = (overrides = {}) => ({
  _id: createId(),
  userId: createId(),
  items: [],
  shippingAddress: {
    fullName: "John Doe",
    phone: "9876543210",
    address: [],
  },
  paymentMethod: "COD",
  paymentStatus: "PENDING",
  orderStatus: "PLACED",
  totalAmount: 1000,
  shippingCharge: 0,
  taxAmount: 0,
  finalAmount: 1000,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const setupApp = async (authFactory) => {
  jest.resetModules();

  jest.unstable_mockModule("../src/middlewares/order.middleware.js", () => ({
    __esModule: true,
    default: () => authFactory(),
  }));

  jest.unstable_mockModule("axios", () => ({
    __esModule: true,
    default: { get: jest.fn() },
    get: jest.fn(),
  }));

  jest.unstable_mockModule("../src/models/order.model.js", () => ({
    __esModule: true,
    default: {
      create: jest.fn(),
      findById: jest.fn(),
    },
  }));

  const { default: app } = await import("../src/app.js");
  const { default: orderModel } = await import("../src/models/order.model.js");

  return {
    app,
    orderModel,
  };
};

// -------------------------------------
// Tests
// -------------------------------------

describe("GET /api/orders/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("401 when user is not authenticated", async () => {
    const { app } = await setupApp(
      () => (req, res) => res.status(401).json({ message: "Unauthorized" }),
    );

    const res = await request(app).get(`/api/orders/${createId()}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  test("404 when order does not exist", async () => {
    const { app, orderModel } = await setupApp(authenticatedUser());

    orderModel.findById.mockResolvedValue(null);

    const res = await request(app).get(`/api/orders/${createId()}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain("order not found");
  });

  test("200 returns order successfully", async () => {
    const userId = createId();
    const orderId = createId();

    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    orderModel.findById.mockResolvedValue(
      createOrder({
        _id: orderId,
        userId,
        items: [
          {
            productId: createId(),
            name: "Test Product",
            image: "https://example.com/image.jpg",
            price: {
              amount: 500,
              currency: "INR",
            },
            quantity: 2,
            size: "M",
            color: "Red",
          },
        ],
      }),
    );

    const res = await request(app).get(`/api/orders/${orderId}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("fetch successfully");
    expect(res.body.order._id.toString()).toBe(orderId.toString());
    expect(res.body.order.userId.toString()).toBe(userId.toString());
    expect(res.body.order.items).toHaveLength(1);
  });

  test("200 returns order with multiple items", async () => {
    const userId = createId();
    const orderId = createId();

    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    orderModel.findById.mockResolvedValue(
      createOrder({
        _id: orderId,
        userId,
        items: [
          {
            productId: createId(),
            name: "Product 1",
            quantity: 1,
            price: { amount: 500 },
          },
          {
            productId: createId(),
            name: "Product 2",
            quantity: 2,
            price: { amount: 1000 },
          },
        ],
        totalAmount: 2500,
        finalAmount: 2500,
      }),
    );

    const res = await request(app).get(`/api/orders/${orderId}`);

    expect(res.status).toBe(200);
    expect(res.body.order.items).toHaveLength(2);
    expect(res.body.order.totalAmount).toBe(2500);
  });

  test("500 when database throws error", async () => {
    const { app, orderModel } = await setupApp(authenticatedUser());

    orderModel.findById.mockRejectedValue(new Error("Database Error"));

    const res = await request(app).get(`/api/orders/${createId()}`);

    expect(res.status).toBe(500);
    expect(res.body.message).toContain("internal server error");
  });

  test("calls findById with correct id", async () => {
    const userId = createId();
    const orderId = createId();

    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    orderModel.findById.mockResolvedValue(
      createOrder({
        _id: orderId,
        userId,
      }),
    );

    await request(app).get(`/api/orders/${orderId}`);

    expect(orderModel.findById).toHaveBeenCalledWith({
      _id: orderId.toString(),
    });
  });

  test.each([
    "PLACED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ])("200 returns order status %s", async (status) => {
    const { app, orderModel } = await setupApp(authenticatedUser());

    const orderId = createId();

    orderModel.findById.mockResolvedValue(
      createOrder({
        _id: orderId,
        orderStatus: status,
      }),
    );

    const res = await request(app).get(`/api/orders/${orderId}`);

    expect(res.status).toBe(200);
    expect(res.body.order.orderStatus).toBe(status);
  });

  test.each(["COD", "UPI", "CARD", "NET_BANKING"])(
    "200 returns payment method %s",
    async (method) => {
      const { app, orderModel } = await setupApp(authenticatedUser());

      const orderId = createId();

      orderModel.findById.mockResolvedValue(
        createOrder({
          _id: orderId,
          paymentMethod: method,
        }),
      );

      const res = await request(app).get(`/api/orders/${orderId}`);

      expect(res.status).toBe(200);
      expect(res.body.order.paymentMethod).toBe(method);
    },
  );
});
