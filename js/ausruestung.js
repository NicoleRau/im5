document.addEventListener("DOMContentLoaded", () => {
  const scroller = document.getElementById("scroller");
  const dropZone = document.getElementById("dropZone");
  const progressEl = document.getElementById("progress");
  const nextHint = document.getElementById("nextHint");

  /* Header Buttons */
  const backBtn = document.getElementById("backBtn");
  const resetBtn = document.getElementById("resetDressBtn");

  /* Reset-Modal */
  const resetModal = document.getElementById("resetDressModal");
  const cancelReset = document.getElementById("cancelDressReset");
  const confirmReset = document.getElementById("confirmDressReset");

  /* Done-Modal */
  const doneModal = document.getElementById("doneDressModal");
  const replayBtn = document.getElementById("replayDressBtn");
  const closeDoneBtn = document.getElementById("closeDoneDress");
  const goBagBtn = document.getElementById("goBagBtn");

  /* Pager */
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const pageInfo = document.getElementById("pageInfo");

  const pageSize = 10;
  let page = 0;
  let doneShown = false;

  /* Reihenfolge, ohne Stock/Trinkflasche */
  const WEARABLE = [
    { id:"intimschoner", label:"Intimschoner", img:"assets/intimschoner.png", order:1 },
    { id:"stuelpen", label:"Stülpen", img:"assets/stulpen.png", order:2 },
    { id:"hosen", label:"Hosen", img:"assets/hose.png", order:3 },
    { id:"schlittschuhe", label:"Schlittschuhe", img:"assets/schlittschuhe.png", order:4 },
    { id:"knieschoner", label:"Knieschoner", img:"assets/knieschoner.png", order:5 },
    { id:"brustpanzer", label:"Brustpanzer", img:"assets/brustpanzer.png", order:6 },
    { id:"ellenbogenschoner", label:"Ellenbogenschoner", img:"assets/ellenbogenschoner.png", order:7 },
    { id:"trikot", label:"Trikot", img:"assets/trikot.png", order:8 },
    { id:"halsschutz", label:"Halsschutz", img:"assets/halsschoner.png", order:9 },
    { id:"helm", label:"Helm", img:"assets/helm.png", order:10 },
    { id:"handschuhe", label:"Handschuhe", img:"assets/handschuhe.png", order:11 }
  ];
  /* Anzeige-Reihenfolge zufällig gemischt */
  const displayOrder = shuffleArray(WEARABLE.map(x => x.id));

  /* Zustand aus localStorage laden*/
  const state = loadJSON(STORAGE_KEYS.DRESS, {
    worn: [],
    currentStep: 1
  });

  /* Drag-ghost */
  const ghost = createGhost();
  let dragging = null;

  /* Render-Funktion */
    function render(){
    scroller.innerHTML = "";

  /* Alle noch nicht angezogenen IDs (in deiner zufälligen displayOrder) */
    const remainingIds = displayOrder.filter(id => !state.worn.includes(id));

  /* Seiten berechnen + clampen */
    const totalPages = Math.max(1, Math.ceil(remainingIds.length / pageSize));
    if(page > totalPages - 1) page = totalPages - 1;
    if(page < 0) page = 0;

  /* Pager UI */
    if(pageInfo) pageInfo.textContent = `${page + 1}/${totalPages}`;
    if(prevPageBtn) prevPageBtn.disabled = (page === 0);
    if(nextPageBtn) nextPageBtn.disabled = (page >= totalPages - 1);

  /* Slice für diese Seite */
    const start = page * pageSize;
    const slice = remainingIds.slice(start, start + pageSize);

  /* Items rendern (max 10) */
    slice.forEach(id => {
      const item = WEARABLE.find(x => x.id === id);
      if(item) scroller.appendChild(makeItemCard(item));
    });

  /* Optional wie Tasche: Platzhalter auffüllen, damit immer 10 Slots sichtbar sind */
    const missing = pageSize - slice.length;
    for(let i=0; i<missing; i++){
      scroller.appendChild(makePlaceholderCard());
    }

  /* Progress + Hint */
    progressEl.textContent = `${state.worn.length}/${WEARABLE.length} angezogen`;
    nextHint.textContent = "Was kommt als Nächstes?";

  /* Done Modal nur einmal zeigen */
    if(state.worn.length === WEARABLE.length && !doneShown){
      doneShown = true;
      openModal(doneModal);
    }
  }


  /* Item-Karte */
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


  /* Drag-logik */

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


  /* Drop-logik Reihenfolge prüfen */
  function endDrag(x,y){
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

  /* Modal-helper */
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

  /* Button-listener */
  /* Reset */
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

  /* Zurück */
  if(backBtn){
    backBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  /* Done-modal */
  if(replayBtn){
    replayBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.DRESS);
      showToast("Okay, wir ziehen nochmal an!");
      closeModal(doneModal);
      location.reload();

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

  render();

});