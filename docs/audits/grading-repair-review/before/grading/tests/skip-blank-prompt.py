CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    results = result.get("results") or []
    if len(results) < 2 or not results[0].get("ok"):
        return {
            "passed": False,
            "feedback": [{
                "concept": "Function shape",
                "message": result.get("error", "ask_llm must return a string for a normal prompt and for a blank one."),
            }],
        }
    calls = [item for item in trace if item.get("name") == "responses.create"]
    if results[0].get("value") != "mocked-output":
        return {
            "passed": False,
            "feedback": [{
                "concept": "output_text",
                "message": "A real prompt should still return response.output_text.",
            }],
        }
    if len(calls) != 1 or calls[0].get("arguments", {}).get("input") != "ping":
        return {
            "passed": False,
            "feedback": [{
                "concept": "Blank prompt",
                "message": "Call the API once for a real prompt. Do not call it when the prompt is blank.",
            }],
        }
    if results[1].get("value") != "":
        return {
            "passed": False,
            "feedback": [{
                "concept": "Blank prompt",
                "message": "Return an empty string when the prompt has no text.",
            }],
        }
    return {
        "passed": True,
        "feedback": [{
            "concept": "Blank prompt",
            "message": "You skipped the call for a blank prompt and still returned the text for a real one.",
        }],
    }
