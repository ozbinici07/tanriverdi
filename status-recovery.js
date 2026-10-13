(() => {
  const frame = document.getElementById('view');
  let timer, busy = false, generation = 0, pushRenewal;
  function start() {
    clearInterval(timer);
    const current = ++generation;
    const doc = frame?.contentDocument;
    if (!doc?.getElementById('live-notification')) return;
    async function refresh() {
      if (document.hidden || busy) return;
      const id = localStorage.getItem('last_order_id');
      if (!id) return;
      busy = true;
      try {
        const response = await fetch('https://tanriverdidoner-a2641-default-rtdb.europe-west1.firebasedatabase.app/siparisler/' + encodeURIComponent(id) + '.json', {cache:'no-store', signal:AbortSignal.timeout(8000)});
        if (!response.ok) return;
        const order = await response.json();
        if (!order || current !== generation || id !== localStorage.getItem('last_order_id')) return;
        if (!pushRenewal && 'Notification' in window && Notification.permission === 'granted' && order.bildirimCihazId === localStorage.getItem('tanriverdi_push_device_id')) {
          pushRenewal = window.tanriverdiPrepareCustomerPush({deviceId:order.bildirimCihazId,username:order.bildirimKullanici||order.username||'',phone:order.telefon||order.phone||''}).catch(error => { console.warn('Bildirim kaydı yenilenemedi:',error); });
        }
        const states = {
          yeni:['⏳ Siparişiniz Alındı. Restoran Onayı Bekleniyor...', '#2980b9'],
          accepted:['✅ Siparişiniz Restoran Tarafından Kabul Edildi! Hazırlanıyor.', '#27ae60'],
          onway:['🛵 Müjde! Siparişiniz Yola Çıktı, Geliyor!', '#f39c12'],
          delivered:['🎉 Siparişiniz Teslim Edildi. Afiyet Olsun!', '#2e7d32'],
          rejected:['❌ Üzgünüz, Siparişiniz Reddedildi/İptal Edildi.', '#c0392b']
        };
        const state = states[order.durum];
        const box = doc.getElementById('live-notification');
        if (state && box && box.textContent !== state[0]) {
          box.textContent = state[0]; box.style.background = state[1]; box.style.display = 'block';
        }
        const history = JSON.parse(localStorage.getItem('tanriverdi_siparislerim') || '[]');
        const item = history.find(item => item.id === id);
        if (item && item.durum !== order.durum) {
          item.durum = order.durum;
          localStorage.setItem('tanriverdi_siparislerim', JSON.stringify(history));
          frame.contentWindow.renderOrderHistory?.();
        }
        if (order.durum === 'delivered' || order.durum === 'rejected') clearInterval(timer);
      } catch (error) { console.warn('Sipariş durumu yenilenemedi:', error.message); }
      finally { busy = false; }
    }
    refresh();
    timer = setInterval(refresh, 5000);
  }
  frame?.addEventListener('load', start);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  window.addEventListener('online', start);
  window.addEventListener('pageshow', start);
  start();
})();
