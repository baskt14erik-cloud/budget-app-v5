export default function MonthPicker({ month, onChange }) {
  return (
    <label className="month-picker glass-card">
      <span>Mes de análisis</span>
      <input type="month" value={month} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
