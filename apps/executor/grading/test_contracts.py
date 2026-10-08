"""Offline benign harness/grader regressions; NOT isolation/security tests."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent
MANIFEST = json.loads((ROOT / 'manifest.json').read_text())


def assess(exercise, source):
    with tempfile.TemporaryDirectory() as directory:
        work = Path(directory)
        (work / 'solution.py').write_text(source)
        (work / 'trace.json').write_text('[]')
        item = MANIFEST[exercise]
        env = dict(os.environ, ACADEMY_MODE='submit', ACADEMY_WORKDIR=str(work),
                   ACADEMY_MOCKS=str(ROOT / 'mocks'), ACADEMY_TRACE=str(work / 'trace.json'),
                   ACADEMY_RESULT=str(work / 'result.json'), ACADEMY_ENTRY=item['entry'],
                   ACADEMY_CALLS=json.dumps(item.get('calls', [{'args': item.get('args', [])}])),
                   PYTHONDONTWRITEBYTECODE='1')
        subprocess.run([sys.executable, '-B', str(ROOT / 'harness.py')], env=env, check=True, capture_output=True)
        output = subprocess.run([sys.executable, '-B', str(ROOT / 'grader.py'), exercise,
                                 str(work / 'trace.json'), str(work / 'result.json'),
                                 str(ROOT / 'tests' / f'{exercise}.py')], env=env, check=True, capture_output=True, text=True)
        return json.loads(output.stdout)['passed']


GRAPH = '''from langgraph.graph import StateGraph
class State(dict): pass
def draft(state): return state
def review(state): return state
def build_graph():
    graph = StateGraph(State)
    graph.add_node("draft", draft)
    graph.add_node("review", review)
    graph.set_entry_point("draft")
    graph.add_edge("draft", "review")
    return graph.compile()
'''
ADK = '''from google.adk import Agent, SequentialAgent
def build_pipeline():
    researcher = Agent(name="researcher", model="gemini-flash-latest", instruction="Research.")
    writer = Agent(name="writer", model="gemini-flash-latest", instruction="Write.")
    return SequentialAgent(name="pipeline", sub_agents=[researcher, writer])
'''
SDK = '''from agents import Agent
def build_research_team():
    planner = Agent(name="Planner", instructions="Plan.")
    writer = Agent(name="Writer", instructions="Write.")
    return Agent(name="Manager", instructions="Delegate.", handoffs=[planner, writer])
'''
CAPSTONE = '''from openai import OpenAI
def ask_llm(prompt):
    if not prompt.strip(): return ""
    try:
        return OpenAI().responses.create(model="gpt-4.1-mini", input=prompt).output_text
    except Exception:
        return ""
'''
SCHEMA = '''from openai import OpenAI
def ask_for_json(prompt, text_format):
    return OpenAI().responses.create(model="gpt-4.1-mini", input=prompt, text=text_format).output_text
'''
CHECKPOINT = '''from langgraph.graph import StateGraph
class State(dict): pass
def draft(state): return state
def build_graph(saver):
    graph = StateGraph(State)
    graph.add_node("draft", draft)
    graph.set_entry_point("draft")
    return graph.compile(checkpointer=saver)
'''


class GradingContracts(unittest.TestCase):
    def test_capstone_rejects_fixed_output_without_api(self):
        self.assertFalse(assess('responses-capstone', 'def ask_llm(prompt): return "mocked-output" if prompt == "ping" else ""'))

    def test_capstone_requires_the_failed_call(self):
        self.assertFalse(assess('responses-capstone', CAPSTONE.replace('if not prompt.strip():', 'if prompt == "__academy_fail__" or not prompt.strip():')))

    def test_capstone_rejects_hardcoded_text_after_real_calls(self):
        self.assertFalse(assess('responses-capstone', CAPSTONE.replace('return OpenAI().responses.create(model="gpt-4.1-mini", input=prompt).output_text', 'OpenAI().responses.create(model="gpt-4.1-mini", input=prompt)\n        return "mocked-output"')))

    def test_capstone_accepts_taught_behavior(self):
        self.assertTrue(assess('responses-capstone', CAPSTONE))

    def test_graph_missing_entry_function_fails(self):
        self.assertFalse(assess('lg-project', GRAPH.replace('def build_graph():', 'def unrelated():') + '\nunrelated()'))

    def test_graph_rejects_invalid_construction(self):
        for source in [GRAPH.replace('graph.add_node("review", review)', 'pass'),
                       GRAPH.replace('graph.set_entry_point("draft")', 'pass'),
                       GRAPH.replace('return graph.compile()', 'return graph'),
                       GRAPH.replace('graph.add_edge("draft", "review")', 'graph.add_edge("missing", "review")'),
                       GRAPH.replace('graph.add_node("draft", draft)', 'graph.add_node("draft", None)'),
                       GRAPH.replace('graph = StateGraph(State)', 'graph = StateGraph(State)\n    other = StateGraph(State)').replace('return graph.compile()', 'return other.compile()')]:
            with self.subTest(source=source):
                self.assertFalse(assess('lg-project', source))

    def test_graph_accepts_registered_compiled_project(self):
        self.assertTrue(assess('lg-project', GRAPH))

    def test_adk_rejects_wrong_order_or_non_agents(self):
        for values in ['writer, researcher', 'researcher, researcher', 'object(), object()']:
            with self.subTest(values=values):
                self.assertFalse(assess('adk-sequence', ADK.replace('researcher, writer]', values + ']')))

    def test_adk_accepts_declared_pipeline_order(self):
        self.assertTrue(assess('adk-sequence', ADK))

    def test_sdk_rejects_unrelated_or_duplicate_handoffs(self):
        for values in ['planner, planner', 'object(), object()']:
            with self.subTest(values=values):
                self.assertFalse(assess('agents-research', SDK.replace('planner, writer]', values + ']')))

    def test_sdk_rejects_returning_the_wrong_agent(self):
        self.assertFalse(assess('agents-research', SDK.replace('return Agent(name="Manager"', 'manager = Agent(name="Manager"') + '    return planner\n'))

    def test_sdk_accepts_specialist_declarations(self):
        self.assertTrue(assess('agents-research', SDK))

    def test_schema_rejects_name_without_supplied_format(self):
        self.assertFalse(assess('pass-json-schema', SCHEMA.replace('text=text_format', 'text={"format": {"name": "answer"}}')))

    def test_schema_accepts_supplied_format(self):
        self.assertTrue(assess('pass-json-schema', SCHEMA))

    def test_checkpointer_rejects_empty_or_unentered_graph(self):
        for source in [CHECKPOINT.replace('graph.add_node("draft", draft)', 'pass'), CHECKPOINT.replace('graph.set_entry_point("draft")', 'pass')]:
            with self.subTest(source=source):
                self.assertFalse(assess('lg-checkpointer', source))

    def test_checkpointer_accepts_taught_saver_passthrough(self):
        self.assertTrue(assess('lg-checkpointer', CHECKPOINT))

    def test_dispatcher_rejects_false_harness_success(self):
        self.assertFalse(assess('adk-project', '''from google.adk import Agent
Agent(name="researcher", model="gemini-flash-latest", instruction="Research.", tools=[object()])
def build_researcher(): raise RuntimeError("broken")
'''))


if __name__ == '__main__': unittest.main()
