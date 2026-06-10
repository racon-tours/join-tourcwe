/* ============================================================
   TourCWE — Specials Banner
   Thin sitewide banner powered by the TourCWE Specials sheet via
   https://tourcwe-specials.mike-7a9.workers.dev/ (5-min edge cache)
   - Renders nothing when no special is active (zero footprint)
   - Dismissible per-special, per-session (sessionStorage)
   - Injects its own CSS — no styles.css edit / cache-bust needed
   - Graceful failure: any error = no banner
   ============================================================ */
(function () {
  'use strict';

  var DATA_URL = 'https://tourcwe-specials.mike-7a9.workers.dev/';
  var DISMISS_KEY_PREFIX = 'tourcwe-special-dismissed:';

  var CSS = [
    '.tcwe-special{background:#1c1c1c;color:#efebce;font-family:Nunito,sans-serif;',
    'font-size:.92rem;line-height:1.35;position:relative;z-index:60;}',
    '.tcwe-special__inner{max-width:1100px;margin:0 auto;padding:.5rem 2.4rem .5rem 1rem;',
    'display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.35rem .6rem;text-align:center;}',
    '.tcwe-special__title{font-family:"Cormorant Garamond",serif;font-size:1.08rem;',
    'font-weight:600;color:#d6ce93;letter-spacing:.02em;}',
    '.tcwe-special__deal{color:#efebce;}',
    '.tcwe-special__code{border:1px solid #628395;border-radius:3px;padding:0 .4em;',
    'font-weight:700;letter-spacing:.06em;color:#d6ce93;white-space:nowrap;}',
    '.tcwe-special__cta{color:#1c1c1c;background:#d6ce93;text-decoration:none;font-weight:700;',
    'padding:.12rem .7rem;border-radius:3px;white-space:nowrap;}',
    '.tcwe-special__cta:hover{background:#efebce;}',
    '.tcwe-special__close{position:absolute;right:.4rem;top:50%;transform:translateY(-50%);',
    'background:none;border:0;color:#efebce;opacity:.65;font-size:1.1rem;cursor:pointer;',
    'padding:.2rem .5rem;line-height:1;}',
    '.tcwe-special__close:hover{opacity:1;}',
    '@media(max-width:540px){.tcwe-special{font-size:.85rem;}',
    '.tcwe-special__inner{padding-right:2.2rem;}}'
  ].join('');

  function dismissed(id) {
    try { return sessionStorage.getItem(DISMISS_KEY_PREFIX + id) === '1'; }
    catch (e) { return false; }
  }

  function dismiss(id) {
    try { sessionStorage.setItem(DISMISS_KEY_PREFIX + id, '1'); } catch (e) {}
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function render(sp) {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var banner = el('div', 'tcwe-special');
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Current special offer');

    var inner = el('div', 'tcwe-special__inner');
    inner.appendChild(el('span', 'tcwe-special__title', sp.title));

    var dealText = sp.discount_display || sp.blurb;
    if (dealText) inner.appendChild(el('span', 'tcwe-special__deal', '\u2014 ' + dealText));

    if (sp.promo_code) {
      var code = el('span', 'tcwe-special__code', sp.promo_code);
      code.setAttribute('aria-label', 'Promo code ' + sp.promo_code);
      inner.appendChild(code);
    }

    var cta = el('a', 'tcwe-special__cta', 'Book now');
    cta.href = sp.cta_url || '/tour/';
    inner.appendChild(cta);

    var close = el('button', 'tcwe-special__close', '\u00d7');
    close.setAttribute('aria-label', 'Dismiss special offer');
    close.addEventListener('click', function () {
      dismiss(sp.id);
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    });

    banner.appendChild(inner);
    banner.appendChild(close);
    document.body.insertBefore(banner, document.body.firstChild);
  }

  function init() {
    fetch(DATA_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var list = (data && data.specials) || [];
        for (var i = 0; i < list.length; i++) {
          if (!dismissed(list[i].id)) { render(list[i]); break; }
        }
      })
      .catch(function () { /* no banner on failure */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
