export function shouldRecordAttempt(mode: "run" | "submit"): boolean {
  return mode === "submit";
}
