"use client";
import { useEffect, useRef, useState, type MouseEvent } from "react";

/** Plain text of a prompt, keeping list items on their own lines ("- …" or "1. …"). */
function promptText(el: Element) {
  return [...el.children]
    .map((c) =>
      c.tagName === "UL" || c.tagName === "OL"
        ? [...c.children].map((li, i) => `${c.tagName === "OL" ? `${i + 1}.` : "-"} ${(li as HTMLElement).innerText.trim()}`).join("\n")
        : (c as HTMLElement).innerText.trim(),
    )
    .join("\n\n");
}

/**
 * The guide text (HTML made from the guide's Markdown in lib/guides.ts). Adds the "Copy prompt"
 * buttons: they start hidden, so without JavaScript nobody sees a button that does nothing.
 */
export function GuideBody({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    ref.current?.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((b) => (b.hidden = false));
  }, [html]);

  async function onClick(e: MouseEvent<HTMLDivElement>) {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-copy]");
    const box = button?.closest("figure")?.querySelector(".guide-prompt-text");
    if (!button || !box) return;
    const label = button.dataset.label ?? button.textContent ?? "Copy";
    button.dataset.label = label;
    try {
      await navigator.clipboard.writeText(promptText(box));
      button.textContent = "Copied";
      setStatus("Prompt copied. You can now paste it into your AI assistant.");
    } catch {
      button.textContent = "Couldn't copy";
      setStatus("Sorry, that didn't copy. You can select the text and copy it instead.");
    }
    button.classList.add("done");
    setTimeout(() => {
      button.textContent = label;
      button.classList.remove("done");
    }, 2200);
  }

  return (
    <>
      <div ref={ref} className="guide-body" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
      <p className="sr-only" role="status">{status}</p>
    </>
  );
}
