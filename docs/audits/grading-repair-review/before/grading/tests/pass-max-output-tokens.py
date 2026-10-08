CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    calls = [item for item in trace if item.get("name") == "responses.create"]
    if not calls or calls[-1].get("arguments", {}).get("max_output_tokens") != 32:
        return {"passed": False, "feedback": [{"concept": "max_output_tokens", "message": "Pass max_output_tokens through. Do not bury the limit in the prompt."}]}
    if result.get("value") != "mocked-output":
        return {"passed": False, "feedback": [{"concept": "output_text", "message": "Return response.output_text."}]}
    return {"passed": True, "feedback": [{"concept": "max_output_tokens", "message": "The length limit reached the request."}]}
