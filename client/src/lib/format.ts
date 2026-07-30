const currencyFormatter = new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" });
const dateFormatter = new Intl.DateTimeFormat("sk-SK", { day: "numeric", month: "short", year: "numeric" });

export function formatCurrency(value: string | number): string {
  return currencyFormatter.format(Number(value));
}

export function formatDate(value: string | Date): string {
  return dateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function toDateInputValue(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}
