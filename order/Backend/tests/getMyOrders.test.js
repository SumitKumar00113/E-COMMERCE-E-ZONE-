import { jest, describe, beforeEach, test, expect } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";

// ===================================
// Helpers
// ===================================

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
      find: jest.fn(),
    },
  }));

  const { default: app } = await import("../src/app.js");
  const { default: orderModel } = await import("../src/models/order.model.js");

  return {
    app,
    orderModel,
  };
};

// ===================================
// Tests
// ===================================

describe("GET /api/orders/me - User's Orders with Pagination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===================================
  // Authentication Tests
  // ===================================

  test("401 when user is not authenticated", async () => {
    const { app } = await setupApp(
      () => (req, res) => res.status(401).json({ message: "Unauthorized" }),
    );

    const res = await request(app).get("/api/orders/me");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  // ===================================
  // Success Cases
  // ===================================

  test("200 returns user's orders with default pagination", async () => {
    const userId = createId();
    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    const orders = [
      createOrder({ _id: createId(), userId }),
      createOrder({ _id: createId(), userId }),
    ];

    const mockChain = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(orders),
    };

    orderModel.find.mockReturnValue(mockChain);

    const res = await request(app).get("/api/orders/me");

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("fetched successfully");
    expect(res.body.orders).toHaveLength(2);
    expect(res.body.orders[0].userId.toString()).toBe(userId.toString());
  });

  test("200 returns empty array when user has no orders", async () => {
    const userId = createId();
    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    const mockChain = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };

    orderModel.find.mockReturnValue(mockChain);

    const res = await request(app).get("/api/orders/me");

    expect(res.status).toBe(200);
    expect(res.body.orders).toEqual([]);
  });

  // ===================================
  // Pagination Tests
  // ===================================

  test("200 with page=2 and limit=5", async () => {
    const userId = createId();
    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    const orders = Array.from({ length: 5 }, () => createOrder({ userId }));

    const mockChain = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(orders),
    };

    orderModel.find.mockReturnValue(mockChain);

    const res = await request(app).get("/api/orders/me?page=2&limit=5");

    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(5);
    expect(mockChain.skip).toHaveBeenCalledWith(5); // (2-1)*5 = 5
    expect(mockChain.limit).toHaveBeenCalledWith(5);
  });

  test("200 with custom limit", async () => {
    const userId = createId();
    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    const orders = Array.from({ length: 20 }, () => createOrder({ userId }));

    const mockChain = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(orders),
    };

    orderModel.find.mockReturnValue(mockChain);

    const res = await request(app).get("/api/orders/me?page=1&limit=20");

    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(20);
    expect(mockChain.skip).toHaveBeenCalledWith(0);
    expect(mockChain.limit).toHaveBeenCalledWith(20);
  });

  test("200 with default pagination when no params provided", async () => {
    const userId = createId();
    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    const orders = Array.from({ length: 10 }, () => createOrder({ userId }));

    const mockChain = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(orders),
    };

    orderModel.find.mockReturnValue(mockChain);

    const res = await request(app).get("/api/orders/me");

    expect(res.status).toBe(200);
    expect(mockChain.skip).toHaveBeenCalledWith(0); // default page 1
    expect(mockChain.limit).toHaveBeenCalledWith(10); // default limit 10
  });

  test("200 with page=3 and limit=10", async () => {
    const userId = createId();
    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    const orders = Array.from({ length: 10 }, () => createOrder({ userId }));

    const mockChain = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(orders),
    };

    orderModel.find.mockReturnValue(mockChain);

    const res = await request(app).get("/api/orders/me?page=3&limit=10");

    expect(res.status).toBe(200);
    expect(mockChain.skip).toHaveBeenCalledWith(20); // (3-1)*10 = 20
    expect(mockChain.limit).toHaveBeenCalledWith(10);
  });

  // ===================================
  // Order Data Tests
  // ===================================

  test("200 returns orders with all fields", async () => {
    const userId = createId();
    const orderId = createId();
    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    const order = createOrder({
      _id: orderId,
      userId,
      items: [
        {
          productId: createId(),
          name: "Product 1",
          quantity: 2,
          price: { amount: 500, currency: "INR" },
        },
      ],
      orderStatus: "SHIPPED",
      paymentStatus: "PAID",
      paymentMethod: "UPI",
      totalAmount: 1000,
      finalAmount: 1100,
    });

    const mockChain = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([order]),
    };

    orderModel.find.mockReturnValue(mockChain);

    const res = await request(app).get("/api/orders/me");

    expect(res.status).toBe(200);
    expect(res.body.orders[0]).toMatchObject({
      _id: orderId.toString(),
      userId: userId.toString(),
      orderStatus: "SHIPPED",
      paymentStatus: "PAID",
      paymentMethod: "UPI",
      totalAmount: 1000,
      finalAmount: 1100,
    });
  });

  test("200 returns multiple orders sorted", async () => {
    const userId = createId();
    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    const order1 = createOrder({
      userId,
      orderStatus: "PLACED",
      totalAmount: 500,
    });

    const order2 = createOrder({
      userId,
      orderStatus: "SHIPPED",
      totalAmount: 1000,
    });

    const order3 = createOrder({
      userId,
      orderStatus: "DELIVERED",
      totalAmount: 1500,
    });

    const mockChain = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([order1, order2, order3]),
    };

    orderModel.find.mockReturnValue(mockChain);

    const res = await request(app).get("/api/orders/me");

    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(3);
    expect(res.body.orders[0].orderStatus).toBe("PLACED");
    expect(res.body.orders[1].orderStatus).toBe("SHIPPED");
    expect(res.body.orders[2].orderStatus).toBe("DELIVERED");
  });

  // ===================================
  // Error Handling Tests
  // ===================================

  test("500 when database error occurs", async () => {
    const { app, orderModel } = await setupApp(authenticatedUser());

    orderModel.find.mockImplementation(() => {
      throw new Error("Database connection failed");
    });

    const res = await request(app).get("/api/orders/me");

    expect(res.status).toBe(500);
    expect(res.body.message).toContain("internal server error");
  });

  test("500 when find().skip().limit() chain fails", async () => {
    const { app, orderModel } = await setupApp(authenticatedUser());

    const mockChain = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockRejectedValue(new Error("DB Error")),
    };

    orderModel.find.mockReturnValue(mockChain);

    const res = await request(app).get("/api/orders/me");

    expect(res.status).toBe(500);
    expect(res.body.message).toContain("internal server error");
  });

  // ===================================
  // Query Parameter Tests
  // ===================================

  test("200 handles non-numeric page param gracefully", async () => {
    const userId = createId();
    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    const mockChain = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };

    orderModel.find.mockReturnValue(mockChain);

    const res = await request(app).get("/api/orders/me?page=invalid&limit=10");

    expect(res.status).toBe(200);
    expect(mockChain.skip).toHaveBeenCalledWith(0); // defaults to page 1
  });

  test("200 handles non-numeric limit param gracefully", async () => {
    const userId = createId();
    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    const mockChain = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };

    orderModel.find.mockReturnValue(mockChain);

    const res = await request(app).get("/api/orders/me?page=1&limit=invalid");

    expect(res.status).toBe(200);
    expect(mockChain.limit).toHaveBeenCalledWith(10); // defaults to limit 10
  });

  // ===================================
  // Find Query Tests
  // ===================================

  test("correctly calls find with userId", async () => {
    const userId = createId();
    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    const mockChain = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };

    orderModel.find.mockReturnValue(mockChain);

    await request(app).get("/api/orders/me");

    expect(orderModel.find).toHaveBeenCalledWith({ userId: userId });
  });
});
