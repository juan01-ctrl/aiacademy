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


class Index:
    def add(self, chunks):
        _record("add", {"count": len(chunks)})
        return self

    def search(self, query, k=2):
        _record("search", {"query": query, "k": k})
        if query == "missing":
            return []
        return [{"text": "Paris is the capital.", "source": "notes.md"}]
