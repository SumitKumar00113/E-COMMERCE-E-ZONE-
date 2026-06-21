import { Link } from "react-router-dom";

export default function EmptyState({
  title,
  message,
  actionLabel,
  actionTo,
  icon = "○",
}) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state__icon" aria-hidden="true">
        {icon}
      </div>
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__message">{message}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn--primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
