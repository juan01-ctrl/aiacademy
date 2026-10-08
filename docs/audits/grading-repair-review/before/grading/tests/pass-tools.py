CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    calls = [item for item in trace if item.get("name") == "responses.create"]
    if not calls or calls[-1].get("arguments", {}).get("tool_name") != "get_weather":
        return {"passed": False, "feedback": [{"concept": "Tools", "message": "Pass a tools list whose function name is get_weather."}]}
    if result.get("value") != "mocked-output":
        return {"passed": False, "feedback": [{"concept": "output_text", "message": "Return response.output_text."}]}
    return {"passed": True, "feedback": [{"concept": "Tools", "message": "The tool was offered on the request, and you returned the text."}]}
