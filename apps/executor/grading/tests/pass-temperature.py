CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    calls = [item for item in trace if item.get("name") == "responses.create"]
    if not calls or calls[-1].get("arguments", {}).get("temperature") != 0:
        return {"passed": False, "feedback": [{"concept": "Temperature", "message": "Pass the temperature argument through. Do not bury it in the prompt."}]}
    if result.get("value") != "mocked-output":
        return {"passed": False, "feedback": [{"concept": "output_text", "message": "Return response.output_text."}]}
    return {"passed": True, "feedback": [{"concept": "Temperature", "message": "Temperature reached the request, and you returned the text."}]}
