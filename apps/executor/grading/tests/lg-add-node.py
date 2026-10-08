CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    names = [item.get("name") for item in trace]
    nodes = [item.get("arguments", {}).get("name") for item in trace if item.get("name") == "add_node"]
    if "draft" not in nodes or "set_entry_point" not in names or "compile" not in names:
        return {"passed": False, "feedback": [{"concept": "Node", "message": "Register a node named draft, set it as the entry point, and compile."}]}
    return {"passed": True, "feedback": [{"concept": "Node", "message": "The graph starts at draft and is compiled."}]}
