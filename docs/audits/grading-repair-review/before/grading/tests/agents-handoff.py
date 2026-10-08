CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    agents = [item for item in trace if item.get("name") == "Agent"]
    manager = [item for item in agents if item.get("arguments", {}).get("name") == "Sales manager"]
    if not manager or manager[-1].get("arguments", {}).get("handoffs") != 1:
        return {"passed": False, "feedback": [{"concept": "Handoffs", "message": "Create a Sales manager agent and pass the specialist in handoffs."}]}
    if not any(item.get("name") == "function_tool" for item in trace):
        return {"passed": False, "feedback": [{"concept": "Tools", "message": "Decorate the Python function with function_tool before you pass it to the agent."}]}
    return {"passed": True, "feedback": [{"concept": "Handoffs", "message": "The manager can delegate, and the tool was registered."}]}
