import { jest, describe, beforeEach, test, expect } from "@jest/globals";
import request from "supertest";

// Mock the model before importing it
jest.unstable_mockModule("../src/models/address.model.js", () => ({
  default: {
    create: jest.fn(),
  },
}));

// Import mocked modules
const { default: addressModel } = await import(
  "../src/models/address.model.js"
);

const { default: app } = await import("../src/app.js");

describe("POST /api/addresses/create-address", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create a new address", async () => {
    const payload = {
      addresses: {
        houseNumber: "123",
        street: "Main Street",
        area: "Downtown",
        city: "New York",
        state: "NY",
        country: "USA",
        pincode: "10001",
        mobileNo: "9876543210",
        isDefault: true,
      },
    };

    const createdAddress = {
      _id: "address123",
      ...payload.addresses,
    };

    addressModel.create.mockResolvedValue(createdAddress);

    const response = await request(app)
      .post("/api/addresses/create-address")
      .send(payload);

    expect(addressModel.create).toHaveBeenCalledTimes(1);
    expect(addressModel.create).toHaveBeenCalledWith(payload.addresses);

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(createdAddress);
  });

  test("should return 400 when required fields are missing", async () => {
    const payload = {
      addresses: {
        street: "Main Street",
        city: "New York",
      },
    };

    const response = await request(app)
      .post("/api/addresses/create-address")
      .send(payload);

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});