/* SVTStar : QCM par chapitre. On part de 20 points ; chaque passe pose les
   questions pas encore réussies, du plus facile au plus difficile, et chaque
   erreur coûte des points (facile −3, moyen −2, difficile −1). La partie est
   gagnée quand toutes les questions ont été réussies, perdue à 0 point.
   Étoiles = points ÷ 4, arrondi à l'inférieur. Les joueurs et leurs records
   sont gardés dans le navigateur. */
(function () {
  'use strict';

  var CHAPS = window.CHAPITRES || [];
  var LEVELS = {1: 'Facile', 2: 'Moyen', 3: 'Difficile'};
  var START = 20;
  var PENALTY = {1: 3, 2: 2, 3: 1};
  function starsOf(points) { return Math.max(0, Math.min(5, Math.floor(points / 4))); }
  function starGlyphs(n) { return '<span class="star-glyphs has">' + '★'.repeat(n) + '</span><span class="star-glyphs">' + '☆'.repeat(5 - n) + '</span>'; }
  var KEY = 'svtstar:';

  function load(k, def) {
    try { var v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  }
  function save(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
    });
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function chapById(id) { return CHAPS.filter(function (c) { return c.id === id; })[0]; }
  function chapLabel(c) { return c.matiere + ' — chapitre ' + c.numero; }

  var app = document.getElementById('app');
  var state = {
    screen: 'profil',
    players: load('joueurs', []),
    player: load('joueur', null),
    chap: load('chapitre', CHAPS.length ? CHAPS[0].id : null),
    mode: load('mode', 'all'),
    run: null
  };
  if (state.player && state.players.indexOf(state.player) >= 0) state.screen = 'menu';
  if (!chapById(state.chap) && CHAPS.length) state.chap = CHAPS[0].id;

  function stats(name) { return load('scores:' + name, {}); }
  function chapStats(name, id) {
    var s = stats(name)[id] || {};
    return {best: s.best || 0, parties: s.parties || 0, gagnees: s.gagnees || 0, fails: s.fails || {}};
  }
  function addFail(name, id, q) {
    var all = stats(name), s = chapStats(name, id);
    s.fails[q] = (s.fails[q] || 0) + 1;
    all[id] = s; save('scores:' + name, all);
  }
  function recordRun(name, id, points, won) {
    var all = stats(name), s = chapStats(name, id);
    var isRecord = won && points > s.best;
    if (won) { s.best = Math.max(s.best, points); s.gagnees += 1; }
    s.parties += 1;
    all[id] = s; save('scores:' + name, all);
    return isRecord;
  }

  /* ---------- Écrans ---------- */

  function render() {
    if (state.screen === 'profil') renderProfil();
    else if (state.screen === 'menu') renderMenu();
    else if (state.screen === 'quiz') renderQuiz();
    else renderFin();
  }

  function renderProfil() {
    var list = state.players.map(function (p) {
      return '<div class="profile-row"><span class="lb-name"><strong>' + esc(p) + '</strong></span>' +
        '<button class="btn player-btn" data-pick="' + esc(p) + '">Jouer</button>' +
        '<button class="btn ghost trash" data-del="' + esc(p) + '" title="Supprimer ce joueur et ses records">Supprimer</button></div>';
    }).join('');
    app.innerHTML =
      '<h2>Qui joue ?</h2>' +
      (list ? '<div class="profile-list">' + list + '</div>' : '<p class="muted">Aucun joueur pour l\'instant sur cet appareil.</p>') +
      '<h3>Nouveau joueur</h3>' +
      '<div class="field"><input class="text-input" id="newname" maxlength="20" placeholder="Prénom ou pseudo"></div>' +
      '<div class="actions"><button class="btn primary" id="create">Créer et jouer</button></div>' +
      '<p class="muted" id="msg"></p>';
    var input = document.getElementById('newname');
    function create() {
      var n = input.value.trim();
      if (!n) { input.classList.add('invalid'); return; }
      if (state.players.indexOf(n) < 0) { state.players.push(n); save('joueurs', state.players); }
      pick(n);
    }
    document.getElementById('create').onclick = create;
    input.onkeydown = function (e) { if (e.key === 'Enter') create(); };
    app.querySelectorAll('[data-pick]').forEach(function (b) { b.onclick = function () { pick(b.dataset.pick); }; });
    app.querySelectorAll('[data-del]').forEach(function (b) {
      b.onclick = function () {
        var n = b.dataset.del;
        if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Confirmer la suppression'; b.classList.add('danger'); return; }
        state.players = state.players.filter(function (p) { return p !== n; });
        save('joueurs', state.players);
        try { localStorage.removeItem(KEY + 'scores:' + n); } catch (e) {}
        if (state.player === n) { state.player = null; save('joueur', null); }
        renderProfil();
      };
    });
  }

  function pick(n) {
    state.player = n; save('joueur', n);
    state.screen = 'menu'; render();
  }

  function leaderboard(id) {
    var rows = state.players.map(function (p) { var s = chapStats(p, id); return {name: p, best: s.best, parties: s.parties, won: s.gagnees}; })
      .filter(function (r) { return r.won > 0; })
      .sort(function (a, b) { return b.best - a.best; });
    if (!rows.length) return '<p class="muted">Personne n\'a encore terminé ce chapitre.</p>';
    return '<div class="profile-list">' + rows.map(function (r, i) {
      return '<div class="profile-row lb-row' + (r.name === state.player ? ' me' : '') + '"><span class="lb-name"><span class="lb-rank">' + (i + 1) + '</span>' +
        esc(r.name) + '</span><span><span class="record">' + r.best + ' pts</span> ' + starGlyphs(starsOf(r.best)) + '</span><span class="muted">' + r.parties + ' partie' + (r.parties > 1 ? 's' : '') + '</span></div>';
    }).join('') + '</div>';
  }

  function modeChips(c) {
    var all = '<button class="chip mode' + (state.mode === 'all' ? ' on' : '') + '" data-mode="all"><strong>Tout le chapitre</strong>' +
      '<span>' + c.questions.length + ' questions · rapporte des étoiles</span></button>';
    return all + [1, 2, 3].map(function (d) {
      var n = c.questions.filter(function (q) { return q.d === d; }).length;
      return '<button class="chip mode lv-' + d + (state.mode === String(d) ? ' on' : '') + '" data-mode="' + d + '"><strong>Entraînement ' + LEVELS[d].toLowerCase() + '</strong>' +
        '<span>' + n + ' questions · sans étoiles</span></button>';
    }).join('');
  }

  function renderMenu() {
    var chips = CHAPS.map(function (c) {
      var s = chapStats(state.player, c.id);
      return '<button class="chip chap' + (c.id === state.chap ? ' on' : '') + '" data-chap="' + c.id + '">' +
        '<strong>' + esc(chapLabel(c)) + '</strong><span>' + esc(c.titre) + '</span>' +
        '<span class="count">' + c.questions.length + ' questions' + (s.gagnees ? ' · record <span class="record">' + s.best + ' pts</span> ' + starGlyphs(starsOf(s.best)) : '') + '</span></button>';
    }).join('');
    var c = chapById(state.chap);
    app.innerHTML =
      '<div class="quiz-top"><h2>Bonjour ' + esc(state.player) + '</h2>' +
      '<button class="btn ghost" id="switch">Changer de joueur</button></div>' +
      '<h3>Choisis un chapitre</h3><div class="chips chap-list">' + chips + '</div>' +
      (c ? '<h3>Mode de jeu</h3><div class="chips modes">' + modeChips(c) + '</div>' : '') +
      '<div class="actions"><button class="btn primary big-btn" id="start"' + (c ? '' : ' disabled') + '>Commencer</button></div>' +
      (c ? '<h3>Classement du chapitre</h3>' + leaderboard(c.id) : '');
    document.getElementById('switch').onclick = function () { state.screen = 'profil'; render(); };
    app.querySelectorAll('[data-chap]').forEach(function (b) {
      b.onclick = function () { state.chap = b.dataset.chap; save('chapitre', state.chap); renderMenu(); };
    });
    app.querySelectorAll('[data-mode]').forEach(function (b) {
      b.onclick = function () { state.mode = b.dataset.mode; save('mode', state.mode); renderMenu(); };
    });
    document.getElementById('start').onclick = start;
  }

  function ordered(qs) {
    var out = [];
    [1, 2, 3].forEach(function (d) { out = out.concat(shuffle(qs.filter(function (q) { return q.d === d; }))); });
    return out;
  }

  function start() {
    var c = chapById(state.chap);
    var training = state.mode !== 'all';
    var qs = training ? c.questions.filter(function (q) { return String(q.d) === state.mode; }) : c.questions;
    state.run = {chap: c, training: training, level: +state.mode || 0, pass: 1, order: ordered(qs), i: 0, missed: [], points: START,
                 errors: 0, answered: null, choices: null, best: chapStats(state.player, c.id).best};
    state.screen = 'quiz';
    prepare();
    render();
  }

  function prepare() {
    var q = state.run.order[state.run.i];
    state.run.choices = shuffle([q.ok].concat(q.ko));
    state.run.answered = null;
  }

  function remaining() {
    var r = state.run;
    return r.order.length - r.i - (r.answered !== null ? 1 : 0) + r.missed.length;
  }

  function renderQuiz() {
    var r = state.run, q = r.order[r.i], total = r.order.length;
    var opts = r.choices.map(function (o, k) {
      var cls = 'opt';
      if (r.answered !== null) {
        if (o === q.ok) cls += ' good';
        else if (k === r.answered) cls += ' bad';
      }
      return '<button class="' + cls + '" data-k="' + k + '"' + (r.answered !== null ? ' disabled' : '') + '><kbd>' + (k + 1) + '</kbd>' + esc(o) + '</button>';
    }).join('');
    var fb = '';
    if (r.answered !== null) {
      var good = r.choices[r.answered] === q.ok;
      var last = r.i + 1 >= total;
      var label = r.points <= 0 ? 'Voir le résultat'
        : !last ? 'Question suivante'
        : r.missed.length ? 'Revoir les ' + r.missed.length + ' erreur' + (r.missed.length > 1 ? 's' : '')
        : 'Voir le résultat';
      fb = '<div class="feedback ' + (good ? 'fb-ok' : 'fb-ko') + '"><div class="fb-title"><span>' +
        (good ? 'Bonne réponse !' : 'Raté : la bonne réponse était « ' + esc(q.ok) + ' »') + '</span>' +
        (good ? '' : '<span>−' + PENALTY[q.d] + ' pts</span>') + '</div>' +
        '<p>' + esc(q.e) + '</p>' + (good ? '' : '<p class="muted">Cette question reviendra à la passe suivante.</p>') + '</div>' +
        '<div class="actions"><button class="btn primary" id="next">' + label + '</button></div>' +
        '<p class="enter-hint">Entrée pour continuer</p>';
    }
    app.innerHTML =
      '<div class="quiz-top"><div><div class="muted">' + esc(chapLabel(r.chap)) + '</div>' +
      '<div class="streak' + (r.points < 8 ? ' low' : '') + '">' + r.points + ' <small>points</small></div>' +
      '<div>' + (r.training ? '<span class="lv-tag lv-' + r.level + '">Entraînement ' + LEVELS[r.level].toLowerCase() + '</span>' : starGlyphs(starsOf(r.points))) + '</div></div>' +
      '<div class="muted right">' + (r.training || !r.best ? '' : 'Record : <span class="record">' + r.best + ' pts</span><br>') +
      'Erreurs : ' + r.errors + '<br>Restent : ' + remaining() + '</div></div>' +
      '<div class="progress"><span style="width:' + (100 * r.i / total) + '%"></span></div>' +
      '<div class="muted">' + (r.pass === 1 ? 'Première passe' : 'Passe ' + r.pass + ' : révision des erreurs') +
      ' · question ' + (r.i + 1) + ' sur ' + total + '</div>' +
      '<div class="qcard lv-border-' + q.d + '"><div class="qtags"><span class="lv-tag lv-' + q.d + '">' + LEVELS[q.d] + '</span>' +
      '<span class="muted">erreur : −' + PENALTY[q.d] + ' pts</span></div>' +
      '<div class="question">' + esc(q.q) + '</div><div class="options">' + opts + '</div>' + fb + '</div>' +
      '<div class="actions"><button class="btn ghost" id="restart">Recommencer</button><button class="btn ghost" id="quit">Abandonner</button></div>';
    app.querySelectorAll('.opt').forEach(function (b) { b.onclick = function () { answer(+b.dataset.k); }; });
    var next = document.getElementById('next');
    if (next) { next.onclick = advance; next.focus(); }
    document.getElementById('restart').onclick = start;
    document.getElementById('quit').onclick = function () { state.screen = 'menu'; render(); };
  }

  function answer(k) {
    var r = state.run, q = r.order[r.i];
    if (r.answered !== null) return;
    r.answered = k;
    if (r.choices[k] !== q.ok) {
      r.points = Math.max(0, r.points - PENALTY[q.d]);
      r.errors += 1;
      r.missed.push(q);
      addFail(state.player, r.chap.id, q.q);
    }
    renderQuiz();
  }

  function advance() {
    var r = state.run;
    if (r.points <= 0) return finish(false);
    r.i += 1;
    if (r.i >= r.order.length) {
      if (!r.missed.length) return finish(true);
      r.pass += 1; r.order = ordered(r.missed); r.missed = []; r.i = 0;
    }
    prepare();
    renderQuiz();
  }

  function finish(won) {
    var r = state.run;
    r.won = won;
    r.isRecord = r.training ? false : recordRun(state.player, r.chap.id, r.points, won);
    state.screen = 'fin';
    render();
  }

  function renderFin() {
    var r = state.run, c = r.chap;
    var perfect = r.won && r.errors === 0;
    var title = perfect ? 'Sans faute !' : r.won ? 'Chapitre terminé' : 'Plus de points : partie perdue';
    var fails = chapStats(state.player, c.id).fails;
    var worst = Object.keys(fails).sort(function (a, b) { return fails[b] - fails[a]; }).slice(0, 5)
      .map(function (qt) {
        var q = c.questions.filter(function (x) { return x.q === qt; })[0];
        return q ? '<li><strong>' + esc(q.q) + '</strong> → ' + esc(q.ok) + ' <span class="muted">(ratée ' + fails[qt] + ' fois)</span></li>' : '';
      }).join('');
    app.innerHTML =
      '<div class="result-hero"><div class="status ' + (r.won ? 'win' : 'lose') + '">' + title + '</div>' +
      '<div class="big' + (r.won ? ' win' : ' lose') + '">' + r.points + ' points</div>' +
      (r.training ? '<div><span class="lv-tag lv-' + r.level + '">Entraînement ' + LEVELS[r.level].toLowerCase() + '</span> <span class="muted">sans étoiles ni record</span></div>'
        : '<div class="new-stars">' + starGlyphs(starsOf(r.points)) + '</div>') +
      '<div class="muted">' + r.errors + ' erreur' + (r.errors > 1 ? 's' : '') + ' en ' + r.pass + ' passe' + (r.pass > 1 ? 's' : '') + '</div>' +
      (r.isRecord ? '<div class="new-stars">Nouveau record !</div>' :
        r.training && r.won ? '' :
        r.won ? '<div class="muted">Record : <span class="record">' + chapStats(state.player, c.id).best + ' pts</span></div>' :
        '<div class="muted">À 0 point, la partie s\'arrête : recommence pour terminer le chapitre.</div>') +
      '</div>' +
      '<div class="actions"><button class="btn primary big-btn" id="again">Recommencer</button><button class="btn ghost" id="menu">Changer de chapitre</button></div>' +
      '<h3>Classement du chapitre</h3>' + leaderboard(c.id) +
      (worst ? '<h3>Tes questions les plus ratées</h3><ul class="worst">' + worst + '</ul>' : '');
    document.getElementById('again').onclick = start;
    document.getElementById('again').focus();
    document.getElementById('menu').onclick = function () { state.screen = 'menu'; render(); };
  }

  document.addEventListener('keydown', function (e) {
    if (state.screen !== 'quiz' || e.target.tagName === 'INPUT') return;
    var r = state.run;
    if (r.answered === null && /^[1-4]$/.test(e.key)) answer(+e.key - 1);
    else if (r.answered !== null && e.key === 'Enter') { e.preventDefault(); advance(); }
  });

  /* Onglets Jouer / Règles du jeu */
  function showTab() {
    var id = location.hash === '#regles' ? 'regles' : 'jeu';
    document.querySelectorAll('.tab-panel').forEach(function (p) { p.hidden = p.id !== id; });
    document.querySelectorAll('.tab-link').forEach(function (a) { a.classList.toggle('on', a.dataset.tab === id); });
  }
  window.addEventListener('hashchange', showTab);
  showTab();
  render();
})();
