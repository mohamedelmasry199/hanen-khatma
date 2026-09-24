// مسبحة حنين — عدادات ذكر تُهدى ثوابها لها (localStorage)
(function(){
  const K="hanen_tasbih_v1";
  const ADHKAR=[
    {id:"subhan", text:"سبحان الله وبحمده", target:100, hint:"حطّت خطاياه ولو كانت مثل زبد البحر — متفق عليه"},
    {id:"istighfar", text:"أستغفر الله لحنين", target:100, hint:"استغفار يرفع درجتها في الجنة بإذن الله"},
    {id:"salawat", text:"اللهم صل وسلم على نبينا محمد", target:100, hint:"من صلى علي صلاة صلى الله عليه بها عشرا — مسلم 384"},
    {id:"tahlil", text:"لا إله إلا الله", target:100, hint:"أفضل الذكر — الترمذي 3383"},
    {id:"hamd", text:"سبحان الله والحمد لله", target:100, hint:"تملآن ما بين السماوات والأرض — مسلم 223"},
    {id:"dua-hanin", text:"اللهم اغفر لحنين وارحمها", target:100, hint:"دعاء يصلها وينفعها بإذن الله"},
  ];
  const UI=window.HanenUI||{toast:function(m){alert(m);},confirm:function(m){return Promise.resolve(confirm(m));}};
  function load(){ try{return JSON.parse(localStorage.getItem(K))||{};}catch(e){return {};} }
  function save(v){ localStorage.setItem(K,JSON.stringify(v)); }
  function render(){
    const grid=document.getElementById("misbahaGrid"); if(!grid)return;
    const vals=load();
    let total=0;
    grid.innerHTML="";
    ADHKAR.forEach(d=>{
      const c=vals[d.id]||0; total+=c;
      const pct=Math.min(100,Math.round(c/d.target*100));
      const card=document.createElement("div"); card.className="sebha-card";
      card.innerHTML="<div class='sebha-top'><strong>"+d.text+"</strong><span class='sebha-count'>"+c+" / "+d.target+"</span></div>"
        +"<div class='sebha-bar'><div style='width:"+pct+"%'></div></div>"
        +"<small class='muted'>"+d.hint+"</small>"
        +"<div class='card-actions'><button class='btn btn-primary btn-small sebha-plus'>تسبيح +1</button><button class='btn btn-ghost btn-small sebha-reset'>تصفير</button></div>";
      card.querySelector(".sebha-plus").onclick=()=>{ const v=load(); v[d.id]=(v[d.id]||0)+1; save(v); render(); };
      card.querySelector(".sebha-reset").onclick=async()=>{ const ok=await UI.confirm({title:"تصفير العداد",message:"تصفّر عداد «"+d.text+"»؟",okText:"أيوه",cancelText:"لا"}); if(!ok)return; const v=load(); v[d.id]=0; save(v); render(); };
      grid.appendChild(card);
    });
    const t=document.getElementById("sebhaTotal");
    if(t) t.textContent="مجموع التسبيحات المهداة لحنين: "+total;
  }
  document.addEventListener("DOMContentLoaded",()=>{
    render();
    const r=document.getElementById("sebhaResetAll");
    if(r) r.onclick=async()=>{ const ok=await UI.confirm({title:"تصفير الكل",message:"تصفّر كل عدادات المسبحة؟",okText:"أيوه، صفّر",cancelText:"لا"}); if(!ok)return; save({}); render(); UI.toast("اتصفّرت كل العدادات","info"); };
  });
})();
