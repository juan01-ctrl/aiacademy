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
    def __init__(self, role, goal, backstory=""):
        _record("Agent", {"role": role})
        self.role = role


class Task:
    def __init__(self, description, agent, expected_output="", context=None):
        _record("Task", {
            "description": description,
            "role": getattr(agent, "role", ""),
            "expected_output": expected_output,
            "context": len(context or []),
        })
        self.description = description
        self.agent = agent


class Crew:
    def __init__(self, agents, tasks, process="sequential"):
        _record("Crew", {"agents": len(agents), "tasks": len(tasks), "process": process})
        self.agents = agents
        self.tasks = tasks

    def kickoff(self):
        _record("kickoff", {"tasks": len(self.tasks)})
        return "crew-result"
