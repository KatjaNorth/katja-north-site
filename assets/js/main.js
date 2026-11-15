// Меню, ролики YouTube по нажатию, ролик главного экрана, форма обратной связи.
// Тексты: английский — в index.html, датский — в assets/i18n/da.json (страница da/ собирается командой сборки).
(function () {
  'use strict';

  var UI = {
    en: { play: 'Play video: ', menu: 'Menu', sending: 'Sending…', ask: 'I\u2019m interested in: ',
          ok: 'Thank you — your message has been sent.',
          err: 'Something went wrong. Please try again or write to me on LinkedIn.',
          req: 'Please fill in your name, a valid e-mail and a message.' },
    da: { play: 'Afspil video: ', menu: 'Menu', sending: 'Sender…', ask: 'Jeg er interesseret i: ',
          ok: 'Tak – din besked er sendt.',
          err: 'Noget gik galt. Prøv igen, eller skriv til mig på LinkedIn.',
          req: 'Udfyld venligst navn, en gyldig e-mail og en besked.' }
  };

  // Язык страницы берётся из <html lang="…">; если для него нет строк выше — используется первый язык в списке.
  var lang = UI[document.documentElement.lang] ? document.documentElement.lang : Object.keys(UI)[0];

  /* ---------- Меню ---------- */
  var btn = document.getElementById('menu-btn');
  var nav = document.getElementById('site-nav');
  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.site-header')) setOpen(false); });
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth !== lastW) { lastW = window.innerWidth; setOpen(false); }
  });

  var links = {};
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(links).forEach(function (id) { links[id].classList.toggle('is-active', id === en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Ролики: плеер YouTube загружается только по нажатию ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.play-btn');
    if (!b) return;
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + b.getAttribute('data-yt') + '?autoplay=1&rel=0&playsinline=1';
    f.title = b.getAttribute('data-title');
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    b.parentNode.replaceChild(f, b);
  });

  /* ---------- Ролик главного экрана: автозапуск без звука, 16:9 или 9:16 по положению экрана ---------- */
  var loop = document.querySelector('.hero-loop');
  if (loop) {
    var vid = loop.querySelector('video');
    var conn = navigator.connection || {};
    var still = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || conn.saveData === true;
    var portrait = window.matchMedia('(orientation: portrait)');
    var pick = function () {
      var kind = portrait.matches ? 'tall' : 'wide';
      if (loop.getAttribute('data-kind') === kind) return;
      loop.setAttribute('data-kind', kind);
      vid.poster = loop.getAttribute('data-poster-' + kind);
      if (still) return;                       // экономия трафика или «меньше движения» — только обложка
      vid.src = loop.getAttribute('data-' + kind);
      var p = vid.play();
      if (p && p.catch) p.catch(function () {});
    };
    pick();
    if (portrait.addEventListener) portrait.addEventListener('change', pick);
    else if (portrait.addListener) portrait.addListener(pick);
  }

  /* ---------- Карточки услуг: «пример» подсвечивает ролик, «спросить» готовит форму ---------- */
  var lastAsk = '';
  document.addEventListener('click', function (e) {
    var a = e.target.closest('.card-link');
    if (!a) return;
    if (a.hasAttribute('data-ask')) {
      var msg = document.getElementById('f-message');
      var title = a.closest('article').querySelector('h3').textContent.trim();
      var line = UI[lang].ask + title + '.\n';
      if (msg.value.trim() === '' || msg.value === lastAsk) { msg.value = line; lastAsk = line; }
      document.getElementById('f-subject').value = 'Project';
      return;
    }
    var target = document.getElementById(a.getAttribute('href').slice(1));
    if (!target) return;
    target.classList.add('is-target');
    setTimeout(function () { target.classList.remove('is-target'); }, 2600);
  });

  /* ---------- Форма ---------- */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  var send = document.getElementById('f-send');
  function say(kind, text) { status.className = 'form-status ' + kind; status.textContent = text; }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = false;
    ['f-name', 'f-email', 'f-message'].forEach(function (id) {
      var el = document.getElementById(id);
      var ok = el.value.trim() !== '' && el.checkValidity();
      el.classList.toggle('invalid', !ok);
      if (!ok) bad = true;
    });
    if (bad) { say('err', UI[lang].req); return; }
    send.disabled = true;
    say('', UI[lang].sending);
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.reset();
        say('ok', UI[lang].ok);
      })
      .catch(function (err) {
        // Сеть или блокировщик не дали отправить в фоне — отправляем обычным способом (откроется страница Formspree).
        if (err instanceof TypeError) { try { HTMLFormElement.prototype.submit.call(form); return; } catch (e) {} }
        say('err', UI[lang].err);
      })
      .then(function () { send.disabled = false; });
  });

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
