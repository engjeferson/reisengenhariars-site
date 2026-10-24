(function () {
  'use strict';

  // ---- Configuração -------------------------------------------------------
  var CRM_URL = 'https://crm.reisengenhariars.com.br/api/funil/lead';
  var WHATSAPP = '5551981519380';

  var STEPS = [
    { name: 'Sistema construtivo', title: 'Como você imagina sua obra?',
      lead: 'Cada sistema muda prazo, custo e conforto. Se ainda não sabe, nós indicamos.',
      questions: [{ key: 'sistema', type: 'photo', options: [
        { v: 'steel_frame', t: 'Steel Frame', s: 'Obra industrializada e rápida', img: '../assets/img/steelframe/perfis-galvanizados.jpg' },
        { v: 'alvenaria', t: 'Alvenaria', s: 'Construção convencional', img: '../assets/img/obras/fachada-moderna-01.jpg' },
        { v: 'indeciso', t: 'Ainda não sei', s: 'Quero uma indicação' }
      ] }] },
    { name: 'Terreno', title: 'Como está o terreno?',
      lead: 'A situação do terreno define por onde o projeto começa.',
      questions: [{ key: 'terreno', options: [
        { v: 'tenho', t: 'Já tenho o terreno' },
        { v: 'adquirindo', t: 'Estou adquirindo' },
        { v: 'procurando', t: 'Ainda estou procurando' }
      ] }] },
    { name: 'Tamanho', title: 'Qual o tamanho da casa dos sonhos?',
      lead: 'Uma estimativa já ajuda. Ajustamos junto com você depois.',
      questions: [{ key: 'metragem', options: [
        { v: 'ate_120', t: 'Até 120 m²' },
        { v: '120_180', t: '120 a 180 m²' },
        { v: '180_250', t: '180 a 250 m²' },
        { v: 'acima_250', t: 'Acima de 250 m²' }
      ] }] },
    { name: 'Investimento', title: 'Quanto pretende investir na obra?',
      lead: 'Só para direcionarmos as soluções certas. Não é uma proposta.',
      questions: [{ key: 'investimento', options: [
        { v: 'ate_400', t: 'Até R$ 400 mil' },
        { v: '400_700', t: 'R$ 400 a 700 mil' },
        { v: '700_1000', t: 'R$ 700 mil a 1 milhão' },
        { v: 'acima_1000', t: 'Acima de R$ 1 milhão' },
        { v: 'nao_sei', t: 'Ainda não defini' }
      ] }] },
    { name: 'Prazo e prioridade', title: 'O que é mais importante para você?',
      lead: 'Isso orienta a conversa com o nosso engenheiro.',
      questions: [
        { key: 'prazo', label: 'Quando pretende começar?', cols: 2, options: [
          { v: 'imediato', t: 'O quanto antes' },
          { v: '3_6_meses', t: '3 a 6 meses' },
          { v: '6_12_meses', t: '6 a 12 meses' },
          { v: 'pesquisando', t: 'Só pesquisando' }
        ] },
        { key: 'prioridade', label: 'O que pesa mais na sua decisão?', options: [
          { v: 'qualidade', t: 'Qualidade de acabamento' },
          { v: 'prazo_entrega', t: 'Prazo de entrega' },
          { v: 'gestao', t: 'Não me preocupar com a obra' },
          { v: 'custo', t: 'Previsibilidade de custo' },
          { v: 'tecnologia', t: 'Tecnologia construtiva' }
        ] }
      ] },
    { name: 'Finalização', title: 'Falta pouco para ver seu diagnóstico',
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

  // ---- Renderização -------------------------------------------------------
  function renderQuestion(q) {
    var html = '<div class="q">';
    if (q.label) html += '<span class="q__label">' + esc(q.label) + '</span>';
    var cls = q.cols === 2 ? 'opts opts--2' : (q.type === 'photo' ? 'opts opts--2' : 'opts');
    html += '<div class="' + cls + '" role="radiogroup">';
    q.options.forEach(function (o, i) {
      var id = q.key + '_' + i;
      var checked = answers[q.key] === o.v ? ' checked' : '';
      html += '<div class="opt' + (q.type === 'photo' ? ' opt--photo' : '') + '">' +
        '<input type="radio" name="' + q.key + '" id="' + id + '" value="' + o.v + '"' + checked + '>' +
        '<label for="' + id + '">' +
        (o.img ? '<img src="' + o.img + '" alt="" loading="lazy">' : '') +
        '<span>' + esc(o.t) + (o.s ? '<small>' + esc(o.s) + '</small>' : '') + '</span></label></div>';
    });
    return html + '</div></div>';
  }

  function renderContact() {
    return '' +
      '<div class="field"><label for="c_nome">Nome completo *</label><input id="c_nome" name="nome" autocomplete="name" placeholder="Como podemos te chamar?" value="' + esc(contact.nome) + '" required></div>' +
      '<div class="field"><label for="c_whats">WhatsApp *</label><input id="c_whats" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(51) 98151-9380" value="' + esc(contact.whatsapp) + '" required></div>' +
      '<div class="field"><label for="c_email">E-mail</label><input id="c_email" name="email" type="email" autocomplete="email" placeholder="opcional" value="' + esc(contact.email) + '"></div>' +
      '<div class="field"><label for="c_cidade">Cidade da obra *</label><input id="c_cidade" name="cidade" autocomplete="address-level2" placeholder="Onde você quer construir?" value="' + esc(contact.cidade) + '" required></div>' +
      '<div class="hp" aria-hidden="true"><label>Não preencha<input name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<label class="consent"><input type="checkbox" id="c_consent" name="consent"> <span>Concordo em ser contatado pela Reis Engenharia por WhatsApp e e-mail sobre o meu projeto, conforme a <a href="../politica-de-privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a>.</span></label>';
  }

  function render() {
    var s = STEPS[current];
    $('stepName').textContent = s.name;
    $('stepCount').textContent = (current + 1) + ' de ' + STEPS.length;
    $('progressFill').style.width = ((current + 1) / STEPS.length * 100) + '%';
    var html = '<section class="step"><h2>' + esc(s.title) + '</h2><p class="step__lead">' + esc(s.lead) + '</p>';
    html += s.contact ? renderContact() : s.questions.map(renderQuestion).join('');
    body.innerHTML = html + '</section>';
    nextBtn.textContent = s.contact ? 'Ver meu diagnóstico →' : 'Próximo →';
    backBtn.style.visibility = current === 0 ? 'hidden' : 'visible';
    hideError();
    updateNext();
    window.scrollTo(0, 0);
  }

  function stepComplete() {
    var s = STEPS[current];
    if (s.contact) return true;
    return s.questions.every(function (q) { return !!answers[q.key]; });
  }
  function updateNext() { nextBtn.disabled = sending || !stepComplete(); }
  function showError(msg) { errorBox.textContent = msg; errorBox.hidden = false; }
  function hideError() { errorBox.hidden = true; }

  // ---- Interação ----------------------------------------------------------
  body.addEventListener('change', function (e) {
    var t = e.target;
    if (t.type !== 'radio') return;
    answers[t.name] = t.value;
    updateNext();
    var s = STEPS[current];
    // Etapas com uma única pergunta avançam sozinhas: um toque por etapa.
    if (!s.contact && s.questions.length === 1) setTimeout(goNext, 220);
  });
  body.addEventListener('input', function (e) {
    var t = e.target;
    if (STEPS[current].contact && t.name && t.name in contact) contact[t.name] = t.value;
  });

  backBtn.addEventListener('click', function () {
    if (current > 0) { current--; render(); }
  });

  function goNext() {
    if (!stepComplete()) return;
    if (current < STEPS.length - 1) {
      trackCustom('QuizStep', { step: current + 1, name: STEPS[current].name });
      current++; render();
    }
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

    fetch(CRM_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Não foi possível enviar agora. Tente novamente.');
        });
      })
      .then(function () {
        // eventID igual ao enviado ao CRM permite deduplicar com a API de Conversões.
        track('Lead', { content_name: 'Funil de orçamento', value: 0, currency: 'BRL' }, { eventID: eventId });
        finish();
      })
      .catch(function (err) {
        sending = false; nextBtn.textContent = 'Ver meu diagnóstico →'; updateNext();
        showError(err instanceof TypeError ? 'Sem conexão. Verifique a internet e tente de novo.' : err.message);
      });
  }

  var LABEL = {
    sistema: { steel_frame: 'Steel Frame', alvenaria: 'Alvenaria', indeciso: 'ainda não sei qual sistema' },
    terreno: { tenho: 'já tenho terreno', adquirindo: 'estou adquirindo o terreno', procurando: 'estou procurando terreno' },
    metragem: { ate_120: 'até 120 m²', '120_180': '120 a 180 m²', '180_250': '180 a 250 m²', acima_250: 'acima de 250 m²' }
  };

  function finish() {
    quiz.hidden = true; done.hidden = false;
    var primeiro = contact.nome.split(' ')[0];
    $('doneTitle').textContent = primeiro + ', recebemos suas respostas!';
    var msg = 'Olá! Sou ' + contact.nome + ', respondi a simulação no site. ' +
      'Quero construir em ' + (LABEL.sistema[answers.sistema] || 'Steel Frame ou Alvenaria') +
      ', casa de ' + (LABEL.metragem[answers.metragem] || 'tamanho a definir') +
      ', ' + (LABEL.terreno[answers.terreno] || '') + ' (' + contact.cidade + ').';
    $('waLink').href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
    window.scrollTo(0, 0);
  }
})();
