const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const TOKEN_KEY = "meridian_access_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function buildHeaders(isMultipart = false) {
  const headers = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(data?.message || "Something went wrong");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export function formatPrice(amount, currency = "INR") {
  const value = Number(amount);
  if (Number.isNaN(value)) return "—";

  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function mapApiError(error) {
  if (!error?.data) return error?.message || "An unexpected error occurred";

  const { message, errors } = error.data;

  if (Array.isArray(errors) && errors.length > 0) {
    return errors.map((e) => e.msg || e.message).join(". ");
  }

  const friendly = {
    "Unauthorized: token is missing": "Please sign in to continue.",
    "Unauthorized: token is invalid": "Your session expired. Please sign in again.",
    "Forbidden: insufficient permissions":
      "You don't have permission to perform this action.",
    "invalid product ID format": "That product link isn't valid.",
    "product not found": "We couldn't find that product.",
    "search query is required": "Enter a search term to find products.",
    "validation error": "Please check the highlighted fields and try again.",
  };

  return friendly[message] || message || "An unexpected error occurred";
}

export function parseFieldErrors(error) {
  const fieldErrors = {};
  const errors = error?.data?.errors;
  if (!Array.isArray(errors)) return fieldErrors;

  errors.forEach((e) => {
    const field = e.path || e.param;
    if (field) {
      fieldErrors[field] = e.msg || e.message;
    }
  });

  return fieldErrors;
}

export async function searchProducts(query) {
  const params = new URLSearchParams({ query });
  const data = await handleResponse(
    await fetch(apiUrl(`/api/get/products/search?${params}`), {
      headers: buildHeaders(),
      credentials: "include",
    })
  );
  return data.products || [];
}

export async function getProduct(id) {
  const data = await handleResponse(
    await fetch(apiUrl(`/api/get/product/${id}`), {
      headers: buildHeaders(),
      credentials: "include",
    })
  );
  return data.product;
}

export async function createProduct({ title, description, price, images }) {
  const formData = new FormData();
  formData.append("title", title);
  if (description) formData.append("description", description);
  formData.append("price[amount]", String(price.amount));
  formData.append("price[currency]", price.currency);

  images.forEach((file) => {
    formData.append("images", file);
  });

  const data = await handleResponse(
    await fetch(apiUrl("/api/products/product"), {
      method: "POST",
      headers: buildHeaders(true),
      body: formData,
      credentials: "include",
    })
  );

  return data.product;
}

export async function loginWithCredentials(email, password) {
  const loginUrl = import.meta.env.VITE_AUTH_LOGIN_URL;
  if (!loginUrl) {
    throw new Error("Auth endpoint not configured");
  }

  const data = await handleResponse(
    await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    })
  );

  const token = data.accessToken || data.token;
  if (token) setToken(token);
  return token;
}

export function loginWithToken(token) {
  setToken(token.trim());
}

export function logout() {
  setToken(null);
}

export function getProductId(product) {
  return product._id || product.id;
}

export function getProductImage(product, type = "thumbnail") {
  const img = product.images?.[0];
  if (!img) return null;
  return type === "url" ? img.url : img.thumbnail || img.url;
}

export function getProductAlt(product) {
  return product.images?.[0]?.alt || product.title || "Product image";
}
