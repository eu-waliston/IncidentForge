
/* ── mobile nav ─────────────────────────────── */
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    burger.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
});
navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        burger.textContent = '☰';
    })
);

/* ── tabs ───────────────────────────────────── */
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
});

/* ── copy buttons ───────────────────────────── */
document.querySelectorAll('.copy').forEach(btn => {
    btn.addEventListener('click', async () => {
        const el = document.getElementById(btn.dataset.copy);
        if (!el) return;
        try {
            await navigator.clipboard.writeText(el.innerText);
            btn.textContent = 'Copied ✓';
            btn.classList.add('done');
        } catch {
            btn.textContent = 'Press Ctrl+C';
        }
        setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('done');
        }, 1800);
    });
});

/* ── scroll reveal ──────────────────────────── */
const io = new IntersectionObserver(
    entries => {
        entries.forEach((e, i) => {
            if (e.isIntersecting) {
                e.target.style.transitionDelay = Math.min(i * 55, 280) + 'ms';
                e.target.classList.add('in');
                io.unobserve(e.target);
            }
        });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
