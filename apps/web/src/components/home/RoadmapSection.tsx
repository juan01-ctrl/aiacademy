"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { CourseProgress } from "@/components/course/CourseProgress";

export type LandingCourse = { id: string; title: string; summary: string; level: string; duration: string; completionPercent?: number };
export type LandingStep = { order: number; title: string; summary: string; courses: LandingCourse[] };

export function RoadmapSection({ steps }: { steps: LandingStep[] }) {
  const [active, setActive] = useState(steps[0]?.order);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const visible = steps.find((step) => step.order === active) ?? steps[0];

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % steps.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + steps.length) % steps.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = steps.length - 1;
    else return;
    event.preventDefault();
    setActive(steps[next].order);
    tabs.current[next]?.focus();
  }

  return (
    <section id="path" className="academy-path" aria-labelledby="path-title">
      <div className="academy-container">
        <div className="academy-section-heading">
          <div><p className="academy-eyebrow">AGENTIC AI ENGINEER ROADMAP</p><h2 id="path-title">Learn the foundations. Then connect the pieces.</h2></div>
          <p>Follow the roadmap or choose a course. Each step brings a different part of agent engineering into focus.</p>
        </div>
        {visible ? <>
          <div className="academy-roadmap-tabs" role="tablist" aria-label="Roadmap steps">
            {steps.map((step, index) => {
              const selected = step.order === visible.order;
              return <button key={step.order} ref={(node) => { tabs.current[index] = node; }} type="button" role="tab" id={`roadmap-tab-${step.order}`} aria-selected={selected} aria-controls={`roadmap-panel-${step.order}`} tabIndex={selected ? 0 : -1} className="academy-roadmap-tab" onClick={() => setActive(step.order)} onKeyDown={(event) => navigate(event, index)}>
                <span className="academy-step-number">{String(step.order).padStart(2, "0")}</span><span>{step.title}</span><span className="academy-tab-arrow" aria-hidden="true">↗</span>
              </button>;
            })}
          </div>
          {steps.map((step) => <div key={step.order} id={`roadmap-panel-${step.order}`} role="tabpanel" aria-labelledby={`roadmap-tab-${step.order}`} hidden={step.order !== visible.order} tabIndex={0} className="academy-roadmap-panel">
            <div className="academy-panel-heading"><div><h3>{step.title}</h3><p>{step.summary}</p></div><Link href="/catalog" className="academy-text-link">Explore catalog <span aria-hidden="true">↗</span></Link></div>
            {step.courses.length ? <div className="academy-course-grid">{step.courses.map((course) => <article key={course.id} className="academy-course">
              <div className="academy-course-motif" aria-hidden="true"><span>PY</span><div><i /><i /><i /></div><span>↗</span></div>
              <div className="academy-course-content"><div className="academy-course-meta"><span>{course.level}</span><span>{course.duration}</span></div><h4>{course.title}</h4><p>{course.summary}</p><CourseProgress percent={course.completionPercent} /><Link href={`/courses/${course.id}`} className="academy-course-link">See details <span aria-hidden="true">↗</span></Link></div>
            </article>)}</div> : <div className="academy-empty"><p>No courses are available in this step yet.</p><Link href="/catalog" className="btn btn-secondary">Browse available courses</Link></div>}
          </div>)}
        </> : <div className="academy-empty"><p>Browse the catalog for available courses.</p><Link href="/catalog" className="btn btn-secondary">Browse available courses</Link></div>}
      </div>
    </section>
  );
}
