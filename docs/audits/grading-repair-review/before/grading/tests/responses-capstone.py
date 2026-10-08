CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    results = result.get("results") or []
    calls = [item for item in trace if item.get("name") == "responses.create"]
    inputs = [item.get("arguments", {}).get("input") for item in calls]
    if len(results) < 3 or results[0].get("value") != "mocked-output":
        return {"passed": False, "feedback": [{"concept": "output_text", "message": "A real prompt must return response.output_text."}]}
    if "   " in inputs:
        return {"passed": False, "feedback": [{"concept": "Blank prompt", "message": "Do not call the API when the prompt is blank."}]}
    if results[1].get("value") != "":
        return {"passed": False, "feedback": [{"concept": "Blank prompt", "message": "Return an empty string for a blank prompt."}]}
    if not results[2].get("ok") or results[2].get("value") != "":
        return {"passed": False, "feedback": [{"concept": "Exception", "message": "Catch a failed call and return an empty string."}]}
    return {"passed": True, "feedback": [{"concept": "Capstone", "message": "The function returns text, skips blank prompts, and survives a failed call."}]}
