import { Link } from "react-router-dom";

export default function ErrorState({ title, message, actionLabel, actionTo }) {
  return (
    <div className="error-state" role="alert">
      <div className="error-state__icon" aria-hidden="true">
        !
      </div>
      <h2 className="error-state__title">{title}</h2>
      <p className="error-state__message">{message}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn--ghost">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
