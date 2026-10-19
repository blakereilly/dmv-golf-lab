// Capital Golf Labs — shared site behaviour (every page).
// Each feature checks that its elements exist, so one file serves all pages.
(() => {
    const $  = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const page = document.body.dataset.page || '';

    /* ---------- Nav: glass on scroll + reading progress ---------- */
    const nav = $('#main-nav');
    const onScroll = () => {
        const y = window.scrollY;
        if (nav) nav.classList.toggle('scrolled', y > 24);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        document.documentElement.style.setProperty('--progress', max > 0 ? Math.min(y / max, 1).toFixed(4) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Mobile menu ---------- */
    const burger = $('#hamburger');
    const menu = $('#mobile-menu');
    if (burger && menu) {
        const setMenu = (open) => {
            burger.classList.toggle('is-open', open);
            menu.classList.toggle('is-open', open);
            burger.setAttribute('aria-expanded', open);
            burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            menu.setAttribute('aria-hidden', !open);
            document.body.style.overflow = open ? 'hidden' : '';
        };
        burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
        $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    }

    /* ---------- Scroll reveal (siblings inside [data-stagger] cascade) ---------- */
    $$('[data-stagger]').forEach((group) => {
        $$('.reveal', group).forEach((el, i) => el.style.setProperty('--d', `${(i * 0.08).toFixed(2)}s`));
    });
    const revealIO = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add('in');
            revealIO.unobserve(e.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal, .tech-banner').forEach((el) => revealIO.observe(el));

    /* ---------- Cursor spotlight on cards ---------- */
    $$('.spot').forEach((el) => {
        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect();
            el.style.setProperty('--mx', `${e.clientX - r.left}px`);
            el.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
    });

    /* ---------- Nav scroll-spy (home) ---------- */
    const spyLinks = $$('.nav-link[href^="#"]');
    if (spyLinks.length) {
        const map = new Map(spyLinks.map((a) => [a.getAttribute('href').slice(1), a]));
        const spyIO = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                const link = map.get(e.target.id);
                if (link && e.isIntersecting) {
                    spyLinks.forEach((l) => l.classList.remove('is-active'));
                    link.classList.add('is-active');
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        map.forEach((_, id) => { const s = document.getElementById(id); if (s) spyIO.observe(s); });
        // Nothing highlighted while the hero is on screen.
        const hero = $('.hero');
        if (hero) new IntersectionObserver(([e]) => { if (e.isIntersecting) spyLinks.forEach((l) => l.classList.remove('is-active')); }, { threshold: 0.4 }).observe(hero);
    }

    /* ---------- Number helpers ---------- */
    const fmt = (n, dec = 0) => n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    function tweenNumber(el, to, dec = 0, ms = 900) {
        const from = parseFloat(el.dataset.v || '0');
        el.dataset.v = to;
        if (reduceMotion) { el.textContent = fmt(to, dec); return; }
        const t0 = performance.now();
        const step = (now) => {
            const p = Math.min((now - t0) / ms, 1);
            el.textContent = fmt(from + (to - from) * easeOut(p), dec);
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    /* ---------- Stat counters ---------- */
    const statIO = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target;
            const target = parseInt(el.dataset.count, 10);
            const suffix = el.dataset.suffix || '';
            if (!Number.isNaN(target) && !reduceMotion) {
                const t0 = performance.now();
                const step = (now) => {
                    const p = Math.min((now - t0) / 1600, 1);
                    el.innerHTML = `${Math.round(easeOut(p) * target)}<span class="stat-suffix">${suffix}</span>`;
                    if (p < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            }
            statIO.unobserve(el);
        });
    }, { threshold: 0.5 });
    $$('.stat-number[data-count]').forEach((el) => statIO.observe(el));

    /* ---------- Shot data (sample numbers, shared by the hero readout and Shot Lab) ---------- */
    const CLUBS = {
        driver: { name: 'Driver', club: 112, ball: 167, smash: 1.49, launch: 12.1, spin: 2480, apex: 98, carry: 268, total: 291, peak: 0.60 },
        wood:   { name: '3 Wood', club: 106, ball: 156, smash: 1.47, launch: 10.9, spin: 3450, apex: 90, carry: 243, total: 259, peak: 0.58 },
        iron:   { name: '7 Iron', club: 90,  ball: 120, smash: 1.33, launch: 16.3, spin: 6950, apex: 94, carry: 172, total: 179, peak: 0.55 },
        wedge:  { name: 'Wedge',  club: 83,  ball: 102, smash: 1.23, launch: 24.2, spin: 9250, apex: 88, carry: 132, total: 134, peak: 0.52 },
    };
    const DEC = { smash: 2, launch: 1 };

    // Side-on ball flight: rises to the apex, then falls more steeply (like a real flight).
    function flight(c, box) {
        const { x0, x1, ground, top, yds, apexMax } = box;
        const sx = (x1 - x0) / yds;
        const sy = (ground - top) / apexMax;
        const apexYds = c.apex / 3;
        const p = Math.log(0.5) / Math.log(c.peak);
        const pts = [];
        for (let i = 0; i <= 72; i++) {
            const u = i / 72;
            pts.push([x0 + u * c.carry * sx, ground - apexYds * Math.sin(Math.PI * Math.pow(u, p)) * sy]);
        }
        const peakU = Math.pow(0.5, 1 / p);
        return {
            d: 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L'),
            apex: [x0 + peakU * c.carry * sx, ground - apexYds * sy],
            land: [x0 + c.carry * sx, ground],
            start: [x0, ground],
        };
    }

    // Draw a path from start to finish with a ball riding the tip.
    function drawFlight(path, ball, ms, done) {
        const len = path.getTotalLength();
        path.style.strokeDasharray = len;
        if (reduceMotion) {
            path.style.strokeDashoffset = 0;
            const end = path.getPointAtLength(len);
            ball.setAttribute('cx', end.x); ball.setAttribute('cy', end.y);
            if (done) done();
            return;
        }
        const t0 = performance.now();
        const step = (now) => {
            const p = Math.min((now - t0) / ms, 1);
            const e = easeOut(p);
            path.style.strokeDashoffset = len * (1 - e);
            const pt = path.getPointAtLength(len * e);
            ball.setAttribute('cx', pt.x); ball.setAttribute('cy', pt.y);
            if (p < 1) requestAnimationFrame(step); else if (done) done();
        };
        requestAnimationFrame(step);
    }

    /* ---------- Hero readout: cycles through clubs ---------- */
    const readout = $('#readout');
    if (readout) {
        const order = ['driver', 'iron', 'wedge', 'wood'];
        const clubEl = $('.readout-club', readout);
        const path = $('.flight', readout);
        const ball = $('.ball', readout);
        const vals = $$('[data-k]', readout);
        const box = { x0: 8, x1: 312, ground: 66, top: 6, yds: 300, apexMax: 36 };
        let i = 0;
        let timer = null;
        const show = () => {
            const c = CLUBS[order[i % order.length]];
            clubEl.textContent = c.name;
            path.setAttribute('d', flight(c, box).d);
            drawFlight(path, ball, 1400);
            vals.forEach((el) => tweenNumber(el, c[el.dataset.k], DEC[el.dataset.k] || 0));
            i++;
        };
        const start = () => { if (!timer) { show(); if (!reduceMotion) timer = setInterval(show, 4200); } };
        const stop = () => { clearInterval(timer); timer = null; };
        // Only run while the readout is visible on a desktop-sized screen.
        new IntersectionObserver(([e]) => (e.isIntersecting && readout.offsetParent ? start() : stop()), { threshold: 0.2 }).observe(readout);
        document.addEventListener('visibilitychange', () => (document.hidden ? stop() : readout.offsetParent && start()));
    }

    /* ---------- Shot Lab: pick a club, watch the flight ---------- */
    const lab = $('#shotlab');
    if (lab) {
        const svg = $('svg', lab);
        const NS = 'http://www.w3.org/2000/svg';
        const box = { x0: 34, x1: 584, ground: 214, top: 34, yds: 300, apexMax: 38 };
        const el = (tag, attrs, parent) => {
            const n = document.createElementNS(NS, tag);
            Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
            (parent || svg).appendChild(n);
            return n;
        };

        // Grid: yardage ticks along the ground, faint height lines.
        const grid = el('g', { class: 'grid' });
        [80, 126, 172].forEach((y) => el('line', { x1: box.x0, x2: box.x1, y1: y, y2: y }, grid));
        el('line', { class: 'ground', x1: box.x0, x2: box.x1, y1: box.ground, y2: box.ground }, grid);
        for (let yd = 0; yd <= 300; yd += 50) {
            const x = box.x0 + (yd / 300) * (box.x1 - box.x0);
            el('line', { x1: x, x2: x, y1: box.ground, y2: box.ground + 5 }, grid);
            const t = el('text', { x, y: box.ground + 19, 'text-anchor': yd === 0 ? 'start' : yd === 300 ? 'end' : 'middle' }, grid);
            t.textContent = yd;
        }

        const area = el('path', { class: 'area' });
        const path = el('path', { class: 'flight' });
        const apexG = el('g', { class: 'marker' });
        const apexLine = el('line', {}, apexG);
        const apexDot = el('circle', { r: 4 }, apexG);
        const apexTxt = el('text', { 'text-anchor': 'middle' }, apexG);
        const landG = el('g', { class: 'marker' });
        const landDot = el('circle', { r: 4 }, landG);
        const landTxt = el('text', { 'text-anchor': 'end' }, landG);
        const ball = el('circle', { class: 'ball', r: 5, cx: box.x0, cy: box.ground });

        const tabs = $$('.sl-tab', lab);
        const vals = $$('[data-k]', lab);
        const play = (key) => {
            const c = CLUBS[key];
            const f = flight(c, box);
            tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.club === key)));
            [area, apexG, landG].forEach((n) => n.classList.remove('on'));

            path.setAttribute('d', f.d);
            area.setAttribute('d', `${f.d} L${f.land[0].toFixed(1)} ${box.ground} L${box.x0} ${box.ground} Z`);
            apexLine.setAttribute('x1', f.apex[0]); apexLine.setAttribute('x2', f.apex[0]);
            apexLine.setAttribute('y1', f.apex[1]); apexLine.setAttribute('y2', box.ground);
            apexDot.setAttribute('cx', f.apex[0]); apexDot.setAttribute('cy', f.apex[1]);
            apexTxt.setAttribute('x', f.apex[0]); apexTxt.setAttribute('y', f.apex[1] - 12);
            apexTxt.textContent = `APEX ${c.apex} FT`;
            landDot.setAttribute('cx', f.land[0]); landDot.setAttribute('cy', box.ground);
            landTxt.setAttribute('x', Math.max(f.land[0] - 8, 120)); landTxt.setAttribute('y', box.ground - 12);
            landTxt.textContent = `CARRY ${c.carry} YDS`;

            vals.forEach((v) => tweenNumber(v, c[v.dataset.k], DEC[v.dataset.k] || 0, 1100));
            drawFlight(path, ball, 1500, () => [area, apexG, landG].forEach((n) => n.classList.add('on')));
        };
        tabs.forEach((t) => t.addEventListener('click', () => play(t.dataset.club)));

        // First flight plays when the Shot Lab scrolls into view.
        const labIO = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { play('driver'); labIO.disconnect(); }
        }, { threshold: 0.35 });
        labIO.observe(lab);
    }

    /* ---------- Google reviews (from the cgl-hooks Worker; every spot stays hidden until they load) ----------
       #reviews           full section on the home page (summary + swipeable cards)
       [data-rv-inline]   one-line "5.0 ★ on Google" under a Join button
       #join-proof        two quote cards on /join                                                         */
    const reviewsSec = $('#reviews');
    const inlineRv = $$('[data-rv-inline]');
    const joinProof = $('#join-proof');
    if (reviewsSec || inlineRv.length || joinProof) {
        const REVIEWS_API = 'https://waiver.capitalgolflabs.com/api/reviews';
        const STAR = '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z"/></svg>';
        const G = '<svg class="g-mark" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
        const stars = (n) => Array.from({ length: 5 }, (_, i) => (i < Math.round(n) ? STAR : STAR.replace('<svg', '<svg class="off"'))).join('');
        const make = (tag, cls, text) => {
            const n = document.createElement(tag);
            if (cls) n.className = cls;
            if (text != null) n.textContent = text;
            return n;
        };
        const countText = (d) => `${d.count} Google review${d.count === 1 ? '' : 's'}`;

        // One review card. Review text only ever goes in via textContent.
        const reviewCard = (r) => {
            const card = make('article', 'review card');
            const st = make('span', 'stars');
            st.setAttribute('aria-label', `${r.rating} out of 5 stars`);
            st.innerHTML = stars(r.rating);
            card.append(st, make('p', 'review-text', r.text));

            const foot = make('div', 'review-foot');
            let avatar;
            if (r.photo) {
                avatar = make('img', 'review-avatar');
                avatar.src = r.photo;
                avatar.alt = '';
                avatar.loading = 'lazy';
                avatar.referrerPolicy = 'no-referrer';
            } else {
                avatar = make('span', 'review-avatar', (r.author || '?').trim().charAt(0).toUpperCase());
            }
            const who = make('div');
            const name = r.authorUrl ? make('a', 'review-name', r.author) : make('span', 'review-name', r.author);
            if (r.authorUrl) { name.href = r.authorUrl; name.target = '_blank'; name.rel = 'noopener'; }
            who.append(name, make('span', 'review-when', r.when));
            foot.append(avatar, who);
            foot.insertAdjacentHTML('beforeend', G);
            card.append(foot);
            return card;
        };

        const renderSection = (d) => {
            const field = (k) => $(`[data-rv="${k}"]`, reviewsSec);
            field('rating').textContent = Number(d.rating || 5).toFixed(1);
            field('stars').innerHTML = stars(d.rating || 5);
            field('count').textContent = countText(d);
            if (d.url) field('url').href = d.url; else field('url').hidden = true;
            if (d.writeUrl) field('write').href = d.writeUrl; else field('write').hidden = true;

            const track = field('track');
            d.reviews.forEach((r) => track.append(reviewCard(r)));
            reviewsSec.hidden = false;
            $$('.reveal', reviewsSec).forEach((el) => revealIO.observe(el));

            // Arrow buttons page through the cards.
            const btns = $$('.rv-btn', reviewsSec);
            const sync = () => {
                btns[0].disabled = track.scrollLeft < 8;
                btns[1].disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
            };
            btns.forEach((b) => b.addEventListener('click', () => {
                track.scrollBy({ left: Number(b.dataset.dir) * track.clientWidth * 0.9, behavior: 'smooth' });
            }));
            track.addEventListener('scroll', sync, { passive: true });
            sync();
        };

        const renderInline = (d) => inlineRv.forEach((el) => {
            el.innerHTML = `<span class="stars" aria-hidden="true">${stars(d.rating || 5)}</span>`;
            el.append(make('b', null, Number(d.rating || 5).toFixed(1)), ` · ${countText(d)}`);
            if (d.url) el.href = d.url;
            el.hidden = false;
        });

        const renderJoinProof = (d) => {
            const list = $('.join-proof-cards', joinProof);
            d.reviews.slice(0, 2).forEach((r) => list.append(reviewCard(r)));
            const link = $('[data-rv="url"]', joinProof);
            if (d.url) link.href = d.url; else link.hidden = true;
            $('[data-rv="summary"]', joinProof).textContent = `${Number(d.rating || 5).toFixed(1)} on Google · ${countText(d)}`;
            joinProof.hidden = false;
        };

        fetch(REVIEWS_API, { headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!d || !Array.isArray(d.reviews) || !d.reviews.length) return;
                if (reviewsSec) renderSection(d);
                if (inlineRv.length) renderInline(d);
                if (joinProof) renderJoinProof(d);
            })
            .catch(() => { /* no reviews yet — everything stays hidden */ });
    }

    /* ---------- Sticky mobile CTA ---------- */
    const sticky = $('#mobileStickyCta');
    if (sticky && page === 'home') {
        // Visible after the hero, hidden once the membership section is reached or passed.
        let heroGone = false;
        let memberSeen = false;
        const update = () => sticky.classList.toggle('visible', heroGone && !memberSeen);
        new IntersectionObserver(([e]) => { heroGone = !e.isIntersecting; update(); }, { threshold: 0.05 }).observe($('.hero'));
        new IntersectionObserver(([e]) => {
            if (e.isIntersecting) memberSeen = true;
            else if (e.boundingClientRect.top > 0) memberSeen = false;
            update();
        }, { threshold: 0 }).observe($('#reserve'));
    } else if (sticky && page === 'join') {
        // Visible until the real Join button is on screen or scrolled past.
        new IntersectionObserver(([e]) => {
            sticky.classList.toggle('visible', !e.isIntersecting && e.boundingClientRect.top > 0);
        }, { threshold: 0 }).observe($('.plan .btn'));
    }

    /* ---------- Phones: the updates form opens from a "Get Updates" button ---------- */
    const updToggle = $('.updates-toggle');
    if (updToggle) {
        updToggle.addEventListener('click', () => {
            const card = updToggle.closest('.updates');
            card.classList.add('is-open');
            updToggle.setAttribute('aria-expanded', 'true');
            const first = $('input', card);
            if (first) first.focus({ preventScroll: true });
        });
    }

    /* ---------- Updates form (Google Apps Script → Sheet) ---------- */
    const form = $('#waitlist-form');
    if (form) {
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwWFbZPyw8rZ-TZcAF8azrT8u9yPUwVEDuTKJPALWZ2Im9M2iHDBeQ4QUgeTxZbvtNyCQ/exec';
        const btn = $('#form-submit');
        const txt = $('.submit-text', btn);
        const loading = $('.submit-loading', btn);
        const success = $('.submit-success', btn);
        const done = $('#form-success');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            txt.style.display = 'none';
            loading.style.display = 'inline-flex';
            btn.disabled = true;

            const data = {
                name: form.name.value.trim(),
                email: form.email.value.trim(),
                phone: form.phone.value.trim(),
                source: form.source.value,
                timestamp: new Date().toISOString(),
            };
            try {
                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            } catch (err) {
                // no-cors responses are opaque; the row still lands in the Sheet.
            }
            loading.style.display = 'none';
            success.style.display = 'inline-flex';
            btn.classList.add('is-success');
            setTimeout(() => {
                form.style.display = 'none';
                done.style.display = 'block';
            }, 1500);
        });
    }
})();
