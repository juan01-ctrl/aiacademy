import Link from "next/link";

export function HeroSection({ signedIn, startHref }: { signedIn: boolean; startHref: string }) {
  return (
    <section className="academy-hero" aria-labelledby="hero-title">
      <div className="academy-container academy-hero-grid">
        <div className="academy-hero-copy academy-reveal">
          <p className="academy-eyebrow"><span className="academy-small-rule" aria-hidden="true" /> LEARN BY BUILDING</p>
          <h1 id="hero-title">Build agents. Understand every step.</h1>
          <p className="academy-hero-description">Go from your first model call to agentic systems. Read the idea, write the Python, and put it to the test—all in your browser.</p>
          <div className="academy-hero-actions">
            <Link href={startHref} className="btn btn-primary academy-button">{signedIn ? "Continue the path" : "Start the path"} <span aria-hidden="true">↗</span></Link>
            <Link href="#path" className="academy-text-link">See the path <span aria-hidden="true">↓</span></Link>
          </div>
          <p className="academy-hero-note">Short explanations. Hands-on exercises. Your code.</p>
        </div>
        <div className="academy-workspace academy-reveal" aria-label="Illustrative lesson workspace">
          <div className="academy-workspace-bar">
            <span className="academy-window-dots" aria-hidden="true"><i /><i /><i /></span>
            <span>academy / lesson workspace</span>
            <span className="academy-preview-label">Illustrative exercise</span>
          </div>
          <div className="academy-workspace-body">
            <div className="academy-lesson-preview">
              <p className="academy-eyebrow">OPENAI API FUNDAMENTALS</p>
              <h2>Your first<br />model call</h2>
              <p>Give the model a prompt.<br />Read the text it returns.</p>
              <div className="academy-lesson-steps" aria-hidden="true"><span className="is-current">Read</span><span>Write</span><span>Run</span></div>
              <p className="academy-preview-caption">One concept.<br />One piece of working code.</p>
            </div>
            <div className="academy-editor-preview">
              <div className="academy-file"><span>script.py</span><span>Python</span></div>
              <pre><code><span className="academy-code-comment"># Make your first call</span>{"\n"}<span className="academy-code-highlight">response</span>{" = client.responses.create(\n    model=model,\n    input=prompt,\n)\n\n"}<span className="academy-code-keyword">return</span>{" response.output_text"}</code></pre>
              <div className="academy-preview-console"><span>CONSOLE</span><p>Run your code. Inspect the output.</p></div>
              <div className="academy-preview-controls" aria-hidden="true"><span>▷ Run code</span><span>Submit answer ↗</span></div>
            </div>
          </div>
          <div className="academy-workspace-foot"><span aria-hidden="true">↳</span> Understanding happens between reading and running.</div>
        </div>
      </div>
      <div className="academy-container academy-subjects" aria-label="Roadmap topics">
        <span className="academy-subjects-label">FROM FOUNDATIONS<br />TO FRAMEWORKS</span>
        <span>Responses API</span><span>Agents SDK</span><span>CrewAI</span><span>LangGraph</span><span>MCP</span>
      </div>
    </section>
  );
}
