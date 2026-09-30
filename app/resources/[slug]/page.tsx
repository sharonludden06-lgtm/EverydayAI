import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, CalendarCheck, Clock3, House, WandSparkles } from "lucide-react";
import { GuideBody } from "@/components/guide-body";
import { formatGuideDate, getGuide, getGuidePages, renderGuide, type GuideIcon } from "@/lib/guides";

// Every guide page is built in advance from content/guides/. Any other address (including a guide
// that isn't published yet, on the live site) shows "page not found".
export const dynamicParams = false;

export function generateStaticParams() {
  return getGuidePages().map((g) => ({ slug: g.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.summary,
    ...(guide.status === "published" ? {} : { robots: { index: false, follow: false } }),
  };
}

const icons: Record<GuideIcon, typeof House> = { house: House, briefcase: BriefcaseBusiness, wand: WandSparkles, clock: Clock3 };

export default async function GuidePage({ params }: Props) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const { html, headings } = renderGuide(guide.body);
  const Icon = icons[guide.icon];
  // Sections are numbered 01, 02…; "Step 1: …" and "Prompt 1: …" sections show their own label instead.
  let n = 0;
  const numbered = headings.map((h) => ({ ...h, mark: h.label ?? String(++n).padStart(2, "0") }));
  const contents = headings.length > 1 && <ol>{numbered.map((h) => <li key={h.id}><a href={`#${h.id}`}><span>{h.mark}</span>{h.text}</a></li>)}</ol>;

  return <main className="guide-page">
    {guide.status !== "published" && <div className="guide-banner shell" role="note"><strong>Not public yet.</strong> This guide is {guide.status === "draft" ? "a draft" : "marked “coming soon”"}. You can see it because this is a Preview version of the site; it won&apos;t appear on the live site until it&apos;s approved and published.</div>}

    <header className="guide-hero">
      <div className="shell">
        <Link href="/resources" className="guide-crumb"><ArrowLeft size={15}/> All resources</Link>
        <div className="guide-hero-grid">
          <div>
            <p className="eyebrow"><span className="guide-hero-icon" aria-hidden="true"><Icon size={16}/></span>{guide.label}</p>
            <h1>{guide.title}</h1>
          </div>
          <div className="guide-hero-side">
            <p className="guide-summary">{guide.summary}</p>
            <ul className="guide-facts">
              <li><Clock3 size={15} aria-hidden="true"/>{guide.readingTime} min read</li>
              {guide.checked && <li><CalendarCheck size={15} aria-hidden="true"/>Tool details checked {formatGuideDate(guide.checked, true)}</li>}
              {guide.published && <li>Published {formatGuideDate(guide.published)}</li>}
            </ul>
          </div>
        </div>
      </div>
    </header>

    <div className="guide-layout shell">
      {contents && <nav className="guide-toc" aria-label="In this guide"><p className="guide-toc-title">In this guide</p>{contents}</nav>}
      <article className="guide-article">
        {contents && <details className="guide-toc-mobile"><summary>In this guide</summary>{contents}</details>}
        <GuideBody html={html}/>
        <p className="guide-back"><Link href="/resources" className="text-link"><ArrowLeft size={14}/> Back to all resources</Link></p>
      </article>
    </div>

    <section className="guide-cta shell">
      <div>
        <p className="eyebrow light">The Sunday Edit</p>
        <h2>Found this useful? <em>There&apos;s one like it every Sunday.</em></h2>
      </div>
      <div>
        <p>One calm email a week: a tool worth knowing, three prompts worth keeping, and one real-life shortcut. No tech waffle.</p>
        <Link href="/newsletter#signup" className="button button-light">Join the Sunday Edit <ArrowUpRight size={17}/></Link>
      </div>
    </section>
  </main>;
}
