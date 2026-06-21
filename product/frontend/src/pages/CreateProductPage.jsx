import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthGuard from "../components/AuthGuard";
import Dropzone from "../components/Dropzone";
import {
  createProduct,
  mapApiError,
  parseFieldErrors,
  getProductId,
} from "../services/api";
import { useToast } from "../hooks/useToast";

const STEPS = ["Details", "Pricing", "Images"];

export default function CreateProductPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  const validateStep = () => {
    const next = {};

    if (step === 0 && !title.trim()) {
      next.title = "Title is required";
    }

    if (step === 1) {
      if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
        next.amount = "Enter a valid price";
      }
    }

    if (step === 2 && images.length === 0) {
      next.images = "Add at least one image";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const product = await createProduct({
        title: title.trim(),
        description: description.trim(),
        price: { amount: Number(amount), currency },
        images,
      });

      showToast("Product listed successfully!", "success");
      navigate(`/products/${getProductId(product)}`);
    } catch (err) {
      const fieldErrors = parseFieldErrors(err);
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
      }
      showToast(mapApiError(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="create-product">
        <header className="page__header">
          <h1 className="page__title">List a product</h1>
          <p className="page__subtitle">
            Three steps to get your item in front of buyers
          </p>
        </header>

        <div
          className="create-product__steps"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-label="Form progress"
        >
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`create-product__step ${
                i < step
                  ? "create-product__step--done"
                  : i === step
                    ? "create-product__step--active"
                    : ""
              }`}
            />
          ))}
        </div>

        <div className="create-product__step-labels" aria-hidden="true">
          {STEPS.map((label, i) => (
            <span key={label} className={i === step ? "label-caps text-brand" : ""}>
              {label}
            </span>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step < STEPS.length - 1) handleNext();
            else handleSubmit();
          }}
          noValidate
        >
          {step === 0 && (
            <fieldset>
              <legend className="sr-only">Product details</legend>
              <div className="form__group">
                <label htmlFor="title" className="form__label">
                  Title
                </label>
                <input
                  id="title"
                  className={`form__input ${errors.title ? "form__input--error" : ""}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? "title-error" : undefined}
                />
                {errors.title && (
                  <p id="title-error" className="form__error">
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="form__group">
                <label htmlFor="description" className="form__label">
                  Description
                </label>
                <textarea
                  id="description"
                  className="form__textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
                <p className="form__hint">Optional — helps buyers decide</p>
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset>
              <legend className="sr-only">Pricing</legend>
              <div className="form__group">
                <span className="form__label">Currency</span>
                <div
                  className="form__currency-toggle"
                  role="group"
                  aria-label="Currency"
                >
                  {["INR", "USD"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={currency === c ? "form__currency-toggle--active" : ""}
                      onClick={() => setCurrency(c)}
                      aria-pressed={currency === c}
                    >
                      {c === "INR" ? "₹ INR" : "$ USD"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form__group">
                <label htmlFor="amount" className="form__label">
                  Price
                </label>
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className={`form__input ${errors.amount || errors["price.amount"] ? "form__input--error" : ""}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  aria-invalid={!!(errors.amount || errors["price.amount"])}
                />
                {(errors.amount || errors["price.amount"]) && (
                  <p className="form__error">
                    {errors.amount || errors["price.amount"]}
                  </p>
                )}
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset>
              <legend className="sr-only">Product images</legend>
              <Dropzone
                files={images}
                onChange={setImages}
                error={errors.images}
              />
            </fieldset>
          )}

          <div className="create-product__actions">
            {step > 0 ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleBack}
              >
                Back
              </button>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting}
            >
              {submitting
                ? "Publishing…"
                : step < STEPS.length - 1
                  ? "Continue"
                  : "Publish product"}
            </button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
