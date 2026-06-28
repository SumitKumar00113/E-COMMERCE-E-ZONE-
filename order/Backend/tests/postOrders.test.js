import { jest, describe, beforeEach, test, expect } from "@jest/globals";
import request from "supertest";

// =========================
// Order API Tests
// =========================
// Helper to (re)load the app with different auth middleware behaviors and fresh mocks
const setupAppWithAuthMock = async (authFactory) => {
  jest.resetModules();

  jest.unstable_mockModule("../src/middlewares/auth.middleware.js", () => ({
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
    default: { create: jest.fn() },
    create: jest.fn(),
  }));

  const mod = await import("../src/app.js");
  return mod.default;
};

describe("POST /api/orders - full spec", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("401 when not authenticated", async () => {
    const authFactory = () => (req, res, next) =>
      res.status(401).json({ message: "Unauthorized" });

    const app = await setupAppWithAuthMock(authFactory);

    const res = await request(app).post("/api/orders").send({});
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message");
  });

  test("403 when user has insufficient role", async () => {
    const authFactory = () => (req, res, next) =>
      res.status(403).json({ message: "Forbidden" });

    const app = await setupAppWithAuthMock(authFactory);
    const res = await request(app).post("/api/orders").send({});
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("message");
  });

  test("400 when required fields are missing", async () => {
    const authFactory = () => (req, res, next) => {
      req.user = { id: "u1", role: "user" };
      next();
    };

    const app = await setupAppWithAuthMock(authFactory);
    const res = await request(app).post("/api/orders").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  test("400 when item quantity is invalid", async () => {
    const authFactory = () => (req, res, next) => {
      req.user = { id: "u1", role: "user" };
      next();
    };

    const app = await setupAppWithAuthMock(authFactory);

    const payload = {
      items: [
        { productId: "p1", name: "x", amount: { price: 10 }, quantity: 0 },
      ],
      shippingAddress: {
        fullName: "A",
        phone: "1",
        address: [],
        paymentMethod: "COD",
      },
      totalAmount: 0,
      finalAmount: 0,
    };

    const res = await request(app).post("/api/orders").send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  test("400 when payment method is invalid", async () => {
    const authFactory = () => (req, res, next) => {
      req.user = { id: "u1", role: "user" };
      next();
    };

    const app = await setupAppWithAuthMock(authFactory);

    const payload = {
      items: [
        { productId: "p1", name: "x", amount: { price: 10 }, quantity: 1 },
      ],
      shippingAddress: {
        fullName: "A",
        phone: "1",
        address: [],
        paymentMethod: "BITCOIN",
      },
      totalAmount: 10,
      finalAmount: 10,
    };

    const res = await request(app).post("/api/orders").send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  test("502 when external cart service fails", async () => {
    const authFactory = () => (req, res, next) => {
      req.user = { id: "u1", role: "user" };
      next();
    };

    const app = await setupAppWithAuthMock(authFactory);
    const axiosModule = await import("axios");
    const axios = axiosModule.default ?? axiosModule;

    axios.get.mockRejectedValue(new Error("ECONNREFUSED"));

    const payload = {
      items: [
        { productId: "p1", name: "x", amount: { price: 10 }, quantity: 1 },
      ],
      shippingAddress: {
        fullName: "A",
        phone: "1",
        address: [],
        paymentMethod: "COD",
      },
      totalAmount: 10,
      finalAmount: 10,
    };

    const res = await request(app).post("/api/orders").send(payload);
    expect([502, 500]).toContain(res.status);
    expect(res.body).toHaveProperty("message");
  });

  test("500 when saving order fails", async () => {
    const authFactory = () => (req, res, next) => {
      req.user = { id: "u1", role: "user" };
      next();
    };

    const app = await setupAppWithAuthMock(authFactory);
    const axiosModule = await import("axios");
    const axios = axiosModule.default ?? axiosModule;
    const orderModelModule = await import("../src/models/order.model.js");
    const orderModel = orderModelModule.default ?? orderModelModule;

    axios.get.mockResolvedValue({ data: { items: [] } });
    orderModel.create.mockRejectedValue(new Error("DB ERROR"));

    const payload = {
      items: [
        { productId: "p1", name: "x", amount: { price: 10 }, quantity: 1 },
      ],
      shippingAddress: {
        fullName: "A",
        phone: "1",
        address: [],
        paymentMethod: "COD",
      },
      totalAmount: 10,
      finalAmount: 10,
    };

    const res = await request(app).post("/api/orders").send(payload);
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message");
  });

  test("201 and returns created order on success", async () => {
    const authFactory = () => (req, res, next) => {
      req.user = { id: "u1", role: "user" };
      next();
    };

    const app = await setupAppWithAuthMock(authFactory);
    const axiosModule = await import("axios");
    const axios = axiosModule.default ?? axiosModule;
    const orderModelModule = await import("../src/models/order.model.js");
    const orderModel = orderModelModule.default ?? orderModelModule;

    axios.get.mockResolvedValue({ data: { items: [] } });

    const createdOrder = {
      _id: "o1",
      userId: "u1",
      items: [],
      totalAmount: 10,
    };
    orderModel.create.mockResolvedValue(createdOrder);

    const payload = {
      items: [
        { productId: "p1", name: "x", amount: { price: 10 }, quantity: 1 },
      ],
      shippingAddress: {
        fullName: "A",
        phone: "1",
        address: [],
        paymentMethod: "COD",
      },
      totalAmount: 10,
      finalAmount: 10,
    };

    const res = await request(app).post("/api/orders").send(payload);
    expect(res.status).toBe(201);
    expect(orderModel.create).toHaveBeenCalled();
    expect(res.body).toMatchObject({ _id: createdOrder._id });
  });
});
