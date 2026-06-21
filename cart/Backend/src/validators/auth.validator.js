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

const validSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const validColors = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
  "Purple",
  "Pink",
  "Brown",
  "Gray",
  "Navy",
  "Beige",
];

const itemCartValidation = () => [
  body("productId")
    .exists({ checkFalsy: true })
    .withMessage("productId is required")
    .isString()
    .withMessage("productId must be a string")
    .isLength({ min: 24, max: 24 })
    .withMessage("productId must be a valid 24-character ObjectId"),
  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("quantity must be an integer greater than 0"),
  body("size")
    .optional()
    .isIn(validSizes)
    .withMessage(`size must be one of ${validSizes.join(", ")}`),
  body("color")
    .optional()
    .isIn(validColors)
    .withMessage(`color must be one of ${validColors.join(", ")}`),
  validateRequest,
];

const updateCartItemValidation = () => [
  body("quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("quantity must be an integer greater than or equal to 0"),
  body("size")
    .optional()
    .isIn(validSizes)
    .withMessage(`size must be one of ${validSizes.join(", ")}`),
  body("color")
    .optional()
    .isIn(validColors)
    .withMessage(`color must be one of ${validColors.join(", ")}`),
  validateRequest,
];

export default { itemCartValidation, updateCartItemValidation };
