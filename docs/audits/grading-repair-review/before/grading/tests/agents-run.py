CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    if not any(item.get("name") == "Runner.run_sync" for item in trace):
        return {"passed": False, "feedback": [{"concept": "Runner", "message": "Call Runner.run_sync. Constructing the agent does not run it."}]}
    if result.get("value") != "agent-output":
        return {"passed": False, "feedback": [{"concept": "final_output", "message": "Return result.final_output."}]}
    return {"passed": True, "feedback": [{"concept": "Runner", "message": "You ran the agent and returned the final output."}]}
