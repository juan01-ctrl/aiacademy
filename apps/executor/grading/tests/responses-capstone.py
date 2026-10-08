CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    results = result.get("results") or []
    calls = [item for item in trace if item.get("name") == "responses.create"]
    inputs = [item.get("arguments", {}).get("input") for item in calls]
    if len(results) != 4 or any(item.get("ok") is not True for item in results) or results[0].get("value") != "mocked-output":
        return {"passed": False, "feedback": [{"concept": "output_text", "message": "A real prompt must return response.output_text."}]}
    if inputs != ["ping", "__academy_fail__", "__academy_contrast__"] or [item.get("arguments", {}).get("outcome") for item in calls] != ["success", "error", "success"]:
        return {"passed": False, "feedback": [{"concept": "Responses API", "message": "Call the simulated API for the real prompt and the failure case; skip blank prompts."}]}
    if results[3].get("value") != "mocked-contrast-output":
        return {"passed": False, "feedback": [{"concept": "output_text", "message": "Return the actual simulated response text for each prompt, not a fixed output."}]}
    if "   " in inputs:
        return {"passed": False, "feedback": [{"concept": "Blank prompt", "message": "Do not call the API when the prompt is blank."}]}
    if results[1].get("value") != "":
        return {"passed": False, "feedback": [{"concept": "Blank prompt", "message": "Return an empty string for a blank prompt."}]}
    if not results[2].get("ok") or results[2].get("value") != "":
        return {"passed": False, "feedback": [{"concept": "Exception", "message": "Catch a failed call and return an empty string."}]}
    return {"passed": True, "feedback": [{"concept": "Capstone", "message": "The simulation observed a successful API call and a failed call; the function returned text and skipped the blank prompt."}]}
