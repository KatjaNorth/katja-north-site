// Меню, ролики YouTube по нажатию, ролик главного экрана, форма обратной связи.
// Тексты: английский — в index.html, датский — в assets/i18n/da.json (страница da/ собирается командой сборки).
(function () {
  'use strict';

  var UI = {
    en: { play: 'Play video: ', carLabel: 'Maria in Wonderland: New Year project, slides', prev: 'Previous slide', next: 'Next slide', slide: 'Slide ', of: ' of ', carPlay: '\u25B6 Play', more: 'Read more', less: 'Show less', heroPlay: '\u25B6 Play', heroLabel: 'Play the showreel', menu: 'Menu', sending: 'Sending…', ask: 'I\u2019m interested in: ',
          ok: 'Thank you — your message has been sent.',
          err: 'Something went wrong. Please try again or write to me on LinkedIn.',
          req: 'Please fill in your name, a valid e-mail and a message.' },
    da: { play: 'Afspil video: ', carLabel: 'Maria in Wonderland: nytårsprojekt, slides', prev: 'Forrige slide', next: 'Næste slide', slide: 'Slide ', of: ' af ', carPlay: '\u25B6 Afspil', more: 'Læs mere', less: 'Vis mindre', heroPlay: '\u25B6 Afspil', heroLabel: 'Afspil showreel', menu: 'Menu', sending: 'Sender…', ask: 'Jeg er interesseret i: ',
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
    f.src = 'https://www.youtube-nocookie.com/embed/' + b.getAttribute('data-yt') + '?autoplay=1&rel=0&playsinline=1&cc_load_policy=0&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
    f.title = b.getAttribute('data-title');
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    b.parentNode.replaceChild(f, b);
    // Плеер сам включал субтитры YouTube поверх вшитых в ролик: просим выключить (кнопка «CC» остаётся, зритель может включить сам)
    var captionsOff = function () {
      try { f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setOption', args: ['captions', 'track', {}], id: 1, channel: 'widget' }), '*'); } catch (err) {}
    };
    f.addEventListener('load', function () {
      try { f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch (err) {}
      [300, 1200, 3000, 6000].forEach(function (ms) { setTimeout(captionsOff, ms); });
    });
  });

  /* ---------- Ролик главного экрана: автозапуск без звука, 16:9 или 9:16 по положению экрана ---------- */
  var loop = document.querySelector('.hero-loop');
  if (loop) {
    var vid = loop.querySelector('video');
    var conn = navigator.connection || {};
    // экономия трафика или «меньше движения»: видео не грузим, пока человек сам не нажмёт «Play»
    var still = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || conn.saveData === true;
    var started = !still;                      // true — видео можно грузить и запускать
    var portrait = window.matchMedia('(orientation: portrait)');
    var btn = document.createElement('button'); // «▶ Play»: показывается вместо автозапуска
    btn.type = 'button'; btn.className = 'hero-play'; btn.hidden = true;
    btn.textContent = UI[lang].heroPlay; btn.setAttribute('aria-label', UI[lang].heroLabel);
    loop.appendChild(btn);
    var run = function () {
      var p = vid.play();
      if (p && p.catch) p.catch(function () { btn.hidden = false; });   // телефон запретил автозапуск (энергосбережение)
    };
    var pick = function () {
      var kind = portrait.matches ? 'tall' : 'wide';
      if (loop.getAttribute('data-kind') === kind) return;
      loop.setAttribute('data-kind', kind);
      vid.poster = loop.getAttribute('data-poster-' + kind);   // пока грузится — виден первый кадр
      if (!started) { btn.hidden = false; return; }
      vid.src = loop.getAttribute('data-' + kind);              // грузится только один файл
      run();
    };
    btn.addEventListener('click', function () {
      started = true; btn.hidden = true;
      if (!vid.getAttribute('src')) vid.src = loop.getAttribute('data-' + loop.getAttribute('data-kind'));
      run();
    });
    vid.addEventListener('playing', function () { btn.hidden = true; });
    // через 4 с после старта ролика (или сразу при экономии/«меньше движения») затемняем низ и показываем текст
    var heroEl = loop.closest('.hero');
    var lift = function () { heroEl.classList.remove('intro'); };
    if (still) lift();
    else {
      vid.addEventListener('playing', function () { setTimeout(lift, 4000); }, { once: true });
      setTimeout(lift, 9000);                  // запасной вариант: ролик не запустился
    }
    pick();
    if (portrait.addEventListener) portrait.addEventListener('change', pick);
    else if (portrait.addListener) portrait.addListener(pick);
  }

  /* ---------- Карточки услуг: «пример» подсвечивает ролик, «спросить» готовит форму ---------- */
  var lastAsk = '';
  document.addEventListener('click', function (e) {
    var a = e.target.closest('.card-link, .card-thumb');
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

  /* ---------- «Обо мне»: на узком экране середина текста сворачивается ---------- */
  var about = document.querySelector('.about');
  var toggle = document.getElementById('about-toggle');
  if (about && toggle) {
    about.classList.add('is-collapsible');
    toggle.hidden = false;
    toggle.textContent = UI[lang].more;
    toggle.addEventListener('click', function () {
      var open = about.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? UI[lang].less : UI[lang].more;
    });
  }

  /* ---------- Карусель: слайды 4:5, видео играют только на видимом слайде ---------- */
  var car = document.querySelector('.carousel');
  if (car) {
    var track = car.querySelector('.car-track'), slidesEl = [].slice.call(track.children);
    var prev = car.querySelector('.car-prev'), next = car.querySelector('.car-next');
    var dotsBox = document.querySelector('.car-dots'), dots = [];
    var cinfo = navigator.connection || {};
    var cstill = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || cinfo.saveData === true;
    var cur = 0, inView = false, total = slidesEl.length;
    car.setAttribute('aria-label', UI[lang].carLabel + ' ' + total);
    prev.setAttribute('aria-label', UI[lang].prev); next.setAttribute('aria-label', UI[lang].next);
    slidesEl.forEach(function (s, i) {
      s.setAttribute('aria-label', UI[lang].slide + (i + 1) + UI[lang].of + total);
      var d = document.createElement('button'); d.type = 'button'; d.className = 'car-dot';
      d.setAttribute('aria-label', UI[lang].slide + (i + 1)); dotsBox.appendChild(d); dots.push(d);
      d.addEventListener('click', function () { go(i); });
      var v = s.querySelector('video');
      if (v) {
        var pb = document.createElement('button'); pb.type = 'button'; pb.className = 'car-play';
        pb.textContent = UI[lang].carPlay; pb.hidden = true; s.appendChild(pb);
        pb.addEventListener('click', function () { cstill = false; load(i); play(i); });
        v.addEventListener('playing', function () { pb.hidden = true; });
      }
    });
    function vid(i) { return slidesEl[i] ? slidesEl[i].querySelector('video') : null; }
    function load(i) { var v = vid(i); if (v && !v.getAttribute('src')) { v.src = v.getAttribute('data-src'); } }
    function play(i) {
      var v = vid(i); if (!v) return;
      var p = v.play(); if (p && p.catch) p.catch(function () { slidesEl[i].querySelector('.car-play').hidden = false; });
    }
    function show(i) {                                  // обновляет кнопки, точки и запускает видео нужного слайда
      cur = i;
      prev.disabled = i === 0; next.disabled = i === total - 1;
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      slidesEl.forEach(function (s, k) { var v = vid(k); if (v && k !== i) v.pause(); });
      if (!inView) return;
      load(i); load(i + 1);
      var cv = vid(i);
      if (cv) { if (cstill) slidesEl[i].querySelector('.car-play').hidden = false; else play(i); }
    }
    function go(i) {
      i = Math.max(0, Math.min(total - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: cstill ? 'auto' : 'smooth' });
    }
    var raf = 0;
    track.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0; var i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== cur) show(i);
      });
    }, { passive: true });
    prev.addEventListener('click', function () { go(cur - 1); });
    next.addEventListener('click', function () { go(cur + 1); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        inView = en[0].isIntersecting; show(cur);
        if (!inView) slidesEl.forEach(function (s, k) { var v = vid(k); if (v) v.pause(); });
      }, { threshold: 0.4 }).observe(car);
    } else { inView = true; }
    show(0);
  }

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
