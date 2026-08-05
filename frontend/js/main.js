/**
 * Portfolio CMS — Main Portfolio JavaScript
 * Handles data loading, rendering & interactions
 */

/* ── State ── */
let allSkills = [];
let allProjects = [];
let searchTimer = null;

/* ── Init ── */
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initNavbar();
  initParticles();
  initScrollAnimations();
  initBackToTop();
  document.getElementById('footer-year').textContent = new Date().getFullYear();

  // Wake up Render backend (free tier sleeps after 15 min inactivity)
  // Show a loading notice if it takes more than 3 seconds
  const wakeTimer = setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading) {
      const msg = loading.querySelector('p') || document.createElement('p');
      msg.textContent = 'Starting server, please wait...';
      msg.style.cssText = 'color:#888;font-size:0.9rem;margin-top:8px;';
      loading.appendChild(msg);
    }
  }, 3000);

  // Ping health endpoint to wake up backend before loading data
  try { await fetch(`${API_BASE}/actuator/health`, { signal: AbortSignal.timeout(55000) }); } catch (_) {}
  clearTimeout(wakeTimer);

  await Promise.allSettled([
    loadProfile(),
    loadSkills(),
    loadProjects(),
    loadExperience(),
    loadEducation(),
    loadCertifications(),
    loadAchievements(),
    loadSettings(),
  ]);

  hideLoading();
  initTypingEffect();
  initSkillBars();
  initProjectSearch();
  initContactForm();
  initModal();
});

/* ── Loading Screen ── */
function hideLoading() {
  const screen = document.getElementById('loading-screen');
  setTimeout(() => screen.classList.add('hidden'), 500);
}

/* ── Theme ── */
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.body.classList.toggle('dark-mode', saved === 'dark');
  updateThemeIcon();

  document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
  });
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  const isDark = document.body.classList.contains('dark-mode');
  icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

/* ── Navbar ── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    highlightActiveSection();
  });

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

function highlightActiveSection() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY = window.scrollY + 100;
  let current = '';
  sections.forEach(section => {
    if (scrollY >= section.offsetTop) current = section.id;
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}

/* ── Particles ── */
function initParticles() {
  const container = document.getElementById('hero-particles');
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 40 + 10;
    const colors = ['rgba(108,99,255,0.3)', 'rgba(196,113,237,0.3)', 'rgba(246,79,89,0.2)', 'rgba(255,215,0,0.2)'];
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      animation-duration:${Math.random()*15+10}s;
      animation-delay:${Math.random()*10}s;
      background:${colors[Math.floor(Math.random()*colors.length)]};
    `;
    container.appendChild(p);
  }
}

/* ── Scroll Animations ── */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('scroll-reveal');
    observer.observe(section);
  });
}

/* ── Back to Top ── */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── Typing Effect ── */
function initTypingEffect() {
  const el = document.getElementById('hero-typed');
  const titles = window._profileTitles || ['Full Stack Developer', 'Problem Solver', 'Tech Enthusiast'];
  let ti = 0, ci = 0, deleting = false;

  function type() {
    const current = titles[ti % titles.length];
    el.textContent = deleting ? current.substring(0, ci--) : current.substring(0, ci++);

    if (!deleting && ci > current.length) {
      deleting = true;
      setTimeout(type, 2000);
    } else if (deleting && ci < 0) {
      deleting = false; ti++;
      setTimeout(type, 500);
    } else {
      setTimeout(type, deleting ? 50 : 100);
    }
  }
  type();
}

/* ── Skill Bars ── */
function initSkillBars() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
          bar.style.width = bar.dataset.width + '%';
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const grid = document.getElementById('skills-grid');
  if (grid) observer.observe(grid);
}

/* ── DATA LOADERS ── */
async function loadProfile() {
  try {
    let res = await api.profile();
    // Retry once if backend returned an error (can happen during cold start)
    if (!res.success) {
      await new Promise(r => setTimeout(r, 3000));
      res = await api.profile();
    }
    if (!res.success) return;
    const p = res.data;

    // Hero
    document.getElementById('hero-name').textContent = p.name || 'Your Name';
    document.getElementById('hero-bio').textContent = p.bio || '';
    document.getElementById('nav-logo-text').textContent = p.name || 'Portfolio';
    document.getElementById('footer-name').textContent = p.name || 'Portfolio';
    document.title = `${p.name || 'Portfolio'} | ${p.title || ''}`;

    window._profileTitles = [p.title || 'Developer', 'Problem Solver', 'Tech Enthusiast'];

    if (p.profileImageUrl) {
      const imgUrl = getMediaUrl(p.profileImageUrl);
      const heroPhoto = document.getElementById('hero-photo');
      const placeholder = document.getElementById('hero-photo-placeholder');
      
      // Load hero profile photo securely
      heroPhoto.onerror = function() {
        console.error("PROFILE IMAGE FAILED");
        this.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
      };
      
      heroPhoto.onload = function() {
        console.log("PROFILE IMAGE LOADED");
        if (this.naturalWidth > 0) {
          this.style.display = 'block';
          if (placeholder) placeholder.style.display = 'none';
        } else {
          this.onerror();
        }
      };
      
      heroPhoto.src = imgUrl;
      
      document.getElementById('about-photo').onerror = function() {
        this.src = 'https://via.placeholder.com/400x400?text=Photo';
      };
      document.getElementById('about-photo').src = imgUrl;
    } else {
      document.getElementById('hero-photo').style.display = 'none';
      const placeholder = document.getElementById('hero-photo-placeholder');
      if (placeholder) placeholder.style.display = 'flex';
      
      document.getElementById('about-photo').src = 'https://via.placeholder.com/400x400?text=Photo';
    }

    if (p.heroBackgroundUrl) {
      const bgUrl = getMediaUrl(p.heroBackgroundUrl);
      const heroBg = document.getElementById('hero-bg');
      if (heroBg) {
        let img = new Image();
        img.onerror = function() {
           heroBg.style.backgroundImage = `none`;
        };
        img.onload = function() {
           heroBg.style.backgroundImage = `url(${bgUrl})`;
        };
        img.src = bgUrl;
      }
    }

    document.getElementById('about-title').textContent = p.title || '';
    document.getElementById('about-bio').textContent = p.bio || '';
    document.getElementById('about-objective').textContent = p.careerObjective || '';

    // Details
    const details = document.getElementById('about-details');
    details.innerHTML = [
      p.email && `<div class="detail-item"><i class="fas fa-envelope"></i><span>${p.email}</span></div>`,
      p.phone && `<div class="detail-item"><i class="fas fa-phone"></i><span>${p.phone}</span></div>`,
      p.location && `<div class="detail-item"><i class="fas fa-map-marker-alt"></i><span>${p.location}</span></div>`,
    ].filter(Boolean).join('');

    // Contact
    if (p.email) {
      const el = document.getElementById('contact-email');
      el.textContent = p.email; el.href = `mailto:${p.email}`;
    }
    if (p.phone) {
      const el = document.getElementById('contact-phone');
      el.textContent = p.phone; el.href = `tel:${p.phone}`;
    }
    document.getElementById('contact-location').textContent = p.location || '';

    // Social links
    if (p.socialLinks && p.socialLinks.length) {
      renderSocialLinks(p.socialLinks);
    }

    // Resume button — use API_BASE so it works in production too
    const resumeUrl = `${API_BASE}/api/public/resume`;
    document.getElementById('resume-btn').href = resumeUrl;
    document.getElementById('about-resume-btn').href = resumeUrl;

  } catch (err) {
    console.error('Profile load error:', err);
  }
}

function renderSocialLinks(links) {
  const html = links.map(l => `
    <a href="${l.url || '#'}" target="_blank" rel="noopener" class="social-link" title="${l.platform || ''}">
      <i class="${l.icon || 'fas fa-link'}"></i>
    </a>
  `).join('');
  document.getElementById('hero-social').innerHTML = html;

  const contactHtml = links.map(l => `
    <a href="${l.url || '#'}" target="_blank" rel="noopener" class="contact-social-link" title="${l.platform || ''}">
      <i class="${l.icon || 'fas fa-link'}"></i>
    </a>
  `).join('');
  document.getElementById('contact-social').innerHTML = contactHtml;
}

async function loadSkills() {
  try {
    const res = await api.skills();
    if (!res.success) return;
    allSkills = res.data || [];
    renderSkills(allSkills);
    renderSkillFilters(allSkills);
  } catch (e) { console.error(e); }
}

function renderSkillFilters(skills) {
  const categories = [...new Set(skills.map(s => s.category))].filter(Boolean);
  const filter = document.getElementById('skills-filter');
  filter.innerHTML = `
    <button class="filter-btn active" data-cat="all">All</button>
    ${categories.map(c => `<button class="filter-btn" data-cat="${c}">${c}</button>`).join('')}
  `;
  filter.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filter.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      renderSkills(cat === 'all' ? allSkills : allSkills.filter(s => s.category === cat));
      setTimeout(initSkillBars, 100);
    });
  });
}

function renderSkills(skills) {
  const grid = document.getElementById('skills-grid');
  if (!skills.length) {
    grid.innerHTML = '<div class="loading-placeholder">No skills added yet.</div>';
    return;
  }
  grid.innerHTML = skills.map(s => `
    <div class="skill-card">
      <div class="skill-header">
        <div class="skill-icon">
          <i class="${s.icon || 'fas fa-code'}"></i>
        </div>
        <span class="skill-name">${esc(s.name)}</span>
        <span class="skill-percent">${s.percentage || 0}%</span>
      </div>
      <div class="skill-bar-track">
        <div class="skill-bar-fill" data-width="${s.percentage || 0}" style="width:0"></div>
      </div>
      <span class="skill-category-badge">${esc(s.category || '')}</span>
    </div>
  `).join('');
}

async function loadProjects() {
  try {
    const res = await api.projects();
    if (!res.success) return;
    allProjects = res.data || [];

    // Stats
    const pCount = document.querySelector('#stat-projects .stat-num');
    if (pCount) animateCounter(pCount, allProjects.length);

    renderProjects(allProjects);
  } catch (e) { console.error(e); }
}

function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  if (!projects.length) {
    grid.innerHTML = '<div class="loading-placeholder">No projects added yet.</div>';
    return;
  }
  grid.innerHTML = projects.map(p => {
    const img = p.images?.find(i => i.isPrimary) || p.images?.[0];
    const techs = (p.technologies || []).slice(0, 4);
    return `
      <div class="project-card" onclick="openProjectModal(${p.id})">
        ${p.featured ? '<span class="project-featured-badge">⭐ Featured</span>' : ''}
        <div class="project-img-wrapper">
          ${img
            ? `<img src="${getMediaUrl(img.imageUrl)}" alt="${esc(p.title)}" class="project-img" loading="lazy" />`
            : `<div class="project-img-placeholder"><i class="fas fa-laptop-code"></i></div>`}
        </div>
        <div class="project-body">
          <h3 class="project-title">${esc(p.title)}</h3>
          <p class="project-desc">${esc(p.description || '')}</p>
          <div class="project-techs">${techs.map(t => `<span class="tech-tag">${esc(t)}</span>`).join('')}${p.technologies?.length > 4 ? `<span class="tech-tag">+${p.technologies.length - 4}</span>` : ''}</div>
          <div class="project-links" onclick="event.stopPropagation()">
            ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" rel="noopener" class="project-link github"><i class="fab fa-github"></i> GitHub</a>` : ''}
            ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank" rel="noopener" class="project-link demo"><i class="fas fa-external-link-alt"></i> Demo</a>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function initProjectSearch() {
  const input = document.getElementById('project-search');
  if (!input) return;
  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      const q = input.value.trim();
      if (!q) { renderProjects(allProjects); return; }
      try {
        const res = await api.projects(q);
        if (res.success) renderProjects(res.data);
      } catch (e) { console.error(e); }
    }, 400);
  });
}

async function loadExperience() {
  try {
    const res = await api.experience();
    if (!res.success) return;
    const items = res.data || [];
    const container = document.getElementById('experience-timeline');
    if (!items.length) {
      container.innerHTML = '<div class="loading-placeholder">No experience added yet.</div>';
      return;
    }
    container.innerHTML = items.map(e => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="timeline-header">
            <h3 class="timeline-title">${esc(e.role || e.company)}</h3>
            <span class="timeline-date"><i class="fas fa-calendar"></i> ${formatDateRange(e.startDate, e.endDate, e.current)}</span>
          </div>
          <div class="timeline-subtitle">${esc(e.company)}${e.location ? ' · ' + esc(e.location) : ''}</div>
          ${e.type ? `<span class="timeline-type">${esc(e.type)}</span>` : ''}
          ${e.description ? `<p class="timeline-desc">${esc(e.description)}</p>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) { console.error(err); }
}

async function loadEducation() {
  try {
    const res = await api.education();
    if (!res.success) return;
    const items = res.data || [];
    const container = document.getElementById('education-timeline');
    if (!items.length) {
      container.innerHTML = '<div class="loading-placeholder">No education added yet.</div>';
      return;
    }
    container.innerHTML = items.map(e => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="timeline-header">
            <h3 class="timeline-title">${esc(e.institution)}</h3>
            <span class="timeline-date"><i class="fas fa-calendar"></i> ${formatDateRange(e.startDate, e.endDate, e.current)}</span>
          </div>
          <div class="timeline-subtitle">${esc(e.degree || '')}${e.fieldOfStudy ? ' · ' + esc(e.fieldOfStudy) : ''}</div>
          ${e.grade ? `<span class="timeline-type">Grade: ${esc(e.grade)}</span>` : ''}
          ${e.description ? `<p class="timeline-desc">${esc(e.description)}</p>` : ''}
        </div>
      </div>
    `).join('');

    // Count credentials stats
    const cCount = document.querySelector('#stat-certs .stat-num');
    if (cCount) {
      try {
        const cr = await api.certificates();
        if (cr.success) animateCounter(cCount, cr.data?.length || 0);
      } catch {}
    }
  } catch (err) { console.error(err); }
}

async function loadCertifications() {
  try {
    const res = await api.certificates();
    if (!res.success) return;
    const items = res.data || [];
    const grid = document.getElementById('certs-grid');
    if (!items.length) {
      grid.innerHTML = '<div class="loading-placeholder">No certifications added yet.</div>';
      return;
    }
    grid.innerHTML = items.map(c => `
      <div class="cert-card">
        <div class="cert-img-wrapper">
          ${c.imageUrl
            ? `<img src="${getMediaUrl(c.imageUrl)}" alt="${esc(c.title)}" class="cert-img" loading="lazy" />`
            : `<i class="fas fa-certificate cert-icon-placeholder"></i>`}
        </div>
        <div class="cert-body">
          <h3 class="cert-title">${esc(c.title)}</h3>
          <div class="cert-org"><i class="fas fa-building"></i> ${esc(c.organization || '')}</div>
          ${c.issueDate ? `<div class="cert-date"><i class="fas fa-calendar"></i> ${formatDate(c.issueDate)}</div>` : ''}
          ${c.credentialUrl ? `<a href="${c.credentialUrl}" target="_blank" rel="noopener" class="cert-link"><i class="fas fa-external-link-alt"></i> View Credential</a>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) { console.error(err); }
}

async function loadAchievements() {
  try {
    const res = await api.achievements();
    if (!res.success) return;
    const items = res.data || [];
    const grid = document.getElementById('achievements-grid');
    if (!items.length) {
      grid.innerHTML = '<div class="loading-placeholder">No achievements added yet.</div>';
      return;
    }
    grid.innerHTML = items.map(a => `
      <div class="achievement-card">
        ${a.imageUrl 
          ? `<div class="achievement-img-wrapper" style="text-align:center; margin-bottom:12px;"><img src="${getMediaUrl(a.imageUrl)}" alt="${esc(a.title)}" style="max-width:100%; border-radius:8px;" /></div>` 
          : `<div class="achievement-icon">
               <i class="${esc(a.icon || 'fas fa-trophy')}"></i>
             </div>`
        }
        <h3 class="achievement-title">${esc(a.title)}</h3>
        ${a.description ? `<p class="achievement-desc">${esc(a.description)}</p>` : ''}
        ${a.date ? `<div class="achievement-date"><i class="fas fa-calendar"></i> ${formatDate(a.date)}</div>` : ''}
      </div>
    `).join('');
  } catch (err) { console.error(err); }
}

async function loadSettings() {
  try {
    const res = await api.settings();
    if (!res.success) return;
    const settings = {};
    (res.data || []).forEach(s => settings[s.settingKey] = s.settingValue);

    if (settings.site_title) {
      document.getElementById('nav-logo-text').textContent = settings.site_title;
    }
    if (settings.meta_description) {
      document.querySelector('meta[name="description"]').setAttribute('content', settings.meta_description);
    }
    if (settings.theme_color) {
      document.documentElement.style.setProperty('--primary', settings.theme_color);
    }
    if (settings.dark_mode !== undefined) {
      const isDark = settings.dark_mode === 'true';
      if (!localStorage.getItem('theme')) {
        document.body.classList.toggle('dark-mode', isDark);
        updateThemeIcon();
      }
    }
  } catch (err) { console.error(err); }
}

/* ── Contact Form ── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');
  const btn = document.getElementById('contact-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    feedback.className = 'form-feedback';
    feedback.style.display = 'none';

    const data = {
      name: document.getElementById('msg-name').value,
      email: document.getElementById('msg-email').value,
      subject: document.getElementById('msg-subject').value,
      body: document.getElementById('msg-body').value,
    };

    try {
      const res = await api.contact(data);
      if (res.success) {
        feedback.textContent = '✅ Message sent! I\'ll get back to you soon.';
        feedback.className = 'form-feedback success';
        form.reset();
      } else {
        feedback.textContent = '❌ Failed to send. Please try again.';
        feedback.className = 'form-feedback error';
      }
    } catch {
      feedback.textContent = '❌ Network error. Please check your connection.';
      feedback.className = 'form-feedback error';
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
    }
  });
}

/* ── Project Modal ── */
function initModal() {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

async function openProjectModal(id) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  content.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  overlay.classList.add('open');

  try {
    const res = await api.projectById(id);
    if (!res.success) return;
    const p = res.data;
    const primaryImg = p.images?.find(i => i.isPrimary) || p.images?.[0];

    content.innerHTML = `
      ${primaryImg ? `<img src="${getMediaUrl(primaryImg.imageUrl)}" alt="${esc(p.title)}" class="modal-project-img" />` : ''}
      <h2 class="modal-title">${esc(p.title)}</h2>
      ${p.featured ? '<span class="project-featured-badge" style="position:static;margin-bottom:16px;display:inline-block;">⭐ Featured Project</span>' : ''}
      <p class="modal-desc">${esc(p.description || '')}</p>
      <div class="modal-techs">
        <h4>Technologies</h4>
        <div class="project-techs">${(p.technologies || []).map(t => `<span class="tech-tag">${esc(t)}</span>`).join('')}</div>
      </div>
      <div class="modal-links">
        ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" rel="noopener" class="project-link github"><i class="fab fa-github"></i> GitHub</a>` : ''}
        ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank" rel="noopener" class="project-link demo"><i class="fas fa-external-link-alt"></i> Live Demo</a>` : ''}
      </div>
    `;
  } catch (e) {
    content.innerHTML = '<div class="loading-placeholder">Failed to load project details.</div>';
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

/* ── Helpers ── */
function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function getMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  // Use the same API base as the rest of the app
  const base = (typeof API_BASE !== 'undefined' ? API_BASE : window.API_BASE_URL) || 'http://localhost:8080';
  return base + url + '?t=' + Date.now();
}

function formatDateRange(start, end, current) {
  const s = formatDate(start);
  const e = current ? 'Present' : formatDate(end);
  return `${s}${s && e ? ' – ' : ''}${e}`;
}

function animateCounter(el, target) {
  let count = 0;
  const step = Math.max(1, Math.floor(target / 40));
  const timer = setInterval(() => {
    count = Math.min(count + step, target);
    el.textContent = count;
    if (count >= target) clearInterval(timer);
  }, 50);
}
