export default function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="section-header">
      <div>
        <p className="eyebrow">Panel</p>
        <h2>{title}</h2>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
