// Aarya Plastopet — enquiry tracking for Google Analytics 4 (G-YE4GGVNF2N).
// Sends WhatsApp, phone, email and datasheet clicks as events. No personal data is sent.
(function () {
  function send(name, params) { if (typeof gtag === 'function') gtag('event', name, params); }
  function where(el) {
    if (el.closest('header')) return 'header';
    if (el.closest('nav.sheet')) return 'mobile_menu';
    if (el.closest('.dock')) return 'dock';
    if (el.closest('footer')) return 'footer';
    var s = el.closest('section[id]');
    return s ? s.id : 'page';
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    var p = { link_location: where(a), page_path: location.pathname };
    if (/^https:\/\/wa\.me\//.test(h)) send('whatsapp_click', p);
    else if (h.indexOf('tel:') === 0) send('phone_click', p);
    else if (h.indexOf('mailto:') === 0) send('email_click', p);
    else if (/\.pdf(\?|$)/i.test(h)) { p.file_name = h.split('/').pop().split('?')[0]; send('file_download', p); }
  }, true);
})();
