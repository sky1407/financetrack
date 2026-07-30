import clsx from "clsx";

export function ProgressBar({ percentage, color }: { percentage: number; color?: string }) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const isOver = percentage >= 100;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={clsx("h-full rounded-full transition-all", isOver && "bg-red-500")}
        style={{ width: `${clamped}%`, backgroundColor: isOver ? undefined : (color ?? "#3b82f6") }}
      />
    </div>
  );
}
