document.addEventListener("DOMContentLoaded", () => {
  const scroller = document.getElementById("scroller");
  const dropZone = document.getElementById("dropZone");
  const progressEl = document.getElementById("progress");
  const nextHint = document.getElementById("nextHint");

  // Header Buttons
  const backBtn = document.getElementById("backBtn");
  const resetBtn = document.getElementById("resetDressBtn");

  // Reset-Modal
  const resetModal = document.getElementById("resetDressModal");
  const cancelReset = document.getElementById("cancelDressReset");
  const confirmReset = document.getElementById("confirmDressReset");

  // Done-Modal
  const doneModal = document.getElementById("doneDressModal");
  const replayBtn = document.getElementById("replayDressBtn");
  const closeDoneBtn = document.getElementById("closeDoneDress");
  const goBagBtn = document.getElementById("goBagBtn");

  // Pager
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const pageInfo = document.getElementById("pageInfo");

  // Snap
  const snapLayer = document.getElementById("snapLayer");

  const bgImg = document.getElementById("bgImg");

  const DEBUG_ZONES = false;

  function layoutSnapLayerToImage(){
    if(!dropZone || !snapLayer || !bgImg) return;

    const r = dropZone.getBoundingClientRect();
    const iw = bgImg.naturalWidth;
    const ih = bgImg.naturalHeight;
    if(!iw || !ih) return;

    const cr = r.width / r.height;
    const ir = iw / ih;

    let w, h, x, y;
    if(cr > ir){
      h = r.height;
      w = h * ir;
      x = (r.width - w) / 2;
      y = 0;
    } else {
      w = r.width;
      h = w / ir;
      x = 0;
      y = (r.height - h) / 2;
    }

    snapLayer.style.left = x + "px";
    snapLayer.style.top = y + "px";
    snapLayer.style.width = w + "px";
    snapLayer.style.height = h + "px";
  }

  function getSnapRect(){
    const r = dropZone.getBoundingClientRect();
    return {
      left: r.left + (parseFloat(snapLayer.style.left) || 0),
      top: r.top + (parseFloat(snapLayer.style.top) || 0),
      width: parseFloat(snapLayer.style.width) || r.width,
      height: parseFloat(snapLayer.style.height) || r.height
    };
  }

  const pageSize = 10;
  let page = 0;
  let doneShown = false;

  // Positionen Ausrüstungsteile
  const SNAP_POS = {
    intimschoner: { left: 47.5, top: 62, width: 25},
    stuelpen: { left: 47.5, top: 80, width: 25},
    hosen: { left: 49, top: 62, width: 40},
    schlittschuhe: { left: 48, top: 88, width: 20},
    knieschoner: { left: 49, top: 80, width: 30},
    brustpanzer: { left:  48, top: 45, width: 32},
    ellenbogenschoner: { left: 49, top: 50, width: 20},
    trikot: { left: 48, top: 50, width: 35},
    halsschutz: { left: 48, top: 38, width: 15},
    helm: { left: 50, top: 25, width: 40},
    handschuhe: {left: 48, top: 60, width: 18}
  };

  // Snap-Zonen
  const SNAP_ZONES = {
    intimschoner: { left: 36, top: 53, width: 25, height:15 },
    stuelpen: { left: 36, top: 68, width: 25, height:15 },
    hosen: { left: 36, top: 53, width: 30, height:20 },
    schlittschuhe: { left: 38, top: 83, width: 20, height:10 },
    knieschoner: { left: 34, top: 71, width: 30, height:12 },
    brustpanzer: { left:  32, top: 38, width: 32, height:22 },
    ellenbogenschoner: { left: 28, top: 48, width: 40, height:10 },
    trikot: { left: 32, top: 38, width: 32, height:22 },
    halsschutz: { left: 41, top: 35, width: 15, height:10 },
    helm: { left: 38, top: 10, width: 20, height:30 },
    handschuhe: {left: 28, top: 57, width: 40, height:10 }
  }

  // Reihenfolge, ohne Stock/Trinkflasche
  const WEARABLE = [
    { id:"intimschoner", label:"Intimschoner", img:"assets/intimschoner.png", order:1 },
    { id:"knieschoner", label:"Knieschoner", img:"assets/knieschoner.png", order:2 },
    { id:"hosen", label:"Hosen", img:"assets/hose.png", order:3 },
    { id:"stuelpen", label:"Stülpen", img:"assets/stulpen.png", order:4 },
    { id:"schlittschuhe", label:"Schlittschuhe", img:"assets/schlittschuhe.png", order:5 },
    { id:"brustpanzer", label:"Brustpanzer", img:"assets/brustpanzer.png", order:6 },
    { id:"ellenbogenschoner", label:"Ellenbogenschoner", img:"assets/ellenbogenschoner.png", order:7 },
    { id:"trikot", label:"Trikot", img:"assets/trikot.png", order:8 },
    { id:"halsschutz", label:"Halsschutz", img:"assets/halsschoner.png", order:9 },
    { id:"helm", label:"Helm", img:"assets/helm.png", order:10 },
    { id:"handschuhe", label:"Handschuhe", img:"assets/handschuhe.png", order:11 }
  ];

  // Anzeige-Reihenfolge zufällig gemischt
  const displayOrder = shuffleArray(WEARABLE.map(x => x.id));

  // Zustand aus localStorage laden
  const state = loadJSON(STORAGE_KEYS.DRESS, {
    worn: [],
    currentStep: 1
  });

  // Drag-ghost
  const ghost = createGhost();
  let dragging = null;

  // Render-Funktion
  function render(){
    renderPlacedItems();
    if(DEBUG_ZONES) renderDebugZones();

    // Alle noch nicht angezogenen IDs (in deiner zufälligen displayOrder)
    const remainingIds = displayOrder.filter(id => !state.worn.includes(id));

    // Seiten berechnen + clampen
    const totalPages = Math.max(1, Math.ceil(remainingIds.length / pageSize));
    if(page > totalPages - 1) page = totalPages - 1;
    if(page < 0) page = 0;

    // Pager UI
    if(pageInfo) pageInfo.textContent = `${page + 1}/${totalPages}`;
    if(prevPageBtn) prevPageBtn.disabled = (page === 0);
    if(nextPageBtn) nextPageBtn.disabled = (page >= totalPages - 1);

    // Slice für diese Seite
    const start = page * pageSize;
    const slice = remainingIds.slice(start, start + pageSize);

    if(scroller){
      scroller.innerHTML = "";

      slice.forEach(id => {
        const item = WEARABLE.find(x => x.id === id);
        if(item) scroller.appendChild(makeItemCard(item));
      });
      
      const missing = pageSize - slice.length;
      for(let i=0; i<missing; i++){
        scroller.appendChild(makePlaceholderCard());
      }
    }

    // Progress + Hint
    if(progressEl) progressEl.textContent = `${state.worn.length}/${WEARABLE.length} angezogen`;
    if(nextHint) nextHint.textContent = "Was kommt als Nächstes?";

    // Done Modal nur einmal zeigen
   if(state.worn.length === WEARABLE.length && !doneShown){
      doneShown = true;
      openModal(doneModal);
    }
  }

  function renderDebugZones(){
  if(!snapLayer) return;

  // alte Debug-Zonen entfernen (aber nicht die platzierten Items)
  snapLayer.querySelectorAll(".snap-zone-debug").forEach(el => el.remove());

  Object.entries(SNAP_ZONES).forEach(([id, z]) => {
    const box = document.createElement("div");
    box.className = "snap-zone-debug";
    box.dataset.zoneId = id;

    box.style.left = z.left + "%";
    box.style.top = z.top + "%";
    box.style.width = z.width + "%";
    box.style.height = z.height + "%";

    snapLayer.appendChild(box);
  });
}

  function renderPlacedItems(){
  if(!snapLayer) return;

  snapLayer.querySelectorAll(".snap-item").forEach(el => el.remove());

  // alles, was bereits korrekt “angezogen” wurde, wird angezeigt
  state.worn.forEach(id => {
    const pos = SNAP_POS[id];
    if(!pos) return; // falls für ein Teil noch keine Position definiert ist

    const item = WEARABLE.find(x => x.id === id);
    if(!item) return;

    const img = document.createElement("img");
    img.className = "snap-item";
    img.src = item.img;
    img.alt = item.label;

    img.style.left = pos.left + "%";
    img.style.top = pos.top + "%";
    img.style.width = pos.width + "%";
    img.style.height = "auto";

    snapLayer.appendChild(img);
  });
}

  // Item-Karte
  function makeItemCard(item){
    const el = document.createElement("div");
    el.className = "item";
    el.dataset.itemId = item.id;
    el.innerHTML = `<img src="${item.img}" alt=""><span>${item.label}</span>`;
    attachPointerDrag(el, item);
    return el;
  }

  function makePlaceholderCard(){
    const el = document.createElement("div");
    el.className = "item placeholder";
    el.innerHTML = `<span style="font-size:26px;line-height:1;">•</span><span>&nbsp;</span>`;
    return el;
  }

  // Drag-logik
  function createGhost(){
    const g = document.createElement("div");
    g.className = "drag-ghost";
    g.innerHTML = `<img alt=""><span></span>`;
    document.body.appendChild(g);
    return g;
  }

  function attachPointerDrag(el, item){
    el.addEventListener("pointerdown", (e) => {
      el.setPointerCapture(e.pointerId);
      dragging = { item, pointerId: e.pointerId };

      ghost.querySelector("img").src = item.img;
      ghost.querySelector("span").textContent = item.label;
      moveGhost(e.clientX, e.clientY);
    });

    el.addEventListener("pointermove", (e) => {
      if(!dragging || dragging.pointerId !== e.pointerId) return;
      moveGhost(e.clientX, e.clientY);
    });

    el.addEventListener("pointerup", (e) => {
      if(!dragging || dragging.pointerId !== e.pointerId) return;
      endDrag(e.clientX, e.clientY);
      el.releasePointerCapture(e.pointerId);
      dragging = null;
    });

    el.addEventListener("pointercancel", () => {
      hideGhost();
      dragging = null;
    });
  }

  function moveGhost(x,y){
    ghost.style.transform = `translate(${x - 46}px, ${y - 46}px)`;
  }

  function hideGhost(){
    ghost.style.transform = `translate(-9999px,-9999px)`;
  }

  // Drop-logik Reihenfolge prüfen
  function endDrag(x,y){
    if(!dragging) return;
    const hit = isPointInElement(x, y, dropZone);
    if(!hit){
      showToast(`Das gehört nicht dahin – zieh es zur Person!`);
      hideGhost();
      return;
    }

    const next = WEARABLE.find(x => x.order === state.currentStep);
    if(!next){
      showToast(`Du bist schon fertig! 🎉`);
      hideGhost();
      return;
    }

    if(dragging.item.id !== next.id){
      showToast(`Noch nicht! Zuerst: ${next.label}.`);
      hideGhost();
      return;
    }

    const zone = SNAP_ZONES[dragging.item.id];
    if(zone && !isPointInSnapZone(x, y, zone)){
      showToast("Fast! Zieh es näher an die richtige Stelle");
      hideGhost();
      return;
    }

    state.worn.push(dragging.item.id);
    state.currentStep += 1;
    saveJSON(STORAGE_KEYS.DRESS, state);

    showToast(`Du hast ${dragging.item.label} angezogen.`);
    render();
    hideGhost();
  }

  function isPointInElement(x,y, el){
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function isPointInSnapZone(x,y, zone){
    const sr = getSnapRect();

    const left = sr.left + (zone.left / 100) * sr.width;
    const top = sr.top + (zone.top / 100) * sr.height;
    const width = (zone.width / 100) * sr.width;
    const height = (zone.height / 100) * sr.height;

    return x >= left && x <= (left + width) && y >= top && y <= (top + height);
  }

  // Modal-helper
  function openModal (el){
    if(!el) return;
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");  
  }

  function closeModal (el){
    if(!el) return;
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");  
  }

  // Button-listener
  // Reset
  if(resetBtn){
    resetBtn.addEventListener("click", () => openModal(resetModal));
  }
  if(cancelReset){
    cancelReset.addEventListener("click", () => closeModal(resetModal));
  }
  if(confirmReset){
    confirmReset.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.DRESS);
      showToast("Ausrüstung zurückgesetzt.");
      closeModal(resetModal);
      location.reload();
    });
  }
  if(resetModal){
    resetModal.addEventListener("click", e => {
      if(e.target === resetModal) closeModal(resetModal);
    });
  }

  // Zurück
  if(backBtn){
    backBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  // Done-modal
  if(replayBtn){
    replayBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.DRESS);
      showToast("Okay, wir ziehen nochmal an!");
      closeModal(doneModal);
      location.reload();

    });
  }

  if(closeDoneBtn){
    closeDoneBtn.addEventListener("click", () => {
      closeModal(doneModal);
    });
  }

  if(goBagBtn){
    goBagBtn.addEventListener("click", () => {
      window.location.href = "tasche.html";
    });
  }

  if(doneModal){
    doneModal.addEventListener("click", e => {
      if(e.target === doneModal) closeModal(doneModal);
    });
  }

  if(prevPageBtn){
  prevPageBtn.addEventListener("click", () => {
    page -= 1;
    render();
  });
  }

  if(nextPageBtn){
  nextPageBtn.addEventListener("click", () => {
    page += 1;
    render();
  });
  }

  function shuffleArray(arr){
    const a = [...arr];
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function init(){
    layoutSnapLayerToImage();
    render();
  }

  if(bgImg && !bgImg.complete){
    bgImg.addEventListener("load", init, { once:true });
  } else {
    init();
  }

  window.addEventListener("resize", () => {
    layoutSnapLayerToImage();
  });
});