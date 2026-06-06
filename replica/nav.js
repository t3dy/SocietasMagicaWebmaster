/* Shared nav, banner, and footer for every page */
(function () {
  const path = location.pathname.split('/').pop() || 'index.html';

  const navItems = [
    ['index.html',          'Home'],
    ['action-map.html',     'Action Map'],
    ['membership.html',     'Membership'],
    ['newsletters.html',    'Newsletters'],
    ['publications.html',   'Publications'],
    ['conferences.html',    'Conferences'],
    ['manuscripts.html',    'Manuscripts'],
    ['syllabus.html',       'Syllabus Project'],
    ['blog.html',           'Ars Magica Blog'],
    ['contact.html',        'Contact Us'],
  ];

  /* ── Banner ── */
  const banner = document.createElement('header');
  banner.id = 'site-banner';
  banner.innerHTML = `
    <h1><a href="index.html" style="color:inherit;text-decoration:none;">Societas Magica</a></h1>
    <p>Communication and Exchange among Scholars Interested in the Study of Magic</p>
  `;

  /* ── Nav ── */
  const nav = document.createElement('nav');
  nav.id = 'site-nav';
  nav.setAttribute('aria-label', 'Primary');
  const ul = document.createElement('ul');
  navItems.forEach(([href, label]) => {
    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href  = href;
    a.textContent = label;
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
    li.appendChild(a);
    ul.appendChild(li);
  });
  nav.appendChild(ul);

  /* ── Footer ── */
  const footer = document.createElement('footer');
  footer.id = 'site-footer';
  footer.innerHTML = `
    <div class="footer-inner">
      <span>© 1994–2026 Societas Magica — All Rights Reserved</span>
      <div class="footer-links">
        <a href="privacy.html">Privacy Policy</a>
        <a href="terms.html">Terms of Use</a>
        <a href="login.html">Member Login</a>
        <a href="contact.html">Contact Us</a>
      </div>
    </div>
  `;

  /* ── Insert ── */
  const body = document.body;
  body.insertBefore(nav, body.firstChild);
  body.insertBefore(banner, nav);
  body.appendChild(footer);
})();
