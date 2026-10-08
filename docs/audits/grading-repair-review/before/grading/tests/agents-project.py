CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    names = [item.get("name") for item in trace]
    if "Agent" not in names or "Runner.run_sync" not in names or result.get("value") != "agent-output":
        return {"passed": False, "feedback": [{"concept": "Agents SDK", "message": "Create the Assistant, call Runner.run_sync, and return final_output."}]}
    return {"passed": True, "feedback": [{"concept": "Agents SDK", "message": "The agent ran and you returned the final output."}]}
