// Day is maroon on paper, night is red on black. Set early so a page never flashes.
(() => {
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem('mode'); } catch (e) {}
  if (saved) root.dataset.mode = saved;
  addEventListener('DOMContentLoaded', () => {
    document.getElementById('mode').addEventListener('click', () => {
      const night = matchMedia('(prefers-color-scheme: dark)').matches;
      const now = root.dataset.mode || (night ? 'night' : 'day');
      root.dataset.mode = now === 'night' ? 'day' : 'night';
      try { localStorage.setItem('mode', root.dataset.mode); } catch (e) {}
    });
  });
})();
