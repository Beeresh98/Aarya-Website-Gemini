// Aarya Plastopet — shared site behaviour (2026 redesign).
// Header shadow, mobile menu, scroll reveals, gentle parallax, phone dock, film selector, enquiry form.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '917483643028';

  // ---------- header + menu ----------
  const hdr = $('.site-hdr');
  const onScroll = () => hdr && hdr.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const menuBtn = $('.menu-btn');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  if (menuBtn) {
    menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    $$('.sheet a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  // ---------- scroll reveal ----------
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  // whatever is on screen at load animates on the first painted frame
  const onScreen = e => e.getBoundingClientRect().top < innerHeight * .92;
  // (timer fallback: background tabs pause rAF, and the page must never stay blank)
  const nextFrame = fn => { requestAnimationFrame(() => requestAnimationFrame(fn)); setTimeout(fn, 150); };
  $$('[data-reveal]').forEach(e => onScreen(e) ? nextFrame(() => e.classList.add('in')) : io.observe(e));

  // ---------- parallax: image drifts a little slower than the page ----------
  const px = $$('[data-parallax]');
  if (px.length && !reduce) {
    let ticking = false;
    const run = () => {
      ticking = false;
      px.forEach(el => {
        const box = el.parentElement.getBoundingClientRect();
        if (box.bottom < 0 || box.top > innerHeight) return;
        const k = parseFloat(el.dataset.parallax) || .12;
        const mid = box.top + box.height / 2 - innerHeight / 2;
        el.style.transform = `translate3d(0,${(-mid * k).toFixed(1)}px,0) scale(1.12)`;
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    addEventListener('resize', run); run();
  }

  // ---------- phone dock: shows once the hero is gone, hides over the form ----------
  const dock = $('.dock'), heroCta = $('[data-hero-cta]'), contact = $('#contact');
  if (dock && heroCta) {
    let gone = false, atForm = false;
    const sync = () => dock.classList.toggle('show', gone && !atForm);
    new IntersectionObserver(([e]) => { gone = !e.isIntersecting && e.boundingClientRect.top < 0; sync(); }).observe(heroCta);
    if (contact) new IntersectionObserver(([e]) => { atForm = e.isIntersecting; sync(); }, { threshold: .1 }).observe(contact);
  }

  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  // ---------- segmented pills ----------
  function movePill(group) {
    const on = group.querySelector('[aria-pressed=true]'), pill = group.querySelector('.pill');
    if (!on || !pill) return;
    pill.style.width = on.offsetWidth + 'px';
    pill.style.height = on.offsetHeight + 'px';
    pill.style.transform = `translate(${on.offsetLeft - 4}px,${on.offsetTop - 4}px)`;
  }
  const segs = $$('.seg');
  segs.forEach(g => {
    $$('button', g).forEach(b => b.addEventListener('click', () => {
      $$('button', g).forEach(x => x.setAttribute('aria-pressed', x === b));
      movePill(g); g.dispatchEvent(new Event('change', { bubbles: true }));
    }));
  });
  const placePills = () => segs.forEach(movePill);
  addEventListener('resize', placePills);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(placePills);
  placePills();

  // ---------- film selector (same rules as the old site) ----------
  const sel = $('#selectorTool');
  if (sel) {
    const val = name => sel.querySelector(`.seg[data-name=${name}] [aria-pressed=true]`).dataset.v;
    const out = { range: $('#recRange'), grade: $('#recGrade'), why: $('#recWhy'), box: $('#recBox'), wa: $('#recWa') };
    const pick = () => {
      const app = val('app'), load = val('load'), shape = val('shape');
      if (app === 'machine') {
        return (load === 'heavy' || shape === 'sharp')
          ? { range: '23–30', grade: 'Machine grade, heavy duty', why: 'Extra puncture resistance and load holding for heavy or sharp-edged pallets on an automatic wrapper.' }
          : { range: '17–23', grade: 'Machine grade, standard', why: 'Efficient pre-stretch and steady cling for regular pallets on an automatic wrapper.' };
      }
      return shape === 'sharp'
        ? { range: '20–25', grade: 'Hand grade, heavy duty', why: 'A tougher hand roll for loads with corners and edges that tear thinner film.' }
        : { range: '15–20', grade: 'Hand grade, general', why: 'Light, easy to pull and clingy. Right for most hand wrapping and bundling.' };
    };
    const render = () => {
      const r = pick();
      out.box.classList.add('swap');
      setTimeout(() => {
        out.range.textContent = r.range; out.grade.textContent = r.grade; out.why.textContent = r.why;
        out.wa.href = `https://wa.me/${WA}?text=${encodeURIComponent(`Hi, I need ${r.grade.toLowerCase()} stretch film (${r.range} micron). Please share details.`)}`;
        out.box.classList.remove('swap');
      }, reduce ? 0 : 160);
    };
    sel.addEventListener('change', render);
    render();
  }

  // ---------- spec tables: metric / imperial ----------
  // cells carry data-u (mm | m | um) and data-v ("300" or "200-3600"); metric text is in the HTML for search engines
  const units = $('#unitsSeg');
  if (units) {
    const IN = n => n.toLocaleString('en-IN');
    const conv = {
      mm: [v => IN(v) + ' mm', v => (v / 25.4).toFixed(v / 25.4 < 10 ? 1 : 0).replace(/\.0$/, '') + ' in'],
      m: [v => IN(v) + ' m', v => IN(Math.round(v * 3.28084 / 10) * 10) + ' ft'],
      um: [v => v + ' µm', v => (v / 25.4).toFixed(2) + ' mil'],
    };
    const show = imp => $$('td[data-u]').forEach(td => {
      const f = conv[td.dataset.u][imp ? 1 : 0], parts = td.dataset.v.split('-').map(Number);
      td.textContent = parts.length > 1 ? f(parts[0]).replace(/ \S+$/, '') + '–' + f(parts[1]) : f(parts[0]);
    });
    units.addEventListener('change', () => {
      const imp = units.querySelector('[aria-pressed=true]').dataset.v === 'imperial';
      $$('.spec').forEach(t => t.classList.add('swap'));
      setTimeout(() => { show(imp); $$('.spec').forEach(t => t.classList.remove('swap')); }, reduce ? 0 : 180);
    });
  }

  // ---------- enquiry form → EmailJS (same service, template and params as before) ----------
  if (window.emailjs) emailjs.init('QhHVus0o94yoXiR6X');
  const form = $('#contactForm');
  if (form) {
    const status = $('#formStatus'), btn = form.querySelector('button[type=submit]'), lbl = btn.querySelector('.lbl');
    const label = lbl.textContent;
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      ['company', 'email'].forEach(n => {
        const f = form[n], bad = !f.value.trim() || (n === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
        f.closest('.ctl').classList.toggle('bad', bad); if (bad) ok = false;
      });
      const c = $('#consentRow'); c.classList.toggle('bad', !form.consent.checked); if (!form.consent.checked) ok = false;
      if (!ok) { status.textContent = 'Please fill the marked fields.'; status.className = 'form-status err'; return; }

      // spam trap: people never see this field, bots fill it in
      if (form.website && form.website.value) { status.textContent = 'Thank you, we’ll contact you soon.'; status.className = 'form-status ok'; form.reset(); return; }
      btn.disabled = true; btn.classList.add('busy'); lbl.textContent = 'Sending…'; status.textContent = '';
      const params = {
        company_name: form.company.value,
        email: form.email.value,
        phone: form.phone.value,
        quantity: form.volume.value,
        location: form.region.value,
        message: form.message.value,
        // which page the enquiry was sent from, plus where the visitor came from
        source_page: location.pathname + (document.referrer ? ' (from ' + document.referrer + ')' : ' (direct)')
      };
      emailjs.send('service_sg1gkj4', 'template_flyd6xd', params).then(() => {
        status.textContent = 'Thank you, we’ll contact you soon.'; status.className = 'form-status ok';
        form.reset(); btn.disabled = false; btn.classList.remove('busy'); lbl.textContent = label;
      }, err => {
        console.error('EmailJS Error:', err);
        status.innerHTML = `Something went wrong. Please try again, or <a href="https://wa.me/${WA}" target="_blank" rel="noopener">WhatsApp us</a>.`;
        status.className = 'form-status err';
        btn.disabled = false; btn.classList.remove('busy'); lbl.textContent = label;
      });
    });
    form.addEventListener('input', e => { const c = e.target.closest('.ctl'); if (c) c.classList.remove('bad'); });
    form.consent.addEventListener('change', () => $('#consentRow').classList.remove('bad'));
  }
})();
