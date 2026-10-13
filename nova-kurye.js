(() => {
  const tabs = document.getElementById('adminTabs');
  const pushButton = document.getElementById('pushBtn');
  if (!tabs || !pushButton || document.getElementById('novaKuryeTab')) return;

  // Authentication stays with Nova; no credentials enter this public app.
  const url = 'https://panel.novakurye.com.tr/restoran/home';
  const mainView = document.getElementById('view');
  const button = document.createElement('button');
  button.id = 'novaKuryeTab';
  button.type = 'button';
  button.className = 'admin-tab nova-kurye-tab';
  button.textContent = '🛵 Nova Kurye';
  button.setAttribute('aria-controls', 'novaKuryePanel');
  button.setAttribute('aria-expanded', 'false');
  tabs.insertBefore(button, pushButton);

  const panel = document.createElement('section');
  panel.id = 'novaKuryePanel';
  panel.hidden = true;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Nova Kurye paneli');
  const toolbar = document.createElement('div');
  toolbar.className = 'nova-kurye-toolbar';
  const title = document.createElement('strong');
  title.textContent = 'Nova Kurye';
  const reload = document.createElement('button');
  reload.type = 'button';
  reload.textContent = 'Yenile';
  reload.setAttribute('aria-label', 'Nova Kurye panelini yenile');
  const fallback = document.createElement('a');
  fallback.href = url;
  fallback.target = '_blank';
  fallback.rel = 'noopener noreferrer';
  fallback.textContent = 'Giriş için ayrı aç';
  fallback.title = 'Tarayıcı gömülü oturumu engellerse Nova hesabını ayrı aç';
  toolbar.append(title, reload, fallback);
  const view = document.createElement('iframe');
  view.id = 'novaKuryeFrame';
  view.title = 'Nova Kurye restoran paneli';
  // Restrict autoplay only in the courier frame, leaving order audio untouched.
  // Browsers can still permit media explicitly played by a user gesture.
  view.allow = "autoplay 'none'";
  view.referrerPolicy = 'strict-origin-when-cross-origin';
  panel.append(toolbar, view);
  document.getElementById('app').append(panel);

  function hide() {
    panel.hidden = true;
    button.classList.remove('active');
    button.setAttribute('aria-expanded', 'false');
    if (mainView) mainView.style.removeProperty('display');
  }
  button.addEventListener('click', () => {
    if (!tabs.classList.contains('show')) return;
    if (!view.getAttribute('src')) view.src = url;
    panel.hidden = false;
    button.classList.add('active');
    button.setAttribute('aria-expanded', 'true');
    tabs.querySelectorAll('[data-tab]').forEach(tab => tab.classList.remove('active'));
    // Hide rather than unload: existing order listeners keep running.
    if (mainView) mainView.style.display = 'none';
  });
  tabs.querySelectorAll('[data-tab]').forEach(tab => tab.addEventListener('click', hide));
  reload.addEventListener('click', () => { view.src = url; });
  new MutationObserver(() => {
    if (!tabs.classList.contains('show')) {
      hide();
      view.removeAttribute('src');
    }
  }).observe(tabs, { attributes: true, attributeFilter: ['class'] });

  const style = document.createElement('style');
  style.textContent = `
    .nova-kurye-tab{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;text-decoration:none;white-space:nowrap}
    .nova-kurye-tab:hover{background:#354e68}
    .nova-kurye-tab:focus-visible{outline:2px solid #fff;outline-offset:2px}
    #novaKuryePanel{position:absolute;inset:58px 0 0;background:#fff;display:flex;flex-direction:column;z-index:3}
    #novaKuryePanel[hidden]{display:none}
    .nova-kurye-toolbar{display:flex;align-items:center;gap:12px;min-height:44px;padding:6px 14px;box-sizing:border-box;background:#f4f6f9;border-bottom:1px solid #e0e5eb;font-size:13px}
    .nova-kurye-toolbar strong{margin-right:auto}
    .nova-kurye-toolbar button,.nova-kurye-toolbar a{font:inherit;color:#26384b;text-decoration:none;padding:6px 9px;border:1px solid #cfd7df;border-radius:6px;background:white;cursor:pointer}
    #novaKuryeFrame{flex:1;min-height:0;width:100%;border:0;background:#fff}
    #adminTabs{overflow-x:auto;scrollbar-width:none}
    #adminTabs::-webkit-scrollbar{display:none}
    #adminTabs>.admin-tab{flex-shrink:0}
  `;
  document.head.append(style);
})();
