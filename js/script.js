document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');
navToggle.addEventListener('click', () => {
  nav.classList.toggle('active');
});
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => nav.classList.remove('active'));
});

// Header background on scroll
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.style.background = window.scrollY > 40
    ? 'rgba(14,26,43,.92)'
    : 'rgba(14,26,43,.72)';
});

// Animated stat counters + bars (hero)
const statEls = document.querySelectorAll('#heroStats [data-count-to]');

function animateStat(el) {
  const target = parseInt(el.dataset.countTo, 10);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const numEl = el.querySelector('.stat__num');
  const barFill = el.querySelector('.stat__bar-fill');
  const duration = 1800;
  const start = performance.now();

  if (barFill) requestAnimationFrame(() => { barFill.style.width = '100%'; });

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);
    numEl.textContent = prefix + current.toLocaleString('pt-BR') + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

if (statEls.length) {
  const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statEls.forEach(animateStat);
        observer.disconnect();
      }
    });
  }, { threshold: 0.4 });
  statsObserver.observe(document.getElementById('heroStats'));
}

// Gallery lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

document.querySelectorAll('.gallery__item').forEach(item => {
  item.addEventListener('click', () => {
    lightboxImg.src = item.dataset.full;
    lightbox.classList.add('active');
  });
});
lightboxClose.addEventListener('click', () => lightbox.classList.remove('active'));
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) lightbox.classList.remove('active');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') lightbox.classList.remove('active');
});

// Contact form submission via Web3Forms (no backend required)
const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formNote = document.getElementById('formNote');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const accessKey = form.querySelector('input[name="access_key"]').value;
  if (!accessKey || accessKey.includes('COLE_AQUI')) {
    formNote.textContent = 'Formulário ainda não configurado: adicione sua Access Key do Web3Forms em index.html.';
    formNote.className = 'form__note error';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';
  formNote.textContent = '';
  formNote.className = 'form__note';

  const formData = new FormData(form);

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData
    });
    const result = await res.json();

    if (result.success) {
      formNote.textContent = 'Mensagem enviada com sucesso! Retornaremos em breve.';
      formNote.className = 'form__note success';
      form.reset();
    } else {
      throw new Error(result.message || 'Falha no envio');
    }
  } catch (err) {
    formNote.textContent = 'Não foi possível enviar agora. Tente novamente ou fale pelo WhatsApp.';
    formNote.className = 'form__note error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar mensagem';
  }
});
