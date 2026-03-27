export default function EmptyState({ title, description }) {
  return (
    <div className="empty-state glass-card">
      <h3>{title}</h3>
      <p className="muted">{description}</p>
    </div>
  );
}
