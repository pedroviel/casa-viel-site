/* Casa Viel: JS leve, sem bibliotecas, compartilhado pelas três páginas. */
(() => {
  const $ = (s, r = document) => [...r.querySelectorAll(s)];
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.querySelector('.nav');
  const hero = document.querySelector('.hero');
  const heroImg = document.querySelector('.hero .arch img');
  const big = document.querySelector('.big');

  // menu hambúrguer em tela cheia
  const burger = document.querySelector('.burger'), menu = document.getElementById('menu');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', !open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });

  // manifesto (home): as palavras acendem conforme a rolagem
  let words = [];
  if (big) {
    big.innerHTML = big.textContent.trim().split(/\s+/).map(w => '<span>' + w + '</span>').join(' ');
    words = $('span', big);
  }
  function tick() {
    const h = innerHeight, y = scrollY;
    nav.classList.toggle('s', y > 40);
    nav.classList.toggle('hh', !!hero && y < hero.offsetHeight - 90);
    if (big) {
      const r = big.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (h * .8 - r.top) / (r.height + h * .2)));
      words.forEach((w, i) => w.style.opacity = rm || p * words.length * 1.15 > i ? 1 : .18);
    }
    if (heroImg && !rm && y < h) heroImg.style.transform = 'translateY(' + (-y * .06) + 'px)';
  }
  addEventListener('scroll', tick, { passive: true });
  tick();

  // ampliar imagem: usa o arquivo grande (data-full) e a legenda
  const lb = document.querySelector('.lb');
  let set = [], k = 0;
  if (lb) {
    const li = lb.querySelector('img'), cap = lb.querySelector('.cap');

    // pinça no estilo Instagram: só a <img> escala; a interface fica travada
    let d0 = 0, scale = 1, tx = 0, ty = 0, m0 = null, pinching = false, multi = false, sx0 = 0;
    const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const mid = t => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 });
    // animate=true: volta suave a scale(1); false: volta na hora (trocar de foto ou fechar)
    const resetZoom = animate => {
      pinching = false; scale = 1; tx = ty = 0;
      li.classList.toggle('pz', !animate);
      li.style.transform = 'scale(1)';
      if (!animate) requestAnimationFrame(() => li.classList.remove('pz'));
    };
    const closeLb = () => { lb.classList.remove('open'); resetZoom(false); };

    const show = i => {
      resetZoom(false);
      k = (i + set.length) % set.length;
      const im = set[k], fc = im.closest('figure').querySelector('figcaption');
      li.src = im.dataset.full || im.src; li.alt = im.alt;
      cap.textContent = fc ? fc.textContent : '';
    };
    window.openLb = (imgs, i) => { set = imgs; show(i); lb.classList.add('open'); };
    lb.addEventListener('click', e => {
      const a = e.target.dataset.a;
      if (a === 'x' || e.target === lb) closeLb();
      if (a === 'p') show(k - 1);
      if (a === 'n') show(k + 1);
    });
    addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(k - 1);
      if (e.key === 'ArrowRight') show(k + 1);
    });

    lb.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {            // 2 dedos: começa a pinça
        multi = true; pinching = true;
        d0 = dist(e.touches); m0 = mid(e.touches);
        const r = li.getBoundingClientRect();   // origem do zoom = ponto entre os dedos
        li.style.transformOrigin = (m0.x - r.left) + 'px ' + (m0.y - r.top) + 'px';
        li.classList.add('pz');                 // sem transição enquanto os dedos estão na tela
        return;
      }
      if (e.touches.length > 1) { multi = true; return; }
      multi = false; sx0 = e.touches[0].clientX;
    }, { passive: true });

    lb.addEventListener('touchmove', e => {
      if (!pinching || e.touches.length !== 2) return;
      e.preventDefault();
      scale = Math.min(4, Math.max(1, dist(e.touches) / d0));   // distância atual / inicial
      const m = mid(e.touches);
      tx = scale > 1 ? m.x - m0.x : 0; ty = scale > 1 ? m.y - m0.y : 0;
      li.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    }, { passive: false });

    lb.addEventListener('touchend', e => {
      if (pinching && e.touches.length < 2) resetZoom(true);   // soltou: volta suave a scale(1)
      // swipe só com 1 dedo e sem ter havido pinça
      if (multi || e.touches.length > 0 || e.changedTouches.length !== 1) { if (e.touches.length === 0) multi = false; return; }
      const d = e.changedTouches[0].clientX - sx0;
      if (Math.abs(d) > 50) show(k + (d < 0 ? 1 : -1));
    });
    lb.addEventListener('touchcancel', () => { multi = false; resetZoom(true); });
    lb.addEventListener('gesturestart', e => e.preventDefault());   // Safari iOS: bloqueia o zoom da página
    // portfólio (mosaico): clique abre a ampliação dentro do mesmo projeto
    $('.mosaic').forEach(m => m.addEventListener('click', e => {
      const im = e.target.closest('img'); if (!im) return;
      const imgs = $('img', m); window.openLb(imgs, imgs.indexOf(im));
    }));
  }

  // formulário: envio via fetch (sem sair da página) + trava de 24 h no navegador
  const form = document.querySelector('form.f');
  if (form) {
    const KEY = 'cv_last_send', DAY = 24 * 60 * 60 * 1000;
    const btn = form.querySelector('.send'), label = btn.querySelector('span');
    const txt = label.textContent, msg = form.querySelector('.f-msg'), ok = document.querySelector('.f-ok');
    const say = (t, type) => { msg.textContent = t || ''; msg.dataset.t = type || ''; };
    const last = () => { try { return +localStorage.getItem(KEY) || 0; } catch (e) { return 0; } };
    const locked = () => Date.now() - last() < DAY;
    const lockUi = () => { btn.disabled = true; say('Você já enviou uma mensagem recentemente. Aguarde nosso retorno.', 'note'); };
    if (locked()) lockUi();

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (locked()) { lockUi(); return; }
      const data = Object.fromEntries(new FormData(form));
      // if (!data['h-captcha-response']) { say('Por favor, preencha a verificação de segurança antes de enviar.', 'err'); return; }
      btn.disabled = true; label.textContent = 'Enviando...'; say('');
      try {
        const r = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        });
        const j = await r.json().catch(() => ({}));
        if (r.status !== 200 || j.success === false) throw new Error(j.message || '');
        try { localStorage.setItem(KEY, Date.now()); } catch (e) {}
        form.classList.add('out');
        setTimeout(() => {
          form.reset(); form.hidden = true; ok.hidden = false;
          requestAnimationFrame(() => { ok.classList.add('in'); ok.focus({ preventScroll: true }); });
        }, rm ? 0 : 520);
      } catch (err) {
        say(/captcha/i.test(err.message) ? 'Por favor, preencha a verificação de segurança antes de enviar.' : 'Não foi possível enviar agora. Tente novamente em instantes.', 'err');
        if (window.hcaptcha) try { hcaptcha.reset(); } catch (e) {}
        btn.disabled = false; label.textContent = txt;
      }
    });
  }

  // slider imersivo (home)
  $('.rail').forEach(rail => {
    const stage = rail.parentElement;
    const figs = () => $('figure', rail);
    const mk = (cls, label, d) => {
      const b = document.createElement('button');
      b.className = 'arrow ' + cls; b.setAttribute('aria-label', label);
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';
      stage.appendChild(b); return b;
    };
    const prev = mk('prev', 'Imagem anterior', 'M15 5l-7 7 7 7');
    const next = mk('next', 'Próxima imagem', 'M9 5l7 7-7 7');
    const count = document.createElement('p');
    count.className = 'count'; count.setAttribute('aria-live', 'polite');
    stage.after(count);
    rail.tabIndex = 0;
    let cur = 0, moved = false;

    const go = i => {
      const f = figs(); i = Math.max(0, Math.min(f.length - 1, i));
      const t = f[i];
      rail.scrollTo({ left: t.offsetLeft - (rail.clientWidth - t.offsetWidth) / 2, behavior: rm ? 'auto' : 'smooth' });
    };
    const upd = () => {
      const f = figs(), mid = rail.scrollLeft + rail.clientWidth / 2;
      let b = 0, bd = 1e9;
      f.forEach((x, i) => { const d = Math.abs(x.offsetLeft + x.offsetWidth / 2 - mid); if (d < bd) { bd = d; b = i; } });
      cur = b;
      f.forEach((x, i) => x.classList.toggle('on', i === b));
      prev.disabled = b === 0; next.disabled = b === f.length - 1;
      count.textContent = String(b + 1).padStart(2, '0') + ' / ' + String(f.length).padStart(2, '0');
    };
    rail.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
    addEventListener('resize', () => { upd(); go(cur); });
    prev.onclick = () => go(cur - 1);
    next.onclick = () => go(cur + 1);
    rail.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    });

    // toque: swipe nativo + snap. Mouse: arrastar com o botão pressionado
    let down = false, sx = 0, sl = 0;
    rail.addEventListener('pointerdown', e => {
      moved = false;
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; sx = e.clientX; sl = rail.scrollLeft;
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; rail.classList.add('drag'); }
      if (moved) rail.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (moved) { rail.classList.remove('drag'); upd(); go(cur); }
    });

    // clique: lateral avança/recua; central abre o projeto
    rail.addEventListener('click', e => {
      if (moved) { moved = false; return; }
      const f = e.target.closest('figure'); if (!f) return;
      const i = figs().indexOf(f);
      if (i !== cur) return go(i);
      const a = f.querySelector('a');
      if (a) location.href = a.href;
    });
    upd();
  });
})();