CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    agents = [item for item in trace if item.get("name") == "Agent"]
    if not agents:
        return {"passed": False, "feedback": [{"concept": "Agent", "message": "Create an Agent before returning."}]}
    arguments = agents[-1].get("arguments", {})
    if arguments.get("name") != "Assistant":
        return {"passed": False, "feedback": [{"concept": "name", "message": "Name the agent Assistant."}]}
    if arguments.get("instructions") != "You are a helpful assistant":
        return {"passed": False, "feedback": [{"concept": "instructions", "message": "Pass the instructions string to Agent."}]}
    return {"passed": True, "feedback": [{"concept": "Agent", "message": "The agent has a name and instructions."}]}
