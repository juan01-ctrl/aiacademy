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


class StateGraph:
    def __init__(self, state):
        _record("StateGraph", {"state": getattr(state, "__name__", "state")})
        self.nodes = {}

    def add_node(self, name, fn):
        _record("add_node", {"name": name})
        self.nodes[name] = fn
        return self

    def add_edge(self, source, target):
        _record("add_edge", {"source": source, "target": target})
        return self

    def add_conditional_edges(self, source, router, path_map):
        _record("add_conditional_edges", {"source": source, "routes": ",".join(path_map.keys())})
        return self

    def set_entry_point(self, name):
        _record("set_entry_point", {"name": name})
        return self

    def compile(self, checkpointer=None):
        _record("compile", {"nodes": len(self.nodes), "checkpointer": bool(checkpointer)})
        return self
