export function explainFailure(feedback: Array<{ concept: string; message: string }>): string {
  if (feedback.length === 0) return "The tests did not pass. Reread the instruction and try again.";
  return feedback.map((item) => `${item.concept}: ${item.message}`).join(" ");
}
