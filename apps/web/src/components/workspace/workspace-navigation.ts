type NavigationState = { done: boolean; nextHref: string | null };
type SubmissionResponse = { result: { status: string }; certificateHref?: string | null };

export function submissionNavigation(state: NavigationState, mode: "run" | "submit", body: SubmissionResponse): NavigationState {
  if (mode !== "submit" || body.result.status !== "passed") return state;
  return { done: true, nextHref: body.certificateHref ?? state.nextHref };
}
