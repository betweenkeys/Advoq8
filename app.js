// Advoq8 prototype. Runs entirely in the browser. Nothing is sent anywhere or saved.
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var screens = Array.prototype.slice.call(document.querySelectorAll('.screen'));
  var history = [];
  var current = null;
  var supportOn = false;

  var STEPS = { unpack: 'Step 1 of 3', reflect: 'Step 1 of 3', draft: 'Step 2 of 3', pushback: 'Step 3 of 3' };
  var TOPBAR_HIDDEN = { welcome1: true };

  function show(name, opts) {
    opts = opts || {};
    if (current && !opts.isBack && current !== name) history.push(current);
    current = name;
    screens.forEach(function (s) { s.classList.toggle('active', s.dataset.screen === name); });
    $('topbar').hidden = !!TOPBAR_HIDDEN[name];
    $('step').textContent = STEPS[name] || '';
    $('back').style.visibility = history.length ? 'visible' : 'hidden';
    $('supportBanner').hidden = !(supportOn && name !== 'safety');
    if (name === 'reflect') fillReflect();
    if (name === 'pushback') renderPicks();
    if (name === 'plan') fillPlan();
    window.scrollTo(0, 0);
    var h = document.querySelector('.screen.active h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  $('back').addEventListener('click', function () {
    if (!history.length) return;
    show(history.pop(), { isBack: true });
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go]');
    if (t) show(t.dataset.go);
  });

  // ---------- Safety check ----------
  // A simple phrase check. It cannot understand context, so the support link is always visible too.
  var SAFETY = [
    /\b(hits?|hitting|hit me|slap(s|ped)? me|punch(es|ed)? me|kick(s|ed)? me|chok(e|es|ed|ing)|strangl\w*|push(es|ed)? me)\b/i,
    /\b(threat(en|ens|ened|ening)?|weapon|gun|knife)\b/i,
    /\b(abuse|abusive|abused|abuser)\b/i,
    /\b(kill (me|myself)|end my life|suicid\w*|self[- ]harm|hurt myself|want to die)\b/i,
    /\b(afraid for my (life|safety)|scared for my (life|safety)|not safe|unsafe|in danger)\b/i,
    /\b(stalk\w*|won'?t let me (leave|go|see|talk)|controls? (my money|where i go|who i see)|locks? me (in|out))\b/i
  ];
  function looksUnsafe(text) {
    return SAFETY.some(function (re) { return re.test(text); });
  }

  // ---------- Unpack ----------
  $('useExample').addEventListener('click', function () {
    $('situation').value = "My mom expects me to host Christmas again. I've hosted the last four years and I'm worn out. I want my sister to take a turn, but every time I bring it up, I end up saying yes.";
    $('want').value = 'I want someone else to host this year.';
    $('fear').value = "Mom will be hurt and say I'm pulling away from the family.";
  });

  $('unpackNext').addEventListener('click', function () {
    var s = $('situation').value.trim(), w = $('want').value.trim(), f = $('fear').value.trim();
    $('unpackError').hidden = !!(s && w && f);
    if (!(s && w && f)) return;
    if (!supportOn && looksUnsafe([s, w, f].join(' '))) {
      $('safetyLead').textContent = 'Some of what you shared may be about your safety. That is not something to practice a script for. Talking with someone trained can help.';
      show('safety');
      return;
    }
    show('reflect');
  });

  $('keepGoing').addEventListener('click', function () {
    supportOn = true;
    var s = $('situation').value.trim(), w = $('want').value.trim(), f = $('fear').value.trim();
    show(s && w && f ? 'reflect' : 'unpack', { isBack: true });
  });

  function fillReflect() {
    $('rSituation').textContent = $('situation').value.trim();
    $('rWant').textContent = $('want').value.trim();
    $('rFear').textContent = $('fear').value.trim();
  }

  // ---------- Draft check ----------
  var RULES = [
    { why: "Apologizing before you've asked.", re: /\b(i'?m (so |really |very )?sorry|sorry|i apologi[sz]e|i hate to ask|forgive me)\b/gi },
    { why: 'Shrinks your need before they hear it.', re: /\b(i know (this|it)('?s| is) (a lot( to ask)?|asking a lot|a big ask)|i know you'?re (busy|tired)|if it'?s not too much (trouble|to ask)|small favou?r|a little|a bit|just|only)\b/gi },
    { why: 'A hedge. It makes it easy to say no.', re: /\b(maybe|possibly|perhaps|kind of|kinda|sort of|i guess|i think|i feel like|probably|hopefully)\b/gi },
    { why: 'Asking permission for something you can state.', re: /\b(would it (maybe |possibly )?be (ok|okay|alright|all right)|is it (ok|okay|alright) if|would you mind|do you think (you|it)|could i possibly)\b/gi },
    { why: 'Says no for them.', re: /\b(totally fine if not|no worries if not|(it'?s )?(ok|okay|fine) if not|no pressure|feel free to say no|don'?t worry about it|only if you want)\b/gi }
  ];

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  function analyze(text) {
    var hits = [];
    RULES.forEach(function (r) {
      r.re.lastIndex = 0;
      var m;
      while ((m = r.re.exec(text)) !== null) {
        hits.push({ start: m.index, end: m.index + m[0].length, phrase: m[0], why: r.why });
      }
    });
    hits.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    var clean = [], lastEnd = -1;
    hits.forEach(function (h) { if (h.start >= lastEnd) { clean.push(h); lastEnd = h.end; } });
    var words = text.trim().split(/\s+/).filter(Boolean).length;
    return { hits: clean, long: words > 60, words: words };
  }

  function renderFlags(text, box) {
    var res = analyze(text);
    var html = '';
    var marked = '', i = 0;
    res.hits.forEach(function (h) {
      marked += escapeHtml(text.slice(i, h.start)) + '<mark>' + escapeHtml(text.slice(h.start, h.end)) + '</mark>';
      i = h.end;
    });
    marked += escapeHtml(text.slice(i));
    var n = res.hits.length + (res.long ? 1 : 0);
    if (n === 0) {
      html = '<strong>Nothing flagged</strong><p>No apologies, hedges, or built-in outs found. Read it out loud once. Does it say what you need?</p>';
    } else {
      html = '<strong>' + n + (n === 1 ? ' place' : ' places') + ' you shrink your ask</strong>';
      html += '<p class="quote">' + marked + '</p><ul class="flag-list">';
      res.hits.forEach(function (h) {
        html += '<li><span class="phrase">"' + escapeHtml(h.phrase) + '"</span><span class="why">' + h.why + '</span></li>';
      });
      if (res.long) html += '<li><span class="phrase">' + res.words + ' words</span><span class="why">Long asks can turn into over-explaining. Try one or two sentences.</span></li>';
      html += '</ul><p class="muted small">You decide what to keep. Some of these may be fine in your situation.</p>';
    }
    box.innerHTML = html;
    box.hidden = false;
  }

  $('checkDraft').addEventListener('click', function () {
    var t = $('draft1').value.trim();
    $('draftError').hidden = !!t;
    if (!t) return;
    renderFlags(t, $('flags'));
    $('reviseField').hidden = false;
  });

  $('checkRevised').addEventListener('click', function () {
    var t = $('draft2').value.trim();
    if (t) renderFlags(t, $('flags2'));
  });

  $('draftNext').addEventListener('click', function () {
    var t = $('draft1').value.trim() || $('draft2').value.trim();
    $('draftError').hidden = !!t;
    if (t) show('pushback');
  });

  function finalAsk() {
    return $('draft2').value.trim() || $('draft1').value.trim();
  }

  // ---------- Pushback ----------
  var pushback = [
    { text: "But we've always done it this way.", on: false, reply: '' },
    { text: "After everything I've done for you.", on: false, reply: '' },
    { text: "You're being selfish.", on: false, reply: '' },
    { text: 'Can you just do it this one time?', on: false, reply: '' },
    { text: 'Why are you making such a big deal out of this?', on: false, reply: '' },
    { text: "Fine. I guess I'll just do it myself.", on: false, reply: '' }
  ];

  function renderPicks() {
    var box = $('picks');
    box.querySelectorAll('.pick').forEach(function (n) { n.remove(); });
    pushback.forEach(function (p, i) {
      var l = document.createElement('label');
      l.className = 'pick';
      var c = document.createElement('input');
      c.type = 'checkbox'; c.checked = p.on;
      c.addEventListener('change', function () { p.on = c.checked; renderReplies(); });
      var s = document.createElement('span'); s.textContent = '"' + p.text + '"';
      l.appendChild(c); l.appendChild(s);
      box.appendChild(l);
    });
    renderReplies();
  }

  function renderReplies() {
    var box = $('replies');
    box.innerHTML = '';
    pushback.forEach(function (p, i) {
      if (!p.on) return;
      var wrap = document.createElement('div'); wrap.className = 'field reply';
      var l = document.createElement('label'); l.setAttribute('for', 'reply' + i);
      l.textContent = 'If they say "' + p.text + '", you say:';
      var t = document.createElement('textarea'); t.id = 'reply' + i; t.rows = 2; t.value = p.reply;
      t.placeholder = 'Your reply, in your words';
      t.addEventListener('input', function () { p.reply = t.value; });
      wrap.appendChild(l); wrap.appendChild(t); box.appendChild(wrap);
    });
  }

  $('addPush').addEventListener('click', function () {
    var v = $('ownPush').value.trim();
    if (!v) return;
    pushback.push({ text: v.replace(/^["']|["']$/g, ''), on: true, reply: '' });
    $('ownPush').value = '';
    renderPicks();
  });

  // ---------- Plan ----------
  function fillPlan() {
    $('pAsk').textContent = finalAsk();
    var list = pushback.filter(function (p) { return p.on; });
    var box = $('pReplies');
    box.innerHTML = '';
    $('pRepliesCard').hidden = list.length === 0;
    list.forEach(function (p) {
      var q = document.createElement('p'); q.innerHTML = '<strong></strong>'; q.firstChild.textContent = '"' + p.text + '"';
      var a = document.createElement('p'); a.className = 'quote';
      a.textContent = p.reply.trim() ? p.reply.trim() : '(no reply planned yet)';
      a.style.marginBottom = '8px';
      box.appendChild(q); box.appendChild(a);
    });
  }

  function planText() {
    var lines = ['My Advoq8 plan', '', 'My ask:', finalAsk(), ''];
    var list = pushback.filter(function (p) { return p.on; });
    if (list.length) {
      lines.push('If they push back:');
      list.forEach(function (p) {
        lines.push('They say: "' + p.text + '"');
        lines.push('I say: ' + (p.reply.trim() || '(no reply planned yet)'));
        lines.push('');
      });
    }
    lines.push('It may feel uncomfortable when I say it. That does not mean I did something wrong.');
    return lines.join('\n');
  }

  $('copyPlan').addEventListener('click', function () {
    var text = planText();
    var done = function () { $('copyStatus').textContent = 'Copied.'; };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallbackCopy);
    } else { fallbackCopy(); }
    function fallbackCopy() {
      var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
      ta.select(); try { document.execCommand('copy'); done(); } catch (e) { $('copyStatus').textContent = 'Copy did not work. Try the download.'; }
      ta.remove();
    }
  });

  $('downloadPlan').addEventListener('click', function () {
    var blob = new Blob([planText()], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'advoq8-plan.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  $('startOver').addEventListener('click', function () {
    ['situation', 'want', 'fear', 'draft1', 'draft2', 'ownPush'].forEach(function (id) { $(id).value = ''; });
    $('flags').hidden = true; $('flags2').hidden = true; $('reviseField').hidden = true;
    pushback = pushback.slice(0, 6).map(function (p) { return { text: p.text, on: false, reply: '' }; });
    $('copyStatus').textContent = '';
    history = [];
    show('unpack', { isBack: true });
  });

  show('welcome1');
})();
