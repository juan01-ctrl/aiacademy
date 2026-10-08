export type RoadmapStep = {
  order: number;
  title: string;
  summary: string;
  courseIds: string[];
};

export const agenticRoadmap: RoadmapStep[] = [
  {
    order: 1,
    title: "Foundations",
    summary: "First model call, what an agent is, tool calling, then context and retrieval.",
    courseIds: ["openai-api-fundamentals", "agent-foundations", "rag-fundamentals"],
  },
  {
    order: 2,
    title: "OpenAI Agents SDK",
    summary: "Build agents with the OpenAI Agents SDK, including a sales agent and a research team.",
    courseIds: ["openai-agents-sdk"],
  },
  {
    order: 3,
    title: "CrewAI",
    summary: "Crews of roles and tasks. A stock picker, then a software engineering team.",
    courseIds: ["crewai-fundamentals"],
  },
  {
    order: 4,
    title: "LangGraph",
    summary: "Stateful graphs, routing, and a sidekick that can pause for a person.",
    courseIds: ["langgraph-fundamentals"],
  },
  {
    order: 5,
    title: "More agent frameworks",
    summary: "Google ADK, AWS Strands, and the other frameworks in the same tour.",
    courseIds: ["google-adk-fundamentals"],
  },
  {
    order: 6,
    title: "MCP",
    summary: "Model Context Protocol. Agents calling tools that live on MCP servers.",
    courseIds: ["mcp-fundamentals"],
  },
];

export function roadmapCourseOrder(): string[] {
  return agenticRoadmap.flatMap((step) => step.courseIds);
}
