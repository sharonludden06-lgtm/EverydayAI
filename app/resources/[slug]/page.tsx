import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { formatGuideDate, getGuide, getGuidePages, renderGuideBody } from "@/lib/guides";

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

export default async function GuidePage({ params }: Props) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();

  return <main>
    {guide.status !== "published" && <div className="guide-banner shell" role="note"><strong>Not public yet.</strong> This guide is {guide.status === "draft" ? "a draft" : "marked “coming soon”"}. You can see it because this is a Preview version of the site; it won&apos;t appear on the live site until it&apos;s approved and published.</div>}
    <article className="guide shell">
      <header className="guide-head">
        <p className="eyebrow"><Link href="/resources">Resources</Link><span aria-hidden="true">/</span>{guide.label}</p>
        <h1>{guide.title}</h1>
        <p className="guide-summary">{guide.summary}</p>
        <p className="guide-meta">
          <span>{guide.readingTime} min read</span>
          {guide.published && <span>Published {formatGuideDate(guide.published)}</span>}
          {guide.checked && <span>Tool details checked {formatGuideDate(guide.checked, true)}</span>}
        </p>
      </header>
      <div className="guide-body" dangerouslySetInnerHTML={{ __html: renderGuideBody(guide.body) }}/>
      <p className="guide-back"><Link href="/resources" className="text-link"><ArrowLeft size={14}/> Back to all guides</Link></p>
    </article>
    <section className="mini-cta shell"><p className="eyebrow light">One useful thing a week</p><h2>Liked this? There&apos;s more where it came from.</h2><p>Our free Sunday Edit brings one tool worth knowing, three prompts worth keeping and no tech waffle.</p><Link href="/newsletter#signup" className="button button-light">Join the Sunday Edit <ArrowUpRight size={17}/></Link></section>
  </main>;
}
