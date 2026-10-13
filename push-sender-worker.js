const PROJECT_ID = 'tanriverdidoner-a2641';
const DB_URL = 'https://tanriverdidoner-a2641-default-rtdb.europe-west1.firebasedatabase.app';
const APP_URL = 'https://tanriverdi.web.app/';


function base64url(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function textBase64url(text) { return base64url(new TextEncoder().encode(text)); }
function privateKeyBytes(value) {
  const normalized = String(value).replace(/\\n/g, '\n').trim()
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '').replace(/\s/g, '');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
async function getAccessToken(env) {
  if (!env.FCM_SERVICE_ACCOUNT_EMAIL) throw new Error('FCM_SERVICE_ACCOUNT_EMAIL Secret eksik');
  if (!env.FCM_SERVICE_ACCOUNT_PRIVATE_KEY) throw new Error('FCM_SERVICE_ACCOUNT_PRIVATE_KEY Secret eksik');
  const now = Math.floor(Date.now() / 1000);
  const header = textBase64url(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const claim = textBase64url(JSON.stringify({
    iss: env.FCM_SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600
  }));
  const key = await crypto.subtle.importKey('pkcs8', privateKeyBytes(env.FCM_SERVICE_ACCOUNT_PRIVATE_KEY),
    {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'}, false, ['sign']);
  const unsigned = `${header}.${claim}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const assertion = `${unsigned}.${base64url(new Uint8Array(signature))}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion='+encodeURIComponent(assertion)
  });
  if (!response.ok) throw new Error(`Google OAuth hatası: ${await response.text()}`);
  const data = await response.json();
  if (!data.access_token) throw new Error('Google OAuth access_token döndürmedi');
  return data.access_token;
}
async function databaseGet(path, accessToken) {
  const response = await fetch(`${DB_URL}/${path}.json`, {headers:{Authorization:`Bearer ${accessToken}`}});
  if (!response.ok) throw new Error(`Realtime Database GET hatası: ${await response.text()}`);
  return response.json();
}
async function databasePut(path, value, accessToken) {
  const response = await fetch(`${DB_URL}/${path}.json`, {
    method:'PUT',
    headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},
    body:JSON.stringify(value)
  });
  if (!response.ok) throw new Error(`Realtime Database PUT hatası: ${await response.text()}`);
  return response.json();
}
function jsonResponse(body,status=200){
  return new Response(JSON.stringify(body),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Allow-Methods':'POST,OPTIONS'
  }});
}
function statusText(status) {
  return ({
    accepted:{title:'✅ Siparişiniz Kabul Edildi',body:'Siparişiniz restoran tarafından kabul edildi ve hazırlanıyor.'},
    rejected:{title:'❌ Siparişiniz Reddedildi',body:'Üzgünüz, siparişiniz restoran tarafından reddedildi.'},
    onway:{title:'🛵 Siparişiniz Yola Çıktı',body:'Siparişiniz hazırlandı ve yola çıktı.'},
    delivered:{title:'🎉 Siparişiniz Teslim Edildi',body:'Afiyet olsun. Siparişiniz teslim edildi.'}
  })[status] || null;
}
async function sendFcm(token, notification, data, accessToken) {
  return fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`, {
    method:'POST',
    headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},
    body:JSON.stringify({message:{
      token,
      notification,
      data:{...data,url:APP_URL},
      webpush:{
        headers:{Urgency:'high'},
        notification:{icon:APP_URL+'icon-192.png'},
        fcmOptions:{link:APP_URL}
      }
    }})
  });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST,OPTIONS'}});
    if (url.pathname === '/') return new Response('Tanriverdi FCM Worker OK');
    if (url.pathname !== '/notify') return jsonResponse({ok:false,error:'Geçersiz endpoint'},404);
    if (request.method !== 'POST') return jsonResponse({ok:false,error:'POST gerekli'},405);


    try {
      const payload = await request.json();
      const orderId = payload?.orderId;
      const requestedStatus = payload?.status ? String(payload.status) : '';
      if (!orderId) return jsonResponse({ok:false,error:'orderId gerekli'},400);


      const accessToken = await getAccessToken(env);
      const safeOrderId = encodeURIComponent(String(orderId));
      const order = await databaseGet(`siparisler/${safeOrderId}`, accessToken);
      if (!order) return jsonResponse({ok:false,error:'Sipariş bulunamadı'},404);


      const status = requestedStatus || String(order.durum || 'yeni');
      const isCustomerStatus = !!requestedStatus && requestedStatus !== 'yeni';
      const kind = isCustomerStatus ? `customer-${encodeURIComponent(status)}` : 'new-order';
      const sentPath = `bildirimGonderildi/${safeOrderId}/${kind}`;
      const sentBefore = await databaseGet(sentPath, accessToken);
      if (sentBefore) return jsonResponse({ok:true,duplicate:true,success:sentBefore.success||0});


      let tokens = [];
      if (isCustomerStatus) {
        const deviceId = order.bildirimCihazId;
        if (deviceId) {
          const item = await databaseGet(`bildirimTokenlari/musteri/${encodeURIComponent(String(deviceId))}`, accessToken);
          if (item?.token) tokens = [item.token];
        }
        // İlk siparişte cihaz ID'si kayda geçmemişse kullanıcı adı/telefon ile yedek eşleştirme yap.
        if (!tokens.length) {
          const customerData = await databaseGet('bildirimTokenlari/musteri', accessToken);
          const username = String(order.bildirimKullanici || order.username || '').trim();
          const phone = String(order.telefon || order.phone || '').replace(/\D/g,'');
          for (const [id, item] of Object.entries(customerData || {})) {
            if (!item?.token) continue;
            const itemUser = String(item.username || '').trim();
            const itemPhone = String(item.phone || '').replace(/\D/g,'');
            if ((username && itemUser && username === itemUser) || (phone && itemPhone && phone === itemPhone)) {
              tokens = [item.token];
              break;
            }
          }
        }
      } else {
        const tokenData = await databaseGet('bildirimTokenlari/admin', accessToken);
        tokens = Object.values(tokenData || {}).map(x=>x?.token).filter(x=>typeof x==='string' && x.length>0);
      }


      if (!tokens.length) {
        return jsonResponse({ok:false,success:0,error:isCustomerStatus
          ? 'Bu sipariş için kayıtlı müşteri bildirim tokenı yok.'
          : 'Kayıtlı yönetici FCM tokenı yok.'},409);
      }


      let notification, dataType;
      if (isCustomerStatus) {
        const msg = statusText(status);
        if (!msg) return jsonResponse({ok:false,error:`Desteklenmeyen sipariş durumu: ${status}`},400);
        notification = msg;
        dataType = 'order-status';
      } else {
        const customerName = order.isim || order.adSoyad || 'Müşteri';
        const amount = order.tutar ?? order.toplam ?? null;
        notification = {
          title:'🚨 Yeni Sipariş',
          body: amount != null ? `${customerName} adına yeni sipariş • ${amount} TL` : `${customerName} adına yeni sipariş`
        };
        dataType = 'new-order';
      }


      let success=0, errors=[];
      for (const token of tokens) {
        const response = await sendFcm(token, notification, {
          orderId:String(orderId), type:dataType, status:String(status)
        }, accessToken);
        if (response.ok) success++;
        else errors.push(await response.text());
      }


      if (success > 0) {
        await databasePut(sentPath,{sentAt:Date.now(),success,attempted:tokens.length},accessToken);
      }


      return jsonResponse({ok:success>0,success,attempted:tokens.length,errors:errors.slice(0,3)}, success>0 ? 200 : 502);
    } catch(error) {
      return jsonResponse({ok:false,error:String(error?.message||error)},500);
    }
  }
};
