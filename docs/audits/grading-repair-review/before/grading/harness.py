import importlib.util
import json
import os
import sys
import traceback

mode = os.environ["ACADEMY_MODE"]
workdir = os.environ["ACADEMY_WORKDIR"]
source_path = os.path.join(workdir, "solution.py")

sys.path.insert(0, os.environ["ACADEMY_MOCKS"])

spec = importlib.util.spec_from_file_location("learner_solution", source_path)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load learner source")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

if mode == "submit":
    entry = os.environ["ACADEMY_ENTRY"]
    calls = json.loads(os.environ.get("ACADEMY_CALLS") or "null")
    if not calls:
        calls = [{"args": json.loads(os.environ.get("ACADEMY_ARGS") or "[]")}]
    fn = getattr(module, entry, None)
    result_path = os.environ["ACADEMY_RESULT"]
    results = []
    if not callable(fn):
        results.append({"ok": False, "error": f"Define {entry} before submitting."})
    else:
        for call in calls:
            try:
                value = fn(*call.get("args", []))
                results.append({"ok": True, "value": value if isinstance(value, str) else None, "valueType": type(value).__name__})
            except Exception as exc:
                results.append({"ok": False, "error": f"{type(exc).__name__}: {exc}", "trace": traceback.format_exc()[-800:]})
    first = results[0] if results else {"ok": False}
    payload = {
        "ok": all(item.get("ok") for item in results),
        "value": first.get("value"),
        "valueType": first.get("valueType"),
        "error": first.get("error"),
        "results": results,
    }
    with open(result_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle)
