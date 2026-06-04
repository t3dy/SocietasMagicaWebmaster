# Societas Magica — Webmaster Field Guide & Modern Replica

## Live Sites

| | URL |
|---|---|
| **Webmaster Field Guide** (tutorials) | **[https://t3dy.github.io/SocietasMagicaWebmaster](https://t3dy.github.io/SocietasMagicaWebmaster)** |
| **Modern Replica** (functional site) | **[https://t3dy.github.io/SocietasMagicaWebmaster/replica/](https://t3dy.github.io/SocietasMagicaWebmaster/replica/)** |

---

## What's in this repo

### 1. Webmaster Field Guide (`/`)

A tutorial site mapping every task a new webmaster faces when taking over, stabilizing, and modernizing the [Societas Magica](https://www.societasmagica.org/) website — an academic society for scholars of the history of magic, founded in 1994.

| Section | Topics |
|---|---|
| **1. Access Recovery** | SSH, DNS, Git, domain registrar, database credentials |
| **2. Audit & Triage** | Reading PHP code, MySQL inspection, checklist for first week |
| **3. Content Repairs** | Known broken/stale pages, HTML editing, accessibility |
| **4. Member Directory** | How member lists work, 4 options from repair to Wild Apricot |
| **5. Payments & Dues** | PayPal IPN explained, Stripe as a modern replacement, subscription logic |
| **6. Migration Paths** | Three paths: stabilize PHP / migrate to WordPress / static + managed services |
| **7. Stack Comparison** | Every technology in the guide with links to official docs |

### 2. Modern Replica (`/replica/`)

A fully scraped, content-complete replica of the Societas Magica website rebuilt with clean HTML/CSS and wired for modern services. Every public page has been reproduced with real content from the original site.

| Page | File | Notes |
|---|---|---|
| Home | `replica/index.html` | Officers, news, announcements |
| Membership | `replica/membership.html` | Benefits, dues, PayPal button slot |
| Newsletter Archive | `replica/newsletters.html` | All 44 issues with live PDF links + JS filter |
| Publications | `replica/publications.html` | MRW journal, Magic in History series |
| Conferences | `replica/conferences.html` | 2024 Kalamazoo sessions + past conferences |
| Manuscripts | `replica/manuscripts.html` | All databases and digital collections |
| Syllabus Project | `replica/syllabus.html` | Course repository information |
| Blog | `replica/blog.html` | Full Ars Magica Blog post (July 2021) |
| Travel Bursary | `replica/travel-bursary.html` | Eligibility, application instructions |
| Contact | `replica/contact.html` | Officer directory + Formspree contact form |
| Login | `replica/login.html` | Outseta auth widget slot |
| Register | `replica/register.html` | Outseta registration + profile fields |
| Privacy Policy | `replica/privacy.html` | Full text |
| Terms of Use | `replica/terms.html` | Full text |

## Completing the functional integrations

Two services need free account setup to make the replica fully functional:

### Contact Form → Formspree
1. Create a free account at [formspree.io](https://formspree.io)
2. Create a new form, set recipient to `front_desk@societasmagica.org`
3. Copy your form ID (e.g. `xwkdpbnj`)
4. In `replica/contact.html`, replace `YOUR_FORM_ID` with your form ID

### Member Login/Register → Outseta
1. Create an account at [outseta.com](https://www.outseta.com) (free tier available)
2. Configure your subdomain (e.g. `societasmagica.outseta.com`)
3. Add custom profile fields: Institution, Research Interests
4. In `replica/login.html` and `replica/register.html`, replace `YOUR_OUTSETA_DOMAIN` with your subdomain
5. Configure Stripe in the Outseta dashboard for dues collection

### Newsletter PDFs
All 44 newsletter PDFs currently link directly to the original `societasmagica.org` server. If migrating hosting, download the PDFs and update the paths in `replica/newsletters.html`.

## Current site diagnosis

The original Societas Magica site runs on a **custom PHP application** (not WordPress/Drupal/Joomla). Signs: `themes/default/` directory structure, `?page=TravelBursary.html` query parameter routing, session/cookie auth. Known issues:

- Multiple pages with content last updated in **2012**
- Officers/contact page returns HTTP 404
- PayPal integration recently broke and was repaired
- Member directory public URL 404s (login-gated, state unknown)

## Tech stack (this repo)

Pure HTML/CSS/JS — no build step, no framework, no dependencies. Hosted on GitHub Pages. Ready to fork and deploy anywhere static files can be served.

## Source

- Repo: [github.com/t3dy/SocietasMagicaWebmaster](https://github.com/t3dy/SocietasMagicaWebmaster)
- Tutorial: [`index.html`](index.html)
- Replica: [`replica/`](replica/)
