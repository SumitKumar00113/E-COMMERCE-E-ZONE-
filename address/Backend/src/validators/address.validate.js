const createAddressValidator = (req, res, next) => {
  const addressPayload = req.body?.addresses ?? req.body;
  const errors = [];

  const requiredFields = [
    { field: "houseNumber", message: "House number is required" },
    { field: "street", message: "Street is required" },
    { field: "area", message: "Area is required" },
    { field: "city", message: "City is required" },
    { field: "state", message: "State is required" },
    { field: "country", message: "Country is required" },
  ];

  requiredFields.forEach(({ field, message }) => {
    const value = addressPayload?.[field];
    if (typeof value !== "string" || value.trim() === "") {
      errors.push({ field, msg: message });
    }
  });

  const pincode = addressPayload?.pincode;
  if (
    pincode === undefined ||
    pincode === null ||
    String(pincode).trim() === ""
  ) {
    errors.push({ field: "pincode", msg: "Pincode is required" });
  } else if (!/^\d{4,6}$/.test(String(pincode))) {
    errors.push({ field: "pincode", msg: "Pincode must be numeric" });
  }

  const mobileNo = addressPayload?.mobileNo;
  if (
    mobileNo === undefined ||
    mobileNo === null ||
    String(mobileNo).trim() === ""
  ) {
    errors.push({ field: "mobileNo", msg: "Mobile number is required" });
  } else if (!/^\d{10}$/.test(String(mobileNo))) {
    errors.push({
      field: "mobileNo",
      msg: "Mobile number must be exactly 10 digits",
    });
  }

  if (
    addressPayload?.addressType &&
    !["Home", "Work", "Other"].includes(addressPayload.addressType)
  ) {
    errors.push({
      field: "addressType",
      msg: "Address type must be Home, Work or Other",
    });
  }

  if (
    addressPayload?.isDefault !== undefined &&
    typeof addressPayload.isDefault !== "boolean"
  ) {
    errors.push({ field: "isDefault", msg: "isDefault must be true or false" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

export { createAddressValidator };
export default { createAddressValidator };
