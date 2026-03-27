export default function StatCard({ title, value, helper }) {
  return (
    <div className="stat-card glass-card">
      <p className="stat-label">{title}</p>
      <h3>{value}</h3>
      <p className="stat-helper">{helper}</p>
    </div>
  );
}
