/* 沐澄診所：選單與浮動聯絡 */
(() => {
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.mainnav');
  burger?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  document.querySelectorAll('.tg').forEach((b) =>
    b.addEventListener('click', () => {
      const sub = b.nextElementSibling;
      const open = sub.classList.toggle('open');
      b.setAttribute('aria-expanded', open);
    }));
  nav?.addEventListener('click', (e) => {
    if (e.target.closest('a[href^="#"], a[href*="/#"]')) { nav.classList.remove('open'); burger?.setAttribute('aria-expanded', false); document.body.style.overflow = ''; }
  });
  // 手風琴：標題列點擊展開 / 收合下一個內文區塊
  document.querySelectorAll('.acc-t').forEach((t) => {
    const body = t.nextElementSibling;
    if (!body) return;
    t.setAttribute('role', 'button');
    t.setAttribute('tabindex', '0');
    t.setAttribute('aria-expanded', !body.classList.contains('shut'));
    const toggle = (e) => {
      e.preventDefault();
      t.setAttribute('aria-expanded', !body.classList.toggle('shut'));
    };
    t.addEventListener('click', toggle);
    t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') toggle(e); });
  });
  const hd = document.querySelector('.hd');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (!nav?.classList.contains('open')) hd.classList.toggle('away', y > lastY && y > 120);
    lastY = y;
  }, { passive: true });
  const fab = document.querySelector('.fab');
  fab?.querySelector('.fab-btn').addEventListener('click', (e) => {
    const open = fab.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', open);
  });
})();
