CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    compiled = [item for item in trace if item.get("name") == "compile"]
    if not compiled or not compiled[-1].get("arguments", {}).get("checkpointer"):
        return {"passed": False, "feedback": [{"concept": "Checkpointer", "message": "Compile with the saver you were given. A pause cannot resume without it."}]}
    return {"passed": True, "feedback": [{"concept": "Checkpointer", "message": "The graph compiles with a checkpointer attached."}]}
