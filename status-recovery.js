(() => {
  const frame = document.getElementById('view');
  let timer, busy = false, generation = 0, pushRenewal;
  let registrationBusy = false, automaticRegistration = false;
  function prepareNotifications(doc) {
    if (doc.getElementById('customer-push-controls')) return;
    const host = doc.getElementById('authBoxContainer');
    if (!host) return;
    const controls = doc.createElement('div');
    controls.id = 'customer-push-controls';
    controls.style.cssText = 'padding:10px 0;';
    const button = doc.createElement('button');
    button.type = 'button';
    button.textContent = '🔔 Sipariş bildirimlerini aç';
    button.style.cssText = 'width:100%;padding:12px;border:0;border-radius:8px;background:#168c3a;color:white;cursor:pointer;font-weight:bold;';
    const notice = doc.createElement('div');
    notice.setAttribute('role', 'status');
    notice.style.cssText = 'font-size:12px;margin-top:6px;';
    controls.append(button, notice);
    host.after(controls);
    async function renew() {
      if (registrationBusy) return;
      if (!('Notification' in window)) {
        notice.textContent = 'Bu tarayıcı bildirimleri desteklemiyor. Chrome ile açın.';
        return;
      }
      if (Notification.permission === 'denied') {
        notice.textContent = 'Bildirim izni kapalı. Tarayıcıda bu site için bildirimlere izin verip yeniden deneyin.';
        return;
      }
      registrationBusy = true;
      button.disabled = true;
      notice.textContent = 'Bildirimler bağlanıyor…';
      try {
        const user = JSON.parse(localStorage.getItem('tanriverdi_logged_user') || 'null');
        const result = await window.tanriverdiPrepareCustomerPush({
          deviceId:localStorage.getItem('tanriverdi_push_device_id') || '',
          username:user?.username || '', name:user?.name || '', phone:user?.phone || ''
        });
        if (!result?.token) throw Object.assign(Error('Bildirim kaydı oluşturulamadı.'),{code:result?.errorCode||'registration-failed'});
        notice.textContent = '✓ Bu cihazda sipariş bildirimleri açık.';
        button.textContent = '🔔 Bildirim kaydını yenile';
      } catch (error) {
        const code=String(error.code||error.name||'unknown').replace(/[^a-zA-Z0-9/_-]/g,'').slice(0,100); notice.textContent = 'Bildirimler bağlanamadı. Hata kodu: '+code+' (Sürüm 4)';
      } finally {
        registrationBusy = false;
        button.disabled = false;
      }
    }
    button.addEventListener('click', renew);
    if (!automaticRegistration && 'Notification' in window && Notification.permission === 'granted') {
      automaticRegistration = true;
      renew();
    }
  }
  function start() {
    clearInterval(timer);
    const current = ++generation;
    const doc = frame?.contentDocument;
    if (!doc?.getElementById('live-notification')) return;
    prepareNotifications(doc);
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
  // External menu images can delay the iframe load event. Start when its UI exists.
  let observedDocument;
  setInterval(() => {
    const doc = frame?.contentDocument;
    if (doc && doc !== observedDocument && doc.getElementById('live-notification')) {
      observedDocument = doc;
      start();
    }
  }, 1000);
  start();
})();
