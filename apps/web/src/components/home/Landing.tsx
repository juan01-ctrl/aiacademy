"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { HeroSection } from "./HeroSection";
import { RoadmapSection, type LandingStep } from "./RoadmapSection";
import { LearningModelSection } from "./LearningModelSection";

export function Landing({ signedIn, startHref, steps }: {
  signedIn: boolean;
  startHref: string;
  steps: LandingStep[];
}) {
  return (
    <div className="academy-landing">
      <a href="#main-content" className="academy-skip">Skip to content</a>
      <header className="academy-header">
        <div className="academy-container academy-header-inner">
          <Link href="/" className="academy-brand" aria-label="Ailearnia home">
            <span className="academy-brand-mark" aria-hidden="true">a<span>.</span></span>
            <span>Ailearnia<span className="academy-brand-caption">AI ENGINEERING ACADEMY</span></span>
          </Link>
          <nav className="academy-nav" aria-label="Landing">
            <Link href="/catalog" className="academy-nav-link">Catalog</Link>
            <Link href={signedIn ? "/dashboard" : "/auth/signin"} className="btn btn-secondary">{signedIn ? "Dashboard" : "Sign in"}</Link>
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <HeroSection signedIn={signedIn} startHref={startHref} />
        <RoadmapSection steps={steps} />
        <LearningModelSection />
        <section className="academy-start" aria-labelledby="start-title">
          <div className="academy-container academy-start-inner">
            <div>
              <p className="academy-eyebrow">YOUR NEXT STEP</p>
              <h2 id="start-title">Start with a model call.<br />Build from there.</h2>
              <p>The path begins with the Responses API, before the frameworks.</p>
            </div>
            <div className="academy-start-actions">
              <Link className="btn academy-button-light" href={signedIn ? "/courses/openai-api-fundamentals" : "/auth/signup?next=%2Fcourses%2Fopenai-api-fundamentals"}>
                {signedIn ? "Start OpenAI API" : "Create your account"}<span aria-hidden="true">↗</span>
              </Link>
              {!signedIn && <button type="button" className="academy-google" onClick={() => { void authClient.signIn.social({ provider: "google", callbackURL: "/catalog" }); }}>Continue with Google <span aria-hidden="true">↗</span></button>}
            </div>
          </div>
        </section>
      </main>
      <footer className="academy-container academy-footer">
        <Link href="/" className="academy-footer-brand">Ailearnia · AI Engineering</Link>
        <p>Read. Write. Run. Refine.</p>
        <Link href="/catalog">Explore catalog <span aria-hidden="true">↗</span></Link>
      </footer>
    </div>
  );
}
