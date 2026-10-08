CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    edges = [item for item in trace if item.get("name") == "add_edge"]
    nodes = [item.get("arguments", {}).get("name") for item in trace if item.get("name") == "add_node"]
    if "draft" not in nodes or not edges or edges[-1].get("arguments", {}).get("target") != "review":
        return {"passed": False, "feedback": [{"concept": "Graph", "message": "Start at draft and add an edge to review."}]}
    return {"passed": True, "feedback": [{"concept": "Graph", "message": "Draft leads to review, and the graph compiles."}]}
