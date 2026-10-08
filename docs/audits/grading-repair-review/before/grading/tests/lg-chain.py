CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    nodes = [item.get("arguments", {}).get("name") for item in trace if item.get("name") == "add_node"]
    edges = [item for item in trace if item.get("name") == "add_edge"]
    if "draft" not in nodes or "review" not in nodes:
        return {"passed": False, "feedback": [{"concept": "Chain", "message": "Register both draft and review."}]}
    linked = any(item.get("arguments", {}).get("source") == "draft" and item.get("arguments", {}).get("target") == "review" for item in edges)
    if not linked:
        return {"passed": False, "feedback": [{"concept": "Chain", "message": "Connect draft to review with add_edge."}]}
    if not any(item.get("name") == "compile" for item in trace):
        return {"passed": False, "feedback": [{"concept": "compile", "message": "Compile after the nodes and the edge are set."}]}
    return {"passed": True, "feedback": [{"concept": "Chain", "message": "Review can read what draft wrote."}]}
