CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    if not result.get("ok"):
        return {"passed": False, "feedback": [{"concept": "Function shape", "message": result.get("error", "ask_with_example must return a string.")}]}
    calls = [item for item in trace if item.get("name") == "responses.create"]
    arguments = calls[-1].get("arguments", {}) if calls else {}
    instructions = arguments.get("instructions", "")
    if "Paris" not in instructions:
        return {"passed": False, "feedback": [{"concept": "Few-shot", "message": "Put the example in instructions. A comment is not a request."}]}
    if arguments.get("input") != "capital of Spain?":
        return {"passed": False, "feedback": [{"concept": "input", "message": "The new question belongs in input, not inside the example."}]}
    if result.get("value") != "mocked-output":
        return {"passed": False, "feedback": [{"concept": "output_text", "message": "Return response.output_text."}]}
    return {"passed": True, "feedback": [{"concept": "Few-shot", "message": "The example stayed in instructions, and the question stayed in input."}]}
