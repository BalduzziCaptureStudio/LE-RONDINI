/* Le Rondini — small progressive enhancements. The page works without this file. */
(function () {
  'use strict';

  var STORAGE_KEY = 'lerondini-lang';
  var LANGS = ['it', 'en'];
  var root = document.documentElement;
  var content = null;
  var lang = 'it';

  /* ---------- helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function lookup(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function t(key, fallback) {
    var v = content && content[lang] ? lookup(content[lang], key) : undefined;
    return typeof v === 'string' ? v : (fallback === undefined ? null : fallback);
  }

  var storage = {
    get: function () { try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; } },
    set: function (v) { try { window.localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* private mode etc. */ } }
  };

  /* ---------- i18n ---------- */
  var listeners = [];

  function applyLanguage(next) {
    if (!content || !content[next]) return;
    lang = next;
    root.setAttribute('lang', next);

    $all('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (v !== null) el.textContent = v;
    });
    $all('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var i = pair.indexOf(':');
        if (i < 1) return;
        var v = t(pair.slice(i + 1).trim());
        if (v !== null) el.setAttribute(pair.slice(0, i).trim(), v);
      });
    });

    var title = t('meta.title');
    if (title) document.title = title;
    var desc = t('meta.description');
    var meta = $('meta[name="description"]');
    if (desc && meta) meta.setAttribute('content', desc);

    var waText = t('contact.whatsappMessage');
    if (waText) {
      $all('[data-whatsapp]').forEach(function (a) {
        a.setAttribute('href', a.getAttribute('href').split('?')[0] + '?text=' + encodeURIComponent(waText));
      });
    }

    $all('[data-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === next));
    });
    listeners.forEach(function (fn) { fn(next); });
  }

  function initI18n() {
    var switcher = $('.lang-switch');
    if (!window.fetch) return;

    fetch('content.json')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        content = data;
        var stored = storage.get();
        applyLanguage(LANGS.indexOf(stored) > -1 ? stored : 'it');
        if (switcher) switcher.hidden = false;
      })
      .catch(function () { /* keep the Italian HTML; toggle stays hidden */ });

    if (switcher) {
      switcher.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-lang]');
        if (!btn) return;
        var next = btn.getAttribute('data-lang');
        applyLanguage(next);
        storage.set(next);
      });
    }
  }

  /* ---------- gentle fade-in on scroll ---------- */
  function initReveal() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    var seen = typeof WeakSet === 'function' ? new WeakSet() : null;
    if (!seen) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        if (!seen.has(el)) {
          seen.add(el);
          // Only hide what is still below the fold, so nothing visible ever flickers.
          if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight) {
            io.unobserve(el);
          } else {
            el.classList.add('is-hidden');
          }
          return;
        }
        if (entry.isIntersecting) {
          el.classList.remove('is-hidden');
          io.unobserve(el);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });

    $all('[data-reveal]').forEach(function (el) { io.observe(el); });
  }

  /* ---------- lightbox ---------- */
  function initLightbox() {
    var links = $all('.g__link');
    var dlg = $('.lightbox');
    if (!links.length || !dlg || typeof dlg.showModal !== 'function') return;

    var img = $('.lightbox__img', dlg);
    var counter = $('.lightbox__counter', dlg);
    var closeBtn = $('.lightbox__close', dlg);
    var index = 0;
    var opener = null;
    var useWebp = true;

    function srcFor(a) { return useWebp && a.getAttribute('data-webp') ? a.getAttribute('data-webp') : a.getAttribute('href'); }

    function updateCounter() {
      counter.textContent = t('lightbox.counter', '{n} / {total}')
        .replace('{n}', index + 1)
        .replace('{total}', links.length);
    }

    function show(i) {
      index = (i + links.length) % links.length;
      var a = links[index];
      var thumb = $('img', a);
      img.width = Number(a.getAttribute('data-w')) || 0;
      img.height = Number(a.getAttribute('data-h')) || 0;
      img.src = srcFor(a);
      img.alt = thumb ? thumb.alt : '';
      updateCounter();
      [index + 1, index - 1].forEach(function (j) {
        var n = links[(j + links.length) % links.length];
        var pre = new Image();
        pre.src = srcFor(n);
      });
    }

    function open(i, trigger) {
      opener = trigger || document.activeElement;
      var thumb = $('img', links[i]);
      // If the browser chose a WebP thumbnail it can show WebP full-size too.
      useWebp = !thumb || !thumb.currentSrc || /\.webp(\?|$)/i.test(thumb.currentSrc);
      show(i);
      dlg.showModal();
      closeBtn.focus();
    }

    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return; // allow "open in new tab"
        e.preventDefault();
        open(i, a);
      });
    });

    closeBtn.addEventListener('click', function () { dlg.close(); });
    $('.lightbox__prev', dlg).addEventListener('click', function () { show(index - 1); });
    $('.lightbox__next', dlg).addEventListener('click', function () { show(index + 1); });

    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    });
    // Click on the dark background (not on the photo or buttons) closes it.
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.classList.contains('lightbox__stage')) dlg.close();
    });
    dlg.addEventListener('close', function () {
      if (opener && typeof opener.focus === 'function') opener.focus();
    });

    // Swipe left / right
    var startX = null, startY = 0;
    var stage = $('.lightbox__stage', dlg);
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      startX = e.clientX; startY = e.clientY;
    });
    stage.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      startX = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) show(index + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener('pointercancel', function () { startX = null; });

    listeners.push(function () { if (dlg.open) updateCounter(); });
  }

  /* ---------- enquiry form (Netlify Forms, no reload) ---------- */
  function isoDate(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function initForm() {
    var form = $('form[name="richiesta"]');
    if (!form) return;
    var arrival = form.elements.arrivo;
    var departure = form.elements.partenza;
    var status = $('.form__status', form);
    var submit = $('button[type="submit"]', form);
    var success = $('.form-success');

    arrival.min = isoDate(new Date());
    departure.min = arrival.min;

    function checkDates() {
      if (arrival.value) {
        var next = new Date(arrival.value + 'T12:00:00');
        next.setDate(next.getDate() + 1);
        departure.min = isoDate(next);
      }
      var bad = arrival.value && departure.value && departure.value <= arrival.value;
      departure.setCustomValidity(bad ? t('enquiry.dateError', 'La data di partenza deve essere successiva all\'arrivo.') : '');
    }
    arrival.addEventListener('change', checkDates);
    departure.addEventListener('change', checkDates);
    listeners.push(checkDates);

    form.addEventListener('submit', function (e) {
      checkDates();
      if (!form.checkValidity()) { e.preventDefault(); form.reportValidity(); return; }
      if (!window.fetch || !window.URLSearchParams || !window.FormData) return; // fall back to a normal POST

      e.preventDefault();
      status.classList.remove('is-error');
      status.textContent = t('enquiry.sending', 'Invio in corso…');
      submit.disabled = true;

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.hidden = true;
          success.hidden = false;
          success.focus();
        })
        .catch(function () {
          status.classList.add('is-error');
          status.textContent = t('enquiry.error', 'Non è stato possibile inviare la richiesta. Riprova oppure scrivici su WhatsApp.');
          submit.disabled = false;
        });
    });
  }

  /* ---------- privacy note + year ---------- */
  function initPrivacy() {
    var details = document.getElementById('privacy');
    if (!details) return;
    function openIfTarget() { if (location.hash === '#privacy') details.open = true; }
    $all('a[href="#privacy"]').forEach(function (a) {
      a.addEventListener('click', function () { details.open = true; });
    });
    window.addEventListener('hashchange', openIfTarget);
    openIfTarget();
  }

  function initYear() {
    var y = String(new Date().getFullYear());
    $all('[data-year]').forEach(function (el) { el.textContent = y; });
  }

  initI18n();
  initReveal();
  initLightbox();
  initForm();
  initPrivacy();
  initYear();
})();
