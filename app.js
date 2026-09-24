// ختمة حنين - حجز وتقارير
// وضعان: مشترك على كل الأجهزة (Firestore مجاني) + احتياطي على نفس الجهاز (localStorage)
(function(){
  const K_USER="hanen_userName", K_WEEKS="hanen_weeks", K_CUR="hanen_currentWeekId";
  const $=id=>document.getElementById(id);
  const norm=s=>(s||"").trim();
  const UI=window.HanenUI||{toast:function(m){alert(m);},confirm:function(m){return Promise.resolve(confirm(m));}};

  // ---------- أدوات محلية ----------
  function load(k,f){ try{const v=localStorage.getItem(k); return v?JSON.parse(v):f;}catch(e){return f;} }
  function save(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
  function saturdayOf(d){
    const x=new Date(d); const day=x.getDay();
    const diff=(day+1)%7;
    x.setDate(x.getDate()-diff); x.setHours(0,0,0,0); return x;
  }
  function autoWeekId(d){
    const s=saturdayOf(d||new Date());
    const y=s.getFullYear(); const onejan=new Date(y,0,1);
    const w=Math.ceil((((s-onejan)/86400000)+onejan.getDay()+1)/7);
    return y+"-W"+String(w).padStart(2,"0");
  }
  function autoLabel(){
    const d=new Date(); const s=saturdayOf(d); const e=new Date(s); e.setDate(s.getDate()+6);
    const f=x=>x.toLocaleDateString("ar-EG",{day:"numeric",month:"long",year:"numeric"});
    return "أسبوع "+f(s)+" - "+f(e);
  }

  // ---------- حالة ----------
  let MODE="local"; // local | cloud
  let db=null, cur=load(K_CUR,null)||autoWeekId(), unsubBookings=null, unsubWeeks=null;
  let cloudBookings={}, cloudWeeks={};

  function fbCfg(){
    try{
      const h=window.HANEN_FIREBASE;
      if(h&&h.CONFIGURED&&h.config&&String(h.config.apiKey||"").indexOf("PASTE")!==0) return h.config;
    }catch(e){}
    return null;
  }

  function setSyncStatus(t,ok){
    const el=$("syncStatus"); if(!el)return;
    el.textContent=t;
    el.style.color=ok?"#0e7a5f":"#6b7280";
    el.style.fontWeight="700";
  }

  // ---------- LOCAL ----------
  function localEnsure(){
    let weeks=load(K_WEEKS,{});
    if(!weeks[cur]){ weeks[cur]={id:cur,label:autoLabel(),start:new Date().toISOString(),bookings:{}}; save(K_WEEKS,weeks); }
    save(K_CUR,cur); return cur;
  }
  function localBookings(){ const w=load(K_WEEKS,{}); return (w[cur]&&w[cur].bookings)||{}; }
  function localLabel(){ const w=load(K_WEEKS,{}); return (w[cur]&&w[cur].label)||autoLabel(); }

  // ---------- CLOUD ----------
  async function cloudInit(cfg){
    if(!window.firebase){ setSyncStatus("تعذر تحميل مكتبة المزامنة — وضع الجهاز فقط",false); return false; }
    try{
      if(!firebase.apps.length) firebase.initializeApp(cfg);
      db=firebase.firestore();
      // تأكد وجود مستند الأسبوع
      const ref=db.collection("hanen_weeks").doc(cur);
      const snap=await ref.get();
      if(!snap.exists) await ref.set({label:autoLabel(),start:new Date().toISOString(),updatedAt:new Date().toISOString()});
      MODE="cloud";
      setSyncStatus("🟢 متصل: الحجز ظاهر على كل الأجهزة لحظيا",true);
      subscribeCloud();
      // راقب الأسابيع للتقارير
      unsubWeeks=db.collection("hanen_weeks").onSnapshot(ss=>{
        cloudWeeks={};
        ss.forEach(d=>{cloudWeeks[d.id]=d.data();});
        renderReports();
      });
      return true;
    }catch(e){
      console.warn(e);
      setSyncStatus("وضع عدم الاتصال: الحفظ على هذا الجهاز فقط",false);
      return false;
    }
  }
  function subscribeCloud(){
    if(unsubBookings)unsubBookings();
    unsubBookings=db.collection("hanen_bookings").where("weekId","==",cur).onSnapshot(ss=>{
      cloudBookings={};
      ss.forEach(d=>{const v=d.data(); cloudBookings[String(v.juzId)]=v;});
      renderJuz(); renderHero(); renderReports();
    });
  }
  function docId(juzId){ return cur+"__"+juzId; }
  async function cloudBook(juzId,user){
    const ref=db.collection("hanen_bookings").doc(docId(juzId));
    const s=await ref.get();
    if(s.exists){ UI.toast("الجزء ده اتحجز خلاص على جهاز تاني — اختار جزء غيره","warn"); return; }
    await ref.set({weekId:cur,juzId:Number(juzId),name:user,status:"reserved",reservedAt:new Date().toISOString(),doneAt:null});
    UI.toast("اتحجز لك الجزء "+juzId+" يا "+user+" 🤍","success");
  }
  async function cloudDone(juzId){ await db.collection("hanen_bookings").doc(docId(juzId)).update({status:"done",doneAt:new Date().toISOString()}); }
  async function cloudUnDone(juzId){ await db.collection("hanen_bookings").doc(docId(juzId)).update({status:"reserved",doneAt:null}); }
  async function cloudCancel(juzId){ await db.collection("hanen_bookings").doc(docId(juzId)).delete(); }

  // ---------- عرض مشترك ----------
  function currentBookings(){ return MODE==="cloud"?cloudBookings:localBookings(); }
  function currentLabel(){ return MODE==="cloud"?((cloudWeeks[cur]&&cloudWeeks[cur].label)||autoLabel()):localLabel(); }

  function getUser(){ return norm(load(K_USER,"")); }
  function setUser(n){ save(K_USER,norm(n)); }

  function renderAll(){
    const user=getUser();
    $("currentUserBadge").textContent=user?user:"زائر";
    $("nameModal").classList.toggle("open",!user&&$("reading").classList.contains("active"));
    $("currentWeekLabel").textContent=currentLabel()+" ("+cur+")";
    renderJuz(); renderHero(); renderReports();
  }

  function renderHero(){
    const b=currentBookings();
    let done=0,res=0;
    Object.values(b).forEach(x=>{ if(x.status==="done")done++; else res++; });
    $("statDone").textContent=done;
    $("statReserved").textContent=res;
    $("statMissing").textContent=30-done-res;
    const pct=Math.round(done/30*100);
    $("weekProgress").style.width=pct+"%";
    $("weekProgressText").textContent=done+" / 30 تمت ("+pct+"%)";
  }

  function renderJuz(){
    const user=getUser();
    const bookings=currentBookings();
    const grid=$("juzGrid"); grid.innerHTML="";
    (window.JUZ_DATA||[]).forEach(j=>{
      const bk=bookings[String(j.id)];
      const card=document.createElement("div");
      card.className="juz-card"+(bk?(bk.status==="done"?" completed":" reserved"):"");
      let ownerHtml=bk?'<span class="owner">'+(bk.status==="done"?"✅ "+bk.name+" • تمت":"📌 "+bk.name+" • محجوز")+"</span><br/>":"";
      card.innerHTML="<h3><span class='juz-num'>"+j.id+"</span>"+j.name+"</h3><div class='surahs'>"+j.surahs+"</div><div class='detail'>"+j.detail+"</div>"+ownerHtml+"<div class='card-actions'></div>";
      const act=card.querySelector(".card-actions");
      if(!bk){
        const btn=document.createElement("button");
        btn.className="btn btn-primary btn-small"; btn.textContent="اختيار هذا الجزء";
        btn.onclick=async()=>{
          if(!user){$("nameModal").classList.add("open");return;}
          if(MODE==="cloud"){ await cloudBook(j.id,user); renderJuz(); }
          else{
            const w=load(K_WEEKS,{}); if(!w[cur])localEnsure();
            const weeks=load(K_WEEKS,{});
            if(weeks[cur].bookings[String(j.id)]){UI.toast("الجزء ده اتحجز خلاص — اختار جزء غيره","warn");renderAll();return;}
            weeks[cur].bookings[String(j.id)]={name:user,status:"reserved",reservedAt:new Date().toISOString(),doneAt:null};
            save(K_WEEKS,weeks); UI.toast("اتحجز لك الجزء "+j.id+" يا "+user+" 🤍","success"); renderAll();
          }
        };
        act.appendChild(btn);
      } else if(bk.status==="reserved"){
        if(bk.name===user){
          const doneBtn=document.createElement("button");
          doneBtn.className="btn btn-primary btn-small"; doneBtn.textContent="تمت القراءة ✅";
          doneBtn.onclick=async()=>{
            if(MODE==="cloud"){ await cloudDone(j.id); } else {
              const w=load(K_WEEKS,{}); w[cur].bookings[String(j.id)].status="done";
              w[cur].bookings[String(j.id)].doneAt=new Date().toISOString(); save(K_WEEKS,w);
            }
            UI.toast("تقبل الله — اتسجل الجزء "+j.id+" مقروء 🤍","success");
            renderAll();
          };
          const cancelBtn=document.createElement("button");
          cancelBtn.className="btn btn-ghost btn-small"; cancelBtn.textContent="إلغاء الحجز";
          cancelBtn.onclick=async()=>{
            const ok=await UI.confirm({title:"إلغاء الحجز",message:"تلغي حجز الجزء "+j.id+"؟",okText:"أيوه، إلغي",cancelText:"لا"});
            if(!ok)return;
            if(MODE==="cloud"){ await cloudCancel(j.id); } else {
              const w=load(K_WEEKS,{}); delete w[cur].bookings[String(j.id)]; save(K_WEEKS,w);
            }
            renderAll();
          };
          act.appendChild(doneBtn); act.appendChild(cancelBtn);
        } else {
          const s=document.createElement("span"); s.className="muted"; s.textContent="محجوز — اختار جزء تاني";
          act.appendChild(s);
        }
      } else {
        const s=document.createElement("span"); s.className="muted";
        s.textContent=bk.name===user?"تمت قراءتك ✅ جزاك الله خيرا":"تمت بواسطة "+bk.name+" ✅";
        act.appendChild(s);
        if(bk.name===user){
          const un=document.createElement("button");
          un.className="btn btn-ghost btn-small"; un.textContent="تراجع";
          un.onclick=async()=>{
            if(MODE==="cloud"){ await cloudUnDone(j.id); } else {
              const w=load(K_WEEKS,{}); w[cur].bookings[String(j.id)].status="reserved";
              w[cur].bookings[String(j.id)].doneAt=null; save(K_WEEKS,w);
            }
            renderAll();
          };
          act.appendChild(un);
        }
      }
      grid.appendChild(card);
    });
  }

  function collectReportData(weekId,bookings,label){
    const done=[],pending=[],missing=[];
    for(let i=1;i<=30;i++){
      const b=bookings[String(i)];
      if(!b)missing.push(i);
      else if(b.status==="done")done.push({juz:i,name:b.name});
      else pending.push({juz:i,name:b.name});
    }
    const byPerson={};
    done.concat(pending).forEach(x=>{ byPerson[x.name]=byPerson[x.name]||{done:0,reserved:0,juzDone:[],juzPending:[]}; });
    done.forEach(x=>{byPerson[x.name].done++;byPerson[x.name].juzDone.push(x.juz);});
    pending.forEach(x=>{byPerson[x.name].reserved++;byPerson[x.name].juzPending.push(x.juz);});
    return {label,done,pending,missing,byPerson};
  }

  async function renderReports(){
    let weeksMap={}, bookingsByWeek={};
    if(MODE==="cloud"){
      weeksMap=cloudWeeks;
      // حمّل حجوزات كل الأسابيع (عدد صغير)
      try{
        const ss=await db.collection("hanen_bookings").get();
        ss.forEach(d=>{const v=d.data(); bookingsByWeek[v.weekId]=bookingsByWeek[v.weekId]||{}; bookingsByWeek[v.weekId][String(v.juzId)]=v;});
      }catch(e){}
      if(!weeksMap[cur])weeksMap[cur]={label:autoLabel()};
    } else {
      const w=load(K_WEEKS,{});
      Object.keys(w).forEach(id=>{weeksMap[id]={label:w[id].label}; bookingsByWeek[id]=w[id].bookings||{};});
    }
    const ids=Object.keys(weeksMap).sort().reverse();
    const cb=bookingsByWeek[cur]||currentBookings();
    const r=collectReportData(cur,cb,weeksMap[cur]?weeksMap[cur].label:autoLabel());
    $("weeklySummary").innerHTML="<strong>تقرير الأسبوع الحالي:</strong> "+r.label
      +" • تم: <b>"+r.done.length+"</b> • محجوز ولم يتم: <b>"+r.pending.length+"</b> • ناقص: <b class='missing'>"+(r.missing.length?r.missing.join("، "):"لا يوجد - تمت الختمة 🤍")+"</b>";
    const list=$("reportsList"); list.innerHTML="";
    if(!ids.length){list.innerHTML="<p class='muted'>لا توجد تقارير بعد</p>";return;}
    ids.forEach(id=>{
      const d=collectReportData(id,bookingsByWeek[id]||(id===cur?cb:{}),(weeksMap[id]&&weeksMap[id].label)||id);
      const div=document.createElement("div"); div.className="report";
      let rows=Object.entries(d.byPerson).map(([name,v])=>"<tr><td>"+name+"</td><td>"+v.done+" ("+(v.juzDone.join("، ")||"-")+")</td><td>"+v.reserved+" ("+(v.juzPending.join("، ")||"-")+")</td></tr>").join("");
      if(!rows)rows="<tr><td colspan='3' class='muted'>لا مشاركات بعد</td></tr>";
      div.innerHTML="<h3>"+d.label+" ("+id+")</h3><div>✅ تم: <b>"+d.done.length+"</b> • ⏳ محجوز ولم يتم: <b>"+d.pending.length+"</b> • ❌ ناقص: <b class='missing'>"+(d.missing.length?d.missing.join("، "):"اكتملت")+"</b></div>"
        +"<table><tr><th>الاسم</th><th>قرأ (جزء)</th><th>حجز ولم يتم</th></tr>"+rows+"</table>";
      list.appendChild(div);
    });
  }

  function exportReport(){
    const b=currentBookings();
    const d=collectReportData(cur,b,currentLabel());
    let t="تقرير ختمة حنين - "+d.label+" ("+cur+")\nتم: "+d.done.length+" / محجوز ولم يتم: "+d.pending.length+" / ناقص: "+d.missing.length+"\n\nتمت:\n";
    d.done.forEach(x=>{t+="جزء "+x.juz+" - "+x.name+"\n";});
    t+="\nمحجوز ولم يتم:\n"; d.pending.forEach(x=>{t+="جزء "+x.juz+" - "+x.name+"\n";});
    t+="\nالناقصة: "+(d.missing.join("، ")||"لا يوجد")+"\n";
    const blob=new Blob([t],{type:"text/plain;charset=utf-8"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download="تقرير-ختمة-حنين-"+cur+".txt"; a.click();
  }

  document.addEventListener("DOMContentLoaded",async()=>{
    document.querySelectorAll("[data-tab]").forEach(b=>{
      b.addEventListener("click",()=>{
        document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.tab===b.dataset.tab));
        document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===b.dataset.tab));
        if(b.dataset.tab==="reading"&&!getUser())$("nameModal").classList.add("open");
        else $("nameModal").classList.remove("open");
        window.scrollTo({top:0,behavior:"smooth"});
      });
    });
    $("saveNameBtn").onclick=()=>{ const v=norm($("userNameInput").value); if(!v){UI.toast("اكتب اسمك الأول عشان تحجز بيه","warn");return;} setUser(v); UI.toast("نورت الختمة يا "+v+" 🤍","success"); renderAll(); };
    $("userNameInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("saveNameBtn").click();});
    const saved=getUser(); if(saved)$("userNameInput").value=saved;
    $("changeNameBtn").onclick=()=>{ $("nameModal").classList.add("open"); };
    $("newWeekBtn").onclick=async()=>{
      const ok=await UI.confirm({title:"أسبوع جديد",message:"تبدأ أسبوع جديد؟ التقرير الحالي هيتحفظ في التقارير.",okText:"أيوه، ابدأ",cancelText:"لا"});
      if(!ok)return;
      const d=new Date();
      const nid="W-"+d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")+"-"+Date.now().toString().slice(-4);
      if(MODE==="cloud"){
        await db.collection("hanen_weeks").doc(nid).set({label:autoLabel(),start:d.toISOString(),updatedAt:d.toISOString()});
        cur=nid; save(K_CUR,cur); subscribeCloud(); renderAll();
      } else {
        const weeks=load(K_WEEKS,{});
        weeks[nid]={id:nid,label:autoLabel(),start:d.toISOString(),bookings:{}};
        save(K_WEEKS,weeks); cur=nid; save(K_CUR,cur); renderAll();
        UI.toast("بدأ أسبوع جديد — ربنا يتقبل 🤍","success");
      }
    };
    $("exportBtn").onclick=exportReport;
    document.querySelectorAll(".copy-dua").forEach(btn=>{
      btn.onclick=()=>{
        const txt=btn.parentElement.querySelector("p").textContent;
        navigator.clipboard.writeText(txt).then(()=>{btn.textContent="تم النسخ ✅";UI.toast("اتنسخ الدعاء — ادع لحنين 🤍","success");setTimeout(()=>btn.textContent="نسخ الدعاء",1500);});
      };
    });

    const cfg=fbCfg();
    if(cfg){
      setSyncStatus("جار الاتصال بالمزامنة...",false);
      const ok=await cloudInit(cfg);
      if(!ok){ localEnsure(); renderAll(); }
      else renderAll();
    } else {
      setSyncStatus("وضع عدم الاتصال: الحفظ على هذا الجهاز فقط — فعّل firebase-config.js للمشاركة",false);
      localEnsure(); renderAll();
    }
  });
})();
