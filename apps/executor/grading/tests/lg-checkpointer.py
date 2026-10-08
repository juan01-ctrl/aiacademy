import json
CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    compiled = [item for item in trace if item.get("name") == "compile"]
    args = compiled[-1].get("arguments", {}) if compiled else {}
    graph = json.loads(args.get("graph", "{}"))
    if (args.get("checkpointer_value") != "true" or graph.get("entry") != "draft"
            or graph.get("nodes", {}).get("draft") is not True or result.get("valueType") != "StateGraph"):
        return {"passed": False, "feedback": [{"concept": "Checkpointer", "message": "Register callable draft, enter at draft, compile with the supplied saver, and return the graph."}]}
    return {"passed": True, "feedback": [{"concept": "Checkpointer", "message": "The simulation recorded draft as entry and the supplied saver at compile; persistence was not tested."}]}
