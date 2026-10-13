// Keep the order screen's account card in sync with the existing admin session.
(() => {
  const frame = document.getElementById('view');
  let observer;
  function sync() {
    observer?.disconnect();
    let session;
    try { session = JSON.parse(localStorage.getItem('tanriverdi_admin_session') || 'null'); } catch (_) { return; }
    if (!session || !(session.role === 'admin' || session.rol === 'admin' || session.yetki === 'admin' || session.isAdmin === true)) return;
    const doc = frame?.contentDocument;
    const title = doc?.getElementById('authBoxTitle');
    const inputs = doc?.getElementById('authInputsWrapper');
    const notice = doc?.getElementById('authNoticeModal');
    const buttons = doc?.getElementById('authButtonsWrapper');
    if (!title || !inputs || !notice || !buttons) return;
    function render() {
      const label = 'Hoş geldiniz, ' + (session.username || 'Admin').toUpperCase();
      if (title.textContent !== label) title.textContent = label;
      if (inputs.style.display !== 'none') inputs.style.display = 'none';
      if (notice.textContent !== '✓ Yönetici oturumunuz açık.') notice.textContent = '✓ Yönetici oturumunuz açık.';
      notice.style.color = '#2ecc71';
      if (!doc.getElementById('admin-account-logout')) {
        const button = doc.createElement('button');
        button.type = 'button';
        button.id = 'admin-account-logout';
        button.className = 'btn-logout-side';
        button.textContent = 'Çıkış Yap';
        button.addEventListener('click', () => {
          window.tanriverdiDisableAdminPush?.().catch(console.warn);
          localStorage.removeItem('tanriverdi_admin_session');
          sessionStorage.removeItem('tanriverdi_admin_session');
          window.postMessage({type:'tanriverdi-logout'}, location.origin);
        });
        buttons.replaceChildren(button);
      }
    }
    render();
    observer = new MutationObserver(render);
    [title, inputs, notice, buttons].forEach(node => observer.observe(node, {childList:true, subtree:true, characterData:true}));
  }
  frame?.addEventListener('load', sync);
  window.addEventListener('storage', sync);
  sync();
})();
