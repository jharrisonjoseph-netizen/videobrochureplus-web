import { inquiryPayload, sendInquiry } from './forms-core.mjs';
import { web3formsAccessKey } from './form-config.mjs';

const track = (event, details = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...details });
};

const toggle = document.getElementById('mobileToggle');
const nav = document.getElementById('navLinks');
function closeMenu() {
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open menu');
}
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    closeMenu();
    toggle.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.navbar')) closeMenu();
});

const backTop = document.getElementById('backTop');
const updateBackTop = () => backTop.classList.toggle('show', window.scrollY > 680);
window.addEventListener('scroll', updateBackTop, { passive: true });
updateBackTop();

const requestedProduct = new URLSearchParams(window.location.search).get('product');
if (requestedProduct) {
  document.querySelectorAll('form[data-inquiry-form] input[name="Product"]').forEach(input => { input.value = requestedProduct; });
}

document.querySelectorAll('a[href="/#quote"], a[href="#quote"]').forEach(link => {
  link.addEventListener('click', () => {
    const form = document.getElementById('quoteForm');
    if (!form) return;
    form.elements.RequestType.value = link.dataset.request || 'Custom quote';
    form.elements.Product.value = link.dataset.product || '';
  });
});

document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link => {
  link.addEventListener('click', () => track('whatsapp_click', { link_location: link.closest('footer') ? 'footer' : 'page' }));
});

document.querySelectorAll('form[data-inquiry-form]').forEach(form => {
  const status = document.getElementById(`${form.id}Status`);
  const fallback = form.querySelector('.form-fallback');
  const button = form.querySelector('button[type="submit"]');
  const originalLabel = button.textContent;
  let pending = false;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, String(value).trim()]));
    if (values.website_check) return;

    pending = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    status.dataset.state = 'pending';
    status.textContent = 'Sending your request…';
    fallback.hidden = true;
    track('generate_lead_start', { form_id: form.id, request_type: values.RequestType });

    try {
      await sendInquiry(inquiryPayload(values, web3formsAccessKey));
      status.dataset.state = 'success';
      status.textContent = 'Thank you. Your request was accepted for delivery. We will contact you using the details provided.';
      track('generate_lead', { form_id: form.id, request_type: values.RequestType, product: values.Product || '' });
      form.reset();
    } catch {
      status.dataset.state = 'error';
      status.textContent = 'We could not confirm your request. Your details are still here. Please try again, email us or use WhatsApp.';
      fallback.hidden = false;
      track('generate_lead_error', { form_id: form.id });
    } finally {
      pending = false;
      button.disabled = false;
      button.textContent = originalLabel;
      form.removeAttribute('aria-busy');
    }
  });
});
