// Меню, переключатель языка, ролики YouTube по нажатию, форма обратной связи.
(function () {
  'use strict';

  /* ---------- Датский перевод (английский — в самой странице) ---------- */
  var DA = {
    'skip': 'Spring til indhold',
    'nav.work': 'Projekter', 'nav.services': 'Ydelser', 'nav.about': 'Om mig', 'nav.contact': 'Kontakt',
    'hero.eyebrow': 'AI-videoskaber',
    'hero.title': 'Film, der ikke kunne optages. Skabt med AI.',
    'hero.work': 'Se projekterne', 'hero.contact': 'Kontakt mig',
    'work.eyebrow': 'Portfolio', 'work.title': 'Udvalgte projekter',
    'work.client': 'Kundeprojekter', 'work.personal': 'Egne projekter',
    'cap.k1': 'Filmisk AI-køkkenreklame',
    'cap.k2': 'AI-musicalreklame',
    'cap.k3': 'AI-reklame for en personlig træner',
    'cap.p1': 'Historiske fotos forvandlet til en filmisk fortælling',
    'cap.p2': 'Rigtige mennesker forvandlet til figurer i Pixar-stil',
    'cap.p3': 'En rigtig pige træder ind i et eventyr',
    'cap.p4': 'En original sang og en surrealistisk musikvideo i gotisk fantasy-stil inspireret af Tim Burton',
    'cap.p5': 'Et rigtigt produkt, en figur og en historie fortalt i anime-stil',
    'services.eyebrow': 'Ydelser', 'services.title': 'Det laver jeg',
    'services.lead': 'Videoproduktion fra start til slut – fra idé og manuskript til færdig film med musik og speak. Uden filmhold, skuespillere eller locations – kun din idé.',
    's1.t': 'Reklamefilm',
    's1.d': 'Filmiske reklamer til brands og virksomheder, der fanger opmærksomheden fra første sekund.',
    's2.t': 'Musikvideoer og musicals',
    's2.d': 'Sang, karakterer og iscenesættelse, hvor historie og musik går op i en højere enhed.',
    's3.t': 'Historiske film',
    's3.d': 'Jeg vækker gamle fotografier af rigtige mennesker til live og fortæller historier om brands, begivenheder og epoker.',
    's4.t': 'Animation og eventyr',
    's4.d': 'Animationsfilm og fortællinger, hvor virkelige optagelser møder AI’ens magi.',
    's5.t': 'Videoer til sociale medier',
    's5.d': 'Korte, lodrette videoer til Reels, TikTok og YouTube Shorts.',
    's6.t': '3D-visualisering',
    's6.d': 'Til projekter, der kræver fuld kontrol over scenen og præcision i hver detalje.',
    'about.eyebrow': 'Om mig',
    'about.p1': 'Hej, jeg hedder Jekaterina Rogaten – jeg er AI-videoskaber, bor i Danmark og arbejder under brandet Katja North.',
    'about.p2': 'Med generativ AI forvandler jeg idéer til kortfilm, reklamer og indhold til sociale medier med et filmisk udtryk. Jeg står for hele processen: koncept, manuskript, storyboard, generering, speak, musik og den endelige klipning.',
    'about.p3': 'Jeg er kreativ af natur og har en stor livserfaring i bagagen. Den har givet mig et trænet øje og en sikker sans for æstetik, og begge dele lægger jeg i hvert eneste billede, jeg skaber.',
    'about.p4': 'Mit arbejde spænder fra filmiske reklamer og musicals til animationsfilm, fotorealistisk video og eventyr, der blander virkelige optagelser med AI. Jeg laver også historiske film, hvor jeg vækker gamle fotografier af rigtige mennesker til live, og 3D-arbejde til projekter, der kræver fuld kontrol over scenen og præcision i hver detalje.',
    'about.p5': 'Jeg bruger blandt andet Seedance, Higgsfield, Kling, Midjourney, Suno, Claude, ChatGPT og CapCut – men det er kun en del af listen. Jeg lærer hurtigt, forstår principperne bag værktøjerne og udvikler mig i takt med dem.',
    'about.p6': 'Jeg taler dansk, engelsk og russisk og er åben for både fastansættelse og freelanceopgaver.',
    'contact.eyebrow': 'Kontakt', 'contact.title': 'Lad os skabe noget',
    'form.title': 'Skriv til mig',
    'form.name': 'Navn', 'form.email': 'Din e-mail', 'form.subject': 'Vedrørende',
    'form.opt1': 'Jobtilbud', 'form.opt2': 'Projekt', 'form.opt3': 'Andet',
    'form.message': 'Besked', 'form.send': 'Send besked'
  };
  var UI = {
    en: { play: 'Play video: ', menu: 'Menu', sending: 'Sending…',
          ok: 'Thank you — your message has been sent.',
          err: 'Something went wrong. Please try again or write to me on LinkedIn.',
          req: 'Please fill in your name, a valid e-mail and a message.' },
    da: { play: 'Afspil video: ', menu: 'Menu', sending: 'Sender…',
          ok: 'Tak – din besked er sendt.',
          err: 'Noget gik galt. Prøv igen, eller skriv til mig på LinkedIn.',
          req: 'Udfyld venligst navn, en gyldig e-mail og en besked.' }
  };

  var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-i18n]'));
  var EN = {};
  nodes.forEach(function (n) { EN[n.getAttribute('data-i18n')] = n.textContent; });
  var lang = 'en';

  function setLang(next, save) {
    lang = next === 'da' ? 'da' : 'en';
    document.documentElement.lang = lang;
    var dict = lang === 'da' ? DA : EN;
    nodes.forEach(function (n) {
      var k = n.getAttribute('data-i18n');
      n.textContent = dict[k] || EN[k];
    });
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
    document.querySelectorAll('.play-btn').forEach(function (b) {
      b.setAttribute('aria-label', UI[lang].play + b.getAttribute('data-title'));
    });
    if (save) { try { localStorage.setItem('kn-lang', lang); } catch (e) {} }
  }
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
  });
  var saved = null;
  try { saved = localStorage.getItem('kn-lang'); } catch (e) {}
  if (!saved && /^da\b/i.test(navigator.language || '')) saved = 'da';
  if (saved === 'da') setLang('da', false);

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
      .catch(function () { say('err', UI[lang].err); })
      .then(function () { send.disabled = false; });
  });

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
