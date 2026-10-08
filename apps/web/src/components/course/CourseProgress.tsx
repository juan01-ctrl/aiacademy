export function CourseProgress({ percent }: { percent?: number }) {
  if (percent === undefined) return null;

  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="mt-3" aria-label="Course completion">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted">Your progress</span>
        <span className="font-semibold text-navy">{value}% complete</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label="Course completion"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
