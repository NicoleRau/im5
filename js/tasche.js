document.addEventListener("DOMContentLoaded", () => {
  const scroller = document.getElementById("scroller");
  const dropZone = document.getElementById("dropZone");
  const progressEl = document.getElementById("progress");

  // TODO: Sobald du Asset-Namen hast, hier anpassen
  const ITEMS = [
    { id:"schlittschuhe", label:"Schlittschuhe", img:"assets/schlittschuhe.png" },
    { id:"stock", label:"Stock", img:"assets/stock.png" },
    { id:"helm", label:"Helm", img:"assets/helm.png" },
    { id:"handschuhe", label:"Handschuhe", img:"assets/handschuhe.png" },
    { id:"hosen", label:"Hosen", img:"assets/hose.png" },
    { id:"knieschoner", label:"Knieschoner", img:"assets/knieschoner.png" },
    { id:"ellenbogenschoner", label:"Ellenbogen", img:"assets/ellenbogenschoner.png" },
    { id:"brustpanzer", label:"Brustpanzer", img:"assets/brustpanzer.png" },
    { id:"intimschoner", label:"Intim", img:"assets/intimschoner.png" },
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
    scroller.innerHTML = "";
    const remaining = ITEMS.filter(it => !state.packed.includes(it.id));
    remaining.forEach(it => scroller.appendChild(makeItemCard(it)));
    progressEl.textContent = `${state.packed.length}/${ITEMS.length} gepackt`;
  }

  function makeItemCard(item){
    const el = document.createElement("div");
    el.className = "item";
    el.dataset.itemId = item.id;
    el.innerHTML = `<img src="${item.img}" alt=""><span>${item.label}</span>`;
    attachPointerDrag(el, item);
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

  render();
});

