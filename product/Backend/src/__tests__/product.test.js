import mongoose from "mongoose";
import request from "supertest";
import { jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";

jest.setTimeout(30000);

const mockImageKitUpload = jest.fn().mockResolvedValue({
  url: "https://ik.imagekit.io/test/product.jpg",
  fileId: "test-file-id",
  thumbnailUrl: "https://ik.imagekit.io/test/tr:h-200,w-200/product.jpg",
});

jest.unstable_mockModule(
  "imagekit",
  () => ({
    default: jest.fn().mockImplementation(() => ({
      files: {
        upload: mockImageKitUpload,
      },
    })),
  }),
  { virtual: true },
);

// Mock auth middleware to bypass JWT verification in tests
jest.unstable_mockModule(
  "../middlewares/auth.middleware.js",
  () => ({
    default: () => (req, res, next) => {
      req.user = {
        id: req.body?.seller || req.body?.seller || "test-seller-id",
        role: "seller",
      };
      next();
    },
  }),
  { virtual: true },
);

const { default: app } = await import("../app.js");
const { default: productModel } = await import("../models/product.model.js");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {});
});

afterEach(async () => {
  await productModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("POST /api/products/product", () => {
  it("creates a product with uploaded image metadata", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const imageBuffer = Buffer.from("fake image content");

    const response = await request(app)
      .post("/api/products/product")
      .field("title", "Test product")
      .field("description", "Product created from Jest")
      .field("price_amount", "499")
      .field("price_currency", "INR")
      .field("seller", sellerId.toString())
      .attach("images", imageBuffer, {
        filename: "product.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      message: "product create successfully",
      product: {
        title: "Test product",
        description: "Product created from Jest",
        price: {
          amount: 499,
          currency: "INR",
        },
        seller: sellerId.toString(),
      },
    });

    const savedProduct = await productModel.findOne({ title: "Test product" });

    expect(savedProduct).toBeTruthy();
    expect(savedProduct.price.amount).toBe(499);
    expect(savedProduct.price.currency).toBe("INR");
    expect(savedProduct.seller.toString()).toBe(sellerId.toString());
    expect(savedProduct.images).toHaveLength(1);
    expect(savedProduct.images[0].url).toBeDefined();
    expect(savedProduct.images[0].id).toBeDefined();
    expect(savedProduct.images[0].thumbnail).toBeDefined();
    expect(savedProduct.images[0].alt).toBe("product.jpg");
  });
});

describe("GET /api/products/product/:id", () => {
  it("should retrieve a product by ID", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const product = await productModel.create({
      title: "Laptop",
      description: "High-performance laptop",
      price: {
        amount: 89999,
        currency: "INR",
      },
      seller: sellerId,
      images: [
        {
          url: "https://ik.imagekit.io/test/laptop.jpg",
          alt: "laptop.jpg",
          thumbnail: "https://ik.imagekit.io/test/tr:h-200,w-200/laptop.jpg",
          id: "test-file-id",
        },
      ],
    });

    const response = await request(app)
      .get(`/api/products/product/${product._id}`)
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: "product fetched successfully",
      product: {
        title: "Laptop",
        description: "High-performance laptop",
        price: {
          amount: 89999,
          currency: "INR",
        },
        seller: sellerId.toString(),
      },
    });
    expect(response.body.product.images).toHaveLength(1);
  });

  it("should return 404 when product ID does not exist", async () => {
    const fakeProductId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/products/product/${fakeProductId}`)
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "product not found",
    });
  });

  it("should return 400 for invalid product ID format", async () => {
    const response = await request(app)
      .get("/api/products/product/invalid-id-format")
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: expect.stringContaining("invalid"),
    });
  });
});

describe("GET /api/get/product/search", () => {
  it("should return products matching the search query", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    await productModel.create([
      {
        title: "Gaming Laptop",
        description: "High-performance laptop for gaming",
        price: { amount: 129999, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Office Laptop",
        description: "Lightweight laptop for office use",
        price: { amount: 59999, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Wireless Mouse",
        description: "Ergonomic mouse for laptops",
        price: { amount: 1999, currency: "INR" },
        seller: sellerId,
        images: [],
      },
    ]);

    const response = await request(app)
      .get("/api/get/product/search")
      .query({ query: "laptop" })
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: "products fetched successfully",
    });
    expect(Array.isArray(response.body.products)).toBe(true);
    expect(response.body.products).toHaveLength(3);
    response.body.products.forEach((product) => {
      expect(
        product.title.toLowerCase() + product.description.toLowerCase(),
      ).toContain("laptop");
    });
  });

  it("should return 400 when query parameter is missing", async () => {
    const response = await request(app)
      .get("/api/get/product/search")
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "search query is required",
    });
  });
});

describe("PATCH /api/update/products/product/:id", () => {
  it("updates a product when the seller matches", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    // Create a product owned by sellerId
    const product = await productModel.create({
      title: "Old Title",
      description: "Old description",
      price: { amount: 1000, currency: "INR" },
      seller: sellerId,
      images: [],
    });

    const response = await request(app)
      .patch(`/api/update/products/product/${product._id}`)
      .send({
        title: "New Title",
        description: "Updated description",
        price: { amount: 1499, currency: "INR" },
        seller: sellerId.toString(),
      })
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: "product updated successfully",
      product: {
        title: "New Title",
        description: "Updated description",
        price: {
          amount: 1499,
          currency: "INR",
        },
        seller: sellerId.toString(),
      },
    });

    const updated = await productModel.findById(product._id);
    expect(updated.title).toBe("New Title");
    expect(updated.price.amount).toBe(1499);
  });

  it("returns 403 when authenticated seller is different", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const otherSeller = new mongoose.Types.ObjectId();

    const product = await productModel.create({
      title: "Owner Title",
      description: "Owner desc",
      price: { amount: 2000, currency: "INR" },
      seller: sellerId,
      images: [],
    });

    const response = await request(app)
      .patch(`/api/update/products/product/${product._id}`)
      .send({ title: "Hacked", seller: otherSeller.toString() })
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      message: "you are not authorized to update this product",
    });
  });

  it("returns 400 for invalid product id format", async () => {
    const response = await request(app)
      .patch("/api/update/products/product/invalid-id")
      .send({ title: "Nope", seller: "some-seller" })
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: expect.stringContaining("invalid"),
    });
  });

  it("returns 404 when product does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const sellerId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .patch(`/api/update/products/product/${fakeId}`)
      .send({ title: "No product", seller: sellerId.toString() })
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ message: "product not found" });
  });

  it("should update only partial fields provided", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const product = await productModel.create({
      title: "Original Title",
      description: "Original description",
      price: { amount: 5000, currency: "INR" },
      seller: sellerId,
      images: [],
    });

    const response = await request(app)
      .patch(`/api/update/products/product/${product._id}`)
      .send({
        title: "Updated Title Only",
        seller: sellerId.toString(),
      })
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(response.body.product.title).toBe("Updated Title Only");
    expect(response.body.product.description).toBe("Original description");
    expect(response.body.product.price.amount).toBe(5000);
  });
});

describe("DELETE /api/products/product/:id", () => {
  it("should successfully delete a product by the seller", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const product = await productModel.create({
      title: "Product to Delete",
      description: "This will be deleted",
      price: { amount: 999, currency: "INR" },
      seller: sellerId,
      images: [],
    });

    const response = await request(app)
      .delete(`/api/products/product/${product._id}`)
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: "product deleted successfully",
    });

    const deletedProduct = await productModel.findById(product._id);
    expect(deletedProduct).toBeNull();
  });

  it("should return 404 when product does not exist", async () => {
    const fakeProductId = new mongoose.Types.ObjectId();
    const sellerId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .delete(`/api/products/product/${fakeProductId}`)
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: "product not found",
    });
  });

  it("should return 403 when authenticated user is not the seller", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const otherSellerId = new mongoose.Types.ObjectId();

    const product = await productModel.create({
      title: "Protected Product",
      description: "Owner only",
      price: { amount: 5000, currency: "INR" },
      seller: sellerId,
      images: [],
    });

    const response = await request(app)
      .delete(`/api/products/product/${product._id}`)
      .set("Authorization", "Bearer test-token")
      .send({ seller: otherSellerId.toString() });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      message: "you are not authorized to delete this product",
    });

    const stillExists = await productModel.findById(product._id);
    expect(stillExists).toBeTruthy();
  });

  it("should return 400 for invalid product ID format", async () => {
    const response = await request(app)
      .delete("/api/products/product/invalid-id-format")
      .set("Authorization", "Bearer test-token")
      .send({ seller: "some-seller" });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: expect.stringContaining("invalid"),
    });
  });
});

describe("POST /api/products/product - Edge Cases", () => {
  it("should return 400 when title is missing", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const imageBuffer = Buffer.from("fake image content");

    const response = await request(app)
      .post("/api/products/product")
      .field("description", "Product without title")
      .field("price[amount]", "499")
      .field("price[currency]", "INR")
      .field("seller", sellerId.toString())
      .attach("images", imageBuffer, {
        filename: "product.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(400);
  });

  it("should return 400 when description is missing", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const imageBuffer = Buffer.from("fake image content");

    const response = await request(app)
      .post("/api/products/product")
      .field("title", "Product without description")
      .field("price[amount]", "499")
      .field("price[currency]", "INR")
      .field("seller", sellerId.toString())
      .attach("images", imageBuffer, {
        filename: "product.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(400);
  });

  it("should return 400 when price amount is missing", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const imageBuffer = Buffer.from("fake image content");

    const response = await request(app)
      .post("/api/products/product")
      .field("title", "Test Product")
      .field("description", "Product without price")
      .field("price[currency]", "INR")
      .field("seller", sellerId.toString())
      .attach("images", imageBuffer, {
        filename: "product.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(400);
  });

  it("should return 400 when price currency is missing", async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const imageBuffer = Buffer.from("fake image content");

    const response = await request(app)
      .post("/api/products/product")
      .field("title", "Test Product")
      .field("description", "Product without currency")
      .field("price[amount]", "499")
      .field("seller", sellerId.toString())
      .attach("images", imageBuffer, {
        filename: "product.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(400);
  });

  it("should create product without images", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .post("/api/products/product")
      .field("title", "Product without images")
      .field("description", "Testing product creation without images")
      .field("price_amount", "299")
      .field("price_currency", "INR")
      .field("seller", sellerId.toString());

    expect(response.status).toBe(201);
    expect(response.body.product.images).toHaveLength(0);
  });
});

describe("GET /api/products/search - Advanced Filters", () => {
  beforeEach(async () => {
    const sellerId = new mongoose.Types.ObjectId();
    await productModel.create([
      {
        title: "Expensive Gaming Laptop",
        description: "High-end gaming laptop with RTX",
        price: { amount: 150000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Budget Laptop",
        description: "Affordable laptop for daily use",
        price: { amount: 35000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Gaming Keyboard",
        description: "Mechanical gaming keyboard with RGB",
        price: { amount: 8000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
    ]);
  });

  it("should filter products by minPrice", async () => {
    const response = await request(app)
      .get("/api/get/product/search")
      .query({ query: "laptop", minPrice: "40000" })
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.products)).toBe(true);
    response.body.products.forEach((product) => {
      expect(product.price.amount).toBeGreaterThanOrEqual(40000);
    });
  });

  it("should filter products by maxPrice", async () => {
    const response = await request(app)
      .get("/api/get/product/search")
      .query({ query: "laptop", maxPrice: "100000" })
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.products)).toBe(true);
    response.body.products.forEach((product) => {
      expect(product.price.amount).toBeLessThanOrEqual(100000);
    });
  });

  it("should filter products by price range (minPrice and maxPrice)", async () => {
    const response = await request(app)
      .get("/api/get/product/search")
      .query({ query: "laptop", minPrice: "30000", maxPrice: "100000" })
      .set("Authorization", "Bearer test-token");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.products)).toBe(true);
    response.body.products.forEach((product) => {
      expect(product.price.amount).toBeGreaterThanOrEqual(30000);
      expect(product.price.amount).toBeLessThanOrEqual(100000);
    });
  });

  it("should support pagination with skip and limit", async () => {
    const response1 = await request(app)
      .get("/api/get/product/search")
      .query({ query: "laptop", skip: 0, limit: 1 })
      .set("Authorization", "Bearer test-token");

    expect(response1.status).toBe(200);
    expect(response1.body.products.length).toBeLessThanOrEqual(1);

    const response2 = await request(app)
      .get("/api/get/product/search")
      .query({ query: "laptop", skip: 1, limit: 10 })
      .set("Authorization", "Bearer test-token");

    expect(response2.status).toBe(200);
  });
});

describe("GET /api/get/product/seller-products", () => {
  it("should fetch all products for authenticated seller", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    await productModel.create([
      {
        title: "Seller Product 1",
        description: "First product from seller",
        price: { amount: 5000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Seller Product 2",
        description: "Second product from seller",
        price: { amount: 8000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Other Seller Product",
        description: "Product from different seller",
        price: { amount: 3000, currency: "INR" },
        seller: new mongoose.Types.ObjectId(),
        images: [],
      },
    ]);

    const response = await request(app)
      .get("/api/get/product/seller-products")
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "seller products fetched successfully",
    );
    expect(Array.isArray(response.body.products)).toBe(true);
    expect(response.body.products).toHaveLength(2);
    expect(response.body.products[0].seller.toString()).toBe(
      sellerId.toString(),
    );
    expect(response.body.products[1].seller.toString()).toBe(
      sellerId.toString(),
    );
  });

  it("should return empty array when seller has no products", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get("/api/get/product/seller-products")
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response.status).toBe(200);
    expect(response.body.products).toEqual([]);
  });

  it("should support pagination with skip and limit", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    await productModel.create([
      {
        title: "Product 1",
        description: "Description 1",
        price: { amount: 1000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Product 2",
        description: "Description 2",
        price: { amount: 2000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Product 3",
        description: "Description 3",
        price: { amount: 3000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
    ]);

    const response1 = await request(app)
      .get("/api/get/product/seller-products")
      .query({ skip: 0, limit: 2 })
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response1.status).toBe(200);
    expect(response1.body.products).toHaveLength(2);

    const response2 = await request(app)
      .get("/api/get/product/seller-products")
      .query({ skip: 2, limit: 2 })
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response2.status).toBe(200);
    expect(response2.body.products).toHaveLength(1);
  });

  it("should sort products by price ascending", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    await productModel.create([
      {
        title: "Expensive Product",
        description: "High price",
        price: { amount: 9000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Cheap Product",
        description: "Low price",
        price: { amount: 1000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Medium Product",
        description: "Medium price",
        price: { amount: 5000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
    ]);

    const response = await request(app)
      .get("/api/get/product/seller-products")
      .query({ sortBy: "price", sortOrder: "asc" })
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response.status).toBe(200);
    expect(response.body.products[0].price.amount).toBe(1000);
    expect(response.body.products[1].price.amount).toBe(5000);
    expect(response.body.products[2].price.amount).toBe(9000);
  });

  it("should sort products by price descending", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    await productModel.create([
      {
        title: "Expensive Product",
        description: "High price",
        price: { amount: 9000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Cheap Product",
        description: "Low price",
        price: { amount: 1000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Medium Product",
        description: "Medium price",
        price: { amount: 5000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
    ]);

    const response = await request(app)
      .get("/api/get/product/seller-products")
      .query({ sortBy: "price", sortOrder: "desc" })
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response.status).toBe(200);
    expect(response.body.products[0].price.amount).toBe(9000);
    expect(response.body.products[1].price.amount).toBe(5000);
    expect(response.body.products[2].price.amount).toBe(1000);
  });

  it("should sort products by date created", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    const product1 = await productModel.create({
      title: "First Product",
      description: "Created first",
      price: { amount: 1000, currency: "INR" },
      seller: sellerId,
      images: [],
    });

    // Add a small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 100));

    const product2 = await productModel.create({
      title: "Second Product",
      description: "Created second",
      price: { amount: 2000, currency: "INR" },
      seller: sellerId,
      images: [],
    });

    const response = await request(app)
      .get("/api/get/product/seller-products")
      .query({ sortBy: "createdAt", sortOrder: "asc" })
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response.status).toBe(200);
    expect(response.body.products[0]._id.toString()).toBe(
      product1._id.toString(),
    );
    expect(response.body.products[1]._id.toString()).toBe(
      product2._id.toString(),
    );
  });

  it("should filter seller products by category", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    await productModel.create([
      {
        title: "Electronics Item",
        description: "Electronic product",
        price: { amount: 5000, currency: "INR" },
        seller: sellerId,
        images: [],
        category: "Electronics",
      },
      {
        title: "Book Item",
        description: "Book product",
        price: { amount: 500, currency: "INR" },
        seller: sellerId,
        images: [],
        category: "Books",
      },
    ]);

    const response = await request(app)
      .get("/api/get/product/seller-products")
      .query({ category: "Electronics" })
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0].category).toBe("Electronics");
  });

  it("should return seller product stats/count", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    await productModel.create([
      {
        title: "Product 1",
        description: "Description 1",
        price: { amount: 1000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Product 2",
        description: "Description 2",
        price: { amount: 2000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Product 3",
        description: "Description 3",
        price: { amount: 3000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
    ]);

    const response = await request(app)
      .get("/api/get/product/seller-products")
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("count", 3);
  });

  it("should return products with complete details including images and prices", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    await productModel.create({
      title: "Detailed Product",
      description: "Product with all details",
      price: { amount: 5000, currency: "INR" },
      seller: sellerId,
      images: [
        {
          url: "https://example.com/image1.jpg",
          alt: "Product image",
          thumbnail: "https://example.com/thumb1.jpg",
          id: "img-123",
        },
      ],
    });

    const response = await request(app)
      .get("/api/get/product/seller-products")
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response.status).toBe(200);
    expect(response.body.products[0]).toHaveProperty(
      "title",
      "Detailed Product",
    );
    expect(response.body.products[0]).toHaveProperty("description");
    expect(response.body.products[0]).toHaveProperty("price");
    expect(response.body.products[0]).toHaveProperty("images");
    expect(response.body.products[0].price.amount).toBe(5000);
    expect(response.body.products[0].images).toHaveLength(1);
  });

  it("should support search within seller's products", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    await productModel.create([
      {
        title: "Gaming Laptop",
        description: "High-performance gaming laptop",
        price: { amount: 89999, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Office Laptop",
        description: "Lightweight office laptop",
        price: { amount: 45000, currency: "INR" },
        seller: sellerId,
        images: [],
      },
      {
        title: "Gaming Mouse",
        description: "Ergonomic gaming mouse",
        price: { amount: 2999, currency: "INR" },
        seller: sellerId,
        images: [],
      },
    ]);

    const response = await request(app)
      .get("/api/get/product/seller-products")
      .query({ search: "gaming" })
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response.status).toBe(200);
    expect(response.body.products.length).toBeGreaterThan(0);
  });

  it("should return correct response structure", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    await productModel.create({
      title: "Test Product",
      description: "Test description",
      price: { amount: 1000, currency: "INR" },
      seller: sellerId,
      images: [],
    });

    const response = await request(app)
      .get("/api/get/product/seller-products")
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("products");
    expect(response.body).toHaveProperty("count");
    expect(Array.isArray(response.body.products)).toBe(true);
    expect(typeof response.body.count).toBe("number");
  });

  it("should limit returned products to maximum per page", async () => {
    const sellerId = new mongoose.Types.ObjectId();

    for (let i = 0; i < 25; i++) {
      await productModel.create({
        title: `Product ${i}`,
        description: `Description ${i}`,
        price: { amount: 1000 + i * 100, currency: "INR" },
        seller: sellerId,
        images: [],
      });
    }

    const response = await request(app)
      .get("/api/get/product/seller-products")
      .query({ limit: 10 })
      .set("Authorization", "Bearer test-token")
      .send({ seller: sellerId.toString() });

    expect(response.status).toBe(200);
    expect(response.body.products.length).toBeLessThanOrEqual(10);
  });
});
