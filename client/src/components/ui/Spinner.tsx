export function Spinner({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-brand-600 border-t-transparent ${className}`}
      role="status"
      aria-label="Načítava sa"
    />
  );
}
