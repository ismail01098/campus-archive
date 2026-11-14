"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, LayoutDashboard, Menu, Search, Upload, X } from "lucide-react";

export function SiteNav({ college }: { college: string }) {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="brand" onClick={closeMenu}>
          <span className="brand-mark"><BookOpen size={20} aria-hidden="true" /></span>
          <span className="brand-copy">
            <span>CAMPUS ARCHIVE</span>
            <small>{college.toUpperCase()}</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/papers"><Search size={16} aria-hidden="true" /> Papers</Link>
          <Link href="/upload"><Upload size={16} aria-hidden="true" /> Upload</Link>
          <Link href="/dashboard"><LayoutDashboard size={16} aria-hidden="true" /> Dashboard</Link>
          <Link className="btn btn-primary nav-signin" href="/login">Sign in</Link>
        </nav>

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      <nav
        id="mobile-navigation"
        className={`mobile-nav${open ? " is-open" : ""}`}
        aria-label="Mobile navigation"
        hidden={!open}
      >
        <Link href="/papers" onClick={closeMenu}><Search size={17} /> Papers</Link>
        <Link href="/upload" onClick={closeMenu}><Upload size={17} /> Upload</Link>
        <Link href="/dashboard" onClick={closeMenu}><LayoutDashboard size={17} /> Dashboard</Link>
        <Link href="/login" className="btn btn-primary" onClick={closeMenu}>Sign in</Link>
      </nav>
    </header>
  );
}
