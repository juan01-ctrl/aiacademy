export function canIssueCertificate(input: {
  courseComplete: boolean;
  assessmentPassed: boolean;
  projectPassed: boolean;
}): boolean {
  return input.courseComplete && input.assessmentPassed && input.projectPassed;
}

export const PASSING_SCORE = 0.75;
