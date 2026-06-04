# Societas Magica — Webmaster Field Guide

## Live Site

**[https://t3dy.github.io/SocietasMagicaWebmaster](https://t3dy.github.io/SocietasMagicaWebmaster)**

---

A tutorial site mapping every task a new webmaster faces when taking over, stabilizing, and modernizing the [Societas Magica](https://www.societasmagica.org/) website — an academic society for scholars of the history of magic, founded in 1994.

## What's covered

| Section | Topics |
|---|---|
| **1. Access Recovery** | SSH, DNS, Git, domain registrar, database credentials |
| **2. Audit & Triage** | Reading PHP code, MySQL inspection, checklist for first week |
| **3. Content Repairs** | Known broken/stale pages, HTML editing, accessibility |
| **4. Member Directory** | How member lists work, 4 options from repair to Wild Apricot |
| **5. Payments & Dues** | PayPal IPN explained, Stripe as a modern replacement, subscription logic |
| **6. Migration Paths** | Three paths: stabilize PHP / migrate to WordPress / static + managed services |
| **7. Stack Comparison** | Every technology in the guide with links to official docs |

Each section explains the concept, the relevant tools and code patterns, and links to authoritative external learning resources.

## Current site diagnosis

The Societas Magica site runs on a **custom PHP application** (not WordPress/Drupal/Joomla), built by volunteers. Signs: `themes/default/` directory structure, `?page=TravelBursary.html` query parameter routing, session/cookie auth. The site has:

- A working newsletter archive (44 PDF issues, 1995–2026)
- A PayPal dues integration (recently repaired after a broken period)
- A login-gated member directory (state unknown, public URL 404s)
- Multiple pages with content last updated in **2012**
- A broken officers/contact page (HTTP 404)

## Recommended path

**WordPress + MemberPress** — maintainable by any future volunteer without PHP knowledge, with MemberPress handling login-gated member directory, dues renewal, and reminders out of the box.

## Tech stack (this site)

Pure HTML/CSS — no build step, no dependencies. Hosted on GitHub Pages.

## Source

- Site: [`index.html`](index.html), [`style.css`](style.css)
- Repo: [github.com/t3dy/SocietasMagicaWebmaster](https://github.com/t3dy/SocietasMagicaWebmaster)
