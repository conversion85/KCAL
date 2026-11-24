(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('calorieForm');
  const fields = ['foodName', 'totalWeight', 'totalCalories', 'servingSize'];
  const numFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
  const HISTORY_KEY = 'calorieHistory'; // vorhandene Daten aus Version 1 weiterverwenden
  const THEME_KEY = 'kcalTheme';
  const MAX_HISTORY = 30;
  let history = [];
  let currentResult = null;
  let toastTimeout;

  function getStored(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function setStored(key, value) {
    try { localStorage.setItem(key, value); return true; } catch { return false; }
  }
  function parseDecimal(value) {
    const text = String(value ?? '').trim().replace(/\s/g, '').replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(text)) return NaN;
    return Number(text);
  }
  const fmt = n => Number.isFinite(n) ? numFormat.format(n) : '–';
  const rounded = n => Math.round((n + Number.EPSILON) * 100) / 100;
  function toast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => $('toast').classList.remove('visible'), 2400);
  }

  function loadHistory() {
    try {
      const parsed = JSON.parse(getStored(HISTORY_KEY) || '[]');
      history = Array.isArray(parsed) ? parsed.filter(e => e && typeof e === 'object' && Number.isFinite(Number(e.caloriesPerServing))).slice(0, MAX_HISTORY) : [];
    } catch { history = []; }
    renderHistory();
  }
  function persistHistory() {
    if (!setStored(HISTORY_KEY, JSON.stringify(history))) toast('Speichern nicht möglich: Browserspeicher nicht verfügbar.');
    renderHistory();
  }
  function timeLabel(entry) {
    if (entry.timestamp) {
      const date = new Date(entry.timestamp);
      if (!Number.isNaN(date.getTime())) return date.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return String(entry.date || 'Älterer Eintrag');
  }
  function entryShareText(entry) {
    return `${entry.foodName || 'Lebensmittel'}: ${fmt(Number(entry.caloriesPerServing))} kcal für ${fmt(Number(entry.servingSize))} g/ml (${timeLabel(entry)}). Berechnet mit KCAL.`;
  }
  function renderHistory() {
    $('entryCount').textContent = String(history.length);
    $('historyBadge').textContent = String(history.length);
    $('lastValue').textContent = history.length ? fmt(Number(history[0].caloriesPerServing)) : '–';
    const holder = $('history-entries');
    holder.replaceChildren();
    $('exportHistory').disabled = history.length === 0;
    $('clearHistory').disabled = history.length === 0;
    if (!history.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const icon = document.createElement('div'); icon.className = 'empty-state-icon'; icon.textContent = '◷';
      const title = document.createElement('strong'); title.textContent = 'Noch keine Berechnungen';
      const desc = document.createElement('p'); desc.textContent = 'Sobald du ein Ergebnis speicherst, erscheint es hier.';
      const action = document.createElement('button'); action.className = 'button button-primary'; action.type = 'button'; action.textContent = 'Zum Kalorienrechner'; action.addEventListener('click', () => showTab('calculator'));
      empty.append(icon, title, desc, action); holder.append(empty);
      return;
    }
    history.forEach((entry, index) => {
      const card = document.createElement('article'); card.className = 'history-entry';
      const details = document.createElement('div'); details.className = 'history-details';
      const title = document.createElement('strong'); title.textContent = entry.foodName || 'Lebensmittel';
      const meta = document.createElement('small');
      meta.textContent = `${timeLabel(entry)} · ${fmt(Number(entry.servingSize))} g/ml Portion`;
      details.append(title, meta);
      const value = document.createElement('div'); value.className = 'history-value';
      value.textContent = fmt(Number(entry.caloriesPerServing));
      const unit = document.createElement('small'); unit.textContent = ' kcal'; value.append(unit);
      const actions = document.createElement('div'); actions.className = 'history-item-actions';
      const share = document.createElement('button'); share.type = 'button'; share.className = 'mini-action'; share.title = 'Ergebnis teilen'; share.setAttribute('aria-label', `Ergebnis für ${entry.foodName || 'Lebensmittel'} teilen`);
      share.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 16V3m-5 5 5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>';
      share.addEventListener('click', () => {
        const url = `https://wa.me/?text=${encodeURIComponent(entryShareText(entry))}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      });
      const del = document.createElement('button'); del.type = 'button'; del.className = 'mini-action danger'; del.title = 'Eintrag löschen'; del.setAttribute('aria-label', `Eintrag ${entry.foodName || 'Lebensmittel'} löschen`);
      del.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5"/></svg>';
      del.addEventListener('click', () => { history.splice(index, 1); persistHistory(); toast('Eintrag gelöscht'); });
      actions.append(share, del); card.append(details, value, actions); holder.append(card);
    });
  }

  function getCalculation() {
    const totalWeight = parseDecimal($('totalWeight').value);
    const totalCalories = parseDecimal($('totalCalories').value);
    const servingSize = parseDecimal($('servingSize').value);
    if (!Number.isFinite(totalWeight) || !Number.isFinite(totalCalories) || !Number.isFinite(servingSize) || totalWeight <= 0 || totalCalories < 0 || servingSize <= 0) return null;
    const kcal = totalCalories / totalWeight * servingSize;
    const per100 = totalCalories / totalWeight * 100;
    const ratio = servingSize / totalWeight * 100;
    if (![kcal, per100, ratio].every(Number.isFinite) || kcal > 1e12) return null;
    return { foodName: $('foodName').value.trim() || 'Lebensmittel', totalWeight, totalCalories, servingSize, kcal, per100, ratio };
  }
  function updateShare(calc) {
    const copy = $('copyResult'); const whatsapp = $('shareWhatsapp'); const email = $('shareEmail');
    copy.disabled = !calc;
    if (!calc) {
      [whatsapp, email].forEach(a => { a.href = '#'; a.classList.add('disabled'); a.setAttribute('aria-disabled', 'true'); });
      return;
    }
    const text = `${calc.foodName}: ${fmt(calc.kcal)} kcal pro Portion (${fmt(calc.servingSize)} g/ml). ${fmt(calc.per100)} kcal pro 100 g/ml. Berechnet mit KCAL.`;
    whatsapp.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    email.href = `mailto:?subject=${encodeURIComponent('Meine Kalorienberechnung')}&body=${encodeURIComponent(text)}`;
    [whatsapp, email].forEach(a => { a.classList.remove('disabled'); a.setAttribute('aria-disabled', 'false'); });
  }
  function updateLive() {
    const calc = getCalculation(); currentResult = calc;
    $('formError').hidden = true;
    if (!calc) {
      $('resultValue').textContent = '–';
      $('per100').textContent = '–';
      $('portionPercent').textContent = '–';
      $('meterValue').textContent = '0 %';
      $('meterFill').style.width = '0%';
      $('resultRing').style.setProperty('--progress', '0%');
      $('resultNote').textContent = 'Gib deine Werte ein, um das Ergebnis direkt zu sehen.';
    } else {
      $('resultValue').textContent = fmt(calc.kcal);
      $('per100').textContent = `${fmt(calc.per100)} kcal`;
      $('portionPercent').textContent = `${fmt(calc.ratio)} %`;
      $('meterValue').textContent = `${fmt(calc.ratio)} %`;
      $('meterFill').style.width = `${Math.min(calc.ratio, 100)}%`;
      $('resultRing').style.setProperty('--progress', `${Math.min(calc.ratio, 100)}%`);
      $('resultNote').textContent = calc.ratio > 100 ? 'Deine Portion ist größer als die angegebene Gesamtmenge.' : 'Live berechnet · Noch nicht im Verlauf gespeichert';
    }
    document.querySelectorAll('[data-size]').forEach(b => b.classList.toggle('active', parseDecimal($('servingSize').value) === Number(b.dataset.size)));
    updateShare(calc);
  }
  fields.forEach(id => $(id).addEventListener('input', updateLive));
  document.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => { $('servingSize').value = button.dataset.size; updateLive(); $('servingSize').focus(); }));
  form.addEventListener('submit', event => {
    event.preventDefault(); const calc = getCalculation();
    if (!calc) { $('formError').textContent = 'Bitte gib gültige Werte ein: Gesamtmenge und Portion größer als 0, Kalorien mindestens 0. Komma und Punkt sind erlaubt.'; $('formError').hidden = false; return; }
    history.unshift({ date: new Date().toLocaleString('de-DE'), timestamp: new Date().toISOString(), foodName: calc.foodName, totalWeight: calc.totalWeight, totalCalories: calc.totalCalories, servingSize: calc.servingSize, caloriesPerServing: rounded(calc.kcal) });
    history = history.slice(0, MAX_HISTORY); persistHistory(); toast('Ergebnis im Verlauf gespeichert');
    $('resultNote').textContent = 'Im Verlauf gespeichert ✓';
  });
  form.addEventListener('reset', () => { requestAnimationFrame(updateLive); });
  $('shareWhatsapp').addEventListener('click', e => { if (!currentResult) e.preventDefault(); });
  $('shareEmail').addEventListener('click', e => { if (!currentResult) e.preventDefault(); });
  async function copyText(text) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch { /* Fallback */ }
    const node = document.createElement('textarea'); node.value = text; node.style.position = 'fixed'; node.style.opacity = '0'; document.body.append(node); node.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { /* Nicht unterstützt */ } node.remove(); return ok;
  }
  $('copyResult').addEventListener('click', async () => {
    if (!currentResult) return;
    const c = currentResult;
    const ok = await copyText(`${c.foodName}: ${fmt(c.kcal)} kcal (${fmt(c.servingSize)} g/ml). ${fmt(c.per100)} kcal pro 100 g/ml.`);
    toast(ok ? 'Ergebnis kopiert' : 'Kopieren ist in diesem Browser nicht verfügbar');
  });
  $('clearHistory').addEventListener('click', () => { if (!history.length) return; if (window.confirm('Möchtest du wirklich den gesamten Verlauf auf diesem Gerät löschen?')) { history = []; persistHistory(); toast('Verlauf gelöscht'); } });
  $('exportHistory').addEventListener('click', () => {
    if (!history.length) return;
    const cols = ['Datum', 'Lebensmittel', 'Gesamtmenge g/ml', 'Gesamtkalorien', 'Portion g/ml', 'kcal pro Portion'];
    const escapeCSV = value => {
      let s = String(value ?? '');
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // Tabellen-Formel-Injection verhindern
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = history.map(e => [timeLabel(e), e.foodName, e.totalWeight, e.totalCalories, e.servingSize, e.caloriesPerServing].map(escapeCSV).join(';'));
    const csv = '\ufeff' + cols.map(escapeCSV).join(';') + '\r\n' + rows.join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'kcal-verlauf.csv'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
    toast('CSV-Datei heruntergeladen');
  });

  const sectionNames = { calculator: 'Kalorienrechner', history: 'Verlauf', calc: 'Taschenrechner' };
  let currentTab = 'calculator';
  function showTab(name) {
    if (!sectionNames[name]) return;
    currentTab = name;
    for (const key of Object.keys(sectionNames)) {
      const section = $(key); const visible = key === name; section.hidden = !visible; section.classList.toggle('active', visible);
    }
    document.querySelectorAll('[data-tab]').forEach(btn => {
      const active = btn.dataset.tab === name; btn.classList.toggle('active', active);
      if (btn.classList.contains('nav-link')) { if (active) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current'); }
    });
    $('breadcrumbCurrent').textContent = sectionNames[name];
    document.title = `KCAL – ${sectionNames[name]}`;
  }
  document.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => showTab(btn.dataset.tab)));

  const html = document.documentElement;
  function setTheme(theme) {
    const light = theme === 'light'; html.dataset.theme = light ? 'light' : 'dark';
    $('themeToggle').setAttribute('aria-label', light ? 'Dunkles Design aktivieren' : 'Helles Design aktivieren');
    $('themeToggle').title = light ? 'Dunkles Design aktivieren' : 'Helles Design aktivieren';
    $('themeToggle').innerHTML = light ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/></svg>';
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = light ? '#f0f4f3' : '#0b111c';
    setStored(THEME_KEY, html.dataset.theme);
  }
  setTheme(getStored(THEME_KEY) || 'dark');
  $('themeToggle').addEventListener('click', () => setTheme(html.dataset.theme === 'dark' ? 'light' : 'dark'));

  // Einfache, korrekte Taschenrechnerlogik ohne eval()
  let current = '0'; let stored = null; let operation = null; let nextFresh = false; let expression = '';
  const display = $('calcResult');
  function calcText(n) { return Number.isFinite(n) ? String(Number(n.toPrecision(12))) : 'Fehler'; }
  function refreshCalc() { display.value = current.replace('.', ','); $('calcExpression').textContent = expression; }
  function resetCalc() { current = '0'; stored = null; operation = null; nextFresh = false; expression = ''; refreshCalc(); }
  function compute(a, b, op) {
    if (op === '+') return a + b;
    if (op === '−') return a - b;
    if (op === '×') return a * b;
    if (op === '÷') return b === 0 ? NaN : a / b;
    return b;
  }
  function handleKey(key) {
    if (key === 'C') { resetCalc(); return; }
    if (/^\d$/.test(key)) {
      if (current === 'Fehler' || nextFresh) { current = key; nextFresh = false; if (operation === null) expression = ''; }
      else if (current.replace(/[.\-]/g, '').length < 13) current = current === '0' ? key : current + key;
    } else if (key === ',') {
      if (current === 'Fehler' || nextFresh) { current = '0.'; nextFresh = false; }
      else if (!current.includes('.')) current += '.';
    } else if (key === '±') {
      if (current !== 'Fehler' && Number(current) !== 0) current = current.startsWith('-') ? current.slice(1) : '-' + current;
    } else if (key === '%') {
      if (current !== 'Fehler') current = calcText(Number(current) / 100);
    } else if (['+', '−', '×', '÷'].includes(key)) {
      if (current === 'Fehler') return;
      if (operation && !nextFresh) {
        const answer = compute(stored, Number(current), operation);
        if (!Number.isFinite(answer)) { current = 'Fehler'; stored = null; operation = null; expression = 'Division durch 0'; refreshCalc(); return; }
        current = calcText(answer);
      }
      stored = Number(current); operation = key; nextFresh = true; expression = `${current.replace('.', ',')} ${key}`;
    } else if (key === '=') {
      if (operation && stored !== null && current !== 'Fehler') {
        const b = Number(current); const answer = compute(stored, b, operation);
        expression = `${calcText(stored).replace('.', ',')} ${operation} ${current.replace('.', ',')} =`;
        current = Number.isFinite(answer) ? calcText(answer) : 'Fehler'; stored = null; operation = null; nextFresh = true;
      }
    } else if (key === 'Backspace') {
      if (nextFresh || current === 'Fehler') current = '0'; else current = current.length > 1 ? current.slice(0, -1) : '0';
      if (current === '-') current = '0';
    }
    refreshCalc();
  }
  document.querySelectorAll('[data-key]').forEach(button => button.addEventListener('click', () => handleKey(button.dataset.key)));
  document.addEventListener('keydown', e => {
    if (currentTab !== 'calc' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.matches('input:not([readonly]), textarea')) return;
    const translated = { '*': '×', '/': '÷', '-': '−', '.': ',', 'Enter': '=', 'Escape': 'C' }[e.key] || e.key;
    if (/^\d$/.test(translated) || ['×', '÷', '−', '+', '=', ',', '%', 'C', 'Backspace'].includes(translated)) { e.preventDefault(); handleKey(translated); }
  });

  loadHistory(); updateLive(); refreshCalc();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
