import importlib.util
import json
import sys

exercise_id, trace_path, result_path, test_path = sys.argv[1:5]
with open(trace_path, "r", encoding="utf-8") as handle:
    trace = json.load(handle)
with open(result_path, "r", encoding="utf-8") as handle:
    result = json.load(handle)
spec = importlib.util.spec_from_file_location(f"hidden_{exercise_id.replace('-', '_')}", test_path)
if spec is None or spec.loader is None:
    raise RuntimeError("Hidden test could not be loaded")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
# Same fail-closed boundary for direct/offline grader use.
calls = result.get("results") if isinstance(result, dict) else None
success = isinstance(result, dict) and result.get("ok") is True
if isinstance(result, dict) and "results" in result:
    success = success and isinstance(calls, list) and bool(calls) and all(
        isinstance(call, dict) and call.get("ok") is True for call in calls
    )
if not success:
    graded = {"passed": False, "feedback": [{"concept": "Function execution", "message": "The submitted function did not complete successfully."}]}
else:
    graded = module.grade(trace, result)
print(json.dumps(graded))
