import json
import os


class _Response:
    def __init__(self, text: str):
        self.output_text = text
        self.output = [{"type": "message", "content": text}]


class Responses:
    def create(self, **kwargs):
        _record("responses.create", dict(kwargs, outcome="error" if kwargs.get("input") == "__academy_fail__" else "success"))
        if kwargs.get("input") == "__academy_fail__":
            raise RuntimeError("upstream failed")
        return _Response("mocked-contrast-output" if kwargs.get("input") == "__academy_contrast__" else "mocked-output")


class OpenAI:
    def __init__(self, api_key=None):
        self.responses = Responses()


def _record(name: str, arguments: dict) -> None:
    trace_path = os.environ.get("ACADEMY_TRACE")
    if not trace_path:
        return
    existing = []
    if os.path.exists(trace_path):
        with open(trace_path, "r", encoding="utf-8") as handle:
            existing = json.load(handle)
    safe_args = {key: value for key, value in arguments.items() if isinstance(value, (str, int, float, bool))}
    tools = arguments.get("tools")
    if isinstance(tools, list) and tools and isinstance(tools[0], dict):
        safe_args["tool_name"] = tools[0].get("name", "")
    text_format = arguments.get("text")
    if isinstance(text_format, dict):
        safe_args["text_format"] = json.dumps(text_format, sort_keys=True)
        fmt = text_format.get("format", text_format)
        if isinstance(fmt, dict) and isinstance(fmt.get("name"), str):
            safe_args["schema_name"] = fmt["name"]
    existing.append({"name": name, "arguments": safe_args})
    with open(trace_path, "w", encoding="utf-8") as handle:
        json.dump(existing, handle)
