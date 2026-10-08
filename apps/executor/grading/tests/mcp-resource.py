CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    resources = [item for item in trace if item.get("name") == "mcp.resource"]
    if not resources or resources[-1].get("arguments", {}).get("uri") != "notes://handbook":
        return {"passed": False, "feedback": [{"concept": "Resource", "message": "Register a resource at notes://handbook."}]}
    if resources[-1].get("arguments", {}).get("name") != "read_notes":
        return {"passed": False, "feedback": [{"concept": "Resource", "message": "Name the function read_notes."}]}
    return {"passed": True, "feedback": [{"concept": "Resource", "message": "The server exposes a document, not only a tool."}]}
