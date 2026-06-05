# Societas Magica — Site Improvement Proposals
## Admin Quality of Life + Academic Resource Features

A planning document for the incoming webmaster. Each proposal is structured as **Why** (problem being solved), **Feature** (what it looks like), and **How to Build** (implementation path with specific tools and effort estimates).

---

## Part I — Admin Quality of Life

These proposals reduce friction for the webmaster and officers. The goal is a site that can be maintained by a rotating volunteer without institutional knowledge being lost.

---

### 1. Member Management Dashboard

#### Why

The current site almost certainly requires direct database access to answer basic questions: How many active members do we have? Who is lapsed? Did a specific person's payment go through? Officers and the treasurer need this information regularly, and right now getting it requires either querying MySQL or trusting an out-of-date spreadsheet. This is a single point of failure — if the webmaster is unavailable, nobody can answer these questions.

#### Feature

A web-based admin panel showing:

- **Active members** — name, institution, join date, expiry date, payment status
- **Lapsed members** — expired more than 30 days ago, sorted by how long lapsed
- **Expiring soon** — members whose membership expires in the next 60 days
- **New this month** — quick measure of growth and renewal health
- **Search** by name, institution, or research interest
- **CSV export** — one-click export of the full or filtered member list for board reports, journal subscription batches, conference mailing lists

The treasurer and secretary should each have read-only access to this view without needing to be the webmaster.

#### How to Build

**Option A — WordPress + MemberPress** (recommended)  
MemberPress includes a Members table in the WordPress admin with all of the above. Export to CSV is built in. Assign the treasurer a custom WordPress role with access only to the Members screen.

```
Cost: included in MemberPress license (~$360/yr)
Effort: 0 additional build time — configure, don't code
```

**Option B — Outseta**  
The Contacts view in Outseta is this dashboard. Filter by plan, status, payment date. Export to CSV. Assign officer-level admin roles.

```
Cost: included in Outseta subscription (~$49/mo)
Effort: 0 — configure only
```

**Option C — Custom PHP (if staying on current stack)**  
Add an `/admin/members` route behind a separate admin login. A single SQL query powers the view:

```sql
SELECT
  id, first_name, last_name, email, institution,
  joined_date, expiry_date, active,
  DATEDIFF(expiry_date, NOW()) AS days_until_expiry
FROM members
ORDER BY expiry_date ASC;
```

Render as an HTML table with a PHP-generated CSV download link:

```php
// CSV download
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="members-' . date('Y-m-d') . '.csv"');
$out = fopen('php://output', 'w');
fputcsv($out, ['Name', 'Email', 'Institution', 'Joined', 'Expires', 'Active']);
while ($row = $result->fetch_assoc()) {
    fputcsv($out, [$row['first_name'] . ' ' . $row['last_name'],
                   $row['email'], $row['institution'],
                   $row['joined_date'], $row['expiry_date'], $row['active']]);
}
```

```
Cost: $0
Effort: 1–2 days of PHP development
```

---

### 2. Automated Dues & Renewal Lifecycle

#### Why

PayPal IPN (the system that fires when someone pays) recently stopped working, which means members paid but weren't activated. This happened because the IPN endpoint — a single PHP file on the server — broke silently. No alert fired. Nobody knew until members complained. Beyond the fragility of IPN, there are no renewal reminders, no grace period logic, and no automated lapse. Every step of the renewal cycle currently requires manual intervention or just doesn't happen.

#### Feature

A fully automated membership lifecycle:

```
Member pays dues
    → account activated immediately (no webmaster action required)
    → welcome email sent automatically

30 days before expiry
    → email: "Your Societas Magica membership renews soon"
    → link to renewal payment page

7 days before expiry
    → email: "Renew now to keep your member access"

Expiry date
    → grace period begins (suggested: 30 days)
    → member retains access during grace period

Grace period ends
    → account locked
    → email: "Your membership has lapsed — renew to restore access"

Member clicks renew at any point
    → pays
    → access restored immediately
```

Zero webmaster involvement at any step.

#### How to Build

**Option A — Stripe Billing** (best if building custom or on WordPress)

Stripe Billing handles recurring subscriptions, sends renewal receipts, retries failed payments, and fires webhooks at each lifecycle event. Connect a webhook endpoint to update membership status in your database:

```php
// Stripe webhook handler (PHP)
$payload = file_get_contents('php://input');
$sig     = $_SERVER['HTTP_STRIPE_SIGNATURE'];
$event   = \Stripe\Webhook::constructEvent($payload, $sig, STRIPE_WEBHOOK_SECRET);

switch ($event->type) {
    case 'customer.subscription.created':
        activateMember($event->data->object->customer);
        sendWelcomeEmail($event->data->object->customer);
        break;
    case 'customer.subscription.deleted':
        lapseMember($event->data->object->customer);
        sendLapseEmail($event->data->object->customer);
        break;
    case 'invoice.payment_failed':
        sendPaymentFailedEmail($event->data->object->customer);
        break;
}
```

Renewal reminder emails are configured in the Stripe dashboard under Billing > Dunning — no code needed.

```
Cost: 2.9% + $0.30 per transaction (no monthly fee)
Effort: 1 day to wire up webhook handler; reminder emails are zero-code config
```

**Option B — MemberPress + Stripe plugin**  
MemberPress handles the entire lifecycle visually in the WordPress admin. Connect the Stripe payment gateway plugin. Configure reminder emails in MemberPress > Options > Emails. No code required.

```
Cost: included in MemberPress license + Stripe transaction fees
Effort: 2–3 hours of configuration
```

**Option C — Outseta or Wild Apricot**  
Both platforms manage this lifecycle as a core feature. Configure renewal reminder timing and email copy in the dashboard. The renewal link in emails is generated automatically.

```
Cost: included in platform subscription
Effort: 30 minutes of configuration
```

---

### 3. Newsletter Upload Interface

#### Why

Publishing a new newsletter issue currently requires FTP access to the server, knowledge of the exact directory path (`/userfiles/files/Newsletters/docs/`), and then manually editing the newsletter listing page to add the new entry. This means only the webmaster can publish newsletters — the newsletter editor (a separate officer) has to hand off files and wait. It also means the member announcement email is sent separately, manually, through the listserv, by yet another person. Three people, three systems, no automation.

#### Feature

A single admin form for the newsletter editor:

1. Select the PDF file from local disk
2. Enter: Season (Spring / Fall), Year, Issue number
3. Click "Publish"

Result:
- PDF uploads to the server
- Newsletter archive page updates automatically with the new entry
- Announcement email goes to the full member list: "Issue [N] of the Societas Magica Newsletter is now available. [Download PDF]"

The newsletter editor can do this without the webmaster. The webmaster doesn't need to be involved.

#### How to Build

**Option A — WordPress**  
The newsletter archive is a custom post type (`newsletter_issue`) with fields: Season (select), Year (number), Issue Number (number), PDF (file upload via ACF or similar). The archive page is a template that queries and lists these posts. Publishing a post triggers an automated email via MailPoet or Mailchimp for WordPress.

```php
// Register custom post type
register_post_type('newsletter_issue', [
    'label'    => 'Newsletter Issues',
    'public'   => true,
    'supports' => ['title'],
    'menu_icon'=> 'dashicons-media-document',
]);

// ACF fields: season (select), year (number), issue_number (number), pdf_file (file)
```

On publish, a hook fires the announcement email:

```php
add_action('publish_newsletter_issue', function($post_id) {
    $issue = get_field('issue_number', $post_id);
    $season = get_field('season', $post_id);
    $year   = get_field('year', $post_id);
    $pdf    = get_field('pdf_file', $post_id)['url'];
    // trigger MailPoet campaign or wp_mail() to member list
});
```

```
Cost: ACF free tier; MailPoet free up to 1,000 subscribers
Effort: 4–6 hours to build and test
```

**Option B — Netlify + GitHub Actions (if static)**  
Newsletter PDFs are committed to a `newsletters/` folder in the GitHub repo. A GitHub Action detects the new file, updates a `newsletters.json` data file, and triggers a Netlify deploy. A separate Action calls the Outseta or Mailchimp API to send the announcement.

```yaml
# .github/workflows/newsletter.yml
on:
  push:
    paths: ['newsletters/*.pdf']
jobs:
  announce:
    runs-on: ubuntu-latest
    steps:
      - name: Send member email via Mailchimp
        run: |
          curl -X POST https://us1.api.mailchimp.com/3.0/campaigns \
            -H "Authorization: Bearer ${{ secrets.MAILCHIMP_API_KEY }}" \
            -d '{"type":"regular","settings":{"subject_line":"New Newsletter: Issue {{issue}}"}}'
```

```
Cost: $0 (within free tiers)
Effort: 3–4 hours to write and test the GitHub Action
```

**Option C — Wild Apricot**  
Wild Apricot includes a built-in document library and email blast tool. Upload the PDF to the document library, create a new page entry, send an email blast — all from the same admin panel. No code.

```
Cost: included in Wild Apricot subscription
Effort: 15 minutes per issue
```

---

### 4. Integrated Member Email List

#### Why

The site references a "member email list" — almost certainly a separate listserv (Mailman or similar) running independently of the website's member database. When someone joins, they're added to the listserv manually. When someone lapses, they stay on it. The two systems drift apart over time. Managing announcements requires access to the listserv system separately from the website. This is two systems doing one job.

#### Feature

Member list = site membership, automatically synchronized:

- Active members receive announcements
- Lapsed members stop receiving them when their account locks
- Officers send announcements from the same admin panel where they manage members
- Announcement types: newsletter publication, conference CFP, travel bursary deadline, book announcements, ad hoc officer communications
- Members can set preferences: which announcement types they receive

#### How to Build

**Option A — Outseta (simplest)**  
Outseta includes a broadcast email tool tied directly to membership status. Send to "all active members" with one click. No separate listserv, no sync job.

```
Cost: included in Outseta subscription
Effort: 0 — it's the default behavior
```

**Option B — WordPress + MailPoet**  
MailPoet syncs with MemberPress to automatically add/remove users from a "Members" list based on membership status. The newsletter editor uses MailPoet's drag-and-drop email builder to compose announcements.

```
Cost: MailPoet free up to 1,000 subscribers
Effort: 1–2 hours to configure the MemberPress sync
```

**Option C — Mailchimp + Zapier (platform-agnostic)**  
A Zapier automation watches for membership status changes and updates a Mailchimp audience tag accordingly. Announcements go through Mailchimp.

```
Zapier trigger: MemberPress membership activated/expired
Zapier action: Mailchimp — add/remove tag "active-member"
```

```
Cost: Zapier free tier (limited zaps) or ~$20/mo; Mailchimp free up to 500 contacts
Effort: 1 hour to set up Zapier automation
```

---

### 5. Officer Directory Self-Management

#### Why

The contact page is currently returning HTTP 404. The most likely cause: someone edited a file or changed a URL during an officer transition and broke the link. Nobody noticed because the webmaster wasn't watching, and whoever changed it didn't have the context to fix it. This will happen again with the next officer change unless the directory is managed through a form rather than by editing files.

#### Feature

A structured form in the admin panel, one per officer role:

| Field | Type |
|---|---|
| Role title | Locked (set by webmaster) |
| Name | Text |
| Institution | Text |
| Email address | Email |
| Profile URL | URL (optional) |
| Bio | Textarea (optional) |

Any officer with an "Officer" admin role can update their own entry. The contact page renders from the database — it's never a static file that can be accidentally broken.

When an officer changes, the outgoing officer (or webmaster) updates one form field. The page reflects it immediately.

#### How to Build

**Option A — WordPress (ACF Options Page)**  
Create an ACF Options page called "Officers." Each officer is a repeater row. The contact page template loops over the rows and renders the cards.

```php
// In functions.php
if (function_exists('acf_add_options_page')) {
    acf_add_options_page(['page_title' => 'Officers', 'menu_title' => 'Officers',
                          'capability' => 'edit_posts']);
}

// In contact-page-template.php
$officers = get_field('officers', 'option');
foreach ($officers as $officer) {
    echo '<div class="officer-card">';
    echo '<h3>' . esc_html($officer['name']) . '</h3>';
    echo '<p>' . esc_html($officer['role']) . ' — ' . esc_html($officer['institution']) . '</p>';
    echo '<a href="mailto:' . esc_attr($officer['email']) . '">' . esc_html($officer['email']) . '</a>';
    echo '</div>';
}
```

```
Cost: ACF free tier
Effort: 2 hours
```

**Option B — Custom PHP (if staying on current stack)**  
Add an `officers` table to the database. Build a simple admin form to update rows. The contact page queries the table on render.

```sql
CREATE TABLE officers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(100),
    name VARCHAR(150),
    institution VARCHAR(200),
    email VARCHAR(150),
    profile_url VARCHAR(300),
    display_order INT DEFAULT 0
);
```

```
Cost: $0
Effort: 3–4 hours
```

**Option C — Outseta / Wild Apricot**  
Both platforms allow creation of simple data forms. Store the officer directory as a managed data set updated through the admin UI.

```
Cost: included in platform subscription
Effort: 1 hour
```

---

### 6. Role-Based Access Control

#### Why

Currently, access is binary: you're either the webmaster with full server access, or you're an officer with no site access at all. The newsletter editor can't publish a newsletter without the webmaster. The blog editor can't post without the webmaster. The session organizer can't update conference listings. This makes the webmaster a bottleneck for every content change and creates single-point-of-failure risk.

#### Feature

Defined admin roles with scoped permissions:

| Role | Permissions |
|---|---|
| **Webmaster** | Full access to everything |
| **Newsletter Editor** | Upload PDFs, publish newsletter issues, send newsletter announcements |
| **Blog Editor** | Create and publish blog posts |
| **Session Organizer** | Edit conference/session listing pages |
| **Treasurer** | View and export member payment records (read-only) |
| **Officer** | Edit their own officer directory entry |

#### How to Build

**WordPress** handles this natively through its Roles and Capabilities system. Assign built-in roles (Editor, Author, Subscriber) or create custom roles with the Members plugin:

```php
// Create a custom "Newsletter Editor" role
add_role('newsletter_editor', 'Newsletter Editor', [
    'read'                    => true,
    'edit_posts'              => false,
    'upload_files'            => true,
    'publish_newsletter_issue'=> true, // custom capability
]);

// Grant capability only to newsletter post type
add_filter('user_has_cap', function($caps, $cap, $args) {
    if ($cap === 'publish_newsletter_issue') {
        $caps[$cap] = in_array('newsletter_editor', wp_get_current_user()->roles);
    }
    return $caps;
}, 10, 3);
```

**Outseta** and **Wild Apricot** both have built-in admin role systems configurable through their dashboards — no code.

```
Effort (WordPress): 2–3 hours with the Members plugin (free)
Effort (Outseta/Wild Apricot): 30 minutes of dashboard configuration
```

---

### 7. Webmaster Handoff Kit

#### Why

The current site exists primarily in one person's head. If Paul Coyne (current webmaster) is unavailable, nobody knows where the hosting account is, who pays the domain renewal, where the PayPal credentials are, or how to publish a newsletter. This is the root cause of the contact page being 404, the PayPal integration breaking silently, and content going years without updates. It will happen again to the next webmaster unless institutional knowledge is deliberately captured.

#### Feature

A private admin page (or a shared document with restricted access) containing:

**Credential Inventory**

| System | URL | Account holder | Login location | Renewal date |
|---|---|---|---|---|
| Hosting (e.g. DreamHost) | dreamhost.com | [name] | [email] | [date] |
| Domain registrar | [registrar] | [name] | [email] | [date] |
| PayPal / Stripe | paypal.com | [name] | [email] | — |
| GitHub | github.com/... | [name] | [email] | — |
| Email / Listserv | [provider] | [name] | [email] | — |
| SSL certificate | [auto via Let's Encrypt?] | — | — | [date] |

**Annual Calendar**

| Month | Task |
|---|---|
| January | Kalamazoo CFP deadline (check wmich.edu for exact date) |
| March/April | Spring newsletter deadline |
| May | Kalamazoo Congress |
| September/October | Fall newsletter deadline; Travel Bursary reminder |
| [Month] | Domain renewal |
| [Month] | Hosting renewal |

**Runbook** — step-by-step for every common task:

- How to publish a new newsletter issue
- How to manually activate a member if the payment webhook fails
- How to update the officer directory
- How to post a blog entry
- How to update conference session listings
- How to export the member list for the treasurer
- How to renew the SSL certificate if it lapses
- Who to call if the site goes down

#### How to Build

**Simplest:** A private Notion page or shared Google Doc with restricted access (officers only). Not elegant, but immediately useful.

**Better:** A password-protected `/admin/handbook` page on the site itself, rendered from Markdown files stored in the GitHub repository. The handbook lives with the codebase so it stays in sync with site changes.

**Best practice:** Store credentials in a shared password manager (1Password Teams, Bitwarden, or similar) with controlled officer access. The handbook documents *where* credentials are stored, not what they are.

```
Effort: 4–8 hours to write; 0 hours of code if using Notion/Google Docs
Cost: $0 (Google Docs) to ~$4/mo per user (1Password Teams)
```

---

## Part II — Academic Resource Features

These proposals address the president's concern about declining attendance and interest. The goal is to make societasmagica.org a destination scholars visit when they're working — not just when they're paying dues.

---

### 8. Living Bibliography

#### Why

Magic studies is genuinely interdisciplinary. Relevant books and articles appear in journals across history, religious studies, anthropology, classics, literature, Islamic studies, art history, Slavic studies, and more. No single database or journal catches all of it. Scholars regularly miss work published outside their home discipline. There is currently no curated, searchable bibliography of new publications in magic studies anywhere on the web. The Societas is the natural home for one.

Making it freely accessible (no login required) means it serves the entire field — including scholars who aren't yet members. That's a direct pipeline to membership growth.

#### Feature

A searchable database of publications in magic studies, updated quarterly by a volunteer editor:

- **Search** by keyword, author, or title
- **Filter** by:
  - Period: Ancient / Medieval / Early Modern / Modern / Contemporary
  - Region: Europe / Islamic world / East Asia / South Asia / Americas / Africa / Global
  - Subject: Ritual magic / Witchcraft / Alchemy / Astrology / Divination / Folk magic / Learned magic / Demonology
  - Type: Monograph / Article / Edited volume / Chapter / Dissertation
- **Submit a citation** form — members flag works the editor missed
- **RSS feed** — subscribe to new additions
- **ORCID integration** — link entries to author ORCID profiles

Each entry: author, title, year, publisher/journal, DOI/URL, period covered, region, subject tags, brief annotation (optional).

#### How to Build

**Option A — WordPress + FacetWP + Custom Post Type**  

```php
// Register 'publication' custom post type
register_post_type('publication', [
    'label'       => 'Publications',
    'public'      => true,
    'has_archive' => true,
    'supports'    => ['title', 'editor', 'custom-fields'],
]);

// Register taxonomies
register_taxonomy('pub_period',  'publication', ['label' => 'Period']);
register_taxonomy('pub_region',  'publication', ['label' => 'Region']);
register_taxonomy('pub_subject', 'publication', ['label' => 'Subject']);
register_taxonomy('pub_type',    'publication', ['label' => 'Type']);
```

FacetWP adds the filter UI and search with no additional code. The submission form is Gravity Forms or WPForms pointing to a draft post.

```
Cost: FacetWP ~$99/yr; WPForms free tier
Effort: 1–2 days
```

**Option B — Airtable (no-code)**  
Build the bibliography as an Airtable base. Embed the public Airtable view on the site. Members submit via an Airtable form. The editor approves entries in the Airtable UI.

```
Cost: Airtable free tier (up to 1,000 records) or Plus ~$10/mo
Effort: 2–3 hours to set up the base and embed
```

**Option C — Static JSON + Client-Side Search**  
Store the bibliography as a `bibliography.json` file in the GitHub repo. A volunteer editor adds entries as JSON objects. A JavaScript search and filter UI (using Fuse.js for fuzzy search) runs entirely client-side with no backend.

```json
{
  "entries": [
    {
      "author": "Kieckhefer, Richard",
      "title": "Magic in the Middle Ages",
      "year": 2000,
      "type": "monograph",
      "publisher": "Cambridge University Press",
      "period": ["medieval"],
      "region": ["europe"],
      "subject": ["learned-magic", "ritual-magic"],
      "doi": "10.1017/...",
      "annotation": "The standard introduction to medieval magic."
    }
  ]
}
```

```
Cost: $0
Effort: 4–6 hours to build the search UI; ongoing effort is editorial (JSON editing)
```

---

### 9. Dissertation Registry

#### Why

Graduate students are where new conference attendees, new members, and new scholarship come from. The newsletter solicits dissertation notices, but they're buried in PDFs. There is no searchable record of who is working on what. Two grad students at different institutions might be working on the same manuscript tradition without knowing it. A searchable registry changes that — and it positions the Societas as the place graduate students register their scholarly identity in the field.

#### Feature

A searchable list of completed and in-progress dissertations:

| Field | Notes |
|---|---|
| Author name | |
| Institution | |
| Advisor | |
| Title | |
| Status | In Progress / Completed |
| Year completed | If completed |
| Abstract | 150–300 words |
| Tags | Period, region, subject (same taxonomy as bibliography) |
| Link | ProQuest, institutional repository, or personal page |
| Contact | Optional — "open to correspondence" toggle |

**The "open to correspondence" toggle** is particularly valuable: it lets another researcher or a conference organizer reach out to the dissertation author directly.

Completed dissertations feed automatically into the bibliography with a "Dissertation" type tag.

#### How to Build

Identical architecture to the bibliography (Custom Post Type or Airtable). Add a second post type `dissertation` with the additional fields (advisor, institution, status, year). The same FacetWP filter UI covers both.

A member-submitted form (Gravity Forms or an Airtable form) lets grad students self-register their dissertations. An editor approves entries before they go live.

```
Effort: 4 hours if built alongside the bibliography (shared infrastructure)
Cost: No additional cost beyond what the bibliography requires
```

---

### 10. Field-Wide Conference Calendar

#### Why

Magic studies scholars present at dozens of conferences beyond Kalamazoo — Medieval Studies, Renaissance Studies, History of Science, AAR, SBL, ASOR, ACMRS, and many others. There is no central place to see CFPs and conference dates across the whole field. Scholars miss submission deadlines because they weren't watching the right mailing list. The Societas currently lists only its own sessions, which makes the conference page feel parochial.

A field-wide calendar makes the site worth bookmarking. It also positions the Societas as infrastructure for the field rather than a self-promotional brochure.

#### Feature

A public calendar and CFP list:

- **List view** sorted by deadline (what's due soonest)
- **Calendar view** for conference dates
- **Filter** by type: Conference / CFP / Workshop / Seminar / Lecture series
- **Member submission form** — "Add a CFP" available to logged-in members
- **Monthly digest email** — "Upcoming deadlines this month" sent to the member list on the 1st

Each entry: event name, dates, location (or "Virtual"), CFP deadline (if applicable), URL, brief description of relevance to magic studies.

#### How to Build

**Option A — WordPress + The Events Calendar plugin**  
The Events Calendar (free) handles the calendar view and list view. Add custom fields for "CFP deadline" and "submission URL" via ACF. Members submit events via a frontend form (The Events Calendar PRO includes a submission form, or use Gravity Forms).

```
Cost: The Events Calendar free; PRO ~$89/yr for frontend submission
Effort: 3–4 hours
```

**Option B — Google Calendar embed**  
A shared Google Calendar maintained by a volunteer editor, embedded on the site. Simple but not searchable or filterable.

```
Cost: $0
Effort: 1 hour
```

**Option C — Custom post type with deadline-aware query**  

```php
// Query upcoming CFPs sorted by deadline
$args = [
    'post_type'  => 'cfp_event',
    'meta_key'   => 'deadline_date',
    'orderby'    => 'meta_value',
    'order'      => 'ASC',
    'meta_query' => [['key' => 'deadline_date', 'value' => date('Y-m-d'), 'compare' => '>=']],
];
$upcoming = new WP_Query($args);
```

```
Cost: $0
Effort: 1 day
```

**Monthly digest automation:**  
On the 1st of each month, a WordPress cron job queries CFPs with deadlines in the current month and sends an email via MailPoet to the member list.

```php
// wp-cron hook registered in functions.php
add_action('monthly_cfp_digest', function() {
    $cfps = get_upcoming_cfps(date('Y-m'));
    if (!empty($cfps)) mailpoet_send_digest($cfps);
});
if (!wp_next_scheduled('monthly_cfp_digest')) {
    wp_schedule_event(strtotime('first day of this month midnight'), 'monthly', 'monthly_cfp_digest');
}
```

---

### 11. Rich Member Profiles as Scholar Discovery

#### Why

The current member directory is a login-gated list of names. It is not a tool for finding collaborators, peer reviewers, or conference session participants. A magic studies scholar trying to find a reviewer for a paper on Islamicate astrological magic has no way to search the directory for members with that specialty. This is a missed opportunity — the member database is actually a directory of the field's expertise, but it's being used only as a phone book.

#### Feature

Richer profiles visible to logged-in members:

| Field | Notes |
|---|---|
| Name, title, institution | |
| Research interests | Free text + controlled vocabulary tags |
| Current projects | What are you working on right now |
| Recent publications | Manually entered, or pulled via ORCID |
| Languages of research | |
| Career stage | Faculty / Independent / Postdoc / Graduate student / Emeritus |
| Available for | Peer review / Dissertation committees / Conference organization / Media consultation |
| Contact preference | Email / Via website form / Not listed |

**ORCID integration** is the key technical detail: members link their ORCID profile, and their recent publications populate automatically. No manual entry of publication lists.

**Tag-based search** is what makes it useful: "Find all members who tag 'Islamic occult sciences' and are available for peer review."

#### How to Build

**Option A — Outseta**  
Outseta's People profiles support custom fields. Add the fields above in the Outseta dashboard. The member directory is a built-in view that members can search (scoped to logged-in users only).

```
Cost: included in Outseta subscription
Effort: 2 hours of custom field configuration; no code
```

**Option B — WordPress + Ultimate Member plugin**  
Ultimate Member handles the login-gated member directory with custom profile fields and tag search. Add the ORCID field; pull publications via the ORCID public API.

```php
// Fetch publications from ORCID public API
function get_orcid_publications($orcid_id) {
    $url      = "https://pub.orcid.org/v3.0/{$orcid_id}/works";
    $response = wp_remote_get($url, [
        'headers' => ['Accept' => 'application/json']
    ]);
    $data = json_decode(wp_remote_retrieve_body($response), true);
    return $data['group'] ?? [];
}
```

```
Cost: Ultimate Member free; Pro extensions ~$249/yr if advanced directory needed
Effort: 1 day including ORCID integration
```

**Option C — Wild Apricot**  
Wild Apricot's member profiles support custom fields and a searchable member directory. ORCID integration is not built in but can be added via a custom field with a URL.

```
Cost: included in Wild Apricot subscription
Effort: 2 hours of configuration
```

---

### 12. Expanded Ars Magica Blog

#### Why

The blog currently has one post from July 2021. That's not a blog — it's a broken signal. A dormant blog tells visitors the organization is also dormant. A blog with six to eight posts a year, actively solicited from the membership, does three things: it gives scholars a venue for work that's too short for an article but too developed for a newsletter note; it makes the site findable via search engines (every post title is a potential search result); and it creates a reason to share the Societas on social media.

The editorial lift is modest — two editors, a small stable of regular contributors, a submission queue, and a publishing calendar.

#### Feature

**Post types that work for this audience:**

| Format | Description | Length |
|---|---|---|
| Research preview | Scholar shares findings from a project in progress — invites feedback | 800–1,200 words |
| Source spotlight | Close reading of a single underused primary source | 600–1,000 words |
| Field bridge | "What magic studies offers to [adjacent field]" | 800–1,500 words |
| Conference report | Summary of a major session with links to papers | 500–800 words |
| New book forum | Author intro + two short responses | 2,000–3,000 words total |
| Dissertation spotlight | Grad student introduces their project in plain language | 600–800 words |
| Pedagogical post | "How I teach X to undergrads" | 600–1,000 words |

**The dissertation spotlight** is the highest-leverage format: it recruits grad students as contributors, introduces them to the membership, and feeds the dissertation registry.

**Editorial calendar target:** 6–8 posts per year. Two editors alternate solicitation and editing duties.

#### How to Build

WordPress handles this with zero additional plugins. The only infrastructure needed is:

- A blog post submission form (Gravity Forms or a simple email-to-editors process)
- An editorial workflow (Draft → Review → Scheduled → Published)
- A "contributor bio" system (Author profile page, or a custom field on each post)
- An RSS feed (WordPress provides this automatically)
- Social sharing buttons (any sharing plugin)

**The social layer:** Each post should auto-post to the Societas's Bluesky and/or Mastodon account on publication. This is a single Zapier or Make.com automation.

```
Effort: 0 additional code if on WordPress; 2 hours for sharing automation
Cost: $0 for the blog; ~$20/mo for Zapier if used for social posting
The real cost is editorial time — estimate 3–4 hours per post for solicitation, editing, and publication.
```

---

### 13. Open-Access Working Papers Repository

#### Why

Many scholars have conference papers, grant reports, or draft chapters that are more substantial than a blog post but not ready for journal submission. These currently sit on hard drives and are never cited. A working paper repository gives them a stable URL, a citable record, and a path to discovery. The model exists in economics (SSRN, NBER) and philosophy (PhilArchive) but has not been implemented for magic studies.

Papers hosted here get cited in bibliographies. Those citations carry the Societas Magica URL. Over time, this is significant organic visibility.

#### Feature

A member-uploadable repository of working papers:

| Field | Notes |
|---|---|
| Title | |
| Author(s) | |
| Date posted | |
| Abstract | |
| Keywords | Same taxonomy as bibliography |
| PDF | Uploaded file |
| Status | Working paper / Conference paper / Under review (no journal name) |
| Suggested citation | Auto-generated from metadata |
| DOI | Optional — can be minted via Zenodo integration |

Papers are reviewed by an editor for basic fit before going live (not peer reviewed, but not completely unfiltered).

**Zenodo integration:** Zenodo (run by CERN) mints free DOIs for any uploaded document. A Zenodo community for the Societas Magica means every working paper has a permanent, citable DOI. This is free and requires no infrastructure.

#### How to Build

**Option A — Zenodo Community (no-code, immediate)**  
Create a Zenodo community at zenodo.org/communities. Members upload directly to Zenodo, select the Societas community, and the paper appears in the community listing after editor approval. Embed the community feed on the Societas website via Zenodo's API.

```
Cost: $0
Effort: 1 hour to set up the community; embed is a simple API call
```

```javascript
// Fetch working papers from Zenodo community API
fetch('https://zenodo.org/api/records?communities=societas-magica&sort=newest')
  .then(r => r.json())
  .then(data => {
    data.hits.hits.forEach(paper => {
      // render paper.metadata.title, paper.metadata.creators, paper.links.record
    });
  });
```

**Option B — WordPress Custom Post Type**  
Same architecture as the bibliography, with a file upload field for the PDF.

```
Cost: $0 beyond existing WordPress setup
Effort: 3–4 hours
```

---

### 14. Expert / Media Directory (Public-Facing)

#### Why

Journalists, documentary makers, museum curators, and screenwriters regularly need academic experts on magic and witchcraft. Right now they search Google and find whoever has the highest SEO presence — which is not necessarily the most qualified or the most willing to engage with media. The Societas could be the legitimate gateway to expert contact for the field.

This serves scholars directly: media engagements appear in promotion dossiers under "public engagement." Being listed as an available expert is a career benefit.

#### Feature

A public-facing subset of the member directory — members who opt in to media inquiries:

| Field | Notes |
|---|---|
| Name and title | |
| Institution | |
| Expertise areas | Controlled vocabulary + free text |
| Period and region | |
| Languages spoken | For international journalists |
| Available for | Print interview / Podcast / Documentary / Museum consultation / School visits |
| Contact | Email or web form (not phone by default) |

This page requires no login. It is indexed by Google. A journalist searching "expert medieval witchcraft academic" should find it.

**Opt-in only:** Members check a box in their profile to appear here. Default is not listed.

#### How to Build

A filtered view of the member directory, restricted to members with `media_available = true`. On WordPress with Ultimate Member, this is a shortcode with a filter parameter. On Outseta, it's a public-facing member list filtered by a custom field value.

```php
// WordPress shortcode for public expert directory
add_shortcode('expert_directory', function() {
    $experts = get_users(['meta_key' => 'media_available', 'meta_value' => '1']);
    ob_start();
    foreach ($experts as $expert) {
        $name        = get_user_meta($expert->ID, 'display_name', true);
        $institution = get_user_meta($expert->ID, 'institution', true);
        $areas       = get_user_meta($expert->ID, 'expertise_areas', true);
        // render card
    }
    return ob_get_clean();
});
```

```
Cost: $0 additional
Effort: 2–3 hours
```

---

### 15. Virtual Event Infrastructure

#### Why

In-person conference attendance across academia has not fully recovered post-2020. Travel costs have risen. Visa access is uneven. Some of the society's most active scholars — particularly those in non-Anglophone countries or without institutional travel budgets — cannot get to Kalamazoo reliably. Virtual events extend the Societas's reach to these members and create a reason to maintain active membership even in years when travel isn't possible.

#### Feature

**Annual Lecture Series**
One invited lecture per year, recorded and posted on the site. Free to all (including non-members — this is a visibility play). Members get advance registration and a live Q&A period.

**Pre-Conference Virtual Roundtable**
Two weeks before Kalamazoo, a 90-minute Zoom session where session organizers preview their sessions. Scholars who can't attend in person can ask questions in advance. Session organizers collect remote questions to put to presenters. This extends the reach of Kalamazoo sessions without requiring any travel.

**Virtual Working Groups**
Small groups (6–12 members) meeting quarterly via Zoom around a shared text, theme, or manuscript tradition. The site lists current working groups and how to request to join. Groups self-organize; the Societas provides the calendar listing and Zoom link.

**Graduate Student Mentorship Cohorts**
Pairing advanced graduate students with junior faculty or senior scholars by research area. Structured check-ins over an academic semester. Advertised through the newsletter and dissertation registry.

#### How to Build

**Zoom:** The Societas needs one paid Zoom account (~$15/mo) for hosted events. Webinars (for the annual lecture) require the Webinar add-on (~$150/yr for up to 500 attendees).

**Recording and hosting:** Recorded lectures can be hosted on the Societas's YouTube channel (free) or Vimeo (~$7/mo). Embed on the website.

**Event registration:** Eventbrite free tier handles registration for virtual events. Or use the website's built-in forms.

**Working group listings:** A simple custom post type `working_group` with fields for topic, organizer, meeting frequency, and a contact link. Members browse and request to join.

```
Total cost: ~$200/yr for Zoom + Vimeo
Effort to set up: 2–3 hours; ongoing effort is purely organizational
```

---

## Summary Table

| Proposal | Addresses | Platform fit | Effort | Cost/yr |
|---|---|---|---|---|
| Member dashboard + CSV export | Admin QoL | Any | Low | Included |
| Automated dues lifecycle | Admin QoL | Any | Low–Med | Included |
| Newsletter upload interface | Admin QoL | WordPress, static | Med | Included |
| Integrated email list | Admin QoL | Any | Low | Included |
| Officer directory self-management | Admin QoL | Any | Low | Included |
| Role-based access | Admin QoL | Any | Low | Included |
| Webmaster handoff kit | Admin QoL | Any | Low | $0–$50 |
| Living bibliography | Academic resource | WordPress, Airtable | Med | $0–$100 |
| Dissertation registry | Academic resource | WordPress, Airtable | Med | Included |
| Conference calendar + CFP digest | Academic resource | WordPress | Med | $0–$90 |
| Rich member profiles + ORCID | Academic resource | WordPress, Outseta | Med–High | $0–$250 |
| Expanded blog + editorial program | Academic resource | WordPress | Low (code) | $0 |
| Working papers + Zenodo | Academic resource | Zenodo + any | Low | $0 |
| Expert / media directory | Academic resource | WordPress, Outseta | Low | $0 |
| Virtual event infrastructure | Academic resource | Zoom + YouTube | Low (code) | ~$200 |

**Phase 1 (first 3 months):** Items 1–7 (admin stability) + blog editorial program + conference calendar  
**Phase 2 (months 4–9):** Bibliography + dissertation registry + rich member profiles  
**Phase 3 (ongoing):** Working papers + virtual events + expert directory  

---

*This document is part of the [Societas Magica Webmaster Field Guide](https://t3dy.github.io/SocietasMagicaWebmaster).*
