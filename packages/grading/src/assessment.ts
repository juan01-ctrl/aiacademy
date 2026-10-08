import { PASSING_SCORE } from "./index";

type Question = {
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
};

const openai: Question[] = [
  {
    id: "output-text",
    prompt: "Where does the generated string live on a Responses API result?",
    choices: ["response.output[0]", "response.output_text", "response.text"],
    answer: "response.output_text",
  },
  {
    id: "blank",
    prompt: "What should you do with a prompt that is empty or only spaces?",
    choices: ["Call the API anyway", "Return an empty string and do not call the API", "Raise immediately"],
    answer: "Return an empty string and do not call the API",
  },
  {
    id: "instructions",
    prompt: "Which argument holds the standing rule for the model?",
    choices: ["input", "instructions", "model"],
    answer: "instructions",
  },
  {
    id: "errors",
    prompt: "If responses.create raises, what should the function return?",
    choices: ["The exception object", "An empty string", "response.output"],
    answer: "An empty string",
  },
];

const banks: Record<string, Question[]> = {
  "openai-api-fundamentals": openai,
  "langgraph-fundamentals": [
    { id: "node", prompt: "What does a node do?", choices: ["Replace the whole program", "Update shared state", "Call OpenAI directly"], answer: "Update shared state" },
    { id: "entry", prompt: "What sets the first node?", choices: ["add_edge", "set_entry_point", "compile"], answer: "set_entry_point" },
    { id: "route", prompt: "When should you use a conditional edge?", choices: ["When the next node depends on state", "When you want a fixed hop", "When you compile"], answer: "When the next node depends on state" },
  ],
  "rag-fundamentals": [
    { id: "chunk", prompt: "Why split a document before indexing?", choices: ["To hide the source", "So retrieval can rank a passage", "To skip search"], answer: "So retrieval can rank a passage" },
    { id: "cite", prompt: "What should a citation return?", choices: ["The whole document", "The source of the retrieved hit", "The query"], answer: "The source of the retrieved hit" },
    { id: "order", prompt: "What comes first?", choices: ["Generation", "Retrieval", "A certificate"], answer: "Retrieval" },
  ],
  "agent-foundations": [
    { id: "agent", prompt: "What is an agent?", choices: ["A path you wrote in advance", "A model with tools in a loop", "A chat window"], answer: "A model with tools in a loop" },
    { id: "workflow", prompt: "What is a workflow?", choices: ["The model chooses every next step", "A path you wrote in advance", "A vector index"], answer: "A path you wrote in advance" },
    { id: "stop", prompt: "When does the loop stop?", choices: ["After the first model call", "When the model says the tool is done", "When you import a framework"], answer: "When the model says the tool is done" },
  ],
  "openai-agents-sdk": [
    { id: "agent", prompt: "What is an Agent in the Agents SDK?", choices: ["A chat window", "An LLM with instructions and tools", "A vector index"], answer: "An LLM with instructions and tools" },
    { id: "run", prompt: "What starts the agent?", choices: ["The Agent constructor", "Runner.run_sync", "responses.create"], answer: "Runner.run_sync" },
    { id: "output", prompt: "Where is the finished text?", choices: ["result.final_output", "response.output[0]", "agent.name"], answer: "result.final_output" },
  ],
  "google-adk-fundamentals": [
    { id: "agent", prompt: "What does an ADK Agent need?", choices: ["Only a chat window", "A name, a model, an instruction, and tools", "A vector index"], answer: "A name, a model, an instruction, and tools" },
    { id: "tool", prompt: "Where does google_search go?", choices: ["In the instruction string", "In the tools list", "In a separate process flag"], answer: "In the tools list" },
    { id: "run", prompt: "What does constructing the Agent do?", choices: ["It searches immediately", "It records the worker", "It deploys to Cloud Run"], answer: "It records the worker" },
  ],
  "mcp-fundamentals": [
    { id: "mcp", prompt: "What is MCP?", choices: ["A chat product", "A standard for connecting an app to external tools", "A vector database"], answer: "A standard for connecting an app to external tools" },
    { id: "server", prompt: "What exposes the tools?", choices: ["The model weights", "An MCP server", "The assessment"], answer: "An MCP server" },
    { id: "name", prompt: "What name does the model request?", choices: ["The server file path", "The registered function name", "The course id"], answer: "The registered function name" },
  ],
  "crewai-fundamentals": [
    { id: "role", prompt: "What is an agent in this course?", choices: ["A hidden test", "A role with a goal", "A vector index"], answer: "A role with a goal" },
    { id: "task", prompt: "What must a task have?", choices: ["An owning agent", "A JSON schema", "A blank prompt"], answer: "An owning agent" },
    { id: "run", prompt: "What runs the crew?", choices: ["The constructor", "kickoff", "add_edge"], answer: "kickoff" },
  ],
};

export function publicAssessment(courseId = "openai-api-fundamentals") {
  return (banks[courseId] ?? openai).map(({ id, prompt, choices }) => ({ id, prompt, choices }));
}

export function gradeAssessment(courseId: string, answers: Record<string, string>): { score: number; passed: boolean } {
  const questions = banks[courseId] ?? openai;
  const correct = questions.filter((question) => answers[question.id] === question.answer).length;
  const score = questions.length === 0 ? 0 : correct / questions.length;
  return { score, passed: score >= PASSING_SCORE };
}
