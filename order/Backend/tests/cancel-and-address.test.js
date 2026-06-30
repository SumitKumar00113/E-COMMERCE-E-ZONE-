import { jest, describe, beforeEach, test, expect } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";

const createId = () => new mongoose.Types.ObjectId();

const authenticatedUser =
  (userId = createId()) =>
  (...args) => {
    const [, controller] = args;

    return (req, res, next) => {
      req.user = {
        id: userId.toString(),
        fullName: {
          firstName: "John",
          lastName: "Doe",
        },
      };
      req.accessToken = "mock-token";

      if (typeof controller === "function") {
        return controller(req, res, next);
      }

      next();
    };
  };

const createOrderDoc = (overrides = {}) => {
  const order = {
    _id: createId(),
    userId: createId(),
    orderStatus: "PENDING",
    shippingAddress: {
      fullName: "John Doe",
      phone: "9876543210",
      address: [
        "1",
        "Main Street",
        "Area",
        "Landmark",
        "City",
        "State",
        "Country",
        "123456",
      ],
    },
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };

  return order;
};

const setupApp = async (authFactory) => {
  jest.resetModules();

  jest.unstable_mockModule("../src/middlewares/order.middleware.js", () => ({
    __esModule: true,
    default: (...args) => authFactory(...args),
  }));

  jest.unstable_mockModule("../src/models/order.model.js", () => ({
    __esModule: true,
    default: {
      findById: jest.fn(),
    },
  }));

  const { default: app } = await import("../src/app.js");
  const { default: orderModel } = await import("../src/models/order.model.js");

  return { app, orderModel };
};

describe("POST /api/orders/:id/cancel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("401 when user is not authenticated", async () => {
    const { app } = await setupApp(
      () => (req, res) => res.status(401).json({ message: "Unauthorized" }),
    );

    const res = await request(app).post(`/api/orders/${createId()}/cancel`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  test("403 when user tries to cancel another user's order", async () => {
    const userId = createId();
    const { app, orderModel } = await setupApp(authenticatedUser(userId));

    orderModel.findById.mockResolvedValue(
      createOrderDoc({
        userId: createId(),
      }),
    );

    const res = await request(app).post(`/api/orders/${createId()}/cancel`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("not authorized");
  });

  test("200 cancels the order successfully", async () => {
    const userId = createId();
    const orderId = createId();
    const orderDoc = createOrderDoc({
      _id: orderId,
      userId,
      orderStatus: "PENDING",
    });

    const { app, orderModel } = await setupApp(authenticatedUser(userId));
    orderModel.findById.mockResolvedValue(orderDoc);

    const res = await request(app).post(`/api/orders/${orderId}/cancel`);

    expect(res.status).toBe(200);
    expect(orderDoc.orderStatus).toBe("CANCELLED");
    expect(orderDoc.save).toHaveBeenCalledTimes(1);
    expect(res.body.message).toContain("cancelled successfully");
  });
});

describe("PATCH /api/orders/:id/address", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("401 when user is not authenticated", async () => {
    const { app } = await setupApp(
      () => (req, res) => res.status(401).json({ message: "Unauthorized" }),
    );

    const res = await request(app).patch(`/api/orders/${createId()}/address`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  test("404 when order does not exist", async () => {
    const { app, orderModel } = await setupApp(authenticatedUser());
    orderModel.findById.mockResolvedValue(null);

    const res = await request(app).patch(`/api/orders/${createId()}/address`);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain("Order not found");
  });

  test("200 updates the shipping address successfully", async () => {
    const userId = createId();
    const orderId = createId();
    const orderDoc = createOrderDoc({
      _id: orderId,
      userId,
    });

    const { app, orderModel } = await setupApp(authenticatedUser(userId));
    orderModel.findById.mockResolvedValue(orderDoc);

    const payload = {
      fullName: "Jane Doe",
      phone: "9999999999",
      address: {
        houseNumber: "10",
        street: "Park Street",
        area: "Downtown",
        landmark: "Near Mall",
        city: "Mumbai",
        state: "MH",
        country: "India",
        pincode: "400001",
      },
    };

    const res = await request(app)
      .patch(`/api/orders/${orderId}/address`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(orderDoc.shippingAddress.fullName).toBe("Jane Doe");
    expect(orderDoc.shippingAddress.phone).toBe("9999999999");
    expect(orderDoc.shippingAddress.address[0]).toBe("10");
    expect(orderDoc.shippingAddress.address[1]).toBe("Park Street");
    expect(orderDoc.shippingAddress.address[4]).toBe("Mumbai");
    expect(orderDoc.save).toHaveBeenCalledTimes(1);
    expect(res.body.message).toContain("updated successfully");
  });
});
