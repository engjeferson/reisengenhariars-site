(function () {
  'use strict';

  // ---- Configuração -------------------------------------------------------
  var CRM_URL = 'https://crm.reisengenhariars.com.br/api/funil/lead';
  var WHATSAPP = '5551981519380';
  // Prévia: não envia nada ao CRM (usada na versão de demonstração).
  var DRY_RUN = !!window.__FUNIL_DRY_RUN || /[?&]preview=1\b/.test(location.search);

  var STEPS = [
    { name: 'Sistema', title: 'Como você imagina sua obra?',
      lead: 'Cada sistema muda prazo, custo e conforto. Se ainda não sabe, nós indicamos.',
      questions: [{ key: 'sistema', label: 'Sistema', type: 'photo', options: [
        { v: 'steel_frame', t: 'Steel Frame', s: 'Obra industrializada e rápida', img: 'img/steel.jpg' },
        { v: 'alvenaria', t: 'Alvenaria', s: 'Construção convencional', img: 'img/alvenaria.jpg' },
        { v: 'indeciso', t: 'Ainda não sei', s: 'Quero uma indicação' }
      ] }] },
    { name: 'Terreno', title: 'Como está o terreno?',
      lead: 'A situação do terreno define por onde o projeto começa.',
      questions: [
        { key: 'terreno', label: 'Terreno', qlabel: 'Situação do terreno', options: [
          { v: 'tenho', t: 'Já tenho o terreno' },
          { v: 'adquirindo', t: 'Estou adquirindo' },
          { v: 'procurando', t: 'Ainda estou procurando' }
        ] },
        { key: 'condominio', label: 'Condomínio fechado', qlabel: 'É em condomínio fechado?', cols: 2, options: [
          { v: 'sim', t: 'Sim' },
          { v: 'nao', t: 'Não' }
        ] }
      ] },
    { name: 'Área construída', title: 'Qual o tamanho da casa que você quer construir?',
      lead: 'Uma estimativa já ajuda, ajustamos juntos depois.',
      questions: [{ key: 'metragem', label: 'Tamanho', type: 'size', options: [
        { v: 'menos_80', t: 'Menos de 80 m²', pre: 'Menos de', big: '80 m²', f: 0.26 },
        { v: '80_120', t: 'Entre 80 e 120 m²', pre: 'Entre', big: '80 e 120 m²', f: 0.44 },
        { v: '120_180', t: 'Entre 120 e 180 m²', pre: 'Entre', big: '120 e 180 m²', f: 0.62 },
        { v: '180_250', t: 'Entre 180 e 250 m²', pre: 'Entre', big: '180 e 250 m²', f: 0.8 },
        { v: 'acima_250', t: 'Mais de 250 m²', pre: 'Mais de', big: '250 m²', f: 1 },
        { v: 'nao_sei', t: 'Ainda não sei', unknown: true }
      ] }] },
    { name: 'Investimento', title: 'Quanto pretende investir na obra?',
      lead: 'Só para direcionarmos as soluções certas. Não é uma proposta.',
      questions: [{ key: 'investimento', label: 'Investimento', options: [
        { v: 'ate_300', t: 'Até R$ 300 mil' },
        { v: '300_500', t: 'R$ 300 a 500 mil' },
        { v: '500_800', t: 'R$ 500 a 800 mil' },
        { v: '800_1200', t: 'R$ 800 mil a 1,2 milhão' },
        { v: 'acima_1200', t: 'Acima de R$ 1,2 milhão' },
        { v: 'nao_sei', t: 'Ainda não defini' }
      ] }] },
    { name: 'Prazo e prioridade', title: 'O que é mais importante para você?',
      lead: 'Isso orienta a conversa com o nosso engenheiro.',
      questions: [
        { key: 'prazo', label: 'Início', qlabel: 'Quando pretende começar?', cols: 2, options: [
          { v: 'imediato', t: 'O quanto antes' },
          { v: '3_6_meses', t: '3 a 6 meses' },
          { v: '6_12_meses', t: '6 a 12 meses' },
          { v: 'pesquisando', t: 'Só pesquisando' }
        ] },
        { key: 'prioridade', label: 'Prioridade', qlabel: 'O que pesa mais na sua decisão?', hint: 'Marque quantas quiser.', multi: true, options: [
          { v: 'qualidade', t: 'Qualidade de acabamento' },
          { v: 'prazo_entrega', t: 'Prazo de entrega' },
          { v: 'gestao', t: 'Não me preocupar com a obra' },
          { v: 'custo', t: 'Previsibilidade de custo' },
          { v: 'tecnologia', t: 'Tecnologia construtiva' }
        ] }
      ] },
    { name: 'Seus dados', title: 'Falta pouco para ver seu diagnóstico',
      lead: 'Precisamos apenas dos seus dados para dar continuidade.', contact: true }
  ];

  // ---- Estado -------------------------------------------------------------
  var answers = {};
  var contact = { nome: '', whatsapp: '', email: '', cidade: '' };
  var current = 0;
  var sending = false;
  var eventId = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  var $ = function (id) { return document.getElementById(id); };
  var intro = $('intro'), quiz = $('quiz'), done = $('done');
  var body = $('stepBody'), errorBox = $('stepError'), nextBtn = $('next'), backBtn = $('back'), form = $('stepForm');

  function track(name, params, opts) {
    try { if (window.fbq) window.fbq('track', name, params || {}, opts || {}); } catch (e) { /* tracking nunca quebra o funil */ }
  }
  function trackCustom(name, params) {
    try { if (window.fbq) window.fbq('trackCustom', name, params || {}); } catch (e) { /* idem */ }
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function optText(key, v) {
    if (Array.isArray(v)) return v.map(function (x) { return optText(key, x); }).filter(Boolean).join(', ');
    for (var i = 0; i < STEPS.length; i++) {
      var qs = STEPS[i].questions || [];
      for (var j = 0; j < qs.length; j++) {
        if (qs[j].key !== key) continue;
        for (var k = 0; k < qs[j].options.length; k++) if (qs[j].options[k].v === v) return qs[j].options[k].t;
      }
    }
    return '';
  }

  // ---- Renderização -------------------------------------------------------
  function renderQuestion(q) {
    var html = '<div class="q">';
    if (q.qlabel) html += '<span class="q__label">' + esc(q.qlabel) + (q.hint ? '<span class="hint">' + esc(q.hint) + '</span>' : '') + '</span>';
    var two = q.cols === 2 || q.type === 'photo' || q.type === 'size';
    html += '<div class="opts' + (two ? ' opts--2' : '') + '" role="' + (q.multi ? 'group' : 'radiogroup') + '">';
    q.options.forEach(function (o, i) {
      var id = q.key + '_' + i;
      var sel = q.multi ? (answers[q.key] || []).indexOf(o.v) > -1 : answers[q.key] === o.v;
      var checked = sel ? ' checked' : '';
      var key = '<span class="key" aria-hidden="true">' + String.fromCharCode(65 + i) + '</span>';
      var cls = 'opt' + (q.type === 'photo' ? ' opt--photo' : '') + (q.type === 'size' ? ' opt--size' : '') + (q.multi ? ' opt--multi' : '');
      var inner;
      if (q.type === 'photo') {
        inner = (o.img ? '<img src="' + o.img + '" alt="" loading="lazy">' : '') + key +
          '<span class="txt"><span>' + esc(o.t) + '</span>' + (o.s ? '<small>' + esc(o.s) + '</small>' : '') + '</span>';
      } else if (q.type === 'size' && o.unknown) {
        inner = key + '<span class="plan plan--unknown" aria-hidden="true"><i style="height:44px"></i></span><span class="size size--text"><b>' + esc(o.t) + '</b></span>';
      } else if (q.type === 'size') {
        inner = key + '<span class="plan" aria-hidden="true"><i style="width:' + Math.round(o.f * 70) + '%;height:' + Math.round(20 + o.f * 32) + 'px"></i></span>' +
          '<span class="size"><span class="size__pre">' + esc(o.pre) + '</span><b>' + esc(o.big) + '</b></span>';
      } else {
        inner = key + '<span>' + esc(o.t) + '</span>';
      }
      html += '<div class="' + cls + '"><input type="' + (q.multi ? 'checkbox' : 'radio') + '" name="' + q.key + '" id="' + id + '" value="' + o.v + '"' + checked + '>' +
        '<label for="' + id + '" aria-label="' + esc(o.t) + '">' + inner + '</label></div>';
    });
    return html + '</div></div>';
  }

  function renderContact() {
    return '' +
      '<div class="field"><label for="c_nome">Nome completo *</label><input id="c_nome" name="nome" autocomplete="name" placeholder="Como podemos te chamar?" value="' + esc(contact.nome) + '" required></div>' +
      '<div class="field"><label for="c_whats">WhatsApp *</label><input id="c_whats" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(51) 99999-9999" value="' + esc(contact.whatsapp) + '" required></div>' +
      '<div class="field"><label for="c_email">E-mail (opcional)</label><input id="c_email" name="email" type="email" autocomplete="email" placeholder="seu@email.com" value="' + esc(contact.email) + '"></div>' +
      '<div class="field"><label for="c_cidade">Cidade da obra *</label><input id="c_cidade" name="cidade" autocomplete="address-level2" placeholder="Onde você quer construir?" value="' + esc(contact.cidade) + '" required></div>' +
      '<div class="hp" aria-hidden="true"><label>Não preencha<input name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<label class="consent"><input type="checkbox" id="c_consent" name="consent"> <span>Concordo em ser contatado pela Reis Engenharia por WhatsApp e e-mail sobre o meu projeto, conforme a <a href="../politica-de-privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a>.</span></label>';
  }

  function render() {
    var s = STEPS[current];
    $('stepName').textContent = s.name;
    $('stepCount').textContent = String(current + 1).padStart(2, '0') + '/' + String(STEPS.length).padStart(2, '0');
    $('cotaFill').style.width = ((current + 1) / STEPS.length * 100) + '%';
    var html = '<section class="step"><h2>' + esc(s.title) + '</h2><p class="step__lead">' + esc(s.lead) + '</p>';
    html += s.contact ? renderContact() : s.questions.map(renderQuestion).join('');
    body.innerHTML = html + '</section>';
    backBtn.disabled = current === 0;
    nextBtn.textContent = s.contact ? 'Ver meu diagnóstico' : 'Continuar';
    hideError();
    updateNext();
    window.scrollTo(0, 0);
  }

  function single(s) { return !s.contact && s.questions.length === 1; }
  function stepComplete() {
    var s = STEPS[current];
    if (s.contact) return true;
    return s.questions.every(function (q) { return q.multi ? (answers[q.key] || []).length > 0 : !!answers[q.key]; });
  }
  // Etapas de uma pergunta avançam sozinhas; o botão só aparece quando já há
  // resposta (ao voltar para revisar) ou quando a etapa tem mais de uma pergunta.
  function updateNext() {
    var s = STEPS[current];
    nextBtn.hidden = single(s) && !stepComplete();
    nextBtn.disabled = sending || !stepComplete();
  }
  function showError(msg) { errorBox.textContent = msg; errorBox.hidden = false; }
  function hideError() { errorBox.hidden = true; }

  // ---- Interação ----------------------------------------------------------
  body.addEventListener('change', function (e) {
    var t = e.target;
    if (t.type === 'checkbox' && t.name !== 'consent') {
      var list = (answers[t.name] || []).filter(function (v) { return v !== t.value; });
      if (t.checked) list.push(t.value);
      answers[t.name] = list;
      updateNext();
      if (list.length === 1 && t.checked) nextBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    if (t.type !== 'radio') return;
    var fresh = !answers[t.name];
    answers[t.name] = t.value;
    var s = STEPS[current];
    if (single(s)) { setTimeout(goNext, 240); return; }
    updateNext();
    if (fresh && stepComplete()) nextBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  function maskPhone(v) {
    var d = v.replace(/\D/g, '').slice(0, 11);
    if (!d) return '';
    var out = '(' + d.slice(0, 2);
    if (d.length > 2) out += ') ' + d.slice(2, d.length > 10 ? 7 : 6);
    if (d.length > (d.length > 10 ? 7 : 6)) out += '-' + d.slice(d.length > 10 ? 7 : 6);
    return out;
  }
  body.addEventListener('focusin', function (e) {
    if (e.target.name === 'whatsapp' && !e.target.value) e.target.value = '(';
  });
  body.addEventListener('focusout', function (e) {
    if (e.target.name === 'whatsapp' && e.target.value === '(') { e.target.value = ''; contact.whatsapp = ''; }
  });
  body.addEventListener('input', function (e) {
    var t = e.target;
    if (t.name === 'whatsapp') t.value = maskPhone(t.value);
    if (STEPS[current].contact && t.name && t.name in contact) contact[t.name] = t.value;
  });

  backBtn.addEventListener('click', function () {
    if (current > 0) { current--; render(); }
  });

  function goNext() {
    if (!stepComplete() || STEPS[current].contact) return;
    trackCustom('QuizStep', { step: current + 1, name: STEPS[current].name });
    current++; render();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (STEPS[current].contact) return submitLead();
    goNext();
  });

  $('start').addEventListener('click', function () {
    intro.hidden = true; quiz.hidden = false;
    track('ViewContent', { content_name: 'Funil de orçamento' });
    trackCustom('QuizStart');
    render();
  });

  // ---- Envio --------------------------------------------------------------
  function utm() {
    var p = new URLSearchParams(location.search), o = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { if (p.get(k)) o[k] = p.get(k); });
    return o;
  }

  function send(payload) {
    if (DRY_RUN) return new Promise(function (resolve) { setTimeout(resolve, 700); });
    return fetch(CRM_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Não foi possível enviar agora. Tente novamente.');
        });
      });
  }

  function submitLead() {
    if (sending) return;
    var f = form.elements;
    contact.nome = f.nome.value.trim(); contact.whatsapp = f.whatsapp.value.trim();
    contact.email = f.email.value.trim(); contact.cidade = f.cidade.value.trim();
    var digits = contact.whatsapp.replace(/\D/g, '');
    if (digits.length > 11 && digits.indexOf('55') === 0) digits = digits.slice(2);

    if (contact.nome.length < 2) return showError('Informe seu nome.');
    if (digits.length < 10 || digits.length > 11) return showError('Informe um WhatsApp válido com DDD.');
    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return showError('Confira o e-mail informado.');
    if (!contact.cidade) return showError('Informe a cidade da obra.');
    if (!f.consent.checked) return showError('Para continuar, aceite o contato da nossa equipe.');

    hideError(); sending = true; nextBtn.disabled = true; nextBtn.textContent = 'Enviando...';

    var payload = Object.assign({
      nome: contact.nome, whatsapp: digits, email: contact.email, cidade: contact.cidade,
      respostas: answers, event_id: eventId, website: f.website.value
    }, utm());

    send(payload)
      .then(function () {
        // eventID igual ao enviado ao CRM permite deduplicar com a API de Conversões.
        track('Lead', { content_name: 'Funil de orçamento', value: 0, currency: 'BRL' }, { eventID: eventId });
        finish();
      })
      .catch(function (err) {
        sending = false; nextBtn.textContent = 'Ver meu diagnóstico'; updateNext();
        showError(err instanceof TypeError ? 'Sem conexão. Verifique a internet e tente de novo.' : err.message);
      });
  }

  var LABEL = {
    sistema: { steel_frame: 'Steel Frame', alvenaria: 'Alvenaria', indeciso: 'ainda não sei qual sistema' },
    terreno: { tenho: 'já tenho terreno', adquirindo: 'estou adquirindo o terreno', procurando: 'estou procurando terreno' },
    metragem: { nao_sei: 'tamanho a definir', menos_80: 'menos de 80 m²', '80_120': 'entre 80 e 120 m²', '120_180': 'entre 120 e 180 m²', '180_250': 'entre 180 e 250 m²', acima_250: 'mais de 250 m²' }
  };

  function finish() {
    quiz.hidden = true; done.hidden = false;
    var primeiro = contact.nome.split(' ')[0];
    $('doneTitle').textContent = primeiro + ', recebemos suas respostas!';
    var rows = [['sistema', 'Sistema'], ['terreno', 'Terreno'], ['condominio', 'Condomínio fechado'], ['metragem', 'Tamanho'], ['investimento', 'Investimento'], ['prazo', 'Início'], ['prioridade', 'Prioridade']]
      .map(function (r) { return [r[1], optText(r[0], answers[r[0]])]; });
    rows.push(['Cidade', contact.cidade]);
    $('ficha').innerHTML = rows.filter(function (r) { return r[1]; })
      .map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('');
    var msg = 'Olá! Sou ' + contact.nome + ', respondi a simulação no site. ' +
      'Quero construir em ' + (LABEL.sistema[answers.sistema] || 'Steel Frame ou Alvenaria') +
      ', casa de ' + (LABEL.metragem[answers.metragem] || 'tamanho a definir') +
      ', ' + (LABEL.terreno[answers.terreno] || '') + (answers.condominio === 'sim' ? ', em condomínio fechado' : '') + ' (' + contact.cidade + ').';
    $('waLink').href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
    window.scrollTo(0, 0);
  }
})();
