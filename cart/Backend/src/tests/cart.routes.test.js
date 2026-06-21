import { jest } from "@jest/globals";
import request from "supertest";

const TEST_USER_ID = "665f1c000000000000000001";
const carts = new Map();
const clone = (value) => JSON.parse(JSON.stringify(value));

class MockCartModel {
  constructor(data) {
    this.user = data.user;
    this.items = data.items ?? [];
  }

  static async findOne(query) {
    if (query?.user) {
      const userId = query.user.toString();
      const cart = carts.get(userId);
      return cart ? new MockCartModel(clone(cart)) : null;
    }
    return null;
  }

  static async findOneAndDelete(query) {
    if (query?.user) {
      const userId = query.user.toString();
      const cart = carts.get(userId);
      if (!cart) return null;
      carts.delete(userId);
      return new MockCartModel(clone(cart));
    }
    return null;
  }

  async save() {
    const userId = this.user.toString();
    carts.set(userId, {
      user: userId,
      items: clone(this.items),
    });
    return this;
  }
}

jest.unstable_mockModule("../middlewares/auth.middleware.js", () => ({
  default: () => (req, res, next) => {
    req.user = { _id: TEST_USER_ID, id: TEST_USER_ID, role: "user" };
    next();
  },
}));

jest.unstable_mockModule("../models/cart.model.js", () => ({
  default: MockCartModel,
}));

const { default: app } = await import("../app.js");

describe("Cart routes", () => {
  beforeEach(() => {
    carts.clear();
    jest.clearAllMocks();
  });

  describe("GET /cart", () => {
    it("returns an empty cart when none exists", async () => {
      const response = await request(app).get("/cart").expect(200);
      expect(response.body).toEqual({
        message: "cart fetch successfully",
        items: [],
      });
    });

    it("returns stored cart items", async () => {
      carts.set(TEST_USER_ID, {
        user: TEST_USER_ID,
        items: [{ productId: "665f1c000000000000000101", quantity: 2 }],
      });

      const response = await request(app).get("/cart").expect(200);
      expect(response.body).toEqual({
        message: "cart fetch successfully",
        items: [{ productId: "665f1c000000000000000101", quantity: 2 }],
      });
    });
  });

  describe("POST /cart/items", () => {
    it("creates a new cart and adds an item", async () => {
      const response = await request(app)
        .post("/cart/items")
        .send({ productId: "665f1c000000000000000101", quantity: 2 })
        .expect(200);

      expect(response.body).toEqual({
        message: "item added to cart",
        cart: {
          user: TEST_USER_ID,
          items: [{ productId: "665f1c000000000000000101", quantity: 2 }],
        },
      });

      expect(carts.get(TEST_USER_ID)).toEqual({
        user: TEST_USER_ID,
        items: [{ productId: "665f1c000000000000000101", quantity: 2 }],
      });
    });

    it("increments quantity when the item already exists", async () => {
      carts.set(TEST_USER_ID, {
        user: TEST_USER_ID,
        items: [{ productId: "665f1c000000000000000101", quantity: 1 }],
      });

      const response = await request(app)
        .post("/cart/items")
        .send({ productId: "665f1c000000000000000101", quantity: 2 })
        .expect(200);

      expect(response.body.cart.items).toEqual([
        { productId: "665f1c000000000000000101", quantity: 3 },
      ]);
    });

    it("returns 400 when productId is missing", async () => {
      const response = await request(app)
        .post("/cart/items")
        .send({})
        .expect(400);
      expect(response.body).toEqual({
        message: "validation error",
        errors: [
          {
            location: "body",
            msg: "productId is required",
            path: "productId",
            type: "field",
          },
          {
            location: "body",
            msg: "productId must be a string",
            path: "productId",
            type: "field",
          },
          {
            location: "body",
            msg: "productId must be a valid 24-character ObjectId",
            path: "productId",
            type: "field",
          },
        ],
      });
    });
  });

  describe("PATCH /cart/items/:productId", () => {
    it("updates item quantity", async () => {
      carts.set(TEST_USER_ID, {
        user: TEST_USER_ID,
        items: [{ productId: "665f1c000000000000000101", quantity: 1 }],
      });

      const response = await request(app)
        .patch("/cart/items/665f1c000000000000000101")
        .send({ quantity: 3 })
        .expect(200);

      expect(response.body).toEqual({
        message: "cart update successfully",
        cart: {
          user: TEST_USER_ID,
          items: [{ productId: "665f1c000000000000000101", quantity: 3 }],
        },
      });
    });

    it("removes the item when quantity is zero", async () => {
      carts.set(TEST_USER_ID, {
        user: TEST_USER_ID,
        items: [{ productId: "665f1c000000000000000101", quantity: 1 }],
      });

      const response = await request(app)
        .patch("/cart/items/665f1c000000000000000101")
        .send({ quantity: 0 })
        .expect(200);

      expect(response.body).toEqual({
        message: "cart update successfully",
        cart: { user: TEST_USER_ID, items: [] },
      });
      expect(carts.has(TEST_USER_ID)).toBe(false);
    });

    it("returns 404 when the cart item does not exist", async () => {
      carts.set(TEST_USER_ID, {
        user: TEST_USER_ID,
        items: [{ productId: "665f1c000000000000000102", quantity: 1 }],
      });

      await request(app)
        .patch("/cart/items/665f1c000000000000000101")
        .send({ quantity: 2 })
        .expect(404);
    });
  });

  describe("DELETE /cart/items/:productId", () => {
    it("removes the item from the cart", async () => {
      carts.set(TEST_USER_ID, {
        user: TEST_USER_ID,
        items: [{ productId: "665f1c000000000000000101", quantity: 2 }],
      });

      const response = await request(app)
        .delete("/cart/items/665f1c000000000000000101")
        .expect(200);

      expect(response.body).toEqual({
        message: "cart delete successfully",
        cart: { user: TEST_USER_ID, items: [] },
      });
      expect(carts.has(TEST_USER_ID)).toBe(false);
    });

    it("returns 404 when the cart item does not exist", async () => {
      carts.set(TEST_USER_ID, {
        user: TEST_USER_ID,
        items: [{ productId: "665f1c000000000000000102", quantity: 1 }],
      });

      await request(app)
        .delete("/cart/items/665f1c000000000000000101")
        .expect(404);
    });
  });

  describe("DELETE /cart", () => {
    it("clears the user's cart", async () => {
      carts.set(TEST_USER_ID, {
        user: TEST_USER_ID,
        items: [{ productId: "665f1c000000000000000101", quantity: 1 }],
      });

      const response = await request(app).delete("/cart").expect(200);
      expect(response.body).toEqual({ message: "delete cart successfully" });
      expect(carts.has(TEST_USER_ID)).toBe(false);
    });

    it("returns 404 when no cart exists", async () => {
      await request(app).delete("/cart").expect(404);
    });
  });
});
