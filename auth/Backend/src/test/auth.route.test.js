import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";
import { createRequire } from "module";
import path from "path";

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(".tmp", "mongodb-binaries");

const redisMock = {
  set: jest.fn().mockResolvedValue("OK"),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
};

jest.unstable_mockModule("../db/redis.js", () => ({
  default: redisMock,
}));

const require = createRequire(import.meta.url);
const { MongoMemoryServer } = require("mongodb-memory-server");

let app;
let mongoServer;
let userModel;

const validUserPayload = {
  fullName: {
    firstName: "John",
    lastName: "Doe",
  },
  userName: "johndoe",
  email: "johndoe@example.com",
  mobNo: {
    country: "india",
    number: "8651222322",
  },
  password: "Password123",
};

beforeAll(async () => {
  process.env.JWT_SECRET_KEY = "test_jwt_secret";

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = (await import("../app.js")).default;
  userModel = (await import("../models/user.model.js")).default;
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  jest.clearAllMocks();
  await userModel.deleteMany({});
});

describe("POST /api/auth/register", () => {
  it("registers a new user in the memory database", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(validUserPayload)
      .expect(201);

    expect(response.body.message).toBe("user registered successfully");
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.headers["set-cookie"]).toBeDefined();

    expect(response.body.user).toMatchObject({
      userName: validUserPayload.userName,
      email: validUserPayload.email,
      fullName: validUserPayload.fullName,
      mobNo: validUserPayload.mobNo,
    });
    expect(response.body.user.password).not.toBe(validUserPayload.password);

    const decodedToken = jwt.verify(
      response.body.accessToken,
      process.env.JWT_SECRET_KEY
    );
    expect(decodedToken).toMatchObject({
      userName: validUserPayload.userName,
      email: validUserPayload.email,
      mobNo: validUserPayload.mobNo,
    });

    const savedUser = await userModel
      .findOne({ email: validUserPayload.email })
      .select("+password");

    expect(savedUser).not.toBeNull();
    expect(savedUser.userName).toBe(validUserPayload.userName);
    expect(savedUser.password).not.toBe(validUserPayload.password);
    await expect(
      bcrypt.compare(validUserPayload.password, savedUser.password)
    ).resolves.toBe(true);
  });

  it("returns 400 when registration data is invalid", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: { firstName: "" },
        userName: "",
        email: "not-an-email",
        mobNo: { number: "123" },
        password: "123",
      })
      .expect(400);

    expect(response.body.message).toBe("validation error");
    expect(response.body.errors).toEqual(expect.any(Array));
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "fullName.firstName" }),
        expect.objectContaining({ path: "userName" }),
        expect.objectContaining({ path: "email" }),
        expect.objectContaining({ path: "mobNo.number" }),
        expect.objectContaining({ path: "password" }),
      ])
    );
  });

  it("returns 409 when username, email, or mobile number already exists", async () => {
    await request(app)
      .post("/api/auth/register")
      .send(validUserPayload)
      .expect(201);

    const duplicateCases = [
      {
        userName: validUserPayload.userName,
        email: "another@example.com",
        mobNo: { country: "india", number: "8651222323" },
      },
      {
        userName: "anotheruser",
        email: validUserPayload.email,
        mobNo: { country: "india", number: "8651222324" },
      },
      {
        userName: "thirduser",
        email: "third@example.com",
        mobNo: validUserPayload.mobNo,
      },
    ];

    for (const duplicateFields of duplicateCases) {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...validUserPayload,
          ...duplicateFields,
          fullName: { firstName: "Jane", lastName: "Doe" },
          password: "Password123",
        })
        .expect(409);

      expect(response.body.message).toBe("user already exist");
    }
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app)
      .post("/api/auth/register")
      .send(validUserPayload)
      .expect(201);
  });

  it("logs in a registered user", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: validUserPayload.email,
        password: validUserPayload.password,
      })
      .expect(200);

    expect(response.body.message).toBe("user logged in successfully");
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.headers["set-cookie"]).toBeDefined();

    expect(response.body.user).toMatchObject({
      userName: validUserPayload.userName,
      email: validUserPayload.email,
      fullName: validUserPayload.fullName,
      mobNo: validUserPayload.mobNo,
    });
    expect(response.body.user.password).not.toBe(validUserPayload.password);

    const decodedToken = jwt.verify(
      response.body.accessToken,
      process.env.JWT_SECRET_KEY
    );
    expect(decodedToken).toMatchObject({
      userName: validUserPayload.userName,
      email: validUserPayload.email,
      mobNo: validUserPayload.mobNo,
    });
  });

  it("returns 400 when login data is invalid", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "not-an-email",
        password: "",
      })
      .expect(400);

    expect(response.body.message).toBe("validation error");
    expect(response.body.errors).toEqual(expect.any(Array));
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "email" }),
        expect.objectContaining({ path: "password" }),
      ])
    );
  });

  it("returns 404 when the user does not exist", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "missing@example.com",
        password: validUserPayload.password,
      })
      .expect(404);

    expect(response.body.message).toBe("user not found");
  });

  it("returns 401 when the password is incorrect", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: validUserPayload.email,
        password: "WrongPassword123",
      })
      .expect(401);

    expect(response.body.message).toBe("invalid credentials password incorrect");
  });
});

describe("GET /api/get/me", () => {
  it("returns the current logged-in user with a bearer token", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(validUserPayload)
      .expect(201);

    const response = await request(app)
      .get("/api/get/me")
      .set("Authorization", `Bearer ${registerResponse.body.accessToken}`)
      .expect(200);

    expect(response.body.message).toBe("user fetched successfully");
    expect(response.body.user).toMatchObject({
      userName: validUserPayload.userName,
      email: validUserPayload.email,
      fullName: validUserPayload.fullName,
      mobNo: validUserPayload.mobNo,
    });
    expect(response.body.user.password).toBeUndefined();
  });

  it("returns the current logged-in user with an access token cookie", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(validUserPayload)
      .expect(201);

    const response = await request(app)
      .get("/api/get/me")
      .set("Cookie", [`accessToken=${registerResponse.body.accessToken}`])
      .expect(200);

    expect(response.body.message).toBe("user fetched successfully");
    expect(response.body.user.email).toBe(validUserPayload.email);
  });

  it("returns 401 when the access token is missing", async () => {
    const response = await request(app).get("/api/get/me").expect(401);

    expect(response.body.message).toBe("authentication token missing");
  });

  it("returns 401 when the access token is invalid", async () => {
    const response = await request(app)
      .get("/api/get/me")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    expect(response.body.message).toBe("invalid authentication token");
  });
});

describe("PATCH /api/auth/user/me", () => {
  it("updates the current authenticated user's profile", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(validUserPayload)
      .expect(201);

    const updatePayload = {
      fullName: {
        firstName: "Johnny",
      },
      userName: "johnnydoe",
      email: "johnnydoe@example.com",
      mobNo: {
        number: "8651222333",
      },
      role: "admin",
      password: "ShouldNotUpdate123",
    };

    const response = await request(app)
      .patch("/api/auth/user/me")
      .set("Authorization", `Bearer ${registerResponse.body.accessToken}`)
      .send(updatePayload)
      .expect(200);

    expect(response.body.message).toBe("user updated successfully");
    expect(response.body.user).toMatchObject({
      fullName: {
        firstName: updatePayload.fullName.firstName,
        lastName: validUserPayload.fullName.lastName,
      },
      userName: updatePayload.userName,
      email: updatePayload.email,
      mobNo: {
        country: validUserPayload.mobNo.country,
        number: updatePayload.mobNo.number,
      },
      role: "user",
    });
    expect(response.body.user.password).toBeUndefined();

    const savedUser = await userModel
      .findById(registerResponse.body.user._id)
      .select("+password");

    expect(savedUser.fullName.firstName).toBe(updatePayload.fullName.firstName);
    expect(savedUser.fullName.lastName).toBe(validUserPayload.fullName.lastName);
    expect(savedUser.email).toBe(updatePayload.email);
    expect(savedUser.role).toBe("user");
    await expect(
      bcrypt.compare(validUserPayload.password, savedUser.password)
    ).resolves.toBe(true);
  });

  it("returns 400 when no supported update fields are provided", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(validUserPayload)
      .expect(201);

    const response = await request(app)
      .patch("/api/auth/user/me")
      .set("Authorization", `Bearer ${registerResponse.body.accessToken}`)
      .send({ password: "NewPassword123", role: "admin" })
      .expect(400);

    expect(response.body.message).toBe("no valid fields provided for update");
  });

  it("returns 401 when the access token is missing", async () => {
    const response = await request(app)
      .patch("/api/auth/user/me")
      .send({ userName: "johnnydoe" })
      .expect(401);

    expect(response.body.message).toBe("authentication token missing");
  });

  it("returns 409 when the updated username, email, or mobile number already exists", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(validUserPayload)
      .expect(201);

    await request(app)
      .post("/api/auth/register")
      .send({
        fullName: { firstName: "Jane", lastName: "Doe" },
        userName: "janedoe",
        email: "janedoe@example.com",
        mobNo: {
          country: "india",
          number: "8651222334",
        },
        password: "Password123",
      })
      .expect(201);

    const response = await request(app)
      .patch("/api/auth/user/me")
      .set("Authorization", `Bearer ${registerResponse.body.accessToken}`)
      .send({ email: "janedoe@example.com" })
      .expect(409);

    expect(response.body.message).toBe("user already exist");
  });
});

describe("GET /api/get/users/me/addresses", () => {
  it("returns the current authenticated user's addresses", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(validUserPayload)
      .expect(201);

    const address = {
      houseNumber: "221B",
      street: "Baker Street",
      area: "Marylebone",
      city: "London",
      state: "Greater London",
      country: "UK",
      pincode: "800001",
    };

    await userModel.findByIdAndUpdate(registerResponse.body.user._id, {
      $push: {
        address: {
          addresses: address,
        },
      },
    });

    const response = await request(app)
      .get("/api/get/users/me/addresses")
      .set("Authorization", `Bearer ${registerResponse.body.accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      address: [
        {
          addresses: address,
        },
      ],
    });
    expect(response.body.fullName).toBeUndefined();
    expect(response.body.email).toBeUndefined();
    expect(response.body.password).toBeUndefined();
  });

  it("returns 401 when the access token is missing", async () => {
    const response = await request(app)
      .get("/api/get/users/me/addresses")
      .expect(401);

    expect(response.body.message).toBe("authentication token missing");
  });
});

describe("POST /api/auth/users/me/addresses", () => {
  const validAddressPayload = {
    area: "Boring Road",
    city: "Patna",
    state: "Bihar",
    country: "India",
    pincode: "800001",
    mobileNo: "9876543210",
    isDefault: true,
  };

  it("adds an address for the current authenticated user", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(validUserPayload)
      .expect(201);

    const response = await request(app)
      .post("/api/auth/users/me/addresses")
      .set("Authorization", `Bearer ${registerResponse.body.accessToken}`)
      .send(validAddressPayload)
      .expect(201);

    expect(response.body).toMatchObject({
      message: "Address added successfully",
      address: validAddressPayload,
    });

    const savedUser = await userModel.findById(registerResponse.body.user._id);

    expect(savedUser.address).toHaveLength(1);
    expect(savedUser.address[0].addresses.toObject()).toMatchObject(
      validAddressPayload
    );
  });

  it("returns 400 when address data is invalid", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(validUserPayload)
      .expect(201);

    const response = await request(app)
      .post("/api/auth/users/me/addresses")
      .set("Authorization", `Bearer ${registerResponse.body.accessToken}`)
      .send({
        area: "",
        city: "",
        state: "",
        country: "",
        pincode: "123",
        mobileNo: "12345",
      })
      .expect(400);

    expect(response.body.message).toBe("validation error");
    expect(response.body.errors).toEqual(expect.any(Array));
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "area" }),
        expect.objectContaining({ path: "city" }),
        expect.objectContaining({ path: "state" }),
        expect.objectContaining({ path: "country" }),
        expect.objectContaining({ path: "pincode" }),
        expect.objectContaining({ path: "mobileNo" }),
      ])
    );
  });

  it("returns 401 when the access token is missing", async () => {
    const response = await request(app)
      .post("/api/auth/users/me/addresses")
      .send(validAddressPayload)
      .expect(401);

    expect(response.body.message).toBe("authentication token missing");
  });
});

describe("PATCH /api/auth/users/me/addresses/:addressId", () => {
  const existingAddressPayload = {
    area: "Boring Road",
    city: "Patna",
    state: "Bihar",
    country: "India",
    pincode: "800001",
    mobileNo: "9876543210",
    isDefault: true,
  };

  const updatedAddressPayload = {
    area: "Kankarbagh",
    city: "Patna",
    state: "Bihar",
    country: "India",
    pincode: "800020",
    mobileNo: "9876543211",
    isDefault: false,
  };

  const createUserWithAddress = async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(validUserPayload)
      .expect(201);

    const user = await userModel.findById(registerResponse.body.user._id);
    user.address.push({ addresses: existingAddressPayload });
    await user.save();

    return {
      accessToken: registerResponse.body.accessToken,
      addressId: user.address[0]._id.toString(),
      userId: registerResponse.body.user._id,
    };
  };

  it("updates an address for the current authenticated user", async () => {
    const { accessToken, addressId, userId } = await createUserWithAddress();

    const response = await request(app)
      .patch(`/api/auth/users/me/addresses/${addressId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(updatedAddressPayload)
      .expect(200);

    expect(response.body.message).toBe("Address updated successfully");
    expect(response.body.address).toMatchObject({
      _id: addressId,
      addresses: updatedAddressPayload,
    });

    const savedUser = await userModel.findById(userId);
    expect(savedUser.address[0].addresses.toObject()).toMatchObject(
      updatedAddressPayload
    );
  });

  it("returns 404 when the address does not exist for the user", async () => {
    const { accessToken } = await createUserWithAddress();
    const missingAddressId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .patch(`/api/auth/users/me/addresses/${missingAddressId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(updatedAddressPayload)
      .expect(404);

    expect(response.body.message).toBe("Address not found");
  });

  it("returns 400 when address data is invalid", async () => {
    const { accessToken, addressId } = await createUserWithAddress();

    const response = await request(app)
      .patch(`/api/auth/users/me/addresses/${addressId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        area: "",
        city: "",
        state: "",
        country: "",
        pincode: "123",
        mobileNo: "12345",
      })
      .expect(400);

    expect(response.body.message).toBe("validation error");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "area" }),
        expect.objectContaining({ path: "city" }),
        expect.objectContaining({ path: "state" }),
        expect.objectContaining({ path: "country" }),
        expect.objectContaining({ path: "pincode" }),
        expect.objectContaining({ path: "mobileNo" }),
      ])
    );
  });

  it("returns 401 when the access token is missing", async () => {
    const addressId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .patch(`/api/auth/users/me/addresses/${addressId}`)
      .send(updatedAddressPayload)
      .expect(401);

    expect(response.body.message).toBe("authentication token missing");
  });
});

describe("POST /api/auth/logout", () => {
  it("logs out an authenticated user and clears the access token cookie", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(validUserPayload)
      .expect(201);

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", [`accessToken=${registerResponse.body.accessToken}`])
      .expect(200);

    expect(response.body.message).toBe("user logged out successfully");
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringMatching(/^accessToken=;/)])
    );
    expect(redisMock.set).toHaveBeenCalled();
  });

  it("returns 401 when the access token is missing", async () => {
    const response = await request(app).post("/api/auth/logout").expect(401);

    expect(response.body.message).toBe("authentication token missing");
    expect(redisMock.set).not.toHaveBeenCalled();
  });
});
