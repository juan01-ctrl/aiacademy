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


class FastMCP:
    def __init__(self, name):
        _record("FastMCP", {"name": name})
        self.name = name

    def tool(self):
        def decorate(fn):
            _record("mcp.tool", {"name": getattr(fn, "__name__", "")})
            return fn
        return decorate

    def resource(self, uri):
        def decorate(fn):
            _record("mcp.resource", {"name": getattr(fn, "__name__", ""), "uri": uri})
            return fn
        return decorate
