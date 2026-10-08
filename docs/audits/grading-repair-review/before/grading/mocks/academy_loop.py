import json
import os

_calls = {"n": 0}


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


def llm(messages):
    _record("llm", {"n": len(messages)})
    _calls["n"] += 1
    if _calls["n"] >= 2:
        return {"tool": "done", "text": "booked"}
    return {"tool": "search", "text": ""}


def run_tool(name):
    _record("run_tool", {"name": name})
    return "found"


def draft(text):
    _record("draft", {"text": text})
    return f"{text} draft"


def judge(text):
    _record("judge", {"text": text})
    return "accepted" if str(text).endswith(" draft") else "rejected"
