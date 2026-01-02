const STORAGE_KEYS = {
  BAG: "hockey_bag_packed",
  DRESS: "hockey_dress_state"
};

function showToast(text, ms=1800){
  const el = document.getElementById("toast");
  if(!el) return;
  el.textContent = text;
  el.style.display = "block";
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>{ el.style.display = "none"; }, ms);
}

function loadJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    return JSON.parse(raw);
  }catch(e){
    return fallback;
  }
}

function saveJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function resetAll(){
  try{
    localStorage.removeItem(STORAGE_KEYS.BAG);
    localStorage.removeItem(STORAGE_KEYS.DRESS);
  }catch(e){}
}

document.addEventListener("DOMContentLoaded", () => {
  const resetBtn = document.getElementById("resetBtn");
  if(resetBtn){
    resetBtn.addEventListener("click", () => {
      resetAll();
      showToast("Alles zurückgesetzt.");
    });
  }
});
