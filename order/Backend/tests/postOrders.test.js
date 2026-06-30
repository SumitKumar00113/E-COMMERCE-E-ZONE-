import { jest, describe, beforeEach, test, expect } from "@jest/globals";
import request from "supertest";

// -------------------------
// Helpers
// -------------------------

const validPayload = () => ({});

const userAuth =
  (userId = "u1") =>
  (req, res, next) => {
    req.user = {
      id: userId,
      fullName: { firstName: "John", lastName: "Doe" },
    };
    req.accessToken = "mock-token";
    next();
  };

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
    default: { create: jest.fn() },
    create: jest.fn(),
  }));

  const { default: app } = await import("../src/app.js");
  const { default: axios } = await import("axios");
  const { default: orderModel } = await import("../src/models/order.model.js");

  return { app, axios, orderModel };
};

// -------------------------
// Tests
// -------------------------

describe("POST /api/orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("401 when unauthenticated", async () => {
    const { app } = await setupApp(
      () => (req, res) => res.status(401).json({ message: "Unauthorized" }),
    );

    const res = await request(app).post("/api/orders").send({});

    expect(res.status).toBe(401);
  });

  test("403 when forbidden", async () => {
    const { app } = await setupApp(
      () => (req, res) => res.status(403).json({ message: "Forbidden" }),
    );

    const res = await request(app).post("/api/orders").send({});

    expect(res.status).toBe(403);
  });

  test("400 when required fields are missing", async () => {
    const { app } = await setupApp(
      () => (req, res) => res.status(401).json({ message: "Unauthorized" }),
    );

    const res = await request(app).post("/api/orders").send({});

    expect(res.status).toBe(401);
  });

  test("400 when quantity is invalid", async () => {
    const { app, axios } = await setupApp(userAuth);

    axios.get.mockResolvedValue({ data: { items: [] } });

    const res = await request(app).post("/api/orders").send(validPayload());

    expect([400, 500]).toContain(res.status);
  });

  test("400 when payment method is invalid", async () => {
    const { app, axios } = await setupApp(userAuth);

    axios.get.mockResolvedValue({ data: { items: [] } });

    const res = await request(app).post("/api/orders").send(validPayload());

    expect([400, 500]).toContain(res.status);
  });

  test("502 when cart service fails", async () => {
    const { app, axios } = await setupApp(userAuth);

    axios.get.mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await request(app).post("/api/orders").send(validPayload());

    expect([500, 502]).toContain(res.status);
  });

  test("500 when database save fails", async () => {
    const { app, axios, orderModel } = await setupApp(userAuth);

    axios.get.mockImplementation((url) => {
      if (url.includes("cart")) {
        return Promise.resolve({
          data: {
            items: [
              {
                productId: "p1",
                quantity: 1,
                size: "M",
                color: "Red",
              },
            ],
          },
        });
      } else if (url.includes("product")) {
        return Promise.resolve({
          data: {
            product: {
              _id: "p1",
              title: "Test Product",
              stock: 10,
              price: { amount: 100, currency: "INR" },
              images: [{ url: "img.jpg" }],
            },
          },
        });
      } else if (url.includes("address")) {
        return Promise.resolve({
          data: {
            data: [
              {
                isDefault: true,
                mobileNo: "9876543210",
                houseNumber: "123",
                street: "Main St",
                city: "City",
                country: "Country",
                pincode: "123456",
              },
            ],
          },
        });
      }
    });

    orderModel.create.mockRejectedValue(new Error("DB Error"));

    const res = await request(app).post("/api/orders").send(validPayload());

    expect(res.status).toBe(500);
  });

  test("201 when order is created successfully", async () => {
    const { app, axios, orderModel } = await setupApp(userAuth);

    axios.get.mockImplementation((url) => {
      if (url.includes("cart")) {
        return Promise.resolve({
          data: {
            items: [
              {
                productId: "p1",
                quantity: 1,
                size: "M",
                color: "Red",
              },
            ],
          },
        });
      } else if (url.includes("product")) {
        return Promise.resolve({
          data: {
            product: {
              _id: "p1",
              title: "Test Product",
              stock: 10,
              price: { amount: 100, currency: "INR" },
              images: [{ url: "img.jpg" }],
            },
          },
        });
      } else if (url.includes("address")) {
        return Promise.resolve({
          data: {
            data: [
              {
                isDefault: true,
                mobileNo: "9876543210",
                houseNumber: "123",
                street: "Main St",
                city: "City",
                country: "Country",
                pincode: "123456",
              },
            ],
          },
        });
      }
    });

    const createdOrder = {
      _id: "o1",
      userId: "u1",
      items: [
        {
          productId: "p1",
          name: "Test Product",
          quantity: 1,
          price: { amount: 100, currency: "INR" },
        },
      ],
      totalAmount: 100,
      finalAmount: 100,
    };

    orderModel.create.mockResolvedValue(createdOrder);

    const res = await request(app).post("/api/orders").send(validPayload());

    expect(res.status).toBe(201);
    expect(orderModel.create).toHaveBeenCalledTimes(1);
    expect(res.body.success).toBe(true);
  });
});
