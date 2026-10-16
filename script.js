/* ==========================================================
   Портфолио — интерактивность
   1. Динамический год
   2. Переключение темы (с сохранением в localStorage)
   3. Мобильная навигация
   3б. Hero: параллакс звёзд и запасные варианты для картинок
   4. Анимация при прокрутке (IntersectionObserver)
   4б. 3D-прокрутка проектов
   5. Модальные окна проектов
   6. Навыки (раскрытие по нажатию — работает и без наведения)
   7. Заглушки контактов
   ========================================================== */

(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

 
  $$('#year, [data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  
  const root = document.documentElement;
  const themeBtn = $('#theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const isDark = theme === 'dark';
    themeBtn.setAttribute('aria-pressed', String(isDark));
    themeBtn.setAttribute('aria-label', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
    if (themeMeta) themeMeta.content = isDark ? '#0a0f33' : '#dde3ff';
  }

 
  applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');

  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    
    try { localStorage.setItem('theme', next); } catch (e) {  }
  });

 
  const menuBtn = $('#menu-toggle');
  const nav = $('#site-nav');
  const desktopQuery = window.matchMedia('(min-width: 960px)');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('is-locked', open);
    
    if (!desktopQuery.matches) nav.toggleAttribute('inert', !open);
  }

 
  function syncNavMode() {
    if (desktopQuery.matches) {
      nav.removeAttribute('inert');
      setMenu(false);
      nav.removeAttribute('inert');
    } else {
      setMenu(false);
    }
  }
  syncNavMode();
  desktopQuery.addEventListener('change', syncNavMode);

  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuBtn.focus();
    }
  });

 
  $$('.hero img').forEach((img) => {
    const fail = () => {
      const o = img.closest('.hero-o');
      if (o) { o.textContent = 'o'; o.classList.add('is-text'); } else { img.hidden = true; }
    };
    if (img.complete && img.naturalWidth === 0) fail();
    else img.addEventListener('error', fail, { once: true });
  });

 
  const heroStars = $$('.hero-star');
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(hover: hover)').matches) {
    let mouseX = 0, mouseY = 0, curX = 0, curY = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - .5) * 2;
      mouseY = (e.clientY / window.innerHeight - .5) * 2;
    });
    (function loop() {
      curX += (mouseX - curX) * .05;
      curY += (mouseY - curY) * .05;
      heroStars.forEach((star, i) => {
        const depth = (i % 3 + 1) * 4; // у звёзд разная "глубина"
        star.style.translate = `${curX * depth}px ${curY * depth}px`;
      });
      requestAnimationFrame(loop);
    })();
  }

 
  const revealEls = $$('.reveal');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    // Без анимации просто показываем всё
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // анимация один раз
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    revealEls.forEach((el) => observer.observe(el));
  }

 
  const projectsSection = $('#projects');
  const frames = projectsSection ? $$('.projects__grid > *', projectsSection) : [];

  if (!reduceMotion && frames.length > 1) {
    const SPACING = 1000;                  
    const travel = frames.length - 1 + .7; 
    const counter = $('.projects__counter', projectsSection);
    const total = frames.length - 1;       

    projectsSection.classList.add('is-3d');
    projectsSection.style.setProperty('--travel', travel);
    
    $$('.reveal', projectsSection).forEach((el) => el.classList.remove('reveal'));

    const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

    function scrollRange() {
      const rect = projectsSection.getBoundingClientRect();
      return { rect, scrollable: rect.height - window.innerHeight };
    }

    function update3D() {
      const { rect, scrollable } = scrollRange();
      const t = clamp01(-rect.top / scrollable) * travel; 

      frames.forEach((frame, i) => {
        const z = (t - i) * SPACING; 
        const opacity = z > 0 ? 1 - z / (SPACING * .45) : 1 + z / (SPACING * 1.3);
        frame.style.transform = `translateZ(${z}px)`;
        frame.style.opacity = clamp01(opacity);
        
        frame.style.pointerEvents = Math.abs(z) < SPACING * .4 ? 'auto' : 'none';
      });

      const current = Math.min(Math.round(t), total);
      counter.textContent = current === 0 ? '' : `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    }

    let ticking = false;
    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; update3D(); });
    }
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update3D();

    
    frames.forEach((frame, i) => {
      frame.addEventListener('focusin', () => {
        const { rect, scrollable } = scrollRange();
        const target = rect.top + window.scrollY + (i / travel) * scrollable;
        if (Math.abs(window.scrollY - target) > 4) window.scrollTo({ top: target, behavior: 'auto' });
      });
    });
  }

 
  const modal = $('#project-modal');
  const modalImg = $('#modal-img');
  const modalCat = $('#modal-cat');
  const modalTitle = $('#modal-title');
  const modalMore = $('#modal-more');

  function openProject(card) {
    const img = $('.project__media img', card);
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    modalCat.textContent = $('.project__cat', card).textContent;
    modalTitle.textContent = $('.project__title', card).textContent;
    
    modalMore.innerHTML = $('.project__more', card).innerHTML;
    modal.showModal(); 
    document.body.classList.add('is-locked');
  }

  $$('.project').forEach((card) => {
    $('[data-open]', card).addEventListener('click', () => openProject(card));
  });

  $('#modal-close').addEventListener('click', () => modal.close());


  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });

  modal.addEventListener('close', () => {
    document.body.classList.remove('is-locked');
  });


  const tools = $$('.tool');
  const toolNote = $('#tool-note');

  function showNote(btn) {
    tools.forEach((t) => t.setAttribute('aria-pressed', String(t === btn)));
    toolNote.textContent = btn.dataset.note;
  }
  tools.forEach((btn) => {
    btn.addEventListener('click', () => showNote(btn));
    btn.addEventListener('mouseenter', () => showNote(btn));
    btn.addEventListener('focus', () => showNote(btn));
  });


  const toast = $('#toast');
  $$('[data-placeholder]').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (!link.hasAttribute('data-placeholder')) return;
      e.preventDefault();
      toast.textContent = 'Это заглушка: впишите свой адрес или ссылку в index.html и удалите data-placeholder.';
    });
  });
})();