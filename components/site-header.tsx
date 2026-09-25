"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const links = [["/", "Home"], ["/resources", "Resources"], ["/newsletter", "The Edit"], ["/about", "About"]];

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link className="brand" href="/">
          <span className="brand-mark">E</span>
          <span>EVERYDAY<em>AI</em></span>
        </Link>
        <nav>
          {links.map(([href, label]) => (
            <Link className={path === href ? "active" : ""} href={href} key={href}>{label}</Link>
          ))}
        </nav>
        <Link href="/newsletter#signup" className="nav-cta">Get the newsletter</Link>
        <button
          className="menu-button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <div id="mobile-nav" className={`mobile-nav${open ? " open" : ""}`}>
        {links.map(([href, label]) => (
          <Link className={path === href ? "active" : ""} href={href} key={href}>{label}</Link>
        ))}
        <Link href="/newsletter#signup">Get the newsletter</Link>
      </div>
    </header>
  );
}
