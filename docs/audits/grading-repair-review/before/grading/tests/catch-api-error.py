CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    results = result.get("results") or []
    calls = [item for item in trace if item.get("name") == "responses.create"]
    if len(results) < 2 or results[0].get("value") != "mocked-output":
        return {
            "passed": False,
            "feedback": [{
                "concept": "output_text",
                "message": "A successful call should still return response.output_text.",
            }],
        }
    if len(calls) < 2:
        return {
            "passed": False,
            "feedback": [{
                "concept": "API call",
                "message": "Still call responses.create. Catch the failure after the call, do not skip the call.",
            }],
        }
    if not results[1].get("ok") or results[1].get("value") != "":
        return {
            "passed": False,
            "feedback": [{
                "concept": "Exception",
                "message": "Catch the error from responses.create and return an empty string.",
            }],
        }
    return {
        "passed": True,
        "feedback": [{
            "concept": "Exception",
            "message": "You returned the text on success and an empty string when the call failed.",
        }],
    }
