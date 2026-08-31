document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');
const navBackdrop = document.getElementById('navBackdrop');

function closeNav() {
  nav.classList.remove('active');
  navToggle.classList.remove('active');
  navBackdrop.classList.remove('active');
  navToggle.setAttribute('aria-label', 'Abrir menu');
}
function openNav() {
  nav.classList.add('active');
  navToggle.classList.add('active');
  navBackdrop.classList.add('active');
  navToggle.setAttribute('aria-label', 'Fechar menu');
}
navToggle.addEventListener('click', () => {
  nav.classList.contains('active') ? closeNav() : openNav();
});
navBackdrop.addEventListener('click', closeNav);
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeNav);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeNav();
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

  if (barFill) requestAnimationFrame(() => { barFill.style.transform = 'scaleX(1)'; });

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
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const galleryItems = Array.from(document.querySelectorAll('.gallery__item'));
let lightboxIndex = 0;

function showLightbox(index) {
  lightboxIndex = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[lightboxIndex];
  lightboxImg.src = item.dataset.full;
  lightboxImg.alt = item.querySelector('img').alt;
  lightbox.classList.add('active');
}

galleryItems.forEach((item, index) => {
  item.addEventListener('click', () => showLightbox(index));
});
lightboxClose.addEventListener('click', () => lightbox.classList.remove('active'));
lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showLightbox(lightboxIndex - 1); });
lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showLightbox(lightboxIndex + 1); });
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) lightbox.classList.remove('active');
});
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') lightbox.classList.remove('active');
  if (e.key === 'ArrowLeft') showLightbox(lightboxIndex - 1);
  if (e.key === 'ArrowRight') showLightbox(lightboxIndex + 1);
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
