CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    routes = [item.get("arguments", {}).get("routes", "") for item in trace if item.get("name") == "add_conditional_edges"]
    if not routes or "approve" not in routes[-1] or "revise" not in routes[-1]:
        return {"passed": False, "feedback": [{"concept": "Routing", "message": "Add conditional edges with approve and revise."}]}
    return {"passed": True, "feedback": [{"concept": "Routing", "message": "The review node can approve or revise."}]}
