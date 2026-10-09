import express from "express";
import { executionResultSchema, exerciseIdSchema } from "@academy/contracts";
import { executeExercise } from "./grade";
import { isAuthorizedServiceRequest } from "./service-auth";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "60kb", strict: true }));

app.post("/internal/execute", async (request, response) => {
  if (!isAuthorizedServiceRequest(request.header("authorization"), process.env.EXECUTOR_SERVICE_TOKEN)) {
    response.status(401).json({ error: "Unauthorized service request." });
    return;
  }

  const body = request.body as Record<string, unknown> | null;
  if (!body || typeof body !== "object"
    || !exerciseIdSchema.safeParse(body.exerciseId).success
    || typeof body.source !== "string" || Buffer.byteLength(body.source, "utf8") > 50_000
    || (body.mode !== "run" && body.mode !== "submit")
    || (body.deadlineAt !== undefined && (typeof body.deadlineAt !== "number" || !Number.isFinite(body.deadlineAt)))) {
    response.status(400).json({ error: "Invalid execution request." });
    return;
  }

  try {
    const result = executionResultSchema.parse(await executeExercise({
      exerciseId: body.exerciseId as string,
      source: body.source,
      mode: body.mode,
      deadlineAt: body.deadlineAt as number | undefined,
    }));
    response.status(200).json(result);
  } catch {
    response.status(503).json({ error: "Execution service is unavailable." });
  }
});

app.use((_request, response) => response.status(404).json({ error: "Not found." }));

export default app;
