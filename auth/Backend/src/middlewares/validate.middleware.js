import { body, validationResult } from "express-validator";


const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "validation error",
      errors: errors.array(),
    });
  }
  next();
};


const validateRegistration = () => [
  body("fullName.firstName").notEmpty().withMessage("first name is required"),
  body("userName").notEmpty().withMessage("username is required"),
  body("email").isEmail().withMessage("valid email is required"),
  body("mobNo.number").isMobilePhone().withMessage("valid mobile number is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters long"),
  validateRequest,
];

const validateLogin = () => [
  body("userName")
  .optional()
  .notEmpty()
  .withMessage("username cannot be empty if provided"),
  body("email")
  .optional()
  .isEmail()
  .withMessage("valid email is required if provided"),
  body("mobNo.number")
  .optional()
  .isMobilePhone()
  .withMessage("valid mobile number is required if provided"),
  body("password").notEmpty().withMessage("password is required"),
  body("role").optional().isIn(["user", "seller"]).withMessage("invalid role provided"),
  validateRequest,
];
const validateAddress = () => [
  body("area")
    .notEmpty()
    .withMessage("Area is required"),

  body("city")
    .notEmpty()
    .withMessage("City is required"),

  body("state")
    .notEmpty()
    .withMessage("State is required"),

  body("country")
    .notEmpty()
    .withMessage("Country is required"),

  body("pincode")
    .notEmpty()
    .withMessage("Pincode is required")
    .isPostalCode("IN") // Use "IN" for Indian pincodes
    .withMessage("Valid pincode is required"),

  body("mobileNo")
    .notEmpty()
    .withMessage("Mobile number is required")
    .isMobilePhone("en-IN")
    .withMessage("Valid mobile number is required"),

  validateRequest,
];

export default { validateRegistration, validateLogin, validateAddress };
