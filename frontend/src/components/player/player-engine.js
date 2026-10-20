export function mountPlayer(host,{media,onClose,onMissingSource}){
  const icons={
    play:'<path d="m9 5 11 7-11 7Z" fill="currentColor"/>',
    pause:'<path d="M8 5v14M16 5v14"/>',
    back:'<path d="M4 9a8 8 0 1 1 0 7M4 4v5h5"/><text x="12" y="16" text-anchor="middle" font-size="7" fill="currentColor" stroke="none">15</text>',
    forward:'<path d="M20 9a8 8 0 1 0 0 7M20 4v5h-5"/><text x="12" y="16" text-anchor="middle" font-size="7" fill="currentColor" stroke="none">15</text>',
    volume:'<path d="M11 5 6 9H3v6h3l5 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
    captions:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h3M7 14h3M14 10h3M14 14h3"/>',
    episodes:'<rect x="3" y="7" width="15" height="13" rx="1"/><path d="M7 3h14v13M7 11h7M7 15h7"/>',
    next:'<path d="m5 5 10 7-10 7ZM19 5v14"/>',
    settings:'<path d="M4 7h16M4 17h16M8 4v6M16 14v6"/>',
    full:'<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5"/>',
    mini:'<rect x="3" y="4" width="18" height="16" rx="1"/><rect x="12" y="11" width="7" height="6" fill="currentColor"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>'
  };
  const svg=name=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>';
  const button=(name,label)=>'<button type="button" data-act="'+name+'" aria-label="'+label+'" title="'+label+'">'+svg(name==='closepanel'?'close':name)+'</button>';
  const format=value=>{
    const s=Math.max(0,Math.floor(Number.isFinite(value)?value:0));
    return(s>=3600?Math.floor(s/3600)+':':'')+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
  };
  const trailer=media.type==='trailer';
  const shell=document.createElement(trailer?'dialog':'section');
  shell.className='cap '+(trailer?'cap-modal':'cap-watch');
  shell.tabIndex=0;
  shell.setAttribute('aria-label','Player de '+media.title);
  shell.innerHTML=`
  <div class="cap-case">
    <header class="cap-head">
      <div class="cap-brand"><span class="cap-star">✦</span><b>CINEASTRA</b><i></i><span data-label></span></div>
      <div class="cap-actions">${button('mini','Minimizar player')}${button('full','Tela cheia')}${button('close','Fechar player')}</div>
    </header>
    <div class="cap-stage">
      <div class="cap-media"></div><div class="cap-shade"></div>
      <div class="cap-intro"><span class="cap-tag"></span><h2></h2><p></p><div class="cap-meta"></div></div>
      <button type="button" class="cap-play" aria-label="Reproduzir">${svg('play')}<span>ASSISTIR</span></button>
      <div class="cap-status" role="status"></div>
      <div class="cap-console">
        <div class="cap-now"></div>
        <div class="cap-seek">
          <div class="cap-thumb"><img alt="Prévia da cena"><span></span></div>
          <input type="range" min="0" max="1" value="0" step=".1" aria-label="Posição do vídeo">
        </div>
        <div class="cap-row">
          <div class="cap-left">
            ${button('back','Voltar 15 segundos')}${button('play','Reproduzir ou pausar')}${button('forward','Avançar 15 segundos')}
            <div class="cap-volume">${button('volume','Ativar ou silenciar som')}<input aria-label="Volume" type="range" min="0" max="1" value=".8" step=".01"></div>
            <span class="cap-time">00:00 <i>/ 00:00</i></span>
          </div>
          <div class="cap-right">
            ${button('captions','Legendas')}
            ${media.type==='series'?button('episodes','Temporadas e episódios')+button('next','Próximo episódio'):''}
            ${button('settings','Configurações')}${button('full','Tela cheia')}
          </div>
        </div>
      </div>
    </div>
    <footer class="cap-foot"><span class="cap-foot-title"></span><span>CINEASTRA / <b data-foot-type></b></span></footer>
    <dialog class="cap-panel">
      <div class="cap-panel-head"><div><small>CINEASTRA STREAM</small><h3></h3></div>${button('closepanel','Fechar painel')}</div>
      <div class="cap-panel-body"></div>
    </dialog>
  </div>`;
  host.replaceChildren(shell);
  const $=selector=>shell.querySelector(selector);
  const video=document.createElement('video');
  video.playsInline=true;video.preload='metadata';video.volume=.8;
  if(media.crossOrigin)video.crossOrigin=media.crossOrigin;
  $('.cap-media').append(video);
  const panel=$('.cap-panel'),seek=$('.cap-seek input'),status=$('.cap-status');
  let iframe=null,active=0,started=false,mini=false,dead=false,timer=null,source=null;
  const episodes=media.type==='series'
    ?(media.seasons||[]).flatMap(s=>s.episodes.map((ep,i)=>({...ep,seasonId:s.id,seasonTitle:s.title,number:i+1})))
    :[];
  const listeners=[];
  const listen=(el,event,fn)=>{
    el.addEventListener(event,fn);
    listeners.push(()=>el.removeEventListener(event,fn));
  };
  const current=()=>({...media,...(episodes[active]||{}),title:media.title});
  const text=(selector,value)=>{const el=$(selector);if(el)el.textContent=value||'';};

  function wake(){
    shell.classList.remove('cap-hidden');clearTimeout(timer);
    if(!video.paused&&!panel.open&&!mini)
      timer=setTimeout(()=>shell.classList.add('cap-hidden'),3200);
  }
  function notice(message){status.textContent=message||'';status.hidden=!message;}
  function update(){
    seek.max=Number.isFinite(video.duration)?video.duration:1;
    seek.value=video.currentTime||0;
    seek.style.setProperty('--played',(video.duration?video.currentTime/video.duration*100:0)+'%');
    $('.cap-time').innerHTML=format(video.currentTime)+' <i>/ '+format(video.duration)+'</i>';
    $('[data-act="play"]').innerHTML=svg(video.paused?'play':'pause');
    $('[data-act="play"]').setAttribute('aria-label',video.paused?'Reproduzir':'Pausar');
    shell.classList.toggle('cap-playing',!video.paused);
    shell.classList.toggle('cap-started',started);
    if($('[data-act="next"]'))$('[data-act="next"]').disabled=active>=episodes.length-1;
  }
  function tracks(){
    video.querySelectorAll('track').forEach(t=>t.remove());
    (current().tracks||[]).forEach(t=>{
      const track=document.createElement('track');
      track.kind='subtitles';track.src=t.src;track.srclang=t.srclang||'pt-BR';
      track.label=t.label;video.append(track);
    });
  }
  function load(){
    const item=current();source=item.src;
    video.pause();video.removeAttribute('src');video.load();
    iframe?.remove();iframe=null;video.hidden=false;
    started=false;notice('');
    shell.classList.remove('cap-embed','cap-started','cap-playing','cap-hidden');
    const embed=trailer&&!source&&item.trailerUrl;
    video.poster=item.poster||item.image||'';
    $('.cap-stage').style.setProperty('--poster','url("'+encodeURI(item.poster||item.image||'').replaceAll('"','%22')+'")');
    if(embed){
      try{
        const url=new URL(embed);
        if(!['www.youtube.com','youtube.com','www.youtube-nocookie.com','player.vimeo.com'].includes(url.hostname))throw Error('URL');
        iframe=document.createElement('iframe');
        iframe.src=url.href;iframe.title='Trailer de '+media.title;
        iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
        iframe.allowFullscreen=true;
        $('.cap-media').append(iframe);video.hidden=true;
        shell.classList.add('cap-embed');
      }catch{notice('O trailer não está disponível.');}
    }else if(source){video.src=source;video.load();}
    text('.cap-intro h2',media.title);
    text('.cap-intro p',item.synopsis||media.synopsis);
    text('.cap-tag',trailer?'TRAILER OFICIAL':media.genre||'CINEASTRA STREAM');
    const age=media.age?(media.age==='L'||media.age==='Livre'?'Livre':media.age+' anos'):null;
    text('.cap-meta',[media.year,age,item.duration].filter(Boolean).join(' · '));
    text('[data-label]',trailer?'CINEMA':'STREAM');
    text('[data-foot-type]',trailer?'TRAILER':'STREAM');
    text('.cap-foot-title',media.title);
    text('.cap-now',episodes.length
      ?episodes[active].seasonTitle+' · E'+episodes[active].number+' — '+episodes[active].title
      :trailer?'Trailer oficial':media.title);
    seek.disabled=!source;tracks();update();
  }
  async function play(){
    if(!source){
      if(onMissingSource)onMissingSource();else notice('Vídeo indisponível.');
      return;
    }
    notice('');
    try{await video.play();}
    catch(e){if(e.name!=='AbortError')notice('Não foi possível reproduzir o vídeo.');}
    wake();
  }
  function toggle(){video.paused?play():video.pause();}
  function jump(delta){
    if(Number.isFinite(video.duration))
      video.currentTime=Math.max(0,Math.min(video.duration,video.currentTime+delta));
    wake();
  }
  function openPanel(title){
    text('.cap-panel h3',title);
    $('.cap-panel-body').replaceChildren();
    panel.showModal();wake();return $('.cap-panel-body');
  }
  function episodePanel(){
    const body=openPanel('Temporadas e episódios');
    const select=document.createElement('select');
    select.setAttribute('aria-label','Escolher temporada');
    (media.seasons||[]).forEach(s=>{
      const option=document.createElement('option');
      option.value=s.id;option.textContent=s.title;select.append(option);
    });
    select.value=episodes[active]?.seasonId||media.seasons?.[0]?.id;
    body.append(select);
    const list=document.createElement('div');body.append(list);
    function render(){
      list.replaceChildren();
      episodes.forEach((ep,index)=>{
        if(String(ep.seasonId)!==select.value)return;
        const b=document.createElement('button');
        b.className='cap-episode';b.type='button';
        b.setAttribute('aria-current',String(index===active));
        const number=document.createElement('span');
        number.className='cap-number';number.textContent=String(ep.number).padStart(2,'0');
        const img=document.createElement('img');
        img.src=ep.poster||media.poster||media.image||'';img.alt='';
        const copy=document.createElement('span');
        const title=document.createElement('b');title.textContent=ep.title;
        const desc=document.createElement('small');desc.textContent=ep.synopsis||ep.duration||'';
        copy.append(title,desc);b.append(number,img,copy);
        b.onclick=()=>{active=index;panel.close();load();play();};
        list.append(b);
      });
    }
    select.onchange=render;render();
  }
  function settings(captionsOnly){
    const body=openPanel(captionsOnly?'Legendas':'Sua sessão');
    if(captionsOnly){
      const available=Array.from(video.textTracks);
      if(!available.length){
        const p=document.createElement('p');
        p.textContent='Este vídeo ainda não possui legendas.';body.append(p);return;
      }
      [{label:'Desativadas',index:-1},...available.map((t,index)=>({label:t.label,index}))].forEach(t=>{
        const b=document.createElement('button');
        b.type='button';b.className='cap-option';b.textContent=t.label;
        b.onclick=()=>{
          available.forEach((track,i)=>track.mode=t.index===i?'showing':'disabled');
          panel.close();
        };
        body.append(b);
      });
    }else{
      const label=document.createElement('label');
      label.textContent='Velocidade de reprodução';
      const select=document.createElement('select');
      [.5,.75,1,1.25,1.5,2].forEach(rate=>{
        const option=document.createElement('option');
        option.value=rate;option.textContent=rate===1?'Normal':rate+'×';select.append(option);
      });
      select.value=video.playbackRate;
      select.onchange=()=>video.playbackRate=Number(select.value);
      label.append(select);body.append(label);
      const volume=document.createElement('label');volume.textContent='Volume';
      const slider=document.createElement('input');
      slider.type='range';slider.min=0;slider.max=1;slider.step=.01;slider.value=video.volume;
      slider.oninput=()=>{video.volume=Number(slider.value);video.muted=false;};
      volume.append(slider);body.append(volume);
    }
  }
  const previousOverflow=document.body.style.overflow;
  function lock(value){document.body.style.overflow=value?'hidden':previousOverflow;}
  async function full(){
    if(document.fullscreenElement){await document.exitFullscreen();return;}
    try{await $('.cap-case').requestFullscreen();}
    catch{shell.classList.toggle('cap-expanded');}
  }
  async function minimize(){
    if(document.fullscreenElement)await document.exitFullscreen();
    mini=!mini;
    if(panel.open)panel.close();
    shell.classList.remove('cap-expanded');
    shell.classList.toggle('cap-mini',mini);
    if(trailer){shell.close();mini?shell.show():shell.showModal();}
    lock(!mini);wake();
  }
  function destroy(){
    if(dead)return;
    dead=true;clearTimeout(timer);video.pause();
    video.removeAttribute('src');video.load();iframe?.remove();
    listeners.forEach(remove=>remove());
    if(trailer&&shell.open)shell.close();
    shell.remove();lock(false);
  }
  function close(){destroy();onClose?.();}

  listen(shell,'click',event=>{
    const b=event.target.closest('[data-act]');if(!b)return;
    const actions={
      play:toggle,back:()=>jump(-15),forward:()=>jump(15),
      volume:()=>{video.muted=!video.muted;},full,mini:minimize,close,
      closepanel:()=>panel.close(),episodes:episodePanel,
      captions:()=>settings(true),settings:()=>settings(false),
      next:()=>{if(active<episodes.length-1){active++;load();play();}}
    };
    actions[b.dataset.act]?.();wake();
  });
  listen($('.cap-play'),'click',toggle);
  listen(video,'click',toggle);
  listen(shell,'pointermove',wake);
  listen(shell,'focusin',wake);
  listen(shell,'keydown',event=>{
    if(event.target.closest('button,input,select,dialog.cap-panel'))return;
    const actions={
      ' ':toggle,k:toggle,ArrowLeft:()=>jump(-15),ArrowRight:()=>jump(15),
      f:full,m:()=>{video.muted=!video.muted;}
    };
    if(actions[event.key]){event.preventDefault();actions[event.key]();}
    if(event.key==='Escape'&&!trailer)close();
  });
  if(trailer){
    listen(shell,'cancel',event=>{event.preventDefault();close();});
    listen(shell,'click',event=>{
      if(event.target!==shell)return;
      const r=shell.getBoundingClientRect();
      if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();
    });
  }
  listen(seek,'input',()=>{
    if(Number.isFinite(video.duration))video.currentTime=Number(seek.value);
    wake();
  });
  listen(seek,'pointermove',event=>{
    const cues=current().thumbnails||[];
    if(!cues.length||!video.duration)return;
    const r=seek.getBoundingClientRect();
    const ratio=Math.max(0,Math.min(1,(event.clientX-r.left)/r.width));
    const seconds=ratio*video.duration;
    const cue=[...cues].reverse().find(t=>t.time<=seconds)||cues[0];
    const popup=$('.cap-thumb');
    popup.style.left=Math.min(85,Math.max(15,ratio*100))+'%';
    popup.classList.add('cap-show');
    popup.querySelector('img').src=cue.src;
    popup.querySelector('span').textContent=format(seconds);
  });
  listen(seek,'pointerleave',()=>$('.cap-thumb').classList.remove('cap-show'));
  listen($('.cap-volume input'),'input',event=>{
    video.volume=Number(event.target.value);video.muted=false;
  });
  listen(video,'volumechange',()=>{
    $('.cap-volume input').value=video.muted?0:video.volume;
  });
  ['timeupdate','durationchange','loadedmetadata','pause','ended'].forEach(name=>
    listen(video,name,()=>{update();wake();})
  );
  listen(video,'play',()=>{started=true;notice('');update();wake();});
  listen(video,'waiting',()=>notice('Carregando…'));
  ['playing','canplay','seeked'].forEach(name=>listen(video,name,()=>notice('')));
  listen(video,'error',()=>notice('Não foi possível carregar o vídeo.'));
  load();lock(true);
  trailer?shell.showModal():shell.focus();
  return destroy;
}
