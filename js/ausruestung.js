document.addEventListener("DOMContentLoaded", () => {
  const scroller = document.getElementById("scroller");
  const dropZone = document.getElementById("dropZone");
  const progressEl = document.getElementById("progress");
  const nextHint = document.getElementById("nextHint");

  // Reihenfolge (hart) – ohne Stock/Trinkflasche
  const WEARABLE = [
    { id:"intimschoner", label:"Intim", img:"assets/intimschoner.png", order:1 },
    { id:"stuelpen", label:"Stülpen", img:"assets/stulpen.png", order:2 },
    { id:"hosen", label:"Hosen", img:"assets/hose.png", order:3 },
    { id:"schlittschuhe", label:"Schlittschuhe", img:"assets/schlittschuhe.png", order:4 },
    { id:"knieschoner", label:"Knieschoner", img:"assets/knieschoner.png", order:5 },
    { id:"brustpanzer", label:"Brustpanzer", img:"assets/brustpanzer.png", order:6 },
    { id:"ellenbogenschoner", label:"Ellenbogen", img:"assets/ellenbogenschoner.png", order:7 },
    { id:"trikot", label:"Trikot", img:"assets/trikot.png", order:8 },
    { id:"halsschutz", label:"Halsschutz", img:"assets/halsschoner.png", order:9 },
    { id:"helm", label:"Helm", img:"assets/helm.png", order:10 },
    { id:"handschuhe", label:"Handschuhe", img:"assets/handschuhe.png", order:11 }
  ];

  const state = loadJSON(STORAGE_KEYS.DRESS, { worn: [], currentStep: 1 });

  const ghost = createGhost();
  let dragging = null;

  function render(){
    scroller.innerHTML = "";
    const remaining = WEARABLE.filter(it => !state.worn.includes(it.id));
    remaining.forEach(it => scroller.appendChild(makeItemCard(it)));
    progressEl.textContent = `${state.worn.length}/${WEARABLE.length} angezogen`;

    const next = WEARABLE.find(x => x.order === state.currentStep);
    nextHint.textContent = next ? `Als Nächstes: ${next.label}` : `Fertig! 🎉`;
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

  render();
});


