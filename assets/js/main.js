/* Демо «CANDY»: баннеры, подбор по параметрам и по технике, живой поиск,
   карусель товаров со степпером, избранное, конфетти */
(function () {
  var D = MS.data, fmt = MS.fmt;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* какие товары подходят какой технике (для подбора «по технике») */
  var VEHICLES = {
    dump: [1, 3, 10, 14],
    tractor: [2, 5, 12, 13],
    light: [4, 5, 6],
    loader: [7, 8],
    backhoe: [9, 11]
  };

  /* ---------- шапка ---------- */
  var header = $('.header');
  addEventListener('scroll', function () { header.classList.toggle('scrolled', scrollY > 50); }, { passive: true });

  var mega = $('.mega-wrap'), megaBtn = $('.catalog-btn');
  function megaOpen(on) { mega.classList.toggle('open', on); megaBtn.setAttribute('aria-expanded', String(on)); $('.mega').setAttribute('aria-hidden', String(!on)); }
  megaBtn.addEventListener('click', function (e) { e.stopPropagation(); megaOpen(!mega.classList.contains('open')); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.mega-wrap')) megaOpen(false); });
  $$('.mega a').forEach(function (a) { a.addEventListener('click', function () { megaOpen(false); }); });

  var mnav = $('.mnav');
  function menu(on) { mnav.classList.toggle('open', on); mnav.setAttribute('aria-hidden', String(!on)); document.documentElement.classList.toggle('ms-lock', on); }
  $('.burger').addEventListener('click', function () { menu(true); });
  $('.mnav-x').addEventListener('click', function () { menu(false); });
  mnav.addEventListener('click', function (e) { if (e.target === mnav || e.target.closest('nav a')) menu(false); });

  /* ---------- баннер-слайдер ---------- */
  var bs = $$('.bslide'), bd = $$('.bn-dots button'), bi = 0, bt;
  function bgo(n) {
    bi = (n + bs.length) % bs.length;
    bs.forEach(function (s, i) { s.classList.toggle('is-active', i === bi); });
    bd.forEach(function (d, i) { d.classList.toggle('is-active', i === bi); });
    clearTimeout(bt); bt = setTimeout(function () { bgo(bi + 1); }, 6000);
  }
  bd.forEach(function (d, i) { d.addEventListener('click', function () { bgo(i); }); });
  $('[data-bprev]').addEventListener('click', function () { bgo(bi - 1); });
  $('[data-bnext]').addEventListener('click', function () { bgo(bi + 1); });
  var banner = $('.banner'), sx = null;
  banner.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  banner.addEventListener('touchend', function (e) {
    if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) bgo(bi + (dx < 0 ? 1 : -1));
  });
  bgo(0);

  /* ---------- каталог-карусель ---------- */
  var state = { cat: 'all', ids: null, note: '' };
  var grid = $('[data-grid]'), note = $('.filter-note');
  var favs = {};
  try { favs = JSON.parse(localStorage.getItem('ms_favs')) || {}; } catch (e) { favs = {}; }

  function buyBox(p) {
    var q = MS.cart()[p.id];
    if (q) {
      return '<div class="stepper"><button type="button" data-step="-1" aria-label="Меньше"><svg class="i"><use href="#i-minus"/></svg></button>' +
        '<output>' + q + ' шт<small>' + fmt(p.price * q) + '</small></output>' +
        '<button type="button" data-step="1" aria-label="Больше"><svg class="i"><use href="#i-plus"/></svg></button></div>';
    }
    return '<button type="button" class="buy-btn" data-add="' + p.id + '"><svg class="i"><use href="#i-cart"/></svg>В корзину</button>';
  }
  function card(p, i) {
    var tag = p.tag ? '<span class="ptag ' + (p.tag === 'Новинка' ? 't-new' : p.tag === 'Скидка' ? 't-sale' : '') + '">' + p.tag + '</span>' : '';
    return '<article class="pcard" data-card data-id="' + p.id + '" data-reveal data-delay="' + Math.min(i, 4) * 70 + '">' +
      '<div class="pcard-media pc-' + p.cat + '">' + tag +
        '<button type="button" class="fav' + (favs[p.id] ? ' on' : '') + '" data-fav="' + p.id + '" aria-label="В избранное"><svg class="i"><use href="#i-heart"/></svg></button>' +
        '<img src="' + MS.img(p) + '" alt="' + p.name + ' ' + p.size + '" loading="lazy"></div>' +
      '<div class="pcard-body">' +
        '<div class="p-row"><span class="p-brand">' + p.brand + '</span><span class="p-rate"><svg class="i"><use href="#i-star"/></svg>' + p.rating.toFixed(1).replace('.', ',') + ' <small>' + p.reviews + ' отз.</small></span></div>' +
        '<h3 class="p-title">' + p.name + '</h3>' +
        '<span class="p-size">' + p.size + (p.diam ? ' · ' + p.axle : '') + '</span>' +
        '<span class="p-stock">В наличии ' + p.stock + ' шт</span>' +
        '<div class="p-price"><b>' + fmt(p.price) + '</b>' + (p.old ? '<s>' + fmt(p.old) + '</s>' : '') + '</div>' +
        '<div class="buy" data-buybox="' + p.id + '">' + buyBox(p) + '</div>' +
      '</div></article>';
  }
  function list() {
    var l = D.products.filter(function (p) {
      return (state.cat === 'all' || p.cat === state.cat) && (!state.ids || state.ids.indexOf(p.id) > -1);
    });
    return l.sort(function (a, b) { return ((b.tag === 'Хит') - (a.tag === 'Хит')) || b.reviews - a.reviews; });
  }
  function renderGrid() {
    var l = list();
    grid.innerHTML = l.map(card).join('') || '<div class="sd-empty">Ничего не найдено — <button type="button" data-callback="Заказ под размер"><b>оставьте заявку</b></button>, привезём под заказ.</div>';
    grid.scrollLeft = 0;
    $$('.chips button').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-tab') === state.cat && !state.ids); });
    note.hidden = !state.note;
    note.innerHTML = state.note ? 'Подобрано: <b>' + state.note + '</b> · ' + l.length + ' шт. <button type="button" data-reset>Сбросить</button>' : '';
    MS.render(); MS.reveal(grid); arrows();
  }
  note.addEventListener('click', function (e) { if (e.target.closest('[data-reset]')) { state.ids = null; state.note = ''; state.cat = 'all'; renderGrid(); } });
  $$('.chips button').forEach(function (b) {
    b.addEventListener('click', function () { state.cat = b.getAttribute('data-tab'); state.ids = null; state.note = ''; renderGrid(); });
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-filter]'); if (!a) return;
    state.cat = a.getAttribute('data-filter'); state.ids = null; state.note = ''; renderGrid();
  });

  // обновляем кнопки «В корзину» ↔ степпер при любом изменении корзины
  document.addEventListener('ms:cart', function () {
    $$('[data-buybox]').forEach(function (box) { box.innerHTML = buyBox(MS.byId(box.getAttribute('data-buybox'))); });
  });
  grid.addEventListener('click', function (e) {
    var st = e.target.closest('[data-step]');
    if (st) { var id = st.closest('[data-buybox]').getAttribute('data-buybox'); MS.add(id, +st.getAttribute('data-step')); return; }
    var f = e.target.closest('[data-fav]');
    if (f) {
      var fid = f.getAttribute('data-fav');
      if (favs[fid]) delete favs[fid]; else { favs[fid] = 1; burst(f, 10); }
      f.classList.toggle('on', !!favs[fid]);
      try { localStorage.setItem('ms_favs', JSON.stringify(favs)); } catch (er) {}
      favCount();
    }
  });
  function favCount() {
    var n = Object.keys(favs).length, el = $('[data-fav-count]');
    el.textContent = n; el.classList.toggle('is-empty', !n);
  }

  // стрелки карусели
  var prev = $('.car-prev'), next = $('.car-next');
  function arrows() {
    prev.disabled = grid.scrollLeft < 10;
    next.disabled = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 10;
  }
  grid.addEventListener('scroll', arrows, { passive: true });
  addEventListener('resize', arrows);
  prev.addEventListener('click', function () { grid.scrollBy({ left: -grid.clientWidth * .8, behavior: 'smooth' }); });
  next.addEventListener('click', function () { grid.scrollBy({ left: grid.clientWidth * .8, behavior: 'smooth' }); });

  /* ---------- конфетти при добавлении в корзину ---------- */
  var COLORS = ['#ffd23f', '#6ee7c5', '#ff9a76', '#8fb8ff', '#12204a', '#ff4d79'];
  function burst(el, n) {
    if (MS.reduced || !el || !document.body.animate) return;
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < (n || 18); i++) {
      var c = document.createElement('i'); c.className = 'confetti';
      c.style.left = cx + 'px'; c.style.top = cy + 'px'; c.style.background = COLORS[i % COLORS.length];
      document.body.appendChild(c);
      var ang = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 90;
      var dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 40;
      c.animate([
        { transform: 'translate(-50%,-50%) rotate(0deg) scale(1)', opacity: 1 },
        { transform: 'translate(' + dx + 'px,' + (dy + 80) + 'px) rotate(' + (Math.random() * 720 - 360) + 'deg) scale(.6)', opacity: 0 }
      ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = (function (x) { return function () { x.remove(); }; })(c);
    }
  }
  document.addEventListener('ms:added', function (e) {
    // кнопка уже заменена степпером — берём её место в карточке
    var b = e.detail.button;
    burst(b.isConnected ? b : document.querySelector('[data-buybox="' + e.detail.product.id + '"]'));
  });

  /* ---------- подбор ---------- */
  var form = $('.picker-form'), mode = 'params', ptab = 'tires';
  function uniq(a) { return a.filter(function (v, i) { return v && a.indexOf(v) === i; }); }
  function opts(sel, vals, any) { sel.innerHTML = '<option value="">' + any + '</option>' + vals.map(function (v) { return '<option>' + v + '</option>'; }).join(''); }
  function pickCat() { return ptab === 'rims' ? 'rims' : form.elements.cat.value; }
  function fillParams() {
    var ps = D.products.filter(function (p) { return p.cat === pickCat(); });
    opts(form.elements.diam, uniq(ps.map(function (p) { return p.diam; })), 'Любой');
    opts(form.elements.axle, uniq(ps.map(function (p) { return p.axle; })), 'Любое');
    opts(form.elements.brand, uniq(ps.map(function (p) { return p.brand; })), 'Любой');
    count();
  }
  function matches() {
    if (mode === 'vehicle' && ptab === 'tires') {
      var ids = VEHICLES[form.elements.vehicle.value] || [];
      return D.products.filter(function (p) { return ids.indexOf(p.id) > -1; });
    }
    var f = form.elements;
    return D.products.filter(function (p) {
      return p.cat === pickCat() && (!f.diam.value || p.diam === f.diam.value) && (!f.axle.value || p.axle === f.axle.value) && (!f.brand.value || p.brand === f.brand.value);
    });
  }
  function count() { $('[data-found]').textContent = matches().length; }
  form.addEventListener('change', function (e) {
    if (e.target.name === 'cat') fillParams();
    if (e.target.name === 'vehicle') $$('.veh-icons button').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-veh') === e.target.value); });
    count();
  });
  $$('.veh-icons button').forEach(function (b) {
    b.addEventListener('click', function () { form.elements.vehicle.value = b.getAttribute('data-veh'); form.dispatchEvent(new Event('change')); $$('.veh-icons button').forEach(function (x) { x.classList.toggle('is-on', x === b); }); count(); });
  });
  var sw = $('.switch');
  function setMode(m) {
    mode = m; sw.setAttribute('aria-checked', String(m === 'vehicle'));
    $$('.pm-lbl').forEach(function (l) { l.classList.toggle('is-on', l.getAttribute('data-mode') === m); });
    $('.pf-params').hidden = m === 'vehicle'; $('.pf-vehicle').hidden = m !== 'vehicle';
    count();
  }
  sw.addEventListener('click', function () { setMode(mode === 'params' ? 'vehicle' : 'params'); });
  $$('.pm-lbl').forEach(function (l) { l.addEventListener('click', function () { setMode(l.getAttribute('data-mode')); }); });
  $$('.picker-tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      ptab = b.getAttribute('data-pt');
      $$('.picker-tabs button').forEach(function (x) { x.classList.toggle('is-active', x === b); });
      $('.picker-mode').style.display = ptab === 'rims' ? 'none' : '';
      form.elements.cat.closest('.field').style.display = ptab === 'rims' ? 'none' : '';
      if (ptab === 'rims') setMode('params');
      form.querySelector('[type=submit]').firstChild.nodeValue = ptab === 'rims' ? 'Найти диски ' : 'Найти шины ';
      fillParams();
    });
  });
  $$('.picker-quick [data-q]').forEach(function (b) {
    b.addEventListener('click', function () {
      var size = b.getAttribute('data-q');
      state.cat = 'all'; state.note = 'размер ' + size;
      state.ids = D.products.filter(function (p) { return p.size === size; }).map(function (p) { return p.id; });
      renderGrid(); $('#catalog').scrollIntoView({ behavior: 'smooth' });
    });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var m = matches();
    state.cat = 'all'; state.ids = m.map(function (p) { return p.id; });
    state.note = mode === 'vehicle' && ptab === 'tires' ? form.elements.vehicle.selectedOptions[0].text :
      [ptab === 'rims' ? 'Диски' : form.elements.cat.selectedOptions[0].text, form.elements.diam.value, form.elements.axle.value, form.elements.brand.value].filter(Boolean).join(' · ');
    renderGrid();
    $('#catalog').scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- живой поиск ---------- */
  var sInput = $('.search input'), drop = $('.search-drop');
  function norm(s) { return s.toLowerCase().replace(/[\s.,\-\/]/g, ''); }
  sInput.addEventListener('input', function () {
    var q = norm(sInput.value);
    if (!q) { drop.hidden = true; return; }
    var res = D.products.filter(function (p) { return norm(p.name + p.size + p.brand + p.axle).indexOf(q) > -1; }).slice(0, 6);
    drop.hidden = false;
    drop.innerHTML = res.length ? res.map(function (p) {
      return '<div class="sd-item" data-goto="' + p.id + '"><img src="' + MS.img(p) + '" alt=""><div><b>' + p.name + '</b><small>' + p.size + '</small></div><span class="sd-price">' + fmt(p.price) + '</span>' +
        '<button type="button" class="sd-add" data-add="' + p.id + '" aria-label="В корзину"><svg class="i"><use href="#i-cart"/></svg></button></div>';
    }).join('') : '<div class="sd-empty">Ничего не нашли по запросу «' + sInput.value.replace(/</g, '') + '»</div>';
  });
  drop.addEventListener('click', function (e) {
    if (e.target.closest('[data-add]')) return;
    var it = e.target.closest('[data-goto]'); if (!it) return;
    var id = +it.getAttribute('data-goto');
    state.cat = 'all'; state.ids = null; state.note = ''; renderGrid();
    drop.hidden = true; sInput.value = '';
    var c = grid.querySelector('[data-id="' + id + '"]');
    $('#catalog').scrollIntoView({ behavior: 'smooth' });
    setTimeout(function () {
      grid.scrollTo({ left: c.offsetLeft - grid.offsetLeft - 10, behavior: 'smooth' });
      c.animate([{ boxShadow: '0 0 0 0 rgba(255,210,63,1)' }, { boxShadow: '0 0 0 14px rgba(255,210,63,0)' }], { duration: 900, iterations: 2 });
    }, 600);
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.search')) drop.hidden = true; });

  /* ---------- отзывы и шоурумы ---------- */
  $('[data-reviews]').innerHTML = D.reviews.map(function (r, i) {
    return '<article class="review" data-reveal data-delay="' + i * 100 + '"><span class="stars">' + '★★★★★'.slice(0, r.rating) + '</span><p>' + r.text + '</p>' +
      '<div class="review-who"><span class="review-ava">' + r.name[0] + '</span><div><b>' + r.name + '</b><small>' + r.role + '</small></div></div></article>';
  }).join('');
  $('[data-shops]').innerHTML = D.company.showrooms.map(function (s, i) {
    return '<div class="shop" data-reveal data-delay="' + i * 80 + '"><svg class="i"><use href="#i-pin"/></svg><div><b>' + s.title + '</b><span>' + s.address + '</span><small>' + s.hours + '</small></div></div>';
  }).join('');

  fillParams(); favCount(); renderGrid(); MS.reveal();
})();
