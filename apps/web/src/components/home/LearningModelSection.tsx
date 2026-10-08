import Image from "next/image";

const learningSteps = [
  { title: "Read the idea", body: "A short explanation gives you the concept and the context for the exercise." },
  { title: "Write the Python", body: "Work in the lesson editor. Turn what you just read into a model call, a tool, or an agent loop." },
  { title: "Run and inspect", body: "Run your code and use the console output to see what actually happened." },
  { title: "Submit and refine", body: "Submit your answer for grading. The tests stay on the server; your next step is to improve the code." },
];

export function LearningModelSection() {
  return (
    <section className="academy-learning" aria-labelledby="learning-title">
      <div className="academy-container academy-learning-grid">
        <div className="academy-learning-intro"><p className="academy-eyebrow">THE LESSON IS THE EXERCISE</p><h2 id="learning-title">From an idea to working Python.</h2><p>Not a wall of theory followed by a blank editor. The explanation and the exercise belong together.</p><Image src="/landing/learning-loop.svg" alt="" aria-hidden="true" width={560} height={310} className="academy-learning-art" /></div>
        <ol className="academy-learning-steps">{learningSteps.map((step, index) => <li key={step.title}><span className="academy-learning-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol>
      </div>
    </section>
  );
}
