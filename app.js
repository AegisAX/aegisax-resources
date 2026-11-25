(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const header = $('.design-header');
  if (header) {
    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty('--design-header-height', header.offsetHeight + 'px');
    };
    syncHeaderHeight();
    new ResizeObserver(syncHeaderHeight).observe(header);
  }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = (name, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const useLabels = {all:'모든 용도',website:'홈페이지 제작',presentation:'PPT·프레젠테이션',education:'교육·보고서',content:'SNS·콘텐츠',ui:'웹·앱 UI',network:'네트워크 구성도',cloud:'클라우드 설계'};
  const useIcons = {all:'grid',website:'monitor',presentation:'presentation',education:'book',content:'layers',ui:'code',network:'network',cloud:'cloud'};
  const typeLabels = {all:'전체 자료',icon:'아이콘',photo:'사진',illustration:'일러스트',background:'배경·패턴','3d':'3D 이미지'};
  const typeIcons = {all:'grid',icon:'spark',photo:'image',illustration:'pen',background:'layers','3d':'cube'};
  const styleLabels = {line:'선형',filled:'채움형',color:'컬러',duotone:'듀오톤',photo:'사진',handdrawn:'손그림','3d':'3D',abstract:'추상·패턴'};
  const scopeLabels = {free:'무료 세트·갤러리',mixed:'무료·유료 혼합','per-item':'항목별 조건'};
  const brand = {tabler:['T','#e9f1fd','#3977c5'],svgrepo:['S','#e6f5ed','#248860'],lucide:['L','#fff0e9','#c76d49'],material:['M','#edf0fa','#5972b7'],cisco:['network','#e9f4fa','#4188b5'],azure:['cloud','#e7f3fc','#337fc5'],aws:['aws','#fff4e4','#b27a27'],flaticon:['F','#e8f5ed','#439969'],icons8:['i8','#eff1fc','#7472b8'],pexels:['P','#e0f3ea','#168365'],unsplash:['U','#eef0f0','#263a36'],undraw:['uD','#ece8fc','#6e5ab1'],manypixels:['M','#e7f4fc','#307ea3'],haikei:['H','#eeeafb','#7260ae'],'3dicons':['3D','#fbeee5','#a06934'],pixabay:['px','#edf2ec','#4c6e49'],heroicons:['H','#e8f1fc','#487ab8'],phosphor:['P','#e8f5d6','#54892d'],drawkit:['D','#f8e7ef','#ac5b81'],heropatterns:['HP','#e8eefb','#5978ae'],fluentemoji:['F','#fff2d8','#a47d2e'],bootstrap:['B','#efe6fc','#825cae'],opendoodles:['OD','#fbe8e5','#b87368'],openpeeps:['OP','#f1f2ef','#61715d'],storyset:['S','#e6f1fc','#4b7da8']};
  const state = {data:[],search:'',use:'all',type:'all',style:'',format:'',bulk:'',license:'',scope:'',view:'grid',favoritesOnly:false,recommendedOnly:false,compared:new Set(),favorites:new Set()};
  let toastTimer;
  try {const saved=JSON.parse(localStorage.getItem('aegisax-icon-favorites') || '[]'); if(Array.isArray(saved)) state.favorites=new Set(saved.filter(x=>typeof x==='string'));} catch {}
  function notify(message){const el=$('#toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true;},2800);}
  function saveFavorites(){try{localStorage.setItem('aegisax-icon-favorites',JSON.stringify([...state.favorites]));}catch{notify('이 브라우저에서는 즐겨찾기를 영구 저장할 수 없습니다.');}}
  function sourceMark(r){const b=brand[r.id] || [r.name[0],'#e7f3eb','#377453'];return `<span class="source-mark" style="--brand-bg:${b[1]};--brand-color:${b[2]}" aria-hidden="true">${['network','cloud'].includes(b[0])?icon(b[0]):esc(b[0])}</span>`;}
  function formats(r){const arr=[...r.formats];if(r.id==='cisco')arr.unshift('PowerPoint');return arr.join(' · ');}
  function styles(r){return r.styles.map(s=>styleLabels[s] || s).join(' · ');}
  function types(r){return r.assetTypes.map(t=>typeLabels[t] || t).join(' · ');}
  function safeUrl(url){try{const u=new URL(url);return u.protocol==='https:'?u.href:'#';}catch{return '#';}}
  function link(url,label,cls=''){return `<a href="${esc(safeUrl(url))}" class="${cls}" target="_blank" rel="noopener noreferrer">${label}</a>`;}
  function favoriteButton(r){const saved=state.favorites.has(r.id);return `<button class="icon-button save-button ${saved?'active':''}" data-favorite="${r.id}" aria-pressed="${saved}" aria-label="${esc(r.name)} 즐겨찾기 ${saved?'해제':'추가'}" title="즐겨찾기 ${saved?'해제':'추가'}">${icon('bookmark')}</button>`;}
  function compareButton(r){return `<button class="compare-check" data-compare="${r.id}" aria-pressed="${state.compared.has(r.id)}" aria-label="${esc(r.name)} 비교 선택"><span class="compare-box">${icon('check')}</span>비교 담기</button>`;}
  function licensePill(r){return `<span class="license-pill ${r.licenseGroup}">${esc(r.licenseLabel)}</span>`;}
  function scopePill(r){return `<span class="scope-badge ${r.freeScope}">${esc(scopeLabels[r.freeScope])}</span>`;}
  function filtered(){
    const terms=state.search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return state.data.filter(r=>{
      const hay=[r.name,r.subtitle,r.description,r.keywords,r.formatNote,r.licenseLabel,formats(r),types(r),r.uses.map(u=>useLabels[u]).join(' ')].join(' ').toLocaleLowerCase();
      return terms.every(t=>hay.includes(t))
        && (state.use==='all'||r.uses.includes(state.use))
        && (state.type==='all'||r.assetTypes.includes(state.type))
        && (!state.style||r.styles.includes(state.style))
        && (!state.format||(state.format==='PowerPoint'?r.id==='cisco'||r.formats.includes('PPTX'):r.formats.includes(state.format)))
        && (!state.bulk||(state.bulk==='yes')===r.bulk)
        && (!state.license||state.license===r.licenseGroup)
        && (!state.scope||state.scope===r.freeScope)
        && (!state.favoritesOnly||state.favorites.has(r.id))
        && (!state.recommendedOnly||r.recommended);
    });
  }
  function renderFilters(){
    $('#useFilters').innerHTML=Object.entries(useLabels).map(([key,label])=>`<button class="use-button ${state.use===key?'active':''}" data-use="${key}" aria-pressed="${state.use===key}">${icon(useIcons[key])}<span>${label}</span><span class="count">${key==='all'?state.data.length:state.data.filter(r=>r.uses.includes(key)).length}</span></button>`).join('');
    $('#assetFilters').innerHTML=Object.entries(typeLabels).map(([key,label])=>`<button class="asset-filter ${state.type===key?'active':''}" data-type="${key}" aria-pressed="${state.type===key}">${icon(typeIcons[key])}<span>${label}</span><b>${key==='all'?state.data.length:state.data.filter(r=>r.assetTypes.includes(key)).length}</b></button>`).join('');
  }
  function card(r){return `<article class="resource-card" data-resource="${r.id}"><div class="card-body"><div class="card-top">${sourceMark(r)}${r.recommended?'<span class="recommend-badge">추천</span>':''}${favoriteButton(r)}</div><div class="resource-category">${r.assetTypes.map(t=>`<span>${icon(typeIcons[t])}${esc(typeLabels[t])}</span>`).join('')}</div><h3 class="card-title">${link(r.primaryUrl,esc(r.name))}</h3><p class="card-subtitle">${esc(r.subtitle)}</p><p class="card-description">${esc(r.description)}</p><div class="card-styles">${scopePill(r)}${r.styles.map(s=>`<span class="style-tag">${esc(styleLabels[s]||s)}</span>`).join('')}</div><div class="card-data"><div class="card-data-row"><span class="data-label">형식</span><span class="data-value">${esc(formats(r))}</span></div><div class="card-data-row"><span class="data-label">모음</span><span class="data-value bulk-text">${r.bulk?icon('check'):''}${esc(r.bulkLabel)}</span></div><div class="card-data-row"><span class="data-label">조건</span><span class="data-value">${licensePill(r)}</span></div><div class="card-data-row"><span class="data-label">출처</span><span class="data-value credit-value">${esc(r.creditSummary)}</span></div></div></div><div class="card-actions">${link(r.downloadUrl,icon('download')+'공식 자료 받기','download-button')}<div class="card-secondary">${compareButton(r)}<button class="details-button" data-detail="${r.id}">이용 조건</button></div></div></article>`;}
  function table(rows){return `<p class="table-hint">가로로 스크롤하면 모든 항목을 볼 수 있습니다.</p><div class="resource-table-wrap"><table class="resource-table"><caption class="sr-only">디자인 자료 사이트별 유형, 용도, 무료 형식, 일괄 다운로드와 라이선스 비교</caption><thead><tr><th scope="col">사이트</th><th scope="col">유형·무료 범위</th><th scope="col">추천 용도</th><th scope="col">스타일</th><th scope="col">무료 형식</th><th scope="col">일괄 다운로드</th><th scope="col">라이선스</th><th scope="col">공식 링크</th></tr></thead><tbody>${rows.map(r=>`<tr><td><span class="table-name">${esc(r.name)}</span><span class="table-secondary">${esc(r.subtitle)}</span><div class="table-fav">${favoriteButton(r)}${compareButton(r)}</div></td><td class="table-type">${esc(types(r))}<div>${scopePill(r)}</div></td><td>${r.uses.map(u=>esc(useLabels[u])).join('<br>')}</td><td>${esc(styles(r))}</td><td class="table-format">${esc(formats(r))}<p class="table-secondary">${esc(r.formatNote)}</p></td><td>${esc(r.bulkLabel)}</td><td class="table-license">${licensePill(r)}<p>${esc(r.creditSummary)}</p></td><td class="table-download">${link(r.downloadUrl,'공식 자료 받기','download-button')}<button class="details-button" data-detail="${r.id}">이용 조건</button></td></tr>`).join('')}</tbody></table></div>`;}
  function render(){
    const rows=filtered();renderFilters();$('#favoriteCount').textContent=state.favorites.size;$('#clearSearch').hidden=!state.search;
    let title=state.type==='all'?'모든 디자인 자료':typeLabels[state.type]+' 자료';
    if(state.use!=='all')title=useLabels[state.use]+' · '+title;
    if(state.recommendedOnly)title='추천 디자인 자료';
    if(state.favoritesOnly)title='내 즐겨찾기';
    $('#resource-title').innerHTML=`${esc(title)} <span id="resultCount">${rows.length}</span>`;
    const active=Boolean(state.search||state.use!=='all'||state.type!=='all'||state.style||state.format||state.bulk||state.license||state.scope||state.favoritesOnly||state.recommendedOnly);
    $('#resultsDescription').textContent=active?`${state.data.length}개 중 ${rows.length}개 사이트가 조건에 맞습니다.`:'무료 제공 범위와 출처 표기 조건을 함께 확인하세요.';
    const list=$('#resourceList');list.className=state.view==='grid'?'resource-grid':'table-container';list.innerHTML=rows.length?(state.view==='grid'?rows.map(card).join(''):table(rows)):'';list.hidden=!rows.length;$('#emptyState').hidden=!!rows.length;
    if(!rows.length){$('#emptyState h3').textContent=state.favoritesOnly&&!state.favorites.size?'아직 저장한 사이트가 없습니다.':'조건에 맞는 사이트가 없습니다.';$('#emptyState p').textContent=state.favoritesOnly&&!state.favorites.size?'사이트 카드의 책갈피 버튼으로 즐겨찾기를 추가하세요.':'검색어를 바꾸거나 필터를 초기화해 보세요.';}
    $$('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===state.view);b.setAttribute('aria-pressed',String(b.dataset.view===state.view));});
    $$('[data-nav]').forEach(b=>b.classList.toggle('active',state.favoritesOnly?b.dataset.nav==='favorites':b.dataset.nav===(state.view==='table'?'table':'browse')));
    $$('[data-quick]').forEach(b=>{const active=b.dataset.quick==='svg'?state.format==='SVG':b.dataset.quick==='bulk'?state.bulk==='yes':state.type==='photo';b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    $('#recommendedButton').textContent=state.recommendedOnly?'전체 사이트 모아보기':'추천 사이트 모아보기';renderDock();
  }
  function renderDock(){const rows=state.data.filter(r=>state.compared.has(r.id));$('#compareDock').hidden=!rows.length;$('#compareCount').textContent=rows.length;$('#openCompare').disabled=rows.length<2;$('#openCompare').textContent=rows.length<2?'2개부터 비교':'비교하기';$('#compareSelection').innerHTML=rows.map(r=>`<span class="selected-chip"><span>${esc(r.name)}</span><button data-remove-compare="${r.id}" aria-label="${esc(r.name)} 비교에서 제외">${icon('close')}</button></span>`).join('');}
  function syncFilters(){$('#search').value=state.search;$('#styleFilter').value=state.style;$('#formatFilter').value=state.format;$('#bulkFilter').value=state.bulk;$('#licenseFilter').value=state.license;$('#scopeFilter').value=state.scope;}
  function reset(){Object.assign(state,{search:'',use:'all',type:'all',style:'',format:'',bulk:'',license:'',scope:'',favoritesOnly:false,recommendedOnly:false});syncFilters();render();}
  function openDetail(id){
    const r=state.data.find(x=>x.id===id);if(!r)return;
    $('#detailContent').innerHTML=`<div class="detail-heading">${sourceMark(r)}<div><h2>${esc(r.name)}</h2><p>${esc(types(r))} · ${esc(r.subtitle)}</p></div></div><p class="detail-description">${esc(r.description)}</p><div class="detail-block"><h3>${icon('download')}무료 다운로드 ${scopePill(r)}</h3><p>${esc(r.formatNote)}</p><span class="detail-label">일괄 다운로드</span><p>${esc(r.bulkLabel)}</p></div><div class="detail-block"><h3>${icon('shield')}${esc(r.licenseLabel)}</h3><p>${esc(r.licenseSummary)}</p><span class="detail-label">출처·고지 조건</span><p>${esc(r.creditSummary)}</p><span class="detail-label">상업적 이용</span><p>${esc(r.commercialSummary)}</p></div><div class="detail-sources"><h3>공식 확인 자료</h3><div class="source-links">${r.sources.map(s=>link(s.url,esc(s.label))).join('')}</div></div><div class="detail-bottom">${link(r.downloadUrl,icon('download')+esc(r.downloadLabel),'primary-button')}${link(r.licenseUrl,'공식 이용 조건','outline-button')}</div><p class="small-note">확인일 ${esc(r.sourceDate||'2026-11-24')} · 다운로드할 때 해당 자료의 최신 라이선스를 확인하세요.</p>`;
    $('#detailDialog').showModal();
  }
  function openComparison(){
    const rows=state.data.filter(r=>state.compared.has(r.id));if(rows.length<2)return;
    const definitions=[['자료 유형',r=>esc(types(r))],['무료 범위',r=>scopePill(r)],['추천 용도',r=>r.uses.map(u=>esc(useLabels[u])).join('<br>')],['디자인 스타일',r=>esc(styles(r))],['무료 형식',r=>`<b>${esc(formats(r))}</b><p class="minor">${esc(r.formatNote)}</p>`],['일괄 다운로드',r=>esc(r.bulkLabel)],['라이선스',r=>`${licensePill(r)}<p class="minor">${esc(r.licenseSummary)}</p>`],['출처·고지',r=>esc(r.creditSummary)],['상업적 이용',r=>esc(r.commercialSummary)],['공식 이용 조건',r=>link(r.licenseUrl,'공식 원문 확인','text-button')]];
    $('#compareContent').innerHTML=`<div class="comparison-scroll"><table class="comparison"><caption class="sr-only">선택한 사이트의 자료 유형, 무료 다운로드와 라이선스 비교</caption><thead><tr><th scope="col">비교 항목</th>${rows.map(r=>`<th scope="col">${sourceMark(r)}${esc(r.name)}${link(r.downloadUrl,'공식 자료 받기','download-button')}</th>`).join('')}</tr></thead><tbody>${definitions.map(([label,fn])=>`<tr><th scope="row">${label}</th>${rows.map(r=>`<td>${fn(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="small-note">확인일 2026.11.24 · 작은 화면에서는 표를 좌우로 움직여 비교할 수 있습니다.</p>`;
    $('#compareDialog').showModal();
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.use){state.use=b.dataset.use;state.recommendedOnly=false;render();}
    else if(b.dataset.type){state.type=b.dataset.type;state.recommendedOnly=false;render();}
    else if(b.dataset.favorite){const id=b.dataset.favorite;state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);saveFavorites();render();}
    else if(b.dataset.compare){const id=b.dataset.compare;if(state.compared.has(id))state.compared.delete(id);else if(state.compared.size<3)state.compared.add(id);else{notify('최대 3개까지 비교할 수 있습니다. 선택한 사이트를 하나 제외해 주세요.');return;}render();}
    else if(b.dataset.removeCompare){state.compared.delete(b.dataset.removeCompare);render();}
    else if(b.dataset.detail){openDetail(b.dataset.detail);}
    else if(b.dataset.close){$('#'+b.dataset.close).close();}
    else if(b.dataset.view){state.view=b.dataset.view;render();}
    else if(b.dataset.nav){const nav=b.dataset.nav;state.favoritesOnly=nav==='favorites';state.recommendedOnly=false;if(nav==='table')state.view='table';if(nav==='browse')state.view='grid';render();$('#resources').scrollIntoView({behavior:'smooth',block:'start'});}
    else if(b.dataset.quick){const q=b.dataset.quick;if(q==='svg')state.format=state.format==='SVG'?'':'SVG';if(q==='bulk')state.bulk=state.bulk==='yes'?'':'yes';if(q==='photo')state.type=state.type==='photo'?'all':'photo';syncFilters();render();}
  });
  $('#search').addEventListener('input',e=>{state.search=e.target.value;render();});
  $('#clearSearch').addEventListener('click',()=>{state.search='';syncFilters();render();$('#search').focus();});
  for(const [id,key] of Object.entries({styleFilter:'style',formatFilter:'format',bulkFilter:'bulk',licenseFilter:'license',scopeFilter:'scope'}))$('#'+id).addEventListener('change',e=>{state[key]=e.target.value;render();});
  $('#resetFilters').addEventListener('click',reset);$('#emptyReset').addEventListener('click',reset);
  $('#recommendedButton').addEventListener('click',()=>{const next=!state.recommendedOnly;reset();state.recommendedOnly=next;render();});
  $('#clearCompare').addEventListener('click',()=>{state.compared.clear();render();});$('#openCompare').addEventListener('click',openComparison);
  $('#licenseGuide').addEventListener('click',()=>$('#guideDialog').showModal());
  $('#bulkGuide').addEventListener('click',()=>{reset();state.bulk='yes';syncFilters();render();$('#resources').scrollIntoView({behavior:'smooth'});});
  $$('.brand').forEach(a=>a.addEventListener('click',()=>{reset();state.view='grid';render();}));
  $$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const rect=d.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)d.close();}}));
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!$('dialog[open]')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('#search').focus();}});
  fetch('./resources.json').then(r=>{if(!r.ok)throw new Error('Resources unavailable');return r.json();}).then(data=>{
    if(!Array.isArray(data))throw new Error('Invalid resource data');state.data=data;
    const ids=new Set(data.map(r=>r.id));state.favorites=new Set([...state.favorites].filter(id=>ids.has(id)));
    $('#totalCount').textContent=data.length;render();
  }).catch(()=>{$('#resourceList').innerHTML='<div class="loading">목록을 불러오지 못했습니다. 페이지를 새로고침해 주세요.</div>';$('#resultsDescription').textContent='자료를 불러오는 중 문제가 발생했습니다.';});
})();
