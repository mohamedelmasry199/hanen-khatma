// HanenUI — toast + confirm modal بدل alert/confirm الأصلية
(function(){
  function ensureToast(){
    let w=document.getElementById("toastWrap");
    if(!w){ w=document.createElement("div"); w.id="toastWrap"; w.className="toast-wrap"; document.body.appendChild(w); }
    return w;
  }
  function toast(msg,type){
    const w=ensureToast();
    const el=document.createElement("div");
    el.className="toast toast-"+(type||"info");
    el.innerHTML="<span class='toast-ico'>"+(type==="success"?"✓":type==="error"?"!":type==="warn"?"⚠":"✦")+"</span><span>"+msg+"</span>";
    w.appendChild(el);
    requestAnimationFrame(()=>el.classList.add("show"));
    setTimeout(()=>{ el.classList.remove("show"); setTimeout(()=>el.remove(),350); },3200);
  }
  let confirmResolve=null;
  function bindModal(m){
    if(m.dataset.hanenBound) return;
    m.dataset.hanenBound="1";
    m.querySelector("#confirmOk").addEventListener("click",()=>{ close(true); });
    m.querySelector("#confirmCancel").addEventListener("click",()=>{ close(false); });
    m.addEventListener("click",e=>{ if(e.target===m) close(false); });
    document.addEventListener("keydown",e=>{
      const mm=document.getElementById("confirmModal");
      if(e.key==="Escape"&&mm&&mm.classList.contains("open")) close(false);
    });
  }
  function ensureModal(){
    let m=document.getElementById("confirmModal");
    if(!m){
      m=document.createElement("div");
      m.id="confirmModal"; m.className="modal";
      m.innerHTML="<div class='modal-card'><div class='modal-top'></div><div class='modal-body'>"
        +"<h3 id='confirmTitle'>تأكيد</h3><p id='confirmMsg' class='muted'></p>"
        +"<div class='confirm-actions'><button id='confirmOk' class='btn btn-primary btn-small'>تأكيد</button>"
        +"<button id='confirmCancel' class='btn btn-ghost btn-small'>تراجع</button></div>"
        +"</div></div>";
      document.body.appendChild(m);
    }
    bindModal(m);
    return m;
  }
  function close(val){
    const m=document.getElementById("confirmModal");
    if(m) m.classList.remove("open");
    if(confirmResolve){ confirmResolve(val); confirmResolve=null; }
  }
  function confirmDlg(opts){
    const o=typeof opts==="string"?{message:opts}:opts;
    const m=ensureModal();
    document.getElementById("confirmTitle").textContent=o.title||"تأكيد";
    document.getElementById("confirmMsg").textContent=o.message||"";
    document.getElementById("confirmOk").textContent=o.okText||"تأكيد";
    document.getElementById("confirmCancel").textContent=o.cancelText||"تراجع";
    m.classList.add("open");
    return new Promise(res=>{ confirmResolve=res; });
  }
  window.HanenUI={toast:toast,confirm:confirmDlg};
})();
