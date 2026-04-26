/* ============================================================
   TourCWE — Reviews Carousel
   Single-card auto-rotating carousel powered by /data/reviews.json
   - 7s rotation, pauses on hover/focus and when tab is hidden
   - Touch swipe support on mobile
   - Keyboard navigable (left/right arrows when focused)
   - Respects prefers-reduced-motion (no autoplay)
   - Graceful failure: hides container if fetch fails AND no fallback present
   ============================================================ */
(function () {
  'use strict';

  var ROTATION_MS = 7000;
  var FADE_MS = 350;
  var DATA_URL = '/data/reviews.json';

  // ---- Source attribution metadata --------------------------------
  // Display name only — we do NOT use OTA logos or trademark colors,
  // staying within fair-use ("via X") attribution norms.
  var SOURCES = {
    tripadvisor: { label: 'TripAdvisor' },
    viator:      { label: 'Viator' },
    google:      { label: 'Google' }
  };

  // ---- Helpers ----------------------------------------------------
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k.indexOf('aria-') === 0 || k === 'role' || k === 'tabindex') node.setAttribute(k, attrs[k]);
        else node[k] = attrs[k];
      }
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function formatDate(iso) {
    // 'YYYY-MM' -> 'Mon YYYY'
    if (!iso) return '';
    var parts = iso.split('-');
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var m = parseInt(parts[1], 10);
    return (months[m - 1] || '') + ' ' + parts[0];
  }

  function buildAttribution(r) {
    // "ahunkins · Minneapolis, MN" then "Oct 2025 · via TripAdvisor"
    var bits = [r.author];
    if (r.location) bits.push(r.location);
    var src = SOURCES[r.source] || { label: r.source };
    var dateBits = [];
    if (r.date) dateBits.push(formatDate(r.date));
    dateBits.push('via ' + src.label);
    return {
      who: bits.join(' \u00b7 '),
      meta: dateBits.join(' \u00b7 ')
    };
  }

  function buildCard(r) {
    var attr = buildAttribution(r);
    var stars = el('div', { class: 'star-row', 'aria-label': r.rating + ' out of 5 stars' });
    for (var i = 0; i < r.rating; i++) stars.appendChild(el('span', { text: '\u2605' }));
    var quote = el('p', { text: r.text });
    var author = el('div', { class: 'testi-card__author', text: attr.who });
    var source = el('div', { class: 'testi-card__source', text: attr.meta });
    return el('div', {
      class: 'testi-card testi-card--carousel',
      'aria-hidden': 'true',
      role: 'group',
      'aria-roledescription': 'review'
    }, [stars, quote, author, source]);
  }

  // ---- Carousel controller ---------------------------------------
  function initCarousel(container, reviews) {
    if (!reviews || !reviews.length) {
      container.style.display = 'none';
      return;
    }

    container.innerHTML = '';
    container.classList.add('testi-carousel');

    var prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var track = el('div', { class: 'testi-carousel__track' });
    var cards = reviews.map(function (r, i) {
      var c = buildCard(r);
      if (i === 0) {
        c.classList.add('is-active');
        c.setAttribute('aria-hidden', 'false');
      }
      track.appendChild(c);
      return c;
    });

    // Dots indicator
    var dots = el('div', { class: 'testi-carousel__dots', role: 'tablist', 'aria-label': 'Choose review' });
    var dotEls = reviews.map(function (r, i) {
      var d = el('button', {
        type: 'button',
        class: 'testi-carousel__dot' + (i === 0 ? ' is-active' : ''),
        'aria-label': 'Show review ' + (i + 1) + ' of ' + reviews.length,
        'aria-selected': i === 0 ? 'true' : 'false',
        role: 'tab'
      });
      d.addEventListener('click', function () { goTo(i, true); });
      dots.appendChild(d);
      return d;
    });

    // Prev/next arrows
    var prev = el('button', {
      type: 'button',
      class: 'testi-carousel__arrow testi-carousel__arrow--prev',
      'aria-label': 'Previous review'
    });
    prev.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var next = el('button', {
      type: 'button',
      class: 'testi-carousel__arrow testi-carousel__arrow--next',
      'aria-label': 'Next review'
    });
    next.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    // Controls row: [prev] [dots] [next] sit BELOW the card on a single line.
    // Keeps arrows clear of the review text on every screen size.
    var controls = el('div', { class: 'testi-carousel__controls' }, [prev, dots, next]);

    container.appendChild(track);
    container.appendChild(controls);

    var current = 0;
    var timer = null;

    function goTo(i, userInitiated) {
      if (i === current) return;
      var n = reviews.length;
      i = ((i % n) + n) % n; // wrap

      var outgoing = cards[current];
      var incoming = cards[i];

      // Quick fade out, then in
      outgoing.classList.remove('is-active');
      outgoing.setAttribute('aria-hidden', 'true');
      dotEls[current].classList.remove('is-active');
      dotEls[current].setAttribute('aria-selected', 'false');

      // Force reflow so the next class change starts a transition
      void incoming.offsetWidth;

      incoming.classList.add('is-active');
      incoming.setAttribute('aria-hidden', 'false');
      dotEls[i].classList.add('is-active');
      dotEls[i].setAttribute('aria-selected', 'true');

      current = i;
      if (userInitiated) restart();
    }

    function nextSlide() { goTo(current + 1, false); }
    function prevSlide() { goTo(current - 1, false); }

    prev.addEventListener('click', function () { prevSlide(); restart(); });
    next.addEventListener('click', function () { nextSlide(); restart(); });

    // Pause on hover/focus, resume on leave/blur
    function start() {
      if (prefersReduce) return;
      stop();
      timer = setInterval(nextSlide, ROTATION_MS);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }
    function restart() { stop(); start(); }

    container.addEventListener('mouseenter', stop);
    container.addEventListener('mouseleave', start);
    container.addEventListener('focusin', stop);
    container.addEventListener('focusout', start);

    // Pause when tab is hidden (Page Visibility API)
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    // Keyboard nav (left/right arrows)
    container.setAttribute('tabindex', '0');
    container.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { prevSlide(); restart(); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { nextSlide(); restart(); e.preventDefault(); }
    });

    // Touch swipe
    var touchStartX = 0;
    var touchEndX = 0;
    track.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
      stop();
    }, { passive: true });
    track.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      var diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff < 0) nextSlide(); else prevSlide();
      }
      restart();
    }, { passive: true });

    start();
  }

  // ---- Bootstrap --------------------------------------------------
  function init() {
    var containers = document.querySelectorAll('[data-reviews-carousel]');
    if (!containers.length) return;

    fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var reviews = (data && data.reviews) || [];
        // Filter to 5-star only as a safety net
        reviews = reviews.filter(function (r) { return r.rating === 5 && r.text; });
        containers.forEach(function (c) { initCarousel(c, reviews); });
      })
      .catch(function (err) {
        // If fetch fails AND container has fallback content, leave it.
        // If empty, hide the container so we don't show an empty section.
        containers.forEach(function (c) {
          if (!c.querySelector('.testi-card')) c.style.display = 'none';
        });
        if (window.console && console.warn) console.warn('Reviews carousel:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
