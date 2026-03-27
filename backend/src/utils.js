export function getMonthRange(monthString) {
  const [year, month] = monthString.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
