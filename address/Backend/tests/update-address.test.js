import { jest, describe, beforeEach, test, expect } from "@jest/globals";
import express from "express";
import request from "supertest";

jest.unstable_mockModule("../src/models/address.model.js", () => ({
  default: {
    findOneAndUpdate: jest.fn(),
  },
}));

const { default: addressModel } =
  await import("../src/models/address.model.js");
const addressRouter = (await import("../src/routes/address.route.js")).default;

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: "user123" };
    next();
  });
  app.use("/api/patch", addressRouter);
  return app;
};

describe("PATCH /api/patch/update-address", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should update an existing address for the authenticated user", async () => {
    const updatePayload = {
      addressId: "address123",
      houseNumber: "321",
      street: "Updated Street",
      city: "Delhi",
    };

    const updatedAddress = {
      _id: "address123",
      user: "user123",
      houseNumber: "321",
      street: "Updated Street",
      city: "Delhi",
      country: "India",
    };

    addressModel.findOneAndUpdate.mockResolvedValue(updatedAddress);

    const response = await request(buildApp())
      .patch("/api/patch/update-address")
      .send(updatePayload);

    expect(addressModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "address123", user: "user123" },
      { houseNumber: "321", street: "Updated Street", city: "Delhi" },
      { new: true, runValidators: true },
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Address updated successfully");
    expect(response.body.data).toEqual(updatedAddress);
  });

  test("should return 404 when the address does not exist", async () => {
    addressModel.findOneAndUpdate.mockResolvedValue(null);

    const response = await request(buildApp())
      .patch("/api/patch/update-address")
      .send({ addressId: "missing-address", houseNumber: "999" });

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Address not found");
  });
});
