import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenCheck,
  Building2,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  LifeBuoy,
  MessageCircle,
  School,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { EnquiryForm } from "@/components/enquiry-form";

export const metadata = {
  title: "Work with us",
  description:
    "Practical, safe AI training and support for schools and small businesses, from a former Assistant Headteacher and Head of ICT.",
};

const schools = [
  {
    icon: Users,
    title: "Staff INSET & CPD",
    text: "Hands-on training that leaves teachers and support staff confident, not overwhelmed.",
    points: [
      "Planning, resources and adapting work for SEND and EAL",
      "Feedback, reports and everyday admin",
      "What never to put into an AI tool, and why",
    ],
  },
  {
    icon: ShieldCheck,
    title: "AI policy & safe use",
    text: "Clear, workable guidance so everyone knows what's allowed and what isn't.",
    points: [
      "Draft or review your AI policy and acceptable-use guidance",
      "Aligned with current DfE guidance and your data protection duties",
      "Plain-English messages for parents and governors",
    ],
  },
  {
    icon: BookOpenCheck,
    title: "AI in the curriculum",
    text: "Help pupils understand the technology they're growing up with.",
    points: [
      "Schemes of work and lesson resources, KS2 to KS4",
      "Built by someone who has written computing curricula across four schools",
      "Critical thinking, not just clever tricks",
    ],
  },
  {
    icon: LifeBuoy,
    title: "Ongoing support",
    text: "A friendly expert on hand as tools, and staff confidence, develop.",
    points: ["Termly check-ins with your leadership team", "Staff drop-in clinics", "Updates when something important changes"],
  },
];

const business = [
  {
    icon: ClipboardList,
    title: "AI time-saving audit",
    text: "We look at a normal week together and find where AI can genuinely help.",
    points: ["A short, practical plan with three to five quick wins", "The right tools for each, with no unnecessary subscriptions", "Honest advice on what to leave alone"],
  },
  {
    icon: Sparkles,
    title: "Team workshop & setup",
    text: "A hands-on session where we set things up and practise together.",
    points: ["Tools set up for your team", "A shared prompt library for emails, quotes, social posts and admin", "Simple rules for using customer data safely"],
  },
  {
    icon: LifeBuoy,
    title: "Ongoing support",
    text: "Someone to ask when a new tool appears or something isn't working.",
    points: ["Monthly check-in call", "Help by email between sessions", "Fresh ideas as your business grows"],
  },
];

const steps = [
  { icon: MessageCircle, title: "A free consultation", text: "A relaxed call about where you are and what you'd like to change. No jargon, no pressure." },
  { icon: ClipboardList, title: "A tailored quote", text: "What we suggest, how long it takes and a clear price. Nothing is booked until you're happy." },
  { icon: CalendarCheck, title: "Do it, then follow up", text: "We run the training or project, then check in afterwards to make sure it's stuck." },
];

function OfferCard({ o }: { o: (typeof schools)[number] }) {
  return (
    <article className="offer-card">
      <o.icon aria-hidden="true" />
      <h3>{o.title}</h3>
      <p>{o.text}</p>
      <ul>
        {o.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </article>
  );
}

export default function WorkWithMe() {
  return (
    <main>
      <section className="wwm-hero shell">
        <div>
          <p className="eyebrow"><Sparkles size={14} /> Work with us</p>
          <h1>AI that actually helps.<br /><em>In your school or business.</em></h1>
          <p className="hero-intro">
            Practical, safe and jargon-free training and support. Everyday AI is led by a former Assistant Headteacher and Head
            of ICT who has spent 18 years helping people feel confident with technology.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="#schools"><School size={17} /> For schools</Link>
            <Link className="button button-light-outline" href="#business"><Building2 size={17} /> For small businesses</Link>
          </div>
          <p className="consult-note"><Link href="#enquire">Book a free consultation</Link>, with no obligation.</p>
        </div>
        <ul className="credential-list" aria-label="Our founder's background">
          <li><strong>18+ years</strong><span>in education, from classroom teacher to Assistant Headteacher</span></li>
          <li><strong>Head of ICT</strong><span>led departments and wrote computing curricula across four schools</span></li>
          <li><strong>BSc Software Development</strong><span>plus a PGDip in Educational Leadership (Warwick)</span></li>
          <li><strong>Still teaching</strong><span>online every week, so we know how busy the job is</span></li>
        </ul>
      </section>

      <section className="offer-section shell" id="schools">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><GraduationCap size={14} /> For schools & trusts</p>
            <h2>Save teachers time.<br />Keep pupils safe.</h2>
          </div>
          <p>Our founder has led technology across a community of schools and supported staff who were sure they &ldquo;weren&apos;t techy&rdquo;. We know what works in a real school week, and what doesn&apos;t.</p>
        </div>
        <div className="offer-grid four">{schools.map((o) => <OfferCard key={o.title} o={o} />)}</div>
      </section>

      <section className="offer-section business-band" id="business">
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><Building2 size={14} /> For small businesses</p>
              <h2>No IT department?<br /><em>No problem.</em></h2>
            </div>
            <p>You don&apos;t need to become a tech expert. You need a few good AI habits that give you hours back each week, set up properly and explained clearly.</p>
          </div>
          <div className="offer-grid three">{business.map((o) => <OfferCard key={o.title} o={o} />)}</div>
        </div>
      </section>

      <section className="steps-section shell">
        <p className="eyebrow">How it works</p>
        <h2>Simple from the first hello.</h2>
        <ol className="steps">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className="step-num">0{i + 1}</span>
              <s.icon aria-hidden="true" />
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-sharon">
        <div className="shell about-sharon-grid">
          <div className="portrait" aria-hidden="true"><span>E</span></div>
          <div>
            <p className="eyebrow light">Who&apos;s behind Everyday AI</p>
            <blockquote>Making technology feel <em>doable</em> has always been the job.</blockquote>
            <p>
              Everyday AI was founded by an educator with a degree in Software Development and more than 18 years in schools: ICT
              teacher, Head of ICT, Director of ICT and Assistant Headteacher. That meant writing computing curricula, leading
              technology across a community of schools and helping staff use it with confidence. Our founder still teaches every
              week, online.
            </p>
            <p>
              Everyday AI brings that experience to AI: calm, practical help for people who want it to be useful, not
              overwhelming. We&apos;re based in Essex, working in person locally and online anywhere in the UK.
            </p>
          </div>
        </div>
      </section>

      <section className="enquire shell" id="enquire">
        <div>
          <p className="eyebrow">Free consultation</p>
          <h2>Tell us what you need.</h2>
          <p>Send a quick message and we&apos;ll get back to you to arrange a free, no-obligation consultation. Every school and business is different, so we&apos;ll send a tailored quote afterwards.</p>
        </div>
        <EnquiryForm />
      </section>
    </main>
  );
}
