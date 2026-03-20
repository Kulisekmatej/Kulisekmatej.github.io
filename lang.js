/**
 * lang.js — Automatická detekce jazyka podle země (IP)
 * CZ → čeština (výchozí), ostatní → angličtina
 *
 * Použití v HTML:
 *   <span data-cs="Ahoj" data-en="Hello">Ahoj</span>
 *   <script src="lang.js"></script>  ← před </body>
 */

(function () {
  'use strict';

  const LS_KEY = 'mk_lang';
  const DEFAULT = 'cs';

  /* ── Přepni všechny elementy s data-cs / data-en ── */
  function applyLang(lang) {
    document.documentElement.lang = lang === 'en' ? 'en' : 'cs';

    // Přeložit <title> tagu
    const titleEl = document.querySelector('title');
    if (titleEl) {
      const cs = titleEl.getAttribute('data-cs');
      const en = titleEl.getAttribute('data-en');
      if (lang === 'en' && en) titleEl.textContent = en;
      else if (lang === 'cs' && cs) titleEl.textContent = cs;
    }

    document.querySelectorAll('[data-cs],[data-en]').forEach(el => {
      const text = el.getAttribute('data-' + lang);
      if (text === null) return;

      // <select> options — přeložit value atribut option elementů
      if (el.tagName === 'OPTION') {
        el.textContent = text;
        return;
      }

      // Elementy bez dětských elementů (jen text) → přímá náhrada
      if (el.children.length === 0) {
        el.textContent = text;
        return;
      }

      // Elementy s dětmi → aktualizuj první textový uzel
      const firstText = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
      if (firstText) {
        firstText.textContent = text;
      } else {
        // Žádný text node neexistuje → vlož na začátek
        el.insertBefore(document.createTextNode(text), el.firstChild);
      }
    });

    // Atributy: placeholder, title, aria-label, alt
    ['placeholder', 'title', 'aria-label', 'alt'].forEach(attr => {
      document.querySelectorAll(`[data-${attr}-cs],[data-${attr}-en]`).forEach(el => {
        const val = el.getAttribute(`data-${attr}-${lang}`);
        if (val !== null) el.setAttribute(attr, val);
      });
    });

    // Aktivní stav na language toggleru
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('lang-btn--active', btn.dataset.lang === lang);
    });

    localStorage.setItem(LS_KEY, lang);
    window.__siteLang = lang;
  }

  /* ── Detekce přes IP ── */
  async function detectCountry() {
    try {
      const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      return (data.country_code || '').toUpperCase();
    } catch {
      return null; // fallback → čeština
    }
  }

  /* ── Init ── */
  async function init() {
    // 1. Zkus localStorage (uživatel si ručně přepnul)
    const saved = localStorage.getItem(LS_KEY);
    if (saved === 'en' || saved === 'cs') {
      applyLang(saved);
      buildToggle();
      return;
    }

    // 2. Detekuj podle IP
    const country = await detectCountry();
    const lang = country === 'CZ' ? 'cs' : (country ? 'en' : DEFAULT);
    applyLang(lang);
    buildToggle();
  }

  /* ── Language toggle tlačítko ── */
  function buildToggle() {
    // Přidá tlačítka CS / EN do elementu .lang-toggle (pokud existuje v HTML)
    document.querySelectorAll('.lang-toggle').forEach(container => {
      if (container.dataset.built) return;
      container.dataset.built = '1';

      ['cs', 'en'].forEach(l => {
        const btn = document.createElement('button');
        btn.className = 'lang-btn';
        btn.dataset.lang = l;
        btn.textContent = l.toUpperCase();
        btn.setAttribute('aria-label', l === 'cs' ? 'Přepnout do češtiny' : 'Switch to English');
        btn.addEventListener('click', () => applyLang(l));
        container.appendChild(btn);
      });

      // Označ aktivní
      container.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('lang-btn--active', btn.dataset.lang === (window.__siteLang || DEFAULT));
      });
    });
  }

  // Spusť po načtení DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
