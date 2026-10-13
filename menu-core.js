const DEFAULT_ROWS=[["Tanrıverdi Menüler","2'li Tanrıverdi Mega & Ayran Menü",740,780,"2 Adet Mega Tavuk Döner Dürüm veya Tavuk Döner Dürüm + 2 Adet Eker Ayran (20 cl.)","https://images.deliveryhero.io/image/global-menu-service/YS_TR/vendor/lgqf/product/b172b338-96a0-47af-8191-d24811986c3f.jpg"],["Tanrıverdi Menüler","2'li Tanrıverdi Dürüm & Ayran Menü",540,580,"2 Adet Tavuk Döner Dürüm + 2 Adet Ayran (20 cl.)","https://images.deliveryhero.io/image/global-menu-service/YS_TR/vendor/lgqf/product/31100375-7989-4478-8f7b-8f3fd3323c71.jpg"],["Tanrıverdi Menüler","2'li 3/4 Ekmek Arası Tavuk Döner & Ayran",580,620,"2 Adet 3/4 Ekmek Arası Tavuk Döner + 2 Adet Ayran (20 cl.)","https://yemeksepeti.dhmedia.io/image/global-menu-service/YS_TR/vendor/lgqf/product/5567e792-18f6-4928-8048-51b096c20c2a.jpg"],["Tavuk Dönerler","Tavuk Döner Dürüm (Odun Ateşinde)",250,270,"İsteyene klasik, isteyene Hatay usulü. Lezzetin en sıcak hali, Odun Ateşinde.","https://images.deliveryhero.io/image/fd-tr/Products/61457530.jpg"],["Tavuk Dönerler","Mega Tavuk Döner Dürüm (Odun Ateşinde)",350,370,"İsteyene klasik, isteyene Hatay usulü. Odun ateşinde.","https://images.deliveryhero.io/image/global-menu-service/YS_TR/vendor/lgqf/product/a55e4f57-0e17-4d0f-adb1-48359d8d7e4c.jpg"],["Tavuk Dönerler","3/4 Ekmek Arası Tavuk Döner",270,290,"Tavuk döner, domates, soğan, ketçap, mayonez","https://images.deliveryhero.io/image/global-menu-service/YS_TR/vendor/lgqf/product/69744654/034f409c-6af5-42b2-a0ba-cdec089d1142.jpg?width=400"],["Tavuk Dönerler","Yarım Ekmek Arası Tavuk Döner",170,190,"Tavuk döner, patates kızartması, sos, mayonez","https://images.deliveryhero.io/image/global-menu-service/YS_TR/vendor/lgqf/product/69750345/a50ba040-daa2-4a70-827a-78b5ecac0b4d.jpg?width=400"],["Tavuk Dönerler","Tam Ekmek Tavuk Döner (Odun Ateşinde)",340,360,"Tavuk döner, somun ekmek","https://images.deliveryhero.io/image/global-menu-service/YS_TR/vendor/lgqf/product/75683772/cf100e49-c69d-4193-86e7-0c65f2205f4d.jpg?width=400"],["İçecekler","Eker Ayran (20 cl.)",45,null,"Küçük boy","https://images.deliveryhero.io/image/global-menu-service/YS_TR/vendor/lgqf/product/69737671/2b35c806-a38b-47fe-83ae-20a98e0ff2de.jpg"],["İçecekler","Şalgam Suyu (30 cl.)",60,null,"Pet şişe","https://images.deliveryhero.io/image/global-menu-service/YS_TR/vendor/lgqf/product/69737687/1bf40266-41d5-46b7-9495-5cf3e2584a7e.jpg"],["İçecekler","Pepsi (33 cl.)",80,null,"Kutu içecek","https://images.deliveryhero.io/image/global-menu-service/YS_TR/vendor/lgqf/product/69737752/8e063115-eaf3-4d5e-9f21-5e9a7437658c.jpg"],["İçecekler","Su (25 cl.)",30,null,"Pet şişe","https://images.deliveryhero.io/image/global-menu-service/YS_TR/vendor/lgqf/product/69744512/ee5d0b71-63a3-4e4c-9cd9-82bb7393f7a8.jpg"],["İçecekler","Eker Ayran (30 cl.)",55,null,"Büyük boy","https://images.deliveryhero.io/image/fd-tr/products/61464542.jpg"],["İçecekler","Fruko (33 cl.)",80,null,"Kutu içecek","https://images.deliveryhero.io/image/fd-tr/products/68486034.jpg"],["İçecekler","Yedigün (33 cl.)",80,null,"Kutu içecek","https://images.deliveryhero.io/image/fd-tr/products/68487633.jpg"]];

export const clone=value=>JSON.parse(JSON.stringify(value));
export const money=value=>Number(value).toLocaleString('tr-TR',{maximumFractionDigits:2})+' TL';
export const uid=prefix=>prefix+'-'+crypto.randomUUID().slice(0,8);
export const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function imageUrl(value){
 const text=String(value||'').trim();if(!text)return '';
 if(/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(text)&&text.length<450000)return text;
 try{const url=new URL(text);if(url.protocol==='https:'&&!url.username&&!url.password)return url.href;}catch{}
 throw Error('Fotoğraf için HTTPS bağlantısı veya yüklenen bir görsel kullanın.');
}
const choice=(id,label,selected=false)=>({id,label,price:0,selected});
export function preset(kind){
 if(kind==='durum')return [
 {id:'style',title:'Hazırlanış Usulü',min:1,max:1,choices:[choice('hatay','Hatay Usulü',true),choice('klasik','Klasik Usul')]},
 {id:'sauce',title:'Sos Seçimi',min:1,max:1,condition:{group:'style',choice:'hatay'},choices:[choice('hatay-sauce','Hatay Usulü Sos, Mayonez ve Patates',true)]},
 {id:'ingredients',title:'Malzeme Seçimi',min:1,max:4,condition:{group:'style',choice:'klasik'},choices:['Domates','Soğan','Mayonez','Ketçap'].map((x,i)=>choice('ingredient-'+i,x))}
 ];
 if(kind==='bread')return [{id:'ingredients',title:'Malzeme Seçimi',min:0,max:4,choices:['Domates','Soğan','Mayonez','Ketçap'].map((x,i)=>choice('ingredient-'+i,x,true))}];
 return [];
}
export const defaults=DEFAULT_ROWS.map((p,id)=>({id,category:p[0],name:p[1],price:p[2],oldPrice:p[3],description:p[4],image:p[5],available:true,deleted:false,groups:preset(id===0||id===1||id===3||id===4?'durum':id===2||id===5||id===6||id===7?'bread':'none')}));
export function mergeRecords(data){
 const all=new Map(defaults.map(p=>[p.id,clone(p)]));
 Object.entries(data||{}).forEach(([key,value])=>{if(value&&Number.isSafeInteger(Number(key))&&Number(key)>=0)all.set(Number(key),{...clone(all.get(Number(key))||{}),...clone(value),id:Number(key),groups:clone(value.groups||[])});});
 return [...all.values()].sort((a,b)=>a.id-b.id);
}
export function validateProduct(input){
 const p=clone(input);p.name=String(p.name||'').trim();p.category=String(p.category||'').trim();p.description=String(p.description||'').trim();
 if(!p.name||p.name.length>140||/[<>]/.test(p.name))throw Error('Ürün adı 1–140 karakter olmalı; < ve > içermemeli.');
 if(!p.category||p.category.length>80||/[<>]/.test(p.category))throw Error('Kategori adı 1–80 karakter olmalı.');
 if(p.description.length>1500||/[<>]/.test(p.description))throw Error('Açıklama en fazla 1500 karakter olmalı; < ve > içermemeli.');
 p.price=Number(p.price);if(!Number.isFinite(p.price)||p.price<0||p.price>100000)throw Error('Geçerli bir ürün fiyatı girin.');p.price=Math.round(p.price*100)/100;
 p.oldPrice=p.oldPrice===''||p.oldPrice==null?null:Number(p.oldPrice);if(p.oldPrice!==null&&(!Number.isFinite(p.oldPrice)||p.oldPrice<p.price))throw Error('Üzeri çizili fiyat satış fiyatından düşük olamaz.');
 p.image=imageUrl(p.image);p.available=p.available!==false;p.deleted=!!p.deleted;p.groups=p.groups||[];
 if(p.groups.length>12)throw Error('En fazla 12 opsiyon grubu ekleyebilirsiniz.');
 const known=new Map();
 for(const g of p.groups){
  g.title=String(g.title||'').trim();if(!g.title||g.title.length>100||/[<>]/.test(g.title))throw Error('Her opsiyon grubuna geçerli bir ad verin.');
  if(!g.id||known.has(g.id))throw Error('Opsiyon grubu kimlikleri benzersiz olmalı.');
  g.choices=g.choices||[];if(!g.choices.length||g.choices.length>30)throw Error(g.title+': 1–30 seçenek olmalı.');
  g.min=Number(g.min);g.max=Number(g.max);if(!Number.isInteger(g.min)||!Number.isInteger(g.max)||g.min<0||g.max<1||g.min>g.max||g.max>g.choices.length)throw Error(g.title+': seçim sınırları seçenek sayısına uygun olmalı.');
  const ids=new Set();for(const c of g.choices){c.label=String(c.label||'').trim();c.price=Number(c.price||0);c.selected=!!c.selected;if(!c.id||ids.has(c.id)||!c.label||c.label.length>160||/[<>]/.test(c.label)||!Number.isFinite(c.price)||c.price<0||c.price>100000)throw Error(g.title+': seçenek adını ve ek ücretini kontrol edin.');c.price=Math.round(c.price*100)/100;ids.add(c.id);}
  if(g.choices.filter(c=>c.selected).length>g.max)throw Error(g.title+': varsayılan seçim sayısı üst sınırı aşıyor.');
  if(g.condition){const parent=known.get(g.condition.group);if(!parent||!parent.choices.some(c=>c.id===g.condition.choice))throw Error(g.title+': gösterim koşulu önceki bir gruptaki seçeneğe bağlı olmalı.');}else delete g.condition;
  known.set(g.id,g);
 }
 return p;
}
export function visibleGroups(groups,selection){
 const active=[];const ids=new Set();for(const g of groups){if(!g.condition||(ids.has(g.condition.group)&&(selection[g.condition.group]||[]).includes(g.condition.choice))){active.push(g);ids.add(g.id);}}return active;
}
export function calculateOptions(product,selection){
 let extra=0;const options=[];for(const g of visibleGroups(product.groups||[],selection)){const ids=selection[g.id]||[];const picked=g.choices.filter(c=>ids.includes(c.id));if(picked.length<g.min||picked.length>g.max)throw Error(g.title+': '+g.min+'–'+g.max+' seçim yapın.');for(const c of picked){extra+=c.price;options.push(c.label+(c.price?' (+'+money(c.price)+')':''));}}return {extra:Math.round(extra*100)/100,options};
}
export async function connect(){
 const [{initializeApp,getApps},{getDatabase,ref,onValue,set,runTransaction}]=await Promise.all([import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js')]);
 const config={apiKey:'AIzaSyBTZSr1gHqeaQXTq1nQ57fY4TXLbAjpmgo',authDomain:'tanriverdidoner-a2641.firebaseapp.com',databaseURL:'https://tanriverdidoner-a2641-default-rtdb.europe-west1.firebasedatabase.app',projectId:'tanriverdidoner-a2641',messagingSenderId:'264603345757',appId:'1:264603345757:web:5317d03dccdf54cb043eb4'};
 const app=getApps().find(a=>a.name==='menu-management')||initializeApp(config,'menu-management'),db=getDatabase(app);
 return {listen:(ok,fail)=>onValue(ref(db,'menuYonetimi/urunler'),s=>ok(mergeRecords(s.val())),fail),save:p=>set(ref(db,'menuYonetimi/urunler/'+p.id),p),nextId:async()=>{const result=await runTransaction(ref(db,'menuYonetimi/sonUrunId'),v=>Math.max(14,Number(v)||14)+1);if(!result.committed)throw Error('Ürün numarası alınamadı.');return result.snapshot.val();}};
}
