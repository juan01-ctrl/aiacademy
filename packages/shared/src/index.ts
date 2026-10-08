import { createHash } from "node:crypto";

export function credentialId(learnerId: string, courseId: string): string {
  const hash = createHash("sha256").update(`${learnerId}:${courseId}`).digest("hex").slice(0, 6).toUpperCase();
  return `AI-${hash}`;
}

export const CERTIFICATE_TITLE = "Certified Applied AI Engineer";
export const CERTIFICATE_SKILLS = [
  "Responses API",
  "output_text",
  "instructions vs input",
  "blank-prompt guard",
  "API error handling",
];

// These describe simulated practice, not real SDK execution or production certification.
const coursePracticeTopics: Record<string, string[]> = {
  "openai-api-fundamentals": ["API request configuration", "Output extraction and blank/error guards"],
  "agent-foundations": ["Chaining and routing concepts", "Agent loop concepts"],
  "rag-fundamentals": ["Retrieval and source selection", "Abstention concepts"],
  "openai-agents-sdk": ["Agent and Runner declarations", "Tool and handoff declarations"],
  "crewai-fundamentals": ["Role and task declarations", "Process and context configuration"],
  "langgraph-fundamentals": ["Node, edge, and routing configuration", "Checkpointer configuration"],
  "google-adk-fundamentals": ["Agent, tool, and sequence configuration"],
  "mcp-fundamentals": ["Server, tool, and resource declarations"],
};

export function certificateMetadata(courseId: string, courseTitle: string): { title: string; skills: string[] } {
  const topics = Object.hasOwn(coursePracticeTopics, courseId) ? coursePracticeTopics[courseId] : [];
  return {
    title: `${courseTitle} — Course Completion`,
    skills: topics.map((topic) => `Simulated practice: ${topic}`),
  };
}
