import {clone,defaults,mergeRecords,money,escape as esc,visibleGroups,calculateOptions,connect} from './menu-core.js?v=2';
const host=window.tanriverdiMenuHost;
let records=new Map(defaults.map(p=>[p.id,clone(p)])),selection={},current=null,ready=false;
if(host)boot();
async function boot(){
 window.add=openProduct;window.confirmProduct=confirmProduct;
 renderMenu();
 try{const api=await connect();api.listen(items=>{records=new Map(items.map(p=>[p.id,p]));ready=true;applyProducts();renderMenu();},()=>showError());}catch{showError();}
}
function showError(){const notice=document.createElement('p');notice.setAttribute('role','status');notice.textContent='Güncel menüye bağlanılamadı. İnternet bağlantısını kontrol edip sayfayı yenileyin.';notice.style.cssText='padding:14px;background:#fff3df;border-radius:10px;color:#825308';document.getElementById('menu').prepend(notice);}
function applyProducts(){
 for(const p of records.values())host.products[p.id]=[p.category,p.name,p.price,p.oldPrice,p.description,p.image];
 let removed=false;for(let i=host.cart.length-1;i>=0;i--){const p=records.get(host.cart[i].i);if(!p||p.deleted||!p.available){host.cart.splice(i,1);removed=true;}}
 if(removed){let notice=document.getElementById('menu-change-notice');if(!notice){notice=document.createElement('div');notice.id='menu-change-notice';notice.setAttribute('role','status');document.getElementById('menu').before(notice);}notice.textContent='Satışa kapanan ürün sepetten çıkarıldı.';}
 host.update();
}
function renderMenu(){
 const menu=document.getElementById('menu');menu.replaceChildren();const available=[...records.values()].filter(p=>!p.deleted&&p.available);
 const groups=[...new Set(available.map(p=>p.category))];for(const category of groups){const section=document.createElement('section');const heading=document.createElement('h2');heading.textContent=category;const grid=document.createElement('div');grid.className='grid';section.append(heading,grid);
  available.filter(p=>p.category===category).forEach(p=>{const card=document.createElement('div');card.className='card';if(p.image){const img=document.createElement('img');img.className='product-photo';img.src=p.image;img.alt=p.name;img.loading='lazy';img.onerror=()=>img.remove();card.append(img);}const name=document.createElement('h3');name.textContent=p.name;const price=document.createElement('div');price.className='price';price.textContent=money(p.price);if(p.oldPrice){const old=document.createElement('span');old.className='old-price';old.textContent=money(p.oldPrice);price.append(old);}const description=document.createElement('div');description.className='desc';description.textContent=p.description;const add=document.createElement('button');add.className='add';add.textContent='+';add.disabled=!ready;add.setAttribute('aria-label',p.name+' ekle');add.onclick=()=>openProduct(p.id);card.append(name,price,description,add);grid.append(card);});menu.append(section);
 }
 if(!available.length){const p=document.createElement('p');p.textContent='Şu anda satışa açık ürün bulunmuyor.';menu.append(p);}
}
function notifyOptionError(text){let error=document.getElementById('menu-selection-error');if(!error){error=document.createElement('div');error.id='menu-selection-error';error.setAttribute('role','alert');error.style.cssText='padding:12px;margin:10px 0;background:#fff0ef;color:#b62725;border-radius:8px';document.getElementById('customization').append(error);}error.textContent=text;}
function openProduct(id){
 const p=records.get(id);if(!ready||!p||p.deleted||!p.available)return;
 if(p.category==='İçecekler'&&!(p.groups||[]).length){host.addSimple(id);return;}
 current=clone(p);selection={};for(const g of current.groups||[])selection[g.id]=g.choices.filter(c=>c.selected).map(c=>c.id);
 host.setSelected(id);document.getElementById('modalTitle').textContent=p.name;document.getElementById('modalDesc').textContent=p.description;const image=document.getElementById('modalImage');image.replaceChildren();if(p.image){const img=document.createElement('img');img.src=p.image;img.alt=p.name;img.onerror=()=>img.remove();image.append(img);}
 renderOptions();document.getElementById('modal').classList.add('show');
}
function renderOptions(){
 const box=document.getElementById('customization');const previousNote=box.querySelector('#itemNote')?.value||'';box.replaceChildren();
 for(const g of visibleGroups(current.groups||[],selection)){
  const section=document.createElement('div');section.className='option-section'+(g.min?' required-section':'');section.innerHTML='<div class="section-head"><div><strong>'+esc(g.title)+'</strong><small>'+ (g.min===g.max?g.min+' seçim':g.min+'–'+g.max+' seçim')+'</small></div><span class="'+(g.min?'badge':'optional-badge')+'">'+(g.min?'Zorunlu':'İsteğe bağlı')+'</span></div>';
  for(const c of g.choices){const row=document.createElement('label');row.className='choice-row';const label=document.createElement('span');label.textContent=c.label;const price=document.createElement('span');price.className='choice-price';price.textContent=c.price?'+'+money(c.price):'Ücretsiz';const input=document.createElement('input');input.type=g.max===1&&g.min>0?'radio':'checkbox';input.name='menu-option-'+g.id;input.value=c.id;input.checked=(selection[g.id]||[]).includes(c.id);input.onchange=()=>{
   const picked=selection[g.id]||[];if(g.max===1){selection[g.id]=input.checked?[c.id]:[];}else if(input.checked){if(picked.length>=g.max){input.checked=false;notifyOptionError(g.title+': en fazla '+g.max+' seçim yapabilirsiniz.');return;}selection[g.id]=[...picked,c.id];}else{selection[g.id]=picked.filter(id=>id!==c.id);}renderOptions();
  };row.append(label,price,input);section.append(row);}box.append(section);
 }
 const note=document.createElement('div');note.innerHTML=host.noteHtml();box.append(note);box.querySelector('#itemNote').value=previousNote;
 const total=document.createElement('div');total.id='menu-option-total';let extra=0;for(const g of visibleGroups(current.groups||[],selection))for(const c of g.choices)if((selection[g.id]||[]).includes(c.id))extra+=c.price;total.style.cssText='font-weight:800;padding:12px 0;text-align:right';total.textContent='Ürün toplamı: '+money(current.price+extra);box.append(total);
}
function confirmProduct(){
 if(!current)return;const live=records.get(current.id);if(!live||live.deleted||!live.available){notifyOptionError('Bu ürün şu anda satışa kapalı.');host.closeModal();return;}
 if(live.updatedAt!==current.updatedAt){notifyOptionError('Ürün güncellendi. Lütfen seçenekleri yeniden kontrol edin.');openProduct(current.id);return;}
 try{const chosen=calculateOptions(current,selection);const note=document.getElementById('itemNote')?.value.trim();if(note)chosen.options.push('Not: '+note);host.cart.push({i:current.id,qty:1,options:chosen.options,extra:chosen.extra});host.closeModal();host.update();current=null;}catch(error){notifyOptionError(error.message);}
}
