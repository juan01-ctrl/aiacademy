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


class Agent:
    def __init__(self, name, model, instruction, tools=None):
        _record("Agent", {
            "name": name,
            "model": model,
            "instruction": instruction,
            "tools": len(tools or []),
        })
        self.name = name


class SequentialAgent:
    def __init__(self, name, sub_agents):
        _record("SequentialAgent", {"name": name, "agents": len(sub_agents or [])})
        self.name = name
        self.sub_agents = sub_agents
