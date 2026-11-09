(function () {
  'use strict';

  // Funil curto de Xangri-lá (condomínio fechado, Steel Frame). Reaproveita o
  // visual do funil principal (../funil.css) e o mesmo endpoint do CRM; as
  // respostas fixas desta página (Steel Frame, condomínio fechado, cidade)
  // já vão preenchidas, então a pessoa responde só o que muda de lead para lead.

  // ---- Configuração -------------------------------------------------------
  var CRM_URL = 'https://crm.reisengenhariars.com.br/api/funil/lead';
  var WHATSAPP = '5551981519380';
  var CIDADE = 'Xangri-lá';
  var DRY_RUN = !!window.__FUNIL_DRY_RUN || /[?&]preview=1\b/.test(location.search);

  var FIXAS = { sistema: 'steel_frame', condominio: 'sim' };

  var STEPS = [
    { name: 'Terreno', title: 'Como está o seu terreno em Xangri-lá?',
      lead: 'A situação do terreno define por onde o projeto começa.',
      questions: [{ key: 'terreno', label: 'Terreno', options: [
        { v: 'tenho', t: 'Já tenho o terreno' },
        { v: 'adquirindo', t: 'Estou adquirindo' },
        { v: 'procurando', t: 'Ainda estou procurando' }
      ] }] },
    { name: 'Uso da casa', title: 'Para que será a casa?',
      lead: 'Casa de praia e moradia fixa pedem soluções diferentes.',
      questions: [{ key: 'finalidade', label: 'Uso da casa', options: [
        { v: 'praia', t: 'Casa de praia (veraneio)' },
        { v: 'fixa', t: 'Moradia fixa' },
        { v: 'indefinido', t: 'Ainda não defini' }
      ] }] },
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
    { name: 'Prazo', title: 'Quando pretende começar a obra?',
      lead: 'Isso orienta a conversa com o nosso engenheiro.',
      questions: [{ key: 'prazo', label: 'Início', options: [
        { v: 'imediato', t: 'O quanto antes' },
        { v: '3_6_meses', t: 'Em 3 a 6 meses' },
        { v: '6_12_meses', t: 'Em 6 a 12 meses' },
        { v: 'pesquisando', t: 'Só pesquisando' }
      ] }] },
    { name: 'Seus dados', title: 'Falta pouco para ver seu diagnóstico',
      lead: 'Precisamos apenas dos seus dados para dar continuidade.', contact: true }
  ];

  // ---- Estado -------------------------------------------------------------
  var answers = {};
  var contact = { nome: '', whatsapp: '', email: '', condominio_nome: '' };
  var current = 0;
  var sending = false;
  var eventId = 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

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
    var two = q.type === 'size';
    html += '<div class="opts' + (two ? ' opts--2' : '') + '" role="radiogroup">';
    q.options.forEach(function (o, i) {
      var id = q.key + '_' + i;
      var checked = answers[q.key] === o.v ? ' checked' : '';
      var key = '<span class="key" aria-hidden="true">' + String.fromCharCode(65 + i) + '</span>';
      var cls = 'opt' + (q.type === 'size' ? ' opt--size' : '');
      var inner;
      if (q.type === 'size' && o.unknown) {
        inner = key + '<span class="plan plan--unknown" aria-hidden="true"><i style="height:44px"></i></span><span class="size size--text"><b>' + esc(o.t) + '</b></span>';
      } else if (q.type === 'size') {
        inner = key + '<span class="plan" aria-hidden="true"><i style="width:' + Math.round(o.f * 70) + '%;height:' + Math.round(20 + o.f * 32) + 'px"></i></span>' +
          '<span class="size"><span class="size__pre">' + esc(o.pre) + '</span><b>' + esc(o.big) + '</b></span>';
      } else {
        inner = key + '<span>' + esc(o.t) + '</span>';
      }
      html += '<div class="' + cls + '"><input type="radio" name="' + q.key + '" id="' + id + '" value="' + o.v + '"' + checked + '>' +
        '<label for="' + id + '" aria-label="' + esc(o.t) + '">' + inner + '</label></div>';
    });
    return html + '</div></div>';
  }

  function renderContact() {
    return '' +
      '<div class="field"><label for="c_nome">Nome completo *</label><input id="c_nome" name="nome" autocomplete="name" placeholder="Como podemos te chamar?" value="' + esc(contact.nome) + '" required></div>' +
      '<div class="field"><label for="c_whats">WhatsApp *</label><input id="c_whats" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(51) 99999-9999" value="' + esc(contact.whatsapp) + '" required></div>' +
      '<div class="field"><label for="c_cond">Nome do condomínio (opcional)</label><input id="c_cond" name="condominio_nome" placeholder="Em qual condomínio é o terreno?" value="' + esc(contact.condominio_nome) + '"></div>' +
      '<div class="field"><label for="c_email">E-mail (opcional)</label><input id="c_email" name="email" type="email" autocomplete="email" placeholder="seu@email.com" value="' + esc(contact.email) + '"></div>' +
      '<div class="hp" aria-hidden="true"><label>Não preencha<input name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<label class="consent"><input type="checkbox" id="c_consent" name="consent"> <span>Concordo em ser contatado pela Reis Engenharia por WhatsApp e e-mail sobre o meu projeto, conforme a <a href="../../politica-de-privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a>.</span></label>';
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

  function stepComplete() {
    var s = STEPS[current];
    if (s.contact) return true;
    return s.questions.every(function (q) { return !!answers[q.key]; });
  }
  // Etapas de uma pergunta avançam sozinhas; o botão só aparece ao voltar para revisar.
  function updateNext() {
    var s = STEPS[current];
    nextBtn.hidden = !s.contact && !stepComplete();
    nextBtn.disabled = sending || !stepComplete();
  }
  function showError(msg) { errorBox.textContent = msg; errorBox.hidden = false; }
  function hideError() { errorBox.hidden = true; }

  // ---- Interação ----------------------------------------------------------
  body.addEventListener('change', function (e) {
    var t = e.target;
    if (t.type !== 'radio') return;
    answers[t.name] = t.value;
    if (!STEPS[current].contact) { setTimeout(goNext, 240); return; }
    updateNext();
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
    track('ViewContent', { content_name: 'Funil Xangri-lá' });
    trackCustom('QuizStart', { funil: 'xangrila' });
    render();
  });

  // ---- Envio --------------------------------------------------------------
  function utm() {
    var p = new URLSearchParams(location.search), o = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { if (p.get(k)) o[k] = p.get(k); });
    return o;
  }

  function cookie(name) {
    try {
      var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : undefined;
    } catch (e) { return undefined; }
  }
  // _fbc é gravado pelo Pixel; se ainda não existir, monta a partir do fbclid da URL.
  function clickId() {
    var c = cookie('_fbc');
    if (c) return c;
    var id = new URLSearchParams(location.search).get('fbclid');
    return id ? 'fb.1.' + Date.now() + '.' + id : undefined;
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
    contact.email = f.email.value.trim(); contact.condominio_nome = f.condominio_nome.value.trim();
    var digits = contact.whatsapp.replace(/\D/g, '');
    if (digits.length > 11 && digits.indexOf('55') === 0) digits = digits.slice(2);

    if (contact.nome.length < 2) return showError('Informe seu nome.');
    if (digits.length < 10 || digits.length > 11) return showError('Informe um WhatsApp válido com DDD.');
    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return showError('Confira o e-mail informado.');
    if (!f.consent.checked) return showError('Para continuar, aceite o contato da nossa equipe.');

    hideError(); sending = true; nextBtn.disabled = true; nextBtn.textContent = 'Enviando...';

    var respostas = Object.assign({}, FIXAS, answers);
    if (contact.condominio_nome) respostas.condominio_nome = contact.condominio_nome;

    var payload = Object.assign({
      nome: contact.nome, whatsapp: digits, email: contact.email, cidade: CIDADE,
      respostas: respostas, event_id: eventId, website: f.website.value,
      // Identificadores do Pixel: permitem ao CRM enviar o Lead pelo servidor ligado ao anúncio.
      fbp: cookie('_fbp'), fbc: clickId(), source_url: location.origin + location.pathname
    }, utm());

    send(payload)
      .then(function () {
        // eventID igual ao enviado ao CRM permite deduplicar com a API de Conversões.
        track('Lead', { content_name: 'Funil Xangri-lá', value: 0, currency: 'BRL' }, { eventID: eventId });
        finish();
      })
      .catch(function (err) {
        sending = false; nextBtn.textContent = 'Ver meu diagnóstico'; updateNext();
        showError(err instanceof TypeError ? 'Sem conexão. Verifique a internet e tente de novo.' : err.message);
      });
  }

  var LABEL = {
    terreno: { tenho: 'já tenho o terreno', adquirindo: 'estou adquirindo o terreno', procurando: 'estou procurando terreno' },
    finalidade: { praia: 'casa de praia', fixa: 'moradia fixa', indefinido: '' },
    metragem: { nao_sei: 'tamanho a definir', menos_80: 'menos de 80 m²', '80_120': 'entre 80 e 120 m²', '120_180': 'entre 120 e 180 m²', '180_250': 'entre 180 e 250 m²', acima_250: 'mais de 250 m²' }
  };

  function finish() {
    quiz.hidden = true; done.hidden = false;
    var primeiro = contact.nome.split(' ')[0];
    $('doneTitle').textContent = primeiro + ', recebemos suas respostas!';
    var rows = [['Sistema', 'Steel Frame'], ['Local', CIDADE + ' (condomínio fechado)']];
    if (contact.condominio_nome) rows.push(['Condomínio', contact.condominio_nome]);
    [['terreno', 'Terreno'], ['finalidade', 'Uso da casa'], ['metragem', 'Tamanho'], ['prazo', 'Início']]
      .forEach(function (r) { rows.push([r[1], optText(r[0], answers[r[0]])]); });
    $('ficha').innerHTML = rows.filter(function (r) { return r[1]; })
      .map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('');
    var uso = LABEL.finalidade[answers.finalidade];
    var msg = 'Olá! Sou ' + contact.nome + ', respondi a simulação no site. ' +
      'Quero construir em Steel Frame' + (uso ? ' (' + uso + ')' : '') +
      ', casa de ' + (LABEL.metragem[answers.metragem] || 'tamanho a definir') +
      ', ' + (LABEL.terreno[answers.terreno] || '') + ', em condomínio fechado em ' + CIDADE + '/RS' +
      (contact.condominio_nome ? ' (' + contact.condominio_nome + ')' : '') + '.';
    $('waLink').href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
    window.scrollTo(0, 0);
  }
})();
