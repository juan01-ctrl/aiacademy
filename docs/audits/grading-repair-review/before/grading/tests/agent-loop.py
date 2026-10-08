CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    if not any(item.get("name") == "run_tool" for item in trace):
        return {"passed": False, "feedback": [{"concept": "Agent loop", "message": "When the model asks for a tool, call run_tool. Do not stop after the first llm call."}]}
    if result.get("value") != "booked":
        return {"passed": False, "feedback": [{"concept": "Agent loop", "message": "Keep calling llm until tool is done, then return the text."}]}
    return {"passed": True, "feedback": [{"concept": "Agent loop", "message": "The loop called the tool and stopped when the model was done."}]}
