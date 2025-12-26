document.addEventListener("DOMContentLoaded", () => {
  const scroller = document.getElementById("scroller");
  const dropZone = document.getElementById("dropZone");
  const progressEl = document.getElementById("progress");

  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const pageInfo = document.getElementById("pageInfo");

  /* Reset Modal */
  const doneModal = document.getElementById("doneBagModal");
  const closeDoneBtn = document.getElementById("closeDoneBag");
  const goDressBtn = document.getElementById("goDressBtn");
  const replayBagBtn = document.getElementById("replayBagBtn");



  let doneShown = false; // damit es nicht dauernd wieder aufpoppt


  const pageSize = 10;
  let page = 0;

  const ITEMS = [
    { id:"schlittschuhe", label:"Schlittschuhe", img:"assets/schlittschuhe.png" },
    { id:"stock", label:"Stock", img:"assets/stock.png" },
    { id:"helm", label:"Helm", img:"assets/helm.png" },
    { id:"handschuhe", label:"Handschuhe", img:"assets/handschuhe.png" },
    { id:"hosen", label:"Hosen", img:"assets/hose.png" },
    { id:"knieschoner", label:"Knieschoner", img:"assets/knieschoner.png" },
    { id:"ellenbogenschoner", label:"Ellenbogenschoner", img:"assets/ellenbogenschoner.png" },
    { id:"brustpanzer", label:"Brustpanzer", img:"assets/brustpanzer.png" },
    { id:"intimschoner", label:"Intimschoner", img:"assets/intimschoner.png" },
    { id:"halsschutz", label:"Halsschutz", img:"assets/halsschoner.png" },
    { id:"trinkflasche", label:"Trinkflasche", img:"assets/flasche.png" },
    { id:"stuelpen", label:"Stülpen", img:"assets/stulpen.png" },
    { id:"trikot", label:"Trikot", img:"assets/trikot.png" }
  ];

  const state = loadJSON(STORAGE_KEYS.BAG, { packed: [] });

  // Ghost für Drag
  const ghost = createGhost();
  let dragging = null;

  function render(){
  const remaining = ITEMS.filter(it => !state.packed.includes(it.id));

  // Seitenzahl berechnen + Seite clampen
  const totalPages = Math.max(1, Math.ceil(remaining.length / pageSize));
  if(page > totalPages - 1) page = totalPages - 1;
  if(page < 0) page = 0;

  // UI: Pager
  if(pageInfo) pageInfo.textContent = `${page + 1}/${totalPages}`;
  if(prevPageBtn) prevPageBtn.disabled = (page === 0);
  if(nextPageBtn) nextPageBtn.disabled = (page >= totalPages - 1);

  // Inhalte rendern (max 10)
  scroller.innerHTML = "";
  const start = page * pageSize;
  const slice = remaining.slice(start, start + pageSize);

  slice.forEach(it => scroller.appendChild(makeItemCard(it)));

  // Platzhalter auffüllen, damit immer 10 Slots sichtbar sind
  const missing = pageSize - slice.length;
  for(let i=0; i<missing; i++){
    scroller.appendChild(makePlaceholderCard());
  }

  // Progress
  progressEl.textContent = `${state.packed.length}/${ITEMS.length} gepackt`;

  // Fertig-Check (nur einmal anzeigen)
  if(state.packed.length === ITEMS.length && !doneShown){
    doneShown = true;
    openDoneModal();
  }
}



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

      showToast(`Zieh "${item.label}" in die Tasche.`);
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

  function endDrag(x,y){
    const hit = isPointInElement(x, y, dropZone);
    if(hit){
      state.packed.push(dragging.item.id);
      saveJSON(STORAGE_KEYS.BAG, state);
      showToast(`Du hast ${dragging.item.label} in die Tasche getan.`);
      render();
    }else{
      showToast(`Das gehört nicht dahin – versuch’s nochmal!`);
    }
    hideGhost();
  }

  function isPointInElement(x,y, el){
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
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


  render();

    // --- Reset nur für Tasche (Modal) ---
  const resetBtn = document.getElementById("resetBagBtn");
  const modal = document.getElementById("resetBagModal");
  const cancel = document.getElementById("cancelBagReset");
  const confirmReset = document.getElementById("confirmBagReset");
  

  function openModal(){
    if(!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
  }

  function closeModal(){
    if(!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden","true");
  }

  if(resetBtn){
    resetBtn.addEventListener("click", openModal);
  }
  if(cancel){
    cancel.addEventListener("click", closeModal);
  }
  if(modal){
    modal.addEventListener("click", (e) => {
      if(e.target === modal) closeModal();
    });
  }

    function openDoneModal(){
    if(!doneModal) return;
    doneModal.classList.add("open");
    doneModal.setAttribute("aria-hidden","false");
  }

  function closeDoneModal(){
    if(!doneModal) return;
    doneModal.classList.remove("open");
    doneModal.setAttribute("aria-hidden","true");
  }

  if(confirmReset){
    confirmReset.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.BAG);
      showToast("Tasche zurückgesetzt.");
      closeModal();
      location.reload();
    });
  }


  const backBtn = document.getElementById("backBtn");
if(backBtn){
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

  if(closeDoneBtn){
    closeDoneBtn.addEventListener("click", closeDoneModal);
  }
  if(doneModal){
    doneModal.addEventListener("click", (e) => {
      if(e.target === doneModal) closeDoneModal();
    });
  }
  if(goDressBtn){
    goDressBtn.addEventListener("click", () => {
      window.location.href = "ausruestung.html";
    });
  }
  

  if(replayBagBtn){
    replayBagBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.BAG);
      showToast("Okay – wir packen nochmal!");
      closeDoneModal();
      location.reload();
    });
  }



});
