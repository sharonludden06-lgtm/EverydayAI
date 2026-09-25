import Link from "next/link";
import { ArrowUpRight, Clock3, Sparkles } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";

const tips = [
  { number: "01", label: "5 minute win", title: "Turn a messy voice note into a tidy to-do list", tag: "ChatGPT" },
  { number: "02", label: "At home", title: "Plan five family dinners from what is already in the fridge", tag: "Everyday life" },
  { number: "03", label: "At work", title: "Write the email you have been putting off—without sounding robotic", tag: "Quick prompt" },
];

export default function Home() {
  return <main>
    <section className="hero shell"><div className="hero-copy"><p className="eyebrow"><Sparkles size={14}/> AI, minus the overwhelm</p><h1>Make AI useful.<br/><em>In real life.</em></h1><p className="hero-intro">Clear, clever ways to use AI at home and at work—written for curious people, not computer experts.</p><div className="hero-actions"><Link className="button button-primary" href="/resources">Explore simple guides <ArrowUpRight size={17}/></Link><Link className="text-link" href="/newsletter">Read this week&apos;s edit</Link></div><div className="reader-note"><span className="avatar-stack"><i>S</i><i>A</i><i>M</i></span><span>Join practical people learning one useful thing at a time.</span></div></div><div className="hero-visual"><img src="/hero-everyday-ai.png" alt="Layered glass and luminous pathways representing approachable AI"/><div className="floating-card prompt-card"><span>TRY THIS</span><p>“Make this simpler, warmer and half the length.”</p></div><div className="floating-card result-card"><Clock3 size={16}/><div><strong>12 mins saved</strong><small>before the school run</small></div></div></div></section>
    <section className="ticker"><div>HOME & FAMILY <b>✦</b> WORK SMARTER <b>✦</b> CLEAR PROMPTS <b>✦</b> NEW TOOLS, TESTED <b>✦</b> NO JARGON</div></section>
    <section className="section shell"><div className="section-heading"><div><p className="eyebrow">Start small</p><h2>Three useful things<br/>you can try today.</h2></div><p>No grand promises. Just practical ideas that save time, remove a little friction, or help you make a start.</p></div><div className="tip-grid">{tips.map((tip)=><article className="tip-card" key={tip.number}><div className="tip-top"><span>{tip.number}</span><span className="pill">{tip.tag}</span></div><div><p className="meta">{tip.label}</p><h3>{tip.title}</h3></div><Link href="/resources"><ArrowUpRight/></Link></article>)}</div></section>
    <section className="manifesto"><div className="shell manifesto-grid"><p className="eyebrow light">Our point of view</p><blockquote>AI should feel less like another thing to learn—and more like <em>a quiet extra pair of hands.</em></blockquote><p>We test the noise, keep what genuinely helps, and explain it like a capable friend sitting beside you.</p></div></section>
    <section className="newsletter-band shell"><div><p className="eyebrow">The Sunday Edit</p><h2>One calm email.<br/>A week of better ideas.</h2></div><div><p>A five-minute read with one tool worth knowing, three prompts worth keeping, and absolutely no tech waffle.</p><NewsletterForm source="home"/></div></section>
  </main>;
}
