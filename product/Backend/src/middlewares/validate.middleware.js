import { body, validationResult } from "express-validator";

const validationHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "validation error",
      errors: errors.array(),
    });
  }
  next();
};

const validateProduct = [
  body("title").notEmpty().withMessage("title is required"),
  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string"),
  body("price_amount").isNumeric().withMessage("price_amount must be a number"),
  body("price_currency").notEmpty().withMessage("price_currency is required"),
  validationHandler,
];

export default { validateProduct };
