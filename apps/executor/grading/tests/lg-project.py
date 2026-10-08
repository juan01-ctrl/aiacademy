import json
CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    compiled = [item for item in trace if item.get("name") == "compile"]
    graph = json.loads(compiled[-1].get("arguments", {}).get("graph", "{}")) if compiled else {}
    nodes = graph.get("nodes", {})
    if (result.get("valueType") != "StateGraph" or graph.get("entry") != "draft"
            or nodes.get("draft") is not True or nodes.get("review") is not True
            or ["draft", "review"] not in graph.get("edges", [])
            or any(source not in nodes or target not in nodes for source, target in graph.get("edges", []))):
        return {"passed": False, "feedback": [{"concept": "Graph", "message": "Register callable draft and review nodes, enter at draft, connect draft to review, then compile and return that graph."}]}
    return {"passed": True, "feedback": [{"concept": "Graph", "message": "The simulation recorded a compiled graph with draft as entry and registered draft-to-review nodes."}]}
