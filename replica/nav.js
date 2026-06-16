/* Shared header (announce bar + site header + nav) and footer */
(function () {
  const path = location.pathname.split('/').pop() || 'index.html';

  const navItems = [
    ['index.html',       'Home'],
    ['membership.html',  'Membership'],
    ['members.html',     'Members'],
    ['newsletters.html', 'Newsletters'],
    ['calendar.html',    'Calendar & CFPs'],
    ['bibliography.html','Bibliography'],
    ['blog.html',        'Blog'],
    ['contact.html',     'Contact'],
  ];

  /* ── Announcement bar ── */
  const announce = document.createElement('div');
  announce.id = 'site-announce';
  announce.innerHTML = 'New — Vol. 33 No. 1 (Spring 2025) newsletter now available. &nbsp;<a href="newsletters.html">Download PDF →</a>';

  /* ── Site header ── */
  const header = document.createElement('header');
  header.id = 'site-header';

  const sigilWrap = document.createElement('a');
  sigilWrap.href = 'index.html';
  sigilWrap.className = 'site-sigil';
  sigilWrap.setAttribute('aria-hidden', 'true');
  const sigilImg = document.createElement('img');
  sigilImg.src = 'sigil-gold.png';
  sigilImg.alt = 'Societas Magica sigil';
  sigilImg.className = 'site-sigil-img';
  sigilWrap.appendChild(sigilImg);

  const wordmark = document.createElement('a');
  wordmark.href = 'index.html';
  wordmark.className = 'site-wordmark';
  wordmark.textContent = 'Societas Magica';

  const nav = document.createElement('nav');
  nav.id = 'site-nav';
  nav.setAttribute('aria-label', 'Primary');

  navItems.forEach(([href, label]) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
    nav.appendChild(a);
  });

  const toggle = document.createElement('button');
  toggle.className = 'nav-toggle';
  toggle.setAttribute('aria-label', 'Toggle navigation');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = '&#9776;';

  const loginBtn = document.createElement('a');
  loginBtn.href = 'login.html';
  loginBtn.className = 'site-login-btn';
  loginBtn.textContent = 'Member login';

  header.appendChild(sigilWrap);
  header.appendChild(wordmark);
  header.appendChild(nav);
  header.appendChild(toggle);
  header.appendChild(loginBtn);

  /* ── Hamburger toggle ── */
  toggle.addEventListener('click', function () {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.innerHTML = open ? '&#10005;' : '&#9776;';
  });

  /* ── Footer ── */
  const footer = document.createElement('footer');
  footer.id = 'site-footer';
  footer.innerHTML = `
    <div class="footer-inner">
      <span>&#169; 1994&#8211;2026 Societas Magica &#8212; All Rights Reserved</span>
      <div class="footer-links">
        <a href="privacy.html">Privacy Policy</a>
        <a href="terms.html">Terms of Use</a>
        <a href="contact.html">Contact</a>
        <a href="login.html">Member Login</a>
      </div>
    </div>
  `;

  /* ── Insert into page ── */
  const body = document.body;
  body.insertBefore(header, body.firstChild);
  body.insertBefore(announce, header);
  body.appendChild(footer);
})();
