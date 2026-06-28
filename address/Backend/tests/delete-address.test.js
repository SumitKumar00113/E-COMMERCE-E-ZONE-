import { jest, describe, beforeEach, test, expect } from "@jest/globals";
import express from "express";
import request from "supertest";

jest.unstable_mockModule("../src/models/address.model.js", () => ({
  default: {
    findOneAndDelete: jest.fn(),
  },
}));

const { default: addressModel } = await import(
  "../src/models/address.model.js"
);
const addressRouter = (await import("../src/routes/address.route.js")).default;

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: "user123" };
    next();
  });
  app.use("/api/delete", addressRouter);
  return app;
};

describe("DELETE /api/delete/address", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should delete the address when addressId is provided", async () => {
    addressModel.findOneAndDelete.mockResolvedValue({
      _id: "address123",
      user: "user123",
    });

    const response = await request(buildApp())
      .delete("/api/delete/address")
      .query({ addressId: "address123" });

    expect(addressModel.findOneAndDelete).toHaveBeenCalledTimes(1);
    expect(addressModel.findOneAndDelete).toHaveBeenCalledWith({
      _id: "address123",
      user: "user123",
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("address delete successfully");
  });

  test("should return 403 when addressId is missing", async () => {
    const response = await request(buildApp()).delete("/api/delete/address");

    expect(addressModel.findOneAndDelete).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("address id is required");
  });
});
