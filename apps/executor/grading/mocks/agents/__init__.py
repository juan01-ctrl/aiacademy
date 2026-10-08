import json
import os


def _record(name, arguments):
    trace_path = os.environ.get("ACADEMY_TRACE")
    if not trace_path:
        return
    existing = []
    if os.path.exists(trace_path):
        with open(trace_path, encoding="utf-8") as handle:
            existing = json.load(handle)
    safe = {key: value for key, value in arguments.items() if isinstance(value, (str, int, float, bool))}
    existing.append({"name": name, "arguments": safe})
    with open(trace_path, "w", encoding="utf-8") as handle:
        json.dump(existing, handle)


class _Result:
    def __init__(self, text):
        self.final_output = text


def function_tool(fn):
    _record("function_tool", {"name": getattr(fn, "__name__", "")})
    return fn


class Agent:
    def __init__(self, name, instructions, tools=None, handoffs=None):
        _record("Agent", {
            "name": name,
            "instructions": instructions,
            "tools": len(tools or []),
            "handoffs": len(handoffs or []),
            "handoff_names": json.dumps([getattr(agent, "name", None) for agent in (handoffs or [])]),
            "valid_handoffs": all(isinstance(agent, Agent) for agent in (handoffs or [])),
        })
        self.name = name
        self.instructions = instructions


class Runner:
    @staticmethod
    def run_sync(agent, prompt):
        _record("Runner.run_sync", {"name": getattr(agent, "name", ""), "prompt": prompt})
        return _Result("agent-output")
