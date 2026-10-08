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
print(json.dumps(module.grade(trace, result)))
