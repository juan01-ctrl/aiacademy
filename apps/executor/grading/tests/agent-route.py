CANARY_HIDDEN_ASSERTION = "CANARY_HIDDEN_ASSERTION_do_not_ship"

def grade(trace, result):
    if result.get("value") != "billing":
        return {"passed": False, "feedback": [{"concept": "Routing", "message": "A billing question goes to billing. Other kinds go to tech."}]}
    return {"passed": True, "feedback": [{"concept": "Routing", "message": "The request went to the billing specialist."}]}
