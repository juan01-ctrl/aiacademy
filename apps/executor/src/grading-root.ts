import { existsSync } from "node:fs";
import path from "node:path";

export function getGradingRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), "../executor/grading"),
    path.resolve(process.cwd(), "apps/executor/grading"),
    path.resolve(process.cwd(), "../../apps/executor/grading"),
  ];
  return candidates.find((candidate) => existsSync(path.join(candidate, "manifest.json"))) ?? candidates[0]!;
}
