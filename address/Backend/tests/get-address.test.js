import { jest, describe, beforeEach, test, expect } from "@jest/globals";
import request from "supertest";

// Mock the model before importing it
jest.unstable_mockModule("../src/models/address.model.js", () => ({
  default: {
    find: jest.fn(),
  },
}));

// Import mocked modules
const { default: addressModel } =
  await import("../src/models/address.model.js");
const { default: app } = await import("../src/app.js");

describe("GET /api/get/address", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return all addresses for the user", async () => {
    const addresses = [
      {
        _id: "address1",
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
      {
        _id: "address2",
        houseNumber: "456",
        street: "Second Street",
        area: "Uptown",
        city: "Los Angeles",
        state: "CA",
        country: "USA",
        pincode: "90001",
        mobileNo: "9876543211",
        isDefault: false,
      },
    ];

    addressModel.find.mockResolvedValue(addresses);

    const response = await request(app).get("/api/get/address");

    expect(addressModel.find).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(addresses);
  });
});
