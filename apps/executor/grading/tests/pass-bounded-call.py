CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    calls = [item for item in trace if item.get("name") == "responses.create"]
    arguments = calls[-1].get("arguments", {}) if calls else {}
    if arguments.get("temperature") != 0 or arguments.get("max_output_tokens") != 32:
        return {"passed": False, "feedback": [{"concept": "Request knobs", "message": "Pass temperature and max_output_tokens. They are separate arguments."}]}
    if result.get("value") != "mocked-output":
        return {"passed": False, "feedback": [{"concept": "output_text", "message": "Return response.output_text."}]}
    return {"passed": True, "feedback": [{"concept": "Request knobs", "message": "Both knobs reached the request, and you returned the text."}]}
