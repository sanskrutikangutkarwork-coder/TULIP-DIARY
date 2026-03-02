import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ─── Fonts & Global CSS ────────────────────────────────────────────────── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:ital,wght@0,400;0,700;1,700&family=Fredoka+One&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Comic Neue',cursive;-webkit-tap-highlight-color:transparent}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:rgba(255,255,255,.04)}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:4px}
input::-webkit-calendar-picker-indicator{filter:invert(1);opacity:.7}
textarea,input,select{font-family:'Comic Neue',cursive}
@keyframes splashIn{0%{opacity:0;transform:scale(.5) rotate(-10deg)}60%{opacity:1;transform:scale(1.08) rotate(2deg)}100%{transform:scale(1) rotate(0deg)}}
@keyframes tagline{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(30px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes slideRight{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(100,220,180,.35)}50%{box-shadow:0 0 0 12px rgba(100,220,180,0)}}
@keyframes toastSlide{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes petal{0%{transform:scale(1) rotate(0deg)}100%{transform:scale(1.15) rotate(5deg)}}
.tab-content{animation:slideUp .38s cubic-bezier(.34,1.56,.64,1) both}
.card{transition:transform .22s,box-shadow .22s}.card:hover{transform:translateY(-3px) scale(1.01);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.btn:active{transform:scale(.93)!important}
.spin{animation:spin 1s linear infinite}
.float{animation:float 3s ease-in-out infinite}
`;

/* ─── Storage ─────────────────────────────────────────────────────────────*/
const S={
  get:(k,d=null)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
};
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const todayKey=()=>new Date().toISOString().split("T")[0];
const fmtDate=s=>new Date(s+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const fmtDT=ms=>new Date(ms).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"});
const fmtTime=v=>{ try{ return new Date(v).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}catch{return v}};
const genCode=()=>Math.random().toString(36).slice(2,8).toUpperCase();

/* ─── EmailJS Config ──────────────────────────────────────────────────────
   FREE email service — sends registration alerts to Sanskruti's Gmail
   Setup instructions in README. Replace with your own EmailJS keys.
───────────────────────────────────────────────────────────────────────── */
const OWNER_EMAIL = "sanskrutikangutkar.work@gmail.com";
const EMAILJS_SERVICE_ID  = "service_sz8t98s";   // 🔧 Replace after EmailJS setup
const EMAILJS_TEMPLATE_ID = "template_bulkkyg";  // 🔧 Replace after EmailJS setup
const EMAILJS_PUBLIC_KEY  = "yAavuC-ELtr2o6J0q";   // 🔧 Replace after EmailJS setup

// Load EmailJS SDK once
function loadEmailJS(){
  if(window.emailjs) return Promise.resolve();
  return new Promise((res,rej)=>{
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    s.onload=()=>{window.emailjs.init(EMAILJS_PUBLIC_KEY);res()};
    s.onerror=rej;
    document.head.appendChild(s);
  });
}

// Send registration alert email to Sanskruti
async function sendRegistrationEmail({name, career, email, phone, accessCode}){
  try{
    await loadEmailJS();
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email:   OWNER_EMAIL,
      from_name:  name,
      user_career: career,
      user_email: email||"Not provided",
      user_phone: phone||"Not provided",
      access_code: accessCode,
      request_time: new Date().toLocaleString("en-IN"),
    });
    console.log("✅ Registration email sent to Sanskruti!");
  } catch(err){
    console.warn("Email send failed (EmailJS not configured yet):", err);
  }
}


/* ─── Themes ──────────────────────────────────────────────────────────────*/
const THEMES=[
  {name:"Tulip Pink",  bg:"linear-gradient(145deg,#0f0318 0%,#1e0530 40%,#0a0118 100%)",accent:"#f472b6",accent2:"#fbbfe8",card:"rgba(30,5,48,.92)",text:"#fff0fa",muted:"#906080",border:"rgba(244,114,182,.22)",green:"#4ade80",red:"#f87171",teal:"#5eead4"},
  {name:"Ocean",       bg:"linear-gradient(145deg,#010c18 0%,#041830 40%,#010810 100%)",accent:"#38bdf8",accent2:"#bae6fd",card:"rgba(4,18,40,.92)",text:"#e0f2fe",muted:"#2d6a90",border:"rgba(56,189,248,.22)",green:"#34d399",red:"#f87171",teal:"#5eead4"},
  {name:"Forest",      bg:"linear-gradient(145deg,#020d02 0%,#061806 40%,#020804 100%)",accent:"#4ade80",accent2:"#bbf7d0",card:"rgba(5,16,7,.92)",text:"#ecfdf5",muted:"#2d6a48",border:"rgba(74,222,128,.22)",green:"#4ade80",red:"#f87171",teal:"#a78bfa"},
  {name:"Galaxy",      bg:"linear-gradient(145deg,#0a0018 0%,#160330 40%,#080014 100%)",accent:"#a78bfa",accent2:"#ddd6fe",card:"rgba(18,4,40,.92)",text:"#f5f3ff",muted:"#6040a0",border:"rgba(167,139,250,.22)",green:"#34d399",red:"#f87171",teal:"#38bdf8"},
  {name:"Caramel",     bg:"linear-gradient(145deg,#120600 0%,#241000 40%,#120600 100%)",accent:"#fb923c",accent2:"#fed7aa",card:"rgba(32,12,0,.92)",text:"#fff7ed",muted:"#805020",border:"rgba(251,146,60,.22)",green:"#4ade80",red:"#f87171",teal:"#38bdf8"},
  {name:"Midnight",    bg:"linear-gradient(145deg,#08080f 0%,#10101e 40%,#08080f 100%)",accent:"#e2e8f0",accent2:"#ffffff",card:"rgba(16,16,30,.92)",text:"#f8fafc",muted:"#505070",border:"rgba(226,232,240,.18)",green:"#4ade80",red:"#f87171",teal:"#38bdf8"},
];

const AVATARS=["🌷","🦁","🐯","🦊","🌸","🌟","⚡","🔥","🌊","🎯","💎","🏆","🚀","🌙","🎭","👑","🎸","🌈","🦅","🐲","🌺","💫","🦄","🐻","🌻","🍀","🎪","🧊","🦋","🌴"];
const CAREERS=["Sales Professional","Insurance Advisor","Business Developer","Marketing Executive","Student – Competitive Exam","Student – College","Student – School","Entrepreneur","Startup Founder","Manager / Team Lead","Freelancer","Content Creator","Doctor","Engineer","Teacher","Lawyer","Accountant","HR Professional","Real Estate Agent","Financial Advisor","Fitness Trainer","Chef","Photographer","Designer","IT Professional","Consultant","Other"];

/* ─── Tulip SVG Logo ──────────────────────────────────────────────────────*/
const TulipLogo=({size=60,glow=false})=>(
  <svg width={size} height={size} viewBox="0 0 100 120" style={{filter:glow?`drop-shadow(0 0 ${size*.25}px #f472b6) drop-shadow(0 0 ${size*.1}px #38bdf8)`:"none"}}>
    {/* stem */}
    <line x1="50" y1="80" x2="50" y2="112" stroke="#4ade80" strokeWidth="4" strokeLinecap="round"/>
    {/* leaves */}
    <path d="M50 95 Q32 88 28 75 Q40 78 50 90" fill="#4ade80" opacity=".85"/>
    <path d="M50 95 Q68 88 72 75 Q60 78 50 90" fill="#4ade80" opacity=".85"/>
    {/* petals outer */}
    <ellipse cx="50" cy="42" rx="16" ry="26" fill="#f472b6" opacity=".9"/>
    <ellipse cx="35" cy="52" rx="13" ry="22" fill="#fb7185" opacity=".85" transform="rotate(-22 35 52)"/>
    <ellipse cx="65" cy="52" rx="13" ry="22" fill="#fb7185" opacity=".85" transform="rotate(22 65 52)"/>
    {/* inner cyan */}
    <ellipse cx="50" cy="38" rx="10" ry="18" fill="#38bdf8" opacity=".9"/>
    {/* shine */}
    <ellipse cx="45" cy="30" rx="4" ry="7" fill="white" opacity=".35"/>
    {/* smile arc */}
    <path d="M28 108 Q50 120 72 108" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════════ ROOT */
export default function App(){
  const [phase,setPhase]=useState("splash"); // splash → gate → app
  const [themeIdx,setThemeIdx]=useState(()=>S.get("tlp_theme",0));
  const T=THEMES[themeIdx];
  const [sessionUser,setSessionUser]=useState(()=>S.get("tlp_session",null));

  // Auto-advance splash
  useEffect(()=>{
    const t=setTimeout(()=>setPhase(S.get("tlp_session")?"app":"gate"),2800);
    return()=>clearTimeout(t);
  },[]);

  const saveTheme=i=>{setThemeIdx(i);S.set("tlp_theme",i)};
  const login=u=>{setSessionUser(u);S.set("tlp_session",u);setPhase("app")};
  const logout=()=>{setSessionUser(null);S.set("tlp_session",null);setPhase("gate")};

  if(phase==="splash") return <SplashScreen T={T}/>;
  if(phase==="gate")   return <GateScreen   T={T} themeIdx={themeIdx} saveTheme={saveTheme} onLogin={login}/>;
  return <MainApp T={T} themeIdx={themeIdx} saveTheme={saveTheme} sessionUser={sessionUser} onLogout={logout}/>;
}

/* ══════════════════════════════════════════════════════════════════════════ SPLASH */
function SplashScreen({T}){
  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Comic Neue',cursive",overflow:"hidden",position:"relative"}}>
      {/* decorative circles */}
      {[...Array(6)].map((_,i)=>(
        <div key={i} style={{position:"absolute",borderRadius:"50%",background:`radial-gradient(circle,${T.accent}18,transparent 70%)`,width:`${180+i*80}px`,height:`${180+i*80}px`,top:"50%",left:"50%",transform:"translate(-50%,-50%)",animation:`float ${3+i*.5}s ease-in-out ${i*.3}s infinite`}}/>
      ))}
      <div style={{animation:"splashIn .9s cubic-bezier(.34,1.56,.64,1) both",zIndex:2}}>
        <TulipLogo size={110} glow/>
      </div>
      <h1 style={{fontFamily:"'Bangers',cursive",fontSize:"clamp(52px,12vw,90px)",color:T.accent2,letterSpacing:8,margin:"10px 0 0",animation:"tagline .7s .6s both",textShadow:`0 0 40px ${T.accent}`,zIndex:2,position:"relative"}}>TULIP</h1>
      <p style={{color:T.accent,fontSize:"clamp(13px,3vw,18px)",fontWeight:700,fontStyle:"italic",animation:"tagline .7s .9s both",zIndex:2,position:"relative",marginTop:4}}>Life, Logged Beautifully 🌷</p>
      <p style={{color:T.muted,fontSize:11,fontWeight:700,marginTop:16,animation:"tagline .7s 1.2s both",zIndex:2,position:"relative",letterSpacing:1}}>by Sanskruti Kangutkar</p>
      <div style={{marginTop:32,animation:"tagline .7s 1.5s both",zIndex:2,position:"relative",display:"flex",gap:6}}>
        {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:T.accent,opacity:.3+i*.35,animation:`float ${1+i*.3}s ease-in-out ${i*.2}s infinite`}}/>)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ GATE */
function GateScreen({T,themeIdx,saveTheme,onLogin}){
  const owner=S.get("tlp_owner",null);
  const MASTER_KEY="TULIP2025Sanskruti";
  const [mode,setMode]=useState(owner?"login":"ownerSetup");
  const [masterInput,setMasterInput]=useState("");
  const [masterUnlocked,setMasterUnlocked]=useState(false);
  const [toast,setToast]=useState(null);
  const showToast=(m,c="#4ade80")=>{setToast({m,c});setTimeout(()=>setToast(null),3500)};
  const bgRef=useRef();
  const [bg,setBg]=useState(()=>S.get("tlp_bg",null));
  const handleBg=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setBg(ev.target.result);S.set("tlp_bg",ev.target.result)};r.readAsDataURL(f)};

  return(
    <div style={{minHeight:"100vh",background:bg?`url(${bg}) center/cover no-repeat`:T.bg,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      {bg&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.65)"}}/>}
      {!bg&&[...Array(4)].map((_,i)=><div key={i} style={{position:"absolute",borderRadius:"50%",background:`radial-gradient(circle,${T.accent}10,transparent 70%)`,width:`${300+i*150}px`,height:`${300+i*150}px`,top:"50%",left:"50%",transform:"translate(-50%,-50%)",animation:`float ${4+i}s ease-in-out ${i*.4}s infinite`}}/>)}

      {/* Top controls */}
      <div style={{position:"absolute",top:14,right:14,display:"flex",gap:6,zIndex:20,alignItems:"center"}}>
        {THEMES.map((t,i)=><div key={i} onClick={()=>saveTheme(i)} title={t.name} style={{width:18,height:18,borderRadius:"50%",background:`radial-gradient(circle at 35% 35%,${t.accent2},${t.accent})`,border:themeIdx===i?"3px solid white":"2px solid rgba(255,255,255,.25)",cursor:"pointer",transition:"transform .2s"}} onMouseEnter={e=>e.target.style.transform="scale(1.3)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}/>)}
        <button onClick={()=>bgRef.current.click()} style={microBtn(T)}>🖼️ Gallery</button>
        <input ref={bgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleBg}/>
        {owner&&<button onClick={()=>setMode("admin")} style={microBtn(T)}>⚙️ Owner</button>}
      </div>

      {toast&&<Toast msg={toast.m} color={toast.c} T={T}/>}

      <div style={{position:"relative",zIndex:5,width:"100%",maxWidth:440,padding:"0 18px",animation:"slideUp .5s ease"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:20}}>
          <div className="float"><TulipLogo size={72} glow/></div>
          <h1 style={{fontFamily:"'Bangers',cursive",color:T.accent2,fontSize:"clamp(36px,9vw,60px)",letterSpacing:5,textShadow:`0 0 30px ${T.accent}`,margin:"6px 0 2px"}}>TULIP</h1>
          <p style={{color:T.accent,fontSize:13,fontWeight:700,fontStyle:"italic"}}>Life, Logged Beautifully 🌷</p>
          <p style={{color:T.muted,fontSize:10,fontWeight:700,letterSpacing:1}}>by Sanskruti Kangutkar</p>
        </div>

        {mode==="ownerSetup"&&!masterUnlocked&&(
          <div style={{background:T.card,backdropFilter:"blur(24px)",border:`2px solid ${T.border}`,borderRadius:22,padding:28}}>
            <div style={{textAlign:"center",marginBottom:16}}><TulipLogo size={50} glow/></div>
            <h3 style={{fontFamily:"'Bangers',cursive",color:T.accent2,fontSize:22,letterSpacing:2,marginBottom:8,textAlign:"center"}}>👑 OWNER SETUP</h3>
            <p style={{color:T.muted,fontSize:13,fontWeight:700,marginBottom:6,textAlign:"center"}}>This is only for <span style={{color:T.accent}}>Sanskruti Kangutkar</span>.</p>
            <p style={{color:T.muted,fontSize:12,fontWeight:700,marginBottom:14,textAlign:"center"}}>If you are not the owner, please click Register below.</p>
            <input type="password" value={masterInput} onChange={e=>setMasterInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(masterInput===MASTER_KEY?setMasterUnlocked(true):showToast("❌ Wrong key!","#f87171"))} placeholder="Enter secret master key..." style={{display:"block",width:"100%",padding:"12px 14px",background:"rgba(255,255,255,.07)",border:`2px solid ${T.border}`,borderRadius:12,color:T.text,fontSize:14,fontFamily:"'Comic Neue',cursive",outline:"none",fontWeight:700,marginBottom:10}}/>
            <button onClick={()=>{if(masterInput===MASTER_KEY){setMasterUnlocked(true)}else{showToast("❌ Wrong key! Only Sanskruti can do this.","#f87171")}}} style={{width:"100%",padding:13,background:`linear-gradient(135deg,${T.accent},${T.accent2})`,border:"none",borderRadius:13,color:"#1a0a0a",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'Bangers',cursive",letterSpacing:2,marginBottom:10}}>UNLOCK 🔑</button>
            <button onClick={()=>setMode("register")} style={{width:"100%",padding:11,background:"transparent",border:`1px solid ${T.border}`,borderRadius:12,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700,fontSize:13}}>Not the owner? Register here →</button>
          </div>
        )}
        {mode==="ownerSetup"&&masterUnlocked&&<OwnerSetupFlow T={T} showToast={showToast} onDone={o=>{S.set("tlp_owner",o);onLogin(o)}}/>}
        {mode==="login"    &&<LoginFlow     T={T} showToast={showToast} onLogin={onLogin} onRegister={()=>setMode("register")} onAdmin={()=>setMode("admin")}/>}
        {mode==="register" &&<RegisterFlow  T={T} showToast={showToast} onBack={()=>setMode("login")} onPending={()=>setMode("pending")}/>}
        {mode==="pending"  &&<PendingScreen T={T} onBack={()=>setMode("login")}/>}
        {mode==="admin"    &&<AdminPanel    T={T} showToast={showToast} onLogin={onLogin} onBack={()=>setMode("login")}/>}
      </div>
    </div>
  );
}

/* ── Owner Setup ──────────────────────────────────────────────────────────*/
function OwnerSetupFlow({T,showToast,onDone}){
  const [step,setStep]=useState(1);
  const [name,setName]=useState(""),  [pwd,setPwd]=useState("");
  const [avatar,setAvatar]=useState("🌷"), [customAv,setCustomAv]=useState(null);
  const [career,setCareer]=useState("Sales Professional");
  const [email,setEmail]=useState(""), [phone,setPhone]=useState(""), [whatsapp,setWhatsapp]=useState(true);
  const [emailRem,setEmailRem]=useState(true);
  const [bg,setBg]=useState(null);
  const appCode=useMemo(()=>genCode(),[]);
  const avRef=useRef(), bgRef=useRef();

  const finish=()=>{
    if(!name.trim()){showToast("Name required!","#f87171");return}
    const o={id:uid(),name:name.trim(),pwd,avatar:customAv||avatar,career,email,phone,whatsapp,emailRem,bgImage:bg,appCode,isOwner:true,role:"owner",approved:true,createdAt:Date.now()};
    const users=S.get("tlp_users",[]);
    S.set("tlp_users",[...users,o]);
    onDone(o);
  };

  return(
    <div style={{background:T.card,backdropFilter:"blur(24px)",border:`2px solid ${T.border}`,borderRadius:24,padding:28}}>
      <p style={{color:T.accent,fontFamily:"'Bangers',cursive",fontSize:22,letterSpacing:2,marginBottom:4}}>STEP {step} OF 3</p>

      {step===1&&(<>
        <h3 style={{color:T.accent2,fontFamily:"'Fredoka One',cursive",fontSize:20,marginBottom:16}}>👤 Your Profile</h3>
        <label style={lbl}>CHOOSE YOUR AVATAR</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",margin:"7px 0 14px"}}>
          {AVATARS.map(a=><div key={a} onClick={()=>{setAvatar(a);setCustomAv(null)}} style={{width:40,height:40,borderRadius:11,background:avatar===a&&!customAv?`${T.accent}30`:"rgba(255,255,255,.07)",border:`2px solid ${avatar===a&&!customAv?T.accent:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,cursor:"pointer",transition:"all .15s"}}>{a}</div>)}
          <div onClick={()=>avRef.current.click()} style={{width:40,height:40,borderRadius:11,border:`2px dashed ${customAv?T.accent:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,cursor:"pointer",overflow:"hidden"}}>{customAv?<img src={customAv} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:"📷"}</div>
          <input ref={avRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setCustomAv(ev.target.result);r.readAsDataURL(f)}}/>
        </div>
        {[[name,setName,"Your Name *","text"],[pwd,setPwd,"Password (optional)","password"]].map(([v,s,p,t])=>(
          <div key={p} style={{marginBottom:12}}>
            <label style={lbl}>{p.toUpperCase()}</label>
            <input type={t} value={v} onChange={e=>s(e.target.value)} placeholder={p} style={inp(T)}/>
          </div>
        ))}
        <label style={lbl}>CAREER</label>
        <select value={career} onChange={e=>setCareer(e.target.value)} style={{...inp(T),marginTop:6,cursor:"pointer"}}>
          {CAREERS.map(c=><option key={c} value={c} style={{background:"#1a1a1a"}}>{c}</option>)}
        </select>
        <button className="btn" onClick={()=>setStep(2)} style={{...pBtn(T),marginTop:16}}>NEXT →</button>
      </>)}

      {step===2&&(<>
        <h3 style={{color:T.accent2,fontFamily:"'Fredoka One',cursive",fontSize:20,marginBottom:16}}>📧 Contact & Notifications</h3>
        {[[email,setEmail,"Email Address","email"],[phone,setPhone,"Phone / WhatsApp Number","tel"]].map(([v,s,p,t])=>(
          <div key={p} style={{marginBottom:12}}>
            <label style={lbl}>{p.toUpperCase()}</label>
            <input type={t} value={v} onChange={e=>s(e.target.value)} placeholder={p} style={inp(T)}/>
          </div>
        ))}
        {[[whatsapp,setWhatsapp,"📱 Get reminders on WhatsApp"],[emailRem,setEmailRem,"📧 Get reminders on Email"]].map(([v,s,label])=>(
          <label key={label} style={{display:"flex",alignItems:"center",gap:10,color:T.text,fontSize:14,fontWeight:700,marginBottom:12,cursor:"pointer",padding:"10px 12px",background:"rgba(255,255,255,.05)",borderRadius:12,border:`1px solid ${T.border}`}}>
            <input type="checkbox" checked={v} onChange={e=>s(e.target.checked)} style={{width:17,height:17,accentColor:T.accent}}/>{label}
          </label>
        ))}
        <label style={lbl}>BACKGROUND IMAGE (OPTIONAL)</label>
        <button onClick={()=>bgRef.current.click()} style={{display:"block",width:"100%",marginTop:6,padding:"10px",background:"rgba(255,255,255,.07)",border:`2px dashed ${T.border}`,borderRadius:12,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700,fontSize:13}}>
          {bg?"✅ Background set! Click to change":"🖼️ Upload from Gallery"}
        </button>
        <input ref={bgRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setBg(ev.target.result);r.readAsDataURL(f)}}/>
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button onClick={()=>setStep(1)} style={{flex:1,padding:12,background:"rgba(255,255,255,.07)",border:`1px solid ${T.border}`,borderRadius:12,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700}}>← Back</button>
          <button className="btn" onClick={()=>setStep(3)} style={{...pBtn(T),flex:2}}>NEXT →</button>
        </div>
      </>)}

      {step===3&&(<>
        <h3 style={{color:T.accent2,fontFamily:"'Fredoka One',cursive",fontSize:20,marginBottom:14}}>🔑 Your App Code</h3>
        <div style={{background:`${T.accent}15`,border:`2px solid ${T.accent}40`,borderRadius:16,padding:20,textAlign:"center",marginBottom:18}}>
          <p style={{color:T.muted,fontSize:11,fontWeight:700,marginBottom:6}}>TULIP ACCESS CODE</p>
          <p style={{fontFamily:"'Bangers',cursive",fontSize:46,color:T.accent2,letterSpacing:10,textShadow:`0 0 20px ${T.accent}60`}}>{appCode}</p>
          <p style={{color:T.muted,fontSize:11,fontWeight:700,marginTop:6}}>Share this with people you allow to use TULIP. You can change it later.</p>
        </div>
        <p style={{color:T.text,fontSize:13,fontWeight:700,lineHeight:1.7,marginBottom:18}}>
          Anyone who opens TULIP on their device must enter this code to register. You'll approve/reject them. Your diary content is always <span style={{color:T.accent}}>private</span> — you only control access.
        </p>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setStep(2)} style={{flex:1,padding:12,background:"rgba(255,255,255,.07)",border:`1px solid ${T.border}`,borderRadius:12,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700}}>← Back</button>
          <button className="btn" onClick={finish} style={{...pBtn(T),flex:2}}>🚀 LAUNCH TULIP!</button>
        </div>
      </>)}

      <div style={{display:"flex",justifyContent:"center",gap:7,marginTop:16}}>
        {[1,2,3].map(s=><div key={s} style={{height:7,borderRadius:4,background:s<=step?T.accent:`${T.accent}30`,width:s===step?28:7,transition:"all .3s"}}/>)}
      </div>
    </div>
  );
}

/* ── Login Flow ──────────────────────────────────────────────────────────*/
function LoginFlow({T,showToast,onLogin,onRegister,onAdmin}){
  const users=S.get("tlp_users",[]).filter(u=>u.approved&&!u.rejected);
  const [sel,setSel]=useState(null);
  const [pwd,setPwd]=useState(""), [showPwd,setShowPwd]=useState(false), [err,setErr]=useState("");

  const go=()=>{
    if(!sel){setErr("Select a user first!");return}
    const u=users.find(x=>x.id===sel);
    if(!u){setErr("User not found.");return}
    if(u.pwd&&u.pwd!==pwd){setErr("Wrong password! 🔐");return}
    onLogin(u);
  };

  return(
    <div style={{background:T.card,backdropFilter:"blur(24px)",border:`2px solid ${T.border}`,borderRadius:22,padding:26}}>
      <h3 style={{color:T.accent,fontFamily:"'Fredoka One',cursive",fontSize:20,marginBottom:14}}>👋 Welcome Back!</h3>
      {users.length===0&&<p style={{color:T.muted,fontSize:13,fontWeight:700,marginBottom:12}}>No users yet. Register to start!</p>}
      <div style={{maxHeight:200,overflowY:"auto",marginBottom:12}}>
        {users.map(u=>(
          <div key={u.id} onClick={()=>{setSel(u.id);setErr("")}} style={{display:"flex",alignItems:"center",gap:11,padding:"10px 13px",borderRadius:13,border:`2px solid ${sel===u.id?T.accent:T.border}`,background:sel===u.id?`${T.accent}20`:"rgba(255,255,255,.05)",marginBottom:7,cursor:"pointer",transition:"all .2s"}}>
            <AvatarBox av={u.avatar} size={42} T={T}/>
            <div>
              <p style={{color:T.text,fontWeight:700,fontSize:14,margin:0}}>{u.name}{u.role==="owner"&&" 👑"}{u.role==="coowner"&&" 🔰"}</p>
              <p style={{color:T.muted,fontSize:11,fontWeight:700,margin:0}}>{u.career}</p>
            </div>
          </div>
        ))}
      </div>
      {sel&&users.find(u=>u.id===sel)?.pwd&&(
        <div style={{position:"relative",marginBottom:10}}>
          <input type={showPwd?"text":"password"} value={pwd} onChange={e=>{setPwd(e.target.value);setErr("")}} placeholder="Password..." onKeyDown={e=>e.key==="Enter"&&go()} style={{...inp(T),paddingRight:44}}/>
          <span onClick={()=>setShowPwd(!showPwd)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:18}}>{showPwd?"🙈":"👁️"}</span>
        </div>
      )}
      {err&&<p style={{color:T.red,fontSize:13,fontWeight:700,marginBottom:8}}>❌ {err}</p>}
      <button className="btn" onClick={go} style={pBtn(T)}>OPEN DIARY →</button>
      <button onClick={onRegister} style={{display:"block",width:"100%",marginTop:9,padding:11,background:"rgba(255,255,255,.06)",border:`1px solid ${T.border}`,borderRadius:12,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700,fontSize:14}}>
        ➕ New User? Register
      </button>
      <button onClick={onAdmin} style={{display:"block",width:"100%",marginTop:6,padding:9,background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700,fontSize:12,textDecoration:"underline"}}>
        ⚙️ Owner / Admin Panel
      </button>
    </div>
  );
}

/* ── Register Flow ────────────────────────────────────────────────────────*/
function RegisterFlow({T,showToast,onBack,onPending}){
  const owner=S.get("tlp_owner",null);
  const [name,setName]=useState(""), [career,setCareer]=useState("Sales Professional");
  const [email,setEmail]=useState(""), [phone,setPhone]=useState(""), [whatsapp,setWhatsapp]=useState(true);
  const [pwd,setPwd]=useState(""), [code,setCode]=useState("");
  const [avatar,setAvatar]=useState("🌸"), [customAv,setCustomAv]=useState(null);
  const avRef=useRef();

  const submit=()=>{
    if(!name.trim()||!code.trim()){showToast("Name & App Code required!","#f87171");return}
    if(code.trim().toUpperCase()!==owner?.appCode){showToast("❌ Wrong App Code! Contact owner.","#f87171");return}
    const users=S.get("tlp_users",[]);
    if(users.find(u=>u.name.toLowerCase()===name.trim().toLowerCase())){showToast("Name already taken!","#f87171");return}
    const accessCode = genCode();
    const u={id:uid(),name:name.trim(),avatar:customAv||avatar,career,email,phone,whatsapp,pwd,approved:false,role:"user",accessCode,createdAt:Date.now()};
    S.set("tlp_users",[...users,u]);
    // 📧 Send email alert to Sanskruti
    sendRegistrationEmail({
      name: name.trim(),
      career,
      email,
      phone,
      accessCode,
    });
    onPending();
    showToast("Request sent! Awaiting approval ✨","#4ade80");
  };

  return(
    <div style={{background:T.card,backdropFilter:"blur(24px)",border:`2px solid ${T.border}`,borderRadius:22,padding:26,maxHeight:"82vh",overflowY:"auto"}}>
      <h3 style={{color:T.accent,fontFamily:"'Fredoka One',cursive",fontSize:20,marginBottom:14}}>📝 Register for TULIP</h3>
      <label style={lbl}>AVATAR</label>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",margin:"7px 0 14px"}}>
        {AVATARS.slice(0,16).map(a=><div key={a} onClick={()=>{setAvatar(a);setCustomAv(null)}} style={{width:36,height:36,borderRadius:10,background:avatar===a&&!customAv?`${T.accent}30`:"rgba(255,255,255,.07)",border:`2px solid ${avatar===a&&!customAv?T.accent:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,cursor:"pointer"}}>{a}</div>)}
        <div onClick={()=>avRef.current.click()} style={{width:36,height:36,borderRadius:10,border:`2px dashed ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",overflow:"hidden"}}>{customAv?<img src={customAv} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:"📷"}</div>
        <input ref={avRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setCustomAv(ev.target.result);r.readAsDataURL(f)}}/>
      </div>
      {[[name,setName,"Full Name *","text"],[email,setEmail,"Email","email"],[phone,setPhone,"Phone/WhatsApp","tel"],[pwd,setPwd,"Password (optional)","password"],[code,setCode,"App Code * (from owner)","text"]].map(([v,s,p,t])=>(
        <div key={p} style={{marginBottom:11}}>
          <label style={lbl}>{p.toUpperCase()}</label>
          <input type={t} value={v} onChange={e=>s(e.target.value)} placeholder={p} style={inp(T)} maxLength={p.includes("Code")?6:undefined}/>
        </div>
      ))}
      <label style={lbl}>CAREER</label>
      <select value={career} onChange={e=>setCareer(e.target.value)} style={{...inp(T),marginTop:6,marginBottom:14,cursor:"pointer"}}>
        {CAREERS.map(c=><option key={c} value={c} style={{background:"#1a1a1a"}}>{c}</option>)}
      </select>
      <label style={{display:"flex",alignItems:"center",gap:8,color:T.text,fontSize:13,fontWeight:700,marginBottom:14,cursor:"pointer"}}>
        <input type="checkbox" checked={whatsapp} onChange={e=>setWhatsapp(e.target.checked)} style={{width:15,height:15,accentColor:T.accent}}/> 📱 WhatsApp reminders
      </label>
      <button className="btn" onClick={submit} style={pBtn(T)}>REQUEST ACCESS 🌷</button>
      <button onClick={onBack} style={{display:"block",width:"100%",marginTop:8,padding:10,background:"transparent",border:`1px solid ${T.border}`,borderRadius:12,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700}}>← Back</button>
    </div>
  );
}

function PendingScreen({T,onBack}){
  return(
    <div style={{background:T.card,backdropFilter:"blur(24px)",border:`2px solid ${T.border}`,borderRadius:22,padding:30,textAlign:"center"}}>
      <div style={{fontSize:60,marginBottom:12}} className="float">⏳</div>
      <h3 style={{fontFamily:"'Bangers',cursive",color:T.accent2,fontSize:26,letterSpacing:1,marginBottom:8}}>REQUEST SENT!</h3>
      <p style={{color:T.text,fontSize:14,fontWeight:700,lineHeight:1.7,marginBottom:18}}>Your request has been sent to the owner!<br/>Once approved, you can log in.</p>
    <div style={{background:`${T.accent}15`,border:`2px solid ${T.accent}40`,borderRadius:14,padding:16,marginBottom:16,textAlign:"center"}}>
      <p style={{color:T.muted,fontSize:11,fontWeight:700,marginBottom:6}}>📧 The owner has been notified on their email.</p>
      <p style={{color:T.accent,fontSize:13,fontWeight:700}}>They will approve you shortly! 🌷</p>
    </div>
      <button onClick={onBack} style={pBtn(T)}>← BACK TO LOGIN</button>
    </div>
  );
}

/* ── Admin Panel ─────────────────────────────────────────────────────────*/
function AdminPanel({T,showToast,onLogin,onBack}){
  const owner=S.get("tlp_owner",null);
  const [unlocked,setUnlocked]=useState(false);
  const [adminPwd,setAdminPwd]=useState(""), [newCode,setNewCode]=useState(owner?.appCode||"");
  const [confirm,setConfirm]=useState(null);
  const [users,setUsers]=useState(()=>S.get("tlp_users",[]));
  const refresh=()=>setUsers(S.get("tlp_users",[]));

  const pending=users.filter(u=>!u.approved&&!u.rejected);
  const approved=users.filter(u=>u.approved&&!u.rejected);

  const approve=(id,yes)=>{
    if(confirm){
      const upd=users.map(u=>u.id===id?{...u,approved:yes,rejected:!yes}:u);
      S.set("tlp_users",upd);refresh();
      showToast(yes?"✅ Approved!":"❌ Rejected.","#4ade80");
      setConfirm(null);
    } else { setConfirm({id,name:users.find(u=>u.id===id)?.name,yes}); }
  };
  const removeUser=id=>{const upd=users.filter(u=>u.id!==id);S.set("tlp_users",upd);refresh();showToast("User removed.","#f87171")};
  const toggleCoOwner=id=>{const upd=users.map(u=>u.id===id?{...u,role:u.role==="coowner"?"user":"coowner"}:u);S.set("tlp_users",upd);refresh()};
  const changeCode=()=>{if(!newCode.trim())return;const o={...owner,appCode:newCode.trim().toUpperCase()};S.set("tlp_owner",o);showToast("App code updated! ✅","#4ade80")};

  // Usage summary — who logged in recently (from session logs)
  const usageLogs=S.get("tlp_usage_logs",[]);

  if(!unlocked) return(
    <div style={{background:T.card,backdropFilter:"blur(24px)",border:`2px solid ${T.border}`,borderRadius:22,padding:26}}>
      <h3 style={{color:T.accent,fontFamily:"'Fredoka One',cursive",fontSize:20,marginBottom:14}}>👑 Owner Panel</h3>
      <input type="password" value={adminPwd} onChange={e=>setAdminPwd(e.target.value)} placeholder="Owner password..." style={inp(T)}/>
      <button className="btn" onClick={()=>{if(adminPwd===owner?.pwd||!owner?.pwd){setUnlocked(true)}else showToast("Wrong password!","#f87171")}} style={{...pBtn(T),marginTop:10}}>UNLOCK</button>
      <button onClick={onBack} style={{display:"block",width:"100%",marginTop:8,padding:10,background:"transparent",border:`1px solid ${T.border}`,borderRadius:12,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700}}>← Back</button>
    </div>
  );

  return(
    <div style={{background:T.card,backdropFilter:"blur(24px)",border:`2px solid ${T.border}`,borderRadius:22,padding:24,maxHeight:"85vh",overflowY:"auto"}}>
      <h3 style={{color:T.accent,fontFamily:"'Bangers',cursive",fontSize:24,letterSpacing:2,marginBottom:16}}>👑 OWNER PANEL</h3>

      {/* Pending */}
      {pending.length>0&&(<>
        <h4 style={{color:T.accent2,fontFamily:"'Fredoka One',cursive",fontSize:16,marginBottom:10}}>⏳ Pending Requests ({pending.length})</h4>
        {pending.map(u=>(
          <div key={u.id} style={{background:`${T.accent}10`,border:`2px solid ${T.accent}35`,borderRadius:14,padding:14,marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <AvatarBox av={u.avatar} size={40} T={T}/>
              <div><p style={{color:T.text,fontWeight:700,fontSize:13,margin:0}}>{u.name}</p><p style={{color:T.muted,fontSize:11,margin:0}}>{u.career} · {u.email||u.phone||"No contact"}</p></div>
            </div>
            <div style={{display:"flex",gap:7}}>
              <button onClick={()=>approve(u.id,true)} style={{flex:1,padding:"8px",background:`${T.green}20`,border:`2px solid ${T.green}`,borderRadius:10,color:T.green,fontWeight:700,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontSize:12}}>✅ Approve</button>
              <button onClick={()=>approve(u.id,false)} style={{flex:1,padding:"8px",background:`${T.red}15`,border:`2px solid ${T.red}`,borderRadius:10,color:T.red,fontWeight:700,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontSize:12}}>❌ Reject</button>
            </div>
          </div>
        ))}
      </>)}

      {/* Approved Users + AI review */}
      <h4 style={{color:T.accent2,fontFamily:"'Fredoka One',cursive",fontSize:16,margin:"14px 0 10px"}}>👥 Users ({approved.length})</h4>
      {approved.map(u=>{
        const daysSince=Math.floor((Date.now()-u.createdAt)/86400000);
        const ai=u.role==="owner"?"Owner of TULIP — primary access holder.":daysSince<2?"New user — give them some time to settle in 🌱":daysSince>14?"⚠️ Long-term user — check diary activity regularly.":"Active member.";
        return(
          <div key={u.id} style={{border:`1px solid ${T.border}`,borderRadius:12,padding:12,marginBottom:8,background:"rgba(255,255,255,.03)"}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <AvatarBox av={u.avatar} size={36} T={T}/>
              <div style={{flex:1}}>
                <p style={{color:T.text,fontWeight:700,fontSize:13,margin:0}}>{u.name} {u.role==="owner"&&"👑"}{u.role==="coowner"&&"🔰"}</p>
                <p style={{color:T.muted,fontSize:10,margin:0}}>{u.career}</p>
                <p style={{color:T.teal,fontSize:10,margin:"2px 0 0",fontStyle:"italic"}}>{ai}</p>
              </div>
              {u.role!=="owner"&&(
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <button onClick={()=>toggleCoOwner(u.id)} style={{padding:"3px 8px",background:`${T.teal}15`,border:`1px solid ${T.teal}`,borderRadius:7,color:T.teal,fontWeight:700,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontSize:10}}>{u.role==="coowner"?"Demote":"Co-Owner"}</button>
                  <button onClick={()=>removeUser(u.id)} style={{padding:"3px 8px",background:`${T.red}10`,border:`1px solid ${T.red}`,borderRadius:7,color:T.red,fontWeight:700,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontSize:10}}>Remove</button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Change App Code */}
      <h4 style={{color:T.accent2,fontFamily:"'Fredoka One',cursive",fontSize:16,margin:"16px 0 8px"}}>🔑 Change App Code</h4>
      <div style={{display:"flex",gap:7}}>
        <input value={newCode} onChange={e=>setNewCode(e.target.value.toUpperCase())} maxLength={6} style={{...inp(T),flex:1,letterSpacing:6,fontFamily:"'Bangers',cursive",fontSize:18}}/>
        <button onClick={changeCode} style={{padding:"10px 16px",background:`${T.accent}25`,border:`2px solid ${T.accent}`,borderRadius:12,color:T.accent,fontWeight:700,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontSize:13}}>Save</button>
      </div>

      <button onClick={onBack} style={{display:"block",width:"100%",marginTop:14,padding:11,background:"transparent",border:`1px solid ${T.border}`,borderRadius:12,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700}}>← Back to Login</button>

      {/* Confirm modal */}
      {confirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:T.card,border:`2px solid ${T.accent}`,borderRadius:22,padding:28,maxWidth:340,textAlign:"center",animation:"slideUp .3s ease"}}>
            <div style={{fontSize:48,marginBottom:10}}>🤔</div>
            <h3 style={{fontFamily:"'Bangers',cursive",color:T.accent2,fontSize:22,letterSpacing:1,marginBottom:8}}>ARE YOU SURE?</h3>
            <p style={{color:T.text,fontSize:14,fontWeight:700,lineHeight:1.7,marginBottom:18}}><span style={{color:T.accent}}>{confirm.name}</span> {confirm.yes?"wants to join TULIP":"will be rejected"}. Confirm?</p>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirm(null)} style={{flex:1,padding:11,background:"rgba(255,255,255,.08)",border:`1px solid ${T.border}`,borderRadius:12,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700}}>Cancel</button>
              <button onClick={()=>approve(confirm.id,confirm.yes)} style={{flex:1,padding:11,background:confirm.yes?`${T.green}25`:`${T.red}20`,border:`2px solid ${confirm.yes?T.green:T.red}`,borderRadius:12,color:confirm.yes?T.green:T.red,fontWeight:700,cursor:"pointer",fontFamily:"'Comic Neue',cursive"}}>
                {confirm.yes?"✅ Approve!":"❌ Reject!"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ MAIN APP */
function MainApp({T,themeIdx,saveTheme,sessionUser,onLogout}){
  const today=todayKey();
  const [diaries,setDiaries]=useState(()=>S.get(`tlp_diaries_${sessionUser.id}`,[{id:"default",name:"My Diary",icon:"📔",createdAt:Date.now()}]));
  const [activeDiary,setActiveDiary]=useState(()=>S.get(`tlp_adiary_${sessionUser.id}`,"default"));
  const [tab,setTab]=useState("overview");
  const [selectedDate,setSelectedDate]=useState(today);
  const [reminders,setReminders]=useState(()=>S.get(`tlp_rem_${sessionUser.id}`,[]) || []);
  const [taskHistory,setTaskHistory]=useState(()=>S.get(`tlp_th_${sessionUser.id}`,[]) || []);
  const [customTabs,setCustomTabs]=useState(()=>S.get(`tlp_ct_${sessionUser.id}`,[]) || []);
  const [tabLabels,setTabLabels]=useState(()=>S.get(`tlp_tl_${sessionUser.id}`,{}) || {});
  const [toastRem,setToastRem]=useState(null);
  const [showDiary,setShowDiary]=useState(false);
  const [toast,setToast]=useState(null);
  const bgRef=useRef();
  const [bgImage,setBgImage]=useState(()=>S.get("tlp_bg")||sessionUser.bgImage);
  const handleBg=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setBgImage(ev.target.result);S.set("tlp_bg",ev.target.result)};r.readAsDataURL(f)};

  const showToast=(m,c="#4ade80")=>{setToast({m,c});setTimeout(()=>setToast(null),3000)};

  // attendance auto-mark
  useEffect(()=>{
    const att=S.get(`tlp_att_${sessionUser.id}`,{});
    if(!att[today]||!att[today].timeIn){
      att[today]={...att[today],status:"present",timeIn:new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})};
      S.set(`tlp_att_${sessionUser.id}`,att);
    }
    // log usage
    const logs=S.get("tlp_usage_logs",[]);
    const todayLog=logs.find(l=>l.uid===sessionUser.id&&l.date===today);
    if(!todayLog){S.set("tlp_usage_logs",[...logs,{uid:sessionUser.id,name:sessionUser.name,date:today,ts:Date.now()}]);}
  },[]);

  // reminder checker
  useEffect(()=>{
    const iv=setInterval(()=>{
      const now=new Date();
      const upd=reminders.map(r=>{
        if(!r.fired&&r.dt&&Math.abs(now-new Date(r.dt))<60000){setToastRem(r);return{...r,fired:true}}
        return r;
      });
      if(JSON.stringify(upd)!==JSON.stringify(reminders)){setReminders(upd);S.set(`tlp_rem_${sessionUser.id}`,upd)}
    },30000);
    return()=>clearInterval(iv);
  },[reminders]);

  const saveDiaries=d=>{setDiaries(d);S.set(`tlp_diaries_${sessionUser.id}`,d)};
  const switchDiary=id=>{setActiveDiary(id);S.set(`tlp_adiary_${sessionUser.id}`,id);setShowDiary(false)};

  const dKey=dt=>`tlp_day_${sessionUser.id}_${activeDiary}_${dt}`;
  const dayData=dt=>S.get(dKey(dt),{tasks:[],updates:[],sticky:[],endNote:"",photos:[]});
  const saveDay=(dt,data)=>S.set(dKey(dt),data);

  const addTaskHistory=text=>{if(text&&!taskHistory.includes(text)){const h=[text,...taskHistory].slice(0,200);setTaskHistory(h);S.set(`tlp_th_${sessionUser.id}`,h)}};
  const addReminder=r=>{const upd=[...reminders,r];setReminders(upd);S.set(`tlp_rem_${sessionUser.id}`,upd)};
  const updateReminders=upd=>{setReminders(upd);S.set(`tlp_rem_${sessionUser.id}`,upd)};

  const snooze=(r,m)=>{const d=new Date(Date.now()+m*60000).toISOString();const upd=reminders.map(x=>x.id===r.id?{...x,dt:d,fired:false}:x);updateReminders(upd);setToastRem(null);showToast(`⏰ Snoozed ${m}m`)};
  const dismissRem=r=>{const upd=reminders.map(x=>x.id===r.id?{...x,fired:true,dismissed:true}:x);updateReminders(upd);setToastRem(null)};

  const BASE_TABS=[
    {id:"overview",   defIcon:"🗓️", defLabel:"Overview"},
    {id:"tasks",      defIcon:"✅",  defLabel:"Tasks"},
    {id:"updates",    defIcon:"📝",  defLabel:"Updates"},
    {id:"sticky",     defIcon:"📌",  defLabel:"Sticky Notes"},
    {id:"attendance", defIcon:"📊",  defLabel:"Attendance"},
    {id:"photos",     defIcon:"📸",  defLabel:"Photos"},
    {id:"summaries",  defIcon:"🤖",  defLabel:"AI Summaries"},
  ];
  const ALL_TABS=[
    ...BASE_TABS.map(t=>({...t,icon:tabLabels[t.id+"_icon"]||t.defIcon,label:tabLabels[t.id+"_label"]||t.defLabel})),
    ...customTabs.map(c=>({id:`ct_${c.id}`,icon:c.icon||"📂",label:c.name}))
  ];

  const saveTabLabel=(id,key,val)=>{
    const upd={...tabLabels,[`${id}_${key}`]:val};
    setTabLabels(upd);S.set(`tlp_tl_${sessionUser.id}`,upd);
  };

  const [editingTab,setEditingTab]=useState(null);
  const currentDiary=diaries.find(d=>d.id===activeDiary)||diaries[0];

  return(
    <div style={{minHeight:"100vh",background:bgImage?`url(${bgImage}) center/cover fixed`:T.bg,fontFamily:"'Comic Neue',cursive",color:T.text,position:"relative"}}>
      {bgImage&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.63)",zIndex:0}}/>}

      {/* Reminder Toast */}
      {toastRem&&(
        <div style={{position:"fixed",top:18,right:18,zIndex:9999,background:T.card,border:`2px solid ${T.accent}`,borderRadius:18,padding:"15px 18px",maxWidth:340,backdropFilter:"blur(20px)",boxShadow:`0 8px 28px ${T.accent}40`,animation:"toastSlide .3s ease",fontFamily:"'Comic Neue',cursive"}}>
          <p style={{color:T.accent2,fontFamily:"'Bangers',cursive",fontSize:17,letterSpacing:1,margin:"0 0 5px"}}>⏰ REMINDER!</p>
          <p style={{color:T.text,fontWeight:700,fontSize:14,margin:"0 0 12px"}}>{toastRem.text}</p>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            <button onClick={()=>dismissRem(toastRem)} style={{padding:"5px 11px",background:`${T.green}20`,border:`2px solid ${T.green}`,borderRadius:8,color:T.green,fontWeight:700,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontSize:11}}>✅ Done</button>
            {[15,30,60,120].map(m=><button key={m} onClick={()=>snooze(toastRem,m)} style={{padding:"5px 9px",background:"rgba(255,255,255,.07)",border:`1px solid ${T.border}`,borderRadius:8,color:T.muted,fontWeight:700,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontSize:11}}>+{m}m</button>)}
          </div>
        </div>
      )}

      {toast&&<Toast msg={toast.m} color={toast.c} T={T}/>}

      {/* Floating sticky */}
      <button title="Quick Sticky Note" style={{position:"fixed",bottom:26,right:26,zIndex:200,width:56,height:56,borderRadius:"50%",background:`linear-gradient(135deg,${T.accent},${T.accent2})`,border:"none",fontSize:24,cursor:"pointer",boxShadow:`0 5px 22px ${T.accent}60`,animation:"pulse 2.5s infinite"}}
        onClick={()=>setTab("sticky")}>📌</button>

      <div style={{position:"relative",zIndex:1,maxWidth:1000,margin:"0 auto",paddingBottom:88}}>

        {/* ── HEADER ── */}
        <div style={{padding:"14px 14px 0"}}>
          <div style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:20,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:9}}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              <TulipLogo size={36}/>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <AvatarBox av={sessionUser.avatar} size={42} T={T}/>
                <div>
                  <h1 style={{fontFamily:"'Bangers',cursive",margin:0,fontSize:"clamp(16px,3.5vw,24px)",color:T.accent2,letterSpacing:2,textShadow:`0 0 14px ${T.accent}50`}}>{currentDiary.icon} {currentDiary.name}</h1>
                  <p style={{margin:"2px 0 0",color:T.muted,fontSize:11,fontWeight:700}}>{fmtDate(selectedDate)}</p>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
              {THEMES.map((t,i)=><div key={i} onClick={()=>saveTheme(i)} title={t.name} style={{width:15,height:15,borderRadius:"50%",background:`radial-gradient(circle at 35% 35%,${t.accent2},${t.accent})`,border:themeIdx===i?"3px solid white":"2px solid rgba(255,255,255,.2)",cursor:"pointer"}}/>)}
              <button onClick={()=>bgRef.current.click()} style={microBtn(T)}>🖼️</button>
              <input ref={bgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleBg}/>
              <button onClick={()=>setShowDiary(true)} style={microBtn(T)}>📒</button>
              <input type="date" value={selectedDate} max={today} onChange={e=>setSelectedDate(e.target.value)} style={{background:"rgba(255,255,255,.08)",border:`1px solid ${T.border}`,borderRadius:9,color:T.text,padding:"5px 9px",fontSize:11,fontFamily:"'Comic Neue',cursive",cursor:"pointer",fontWeight:700}}/>
              <button className="btn" onClick={onLogout} style={{background:"rgba(248,113,113,.2)",border:"2px solid rgba(248,113,113,.5)",color:"#f87171",borderRadius:9,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"'Comic Neue',cursive",fontWeight:700}}>🚪 Logout</button>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{padding:"8px 14px 0",overflowX:"auto",scrollbarWidth:"none"}}>
          <div style={{display:"flex",gap:5,paddingBottom:4,minWidth:"max-content"}}>
            {ALL_TABS.map(t=>(
              <div key={t.id} style={{position:"relative"}}>
                <button onClick={()=>setTab(t.id)} onContextMenu={e=>{e.preventDefault();setEditingTab(t.id)}}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"9px 12px",borderRadius:14,border:`2px solid ${tab===t.id?T.accent:T.border}`,background:tab===t.id?`${T.accent}25`:"rgba(255,255,255,.05)",color:tab===t.id?T.accent:T.muted,cursor:"pointer",fontSize:10,whiteSpace:"nowrap",fontFamily:"'Comic Neue',cursive",fontWeight:700,minWidth:66,gap:2,transform:tab===t.id?"translateY(-3px)":"none",boxShadow:tab===t.id?`0 5px 16px ${T.accent}40`:"none",transition:"all .25s"}}>
                  <span style={{fontSize:26}}>{t.icon}</span><span>{t.label}</span>
                </button>
                {/* Edit tab label on long-press/right-click */}
                {editingTab===t.id&&(
                  <TabEditor T={T} tab={t} onSave={(icon,label)=>{saveTabLabel(t.id,"icon",icon);saveTabLabel(t.id,"label",label);setEditingTab(null)}} onClose={()=>setEditingTab(null)}/>
                )}
              </div>
            ))}
            <button onClick={()=>{const n=prompt("New tab name:");if(!n?.trim())return;const icon=prompt("Icon (emoji):")||"📂";const upd=[...customTabs,{id:uid(),name:n.trim(),icon}];setCustomTabs(upd);S.set(`tlp_ct_${sessionUser.id}`,upd)}}
              style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"9px 12px",borderRadius:14,border:`2px dashed ${T.border}`,background:"rgba(255,255,255,.03)",color:T.muted,cursor:"pointer",fontSize:10,fontFamily:"'Comic Neue',cursive",fontWeight:700,minWidth:66,gap:2,transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted}}>
              <span style={{fontSize:26}}>➕</span><span>Add Tab</span>
            </button>
          </div>
          <p style={{color:T.muted,fontSize:10,fontWeight:700,padding:"2px 0 0"}}>💡 Right-click any tab to rename it / change icon</p>
        </div>

        {/* ── CONTENT ── */}
        <div className="tab-content" key={tab+activeDiary+selectedDate} style={{padding:"12px 14px 0"}}>
          {tab==="overview"   &&<OverviewTab   T={T} date={selectedDate} today={today} dayData={dayData} saveDay={saveDay} profile={sessionUser} reminders={reminders}/>}
          {tab==="tasks"      &&<TasksTab      T={T} date={selectedDate} dayData={dayData} saveDay={saveDay} taskHistory={taskHistory} addTaskHistory={addTaskHistory}/>}
          {tab==="updates"    &&<UpdatesTab    T={T} date={selectedDate} dayData={dayData} saveDay={saveDay}/>}
          {tab==="sticky"     &&<StickyTab     T={T} date={selectedDate} dayData={dayData} saveDay={saveDay} addReminder={addReminder}/>}
          {tab==="attendance" &&<AttendanceTab T={T} today={today} userId={sessionUser.id}/>}
          {tab==="photos"     &&<PhotosTab     T={T} date={selectedDate} today={today} dayData={dayData} saveDay={saveDay} userId={sessionUser.id}/>}
          {tab==="summaries"  &&<SummariesTab  T={T} date={selectedDate} dayData={dayData} profile={sessionUser}/>}
          {tab.startsWith("ct_")&&<CustomTab  T={T} tabId={tab} date={selectedDate} userId={sessionUser.id}/>}
        </div>
      </div>

      {/* Diary Switcher Modal */}
      {showDiary&&(
        <ModalWrap T={T} title="📒 My Diaries" onClose={()=>setShowDiary(false)}>
          <p style={{color:T.muted,fontSize:12,fontWeight:700,marginBottom:12}}>You can have separate diaries — Work, Personal, anything!</p>
          {diaries.map(d=>(
            <div key={d.id} onClick={()=>switchDiary(d.id)} style={{display:"flex",alignItems:"center",gap:11,padding:"11px 14px",borderRadius:12,border:`2px solid ${activeDiary===d.id?T.accent:T.border}`,background:activeDiary===d.id?`${T.accent}20`:"rgba(255,255,255,.05)",marginBottom:7,cursor:"pointer",transition:"all .2s"}}>
              <span style={{fontSize:28}}>{d.icon}</span>
              <div style={{flex:1}}>
                <p style={{color:T.text,fontWeight:700,fontSize:14,margin:0}}>{d.name}</p>
                <p style={{color:T.muted,fontSize:10,margin:0}}>Created {new Date(d.createdAt).toLocaleDateString()}</p>
              </div>
              {activeDiary===d.id&&<span style={{color:T.accent,fontSize:12,fontWeight:700}}>Active ✓</span>}
            </div>
          ))}
          <AddDiaryForm T={T} onAdd={d=>{const upd=[...diaries,d];saveDiaries(upd)}}/>
        </ModalWrap>
      )}
    </div>
  );
}

function AddDiaryForm({T,onAdd}){
  const [icon,setIcon]=useState("📗"), [name,setName]=useState("");
  return(
    <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}`}}>
      <p style={{color:T.muted,fontSize:12,fontWeight:700,marginBottom:8}}>➕ Create new diary:</p>
      <div style={{display:"flex",gap:7}}>
        <input value={icon} onChange={e=>setIcon(e.target.value)} maxLength={2} style={{...inp(T),width:50,textAlign:"center",fontSize:22,padding:"9px 6px",flexShrink:0}}/>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Work Diary / Personal" style={inp(T)} onKeyDown={e=>e.key==="Enter"&&name.trim()&&(onAdd({id:uid(),name:name.trim(),icon,createdAt:Date.now()}),setName(""))}/>
        <button className="btn" onClick={()=>{if(!name.trim())return;onAdd({id:uid(),name:name.trim(),icon,createdAt:Date.now()});setName("")}} style={{padding:"9px 16px",background:`linear-gradient(135deg,${T.accent},${T.accent2})`,border:"none",borderRadius:12,color:"#1a0a0a",fontWeight:700,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontSize:13,flexShrink:0}}>+ Add</button>
      </div>
    </div>
  );
}

function TabEditor({T,tab,onSave,onClose}){
  const [icon,setIcon]=useState(tab.icon);
  const [label,setLabel]=useState(tab.label);
  return(
    <div style={{position:"absolute",top:"100%",left:0,zIndex:200,background:T.card,border:`2px solid ${T.accent}`,borderRadius:14,padding:12,minWidth:180,backdropFilter:"blur(20px)",boxShadow:`0 6px 20px rgba(0,0,0,.5)`,animation:"slideUp .2s ease",marginTop:4}}>
      <p style={{color:T.accent,fontSize:11,fontWeight:700,marginBottom:8}}>✏️ Edit Tab</p>
      <div style={{display:"flex",gap:6,marginBottom:7}}>
        <input value={icon} onChange={e=>setIcon(e.target.value)} maxLength={2} style={{...inp(T),width:40,textAlign:"center",fontSize:18,padding:"6px 4px"}}/>
        <input value={label} onChange={e=>setLabel(e.target.value)} style={{...inp(T),flex:1,padding:"6px 10px",fontSize:12}}/>
      </div>
      <div style={{display:"flex",gap:5}}>
        <button onClick={()=>onSave(icon,label)} style={{flex:1,padding:"6px",background:`${T.green}20`,border:`1px solid ${T.green}`,borderRadius:8,color:T.green,fontWeight:700,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontSize:11}}>Save</button>
        <button onClick={onClose} style={{flex:1,padding:"6px",background:"rgba(255,255,255,.07)",border:`1px solid ${T.border}`,borderRadius:8,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700,fontSize:11}}>✖</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ OVERVIEW */
function OverviewTab({T,date,today,dayData,saveDay,profile,reminders}){
  const data=dayData(date);
  const tasks=data.tasks||[], done=tasks.filter(t=>t.done).length, total=tasks.length;
  const pct=total?Math.round(done/total*100):0;
  const updates=data.updates||[], sticky=data.sticky||[], photos=data.photos||[];
  const [note,setNote]=useState(data.endNote||"");
  const saveNote=v=>{const d=dayData(date);d.endNote=v;saveDay(date,d);setNote(v)};
  const todayRems=reminders.filter(r=>r.dt?.startsWith(date)&&!r.dismissed);

  const stats=[
    {icon:"✅",label:"Tasks Done",   val:`${done}/${total}`,sub:`${pct}%`,c:T.accent},
    {icon:"📈",label:"Completion",   val:`${pct}%`,sub:pct>=70?"🔥":"💪",c:pct>=70?T.green:T.accent},
    {icon:"📝",label:"Updates",      val:updates.length,sub:"logged",c:T.accent2},
    {icon:"📌",label:"Sticky Notes", val:sticky.length, sub:"active",c:"#fef08a"},
    {icon:"📸",label:"Photos",       val:photos.length, sub:"saved", c:"#93c5fd"},
  ];

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:9,marginBottom:16}}>
        {stats.map(s=>(
          <div key={s.label} className="card" style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:16,padding:"14px 12px",textAlign:"center"}}>
            <div style={{fontSize:34}}>{s.icon}</div>
            <div style={{color:s.c,fontSize:24,fontFamily:"'Bangers',cursive",letterSpacing:1,marginTop:4}}>{s.val}</div>
            <div style={{color:T.muted,fontSize:11,fontWeight:700,marginTop:1}}>{s.label}</div>
            <div style={{color:s.c,fontSize:10,opacity:.8}}>{s.sub}</div>
          </div>
        ))}
      </div>
      {total>0&&(
        <div style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
            <span style={{fontWeight:700,fontSize:14}}>🎯 Today's Progress</span>
            <span style={{color:T.accent,fontFamily:"'Bangers',cursive",fontSize:20}}>{pct}%</span>
          </div>
          <div style={{height:11,background:"rgba(255,255,255,.1)",borderRadius:10,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${T.accent},${T.accent2})`,borderRadius:10,transition:"width .8s cubic-bezier(.34,1.56,.64,1)"}}/>
          </div>
          <p style={{color:T.muted,fontSize:12,fontWeight:700,marginTop:5}}>{pct===100?"🏆 All done!":pct>=80?"🔥 Almost!":pct>=50?"💪 Keep it up!":"🚀 Let's go!"}</p>
        </div>
      )}
      {todayRems.length>0&&(
        <div style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:16,padding:16,marginBottom:12}}>
          <h3 style={{color:T.accent,margin:"0 0 10px",fontSize:14,fontFamily:"'Fredoka One',cursive"}}>⏰ Reminders Today</h3>
          {todayRems.map(r=>(
            <div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 11px",background:`${T.accent}15`,borderRadius:9,marginBottom:5,border:`1px solid ${T.border}`}}>
              <span style={{fontSize:13,fontWeight:700}}>{r.text}</span>
              <span style={{color:T.muted,fontSize:11,fontWeight:700}}>{r.dt?fmtTime(new Date(r.dt)):""} {r.fired?"✅":"⏳"}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:16,padding:16}}>
        <h3 style={{color:T.accent,margin:"0 0 9px",fontSize:14,fontFamily:"'Fredoka One',cursive"}}>📓 End of Day Note</h3>
        <textarea value={note} onChange={e=>saveNote(e.target.value)} placeholder="How was your day? Wins, blockers, things to remember..."
          style={{width:"100%",minHeight:96,background:"rgba(255,255,255,.06)",border:`2px solid ${T.border}`,borderRadius:11,color:T.text,padding:13,fontSize:14,resize:"vertical",fontFamily:"'Comic Neue',cursive",outline:"none",lineHeight:1.7,fontWeight:700}}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ TASKS — rich editor */
function TasksTab({T,date,dayData,saveDay,taskHistory,addTaskHistory}){
  const [input,setInput]=useState(""), [time,setTime]=useState(""), [sugg,setSugg]=useState([]);
  const [editId,setEditId]=useState(null);
  const [linkModal,setLinkModal]=useState(null);
  const data=dayData(date), tasks=data.tasks||[];

  const onInput=v=>{setInput(v);setSugg(v.length>1?taskHistory.filter(h=>h.toLowerCase().includes(v.toLowerCase())&&h!==v).slice(0,6):[])};

  const add=(txt=input)=>{
    const t=txt.trim();if(!t)return;
    const d=dayData(date);
    d.tasks=[...(d.tasks||[]),{id:uid(),text:t,done:false,time,createdAt:Date.now(),links:[],blocks:[{type:"text",content:t}],notes:"",subTasks:[]}];
    saveDay(date,d);addTaskHistory(t);setInput("");setTime("");setSugg([]);
  };

  const toggle=id=>{const d=dayData(date);d.tasks=d.tasks.map(t=>t.id===id?{...t,done:!t.done,completedAt:!t.done?Date.now():null}:t);saveDay(date,d)};
  const remove=id=>{const d=dayData(date);d.tasks=d.tasks.filter(t=>t.id!==id);saveDay(date,d)};
  const updateTask=(id,patch)=>{const d=dayData(date);d.tasks=d.tasks.map(t=>t.id===id?{...t,...patch}:t);saveDay(date,d)};

  const allPhotos=data.photos||[];
  const linkPhoto=(taskId,photoId)=>{const d=dayData(date);d.tasks=d.tasks.map(t=>t.id===taskId?{...t,links:[...new Set([...(t.links||[]),photoId])]}:t);saveDay(date,d)};
  const unlinkPhoto=(taskId,photoId)=>{const d=dayData(date);d.tasks=d.tasks.map(t=>t.id===taskId?{...t,links:(t.links||[]).filter(i=>i!==photoId)}:t);saveDay(date,d)};

  const pending=tasks.filter(t=>!t.done), done=tasks.filter(t=>t.done);
  const pct=tasks.length?Math.round(done.length/tasks.length*100):0;

  return(
    <div>
      {tasks.length>0&&<div style={{textAlign:"center",marginBottom:12}}><span style={{fontFamily:"'Bangers',cursive",fontSize:36,color:pct===100?T.green:T.accent,letterSpacing:2,textShadow:`0 0 18px ${pct===100?T.green:T.accent}60`}}>{pct}% Complete</span></div>}

      <div style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:18,padding:16,marginBottom:16,position:"relative"}}>
        <h3 style={{color:T.accent,margin:"0 0 11px",fontSize:15,fontFamily:"'Fredoka One',cursive"}}>➕ Add Task</h3>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          <div style={{flex:"1 1 170px",position:"relative"}}>
            <input value={input} onChange={e=>onInput(e.target.value)} placeholder="What needs to get done?" onKeyDown={e=>e.key==="Enter"&&add()} style={inp(T)}/>
            {sugg.length>0&&(
              <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:T.card,border:`2px solid ${T.border}`,borderRadius:11,marginTop:3,overflow:"hidden",backdropFilter:"blur(20px)"}}>
                {sugg.map(s=><div key={s} onClick={()=>{setInput(s);setSugg([])}} style={{padding:"8px 13px",cursor:"pointer",color:T.text,fontSize:13,fontWeight:700,borderBottom:`1px solid ${T.border}`}} onMouseEnter={e=>e.target.style.background=`${T.accent}20`} onMouseLeave={e=>e.target.style.background="transparent"}>🔄 {s}</div>)}
              </div>
            )}
          </div>
          <input type="time" value={time} onChange={e=>setTime(e.target.value)} style={{...inp(T),width:115,flexShrink:0}}/>
          <button className="btn" onClick={()=>add()} style={{...pBtn(T),width:"auto",padding:"11px 18px"}}>Add ✅</button>
        </div>
      </div>

      {pending.length>0&&(
        <div style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:18,padding:16,marginBottom:11}}>
          <h3 style={{color:T.text,margin:"0 0 10px",fontSize:14,fontFamily:"'Fredoka One',cursive"}}>⏳ Pending ({pending.length})</h3>
          {pending.map(t=><RichTaskRow key={t.id} task={t} T={T} onToggle={()=>toggle(t.id)} onRemove={()=>remove(t.id)} onUpdate={patch=>updateTask(t.id,patch)} isEditing={editId===t.id} setEditing={v=>setEditId(v?t.id:null)} onLink={()=>setLinkModal(t.id)} allPhotos={allPhotos} onUnlink={pid=>unlinkPhoto(t.id,pid)}/>)}
        </div>
      )}
      {done.length>0&&(
        <div style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:18,padding:16}}>
          <h3 style={{color:T.green,margin:"0 0 10px",fontSize:14,fontFamily:"'Fredoka One',cursive"}}>✅ Done ({done.length})</h3>
          {done.map(t=><RichTaskRow key={t.id} task={t} T={T} onToggle={()=>toggle(t.id)} onRemove={()=>remove(t.id)} onUpdate={patch=>updateTask(t.id,patch)} isEditing={editId===t.id} setEditing={v=>setEditId(v?t.id:null)} onLink={()=>setLinkModal(t.id)} allPhotos={allPhotos} onUnlink={pid=>unlinkPhoto(t.id,pid)}/>)}
        </div>
      )}
      {!tasks.length&&<Empty T={T} msg="No tasks yet! Let's add your first one 🚀"/>}

      {linkModal&&(()=>{
        const task=tasks.find(t=>t.id===linkModal);
        return(
          <ModalWrap T={T} title="🔗 Link Photos to Task" onClose={()=>setLinkModal(null)}>
            <p style={{color:T.muted,fontSize:13,fontWeight:700,marginBottom:12}}>Task: <span style={{color:T.accent}}>{task?.text}</span></p>
            {!allPhotos.length&&<p style={{color:T.muted,fontSize:13,fontWeight:700}}>No photos for this day yet. Add in Photos tab first!</p>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:8}}>
              {allPhotos.map(p=>{
                const linked=(task?.links||[]).includes(p.id);
                return(
                  <div key={p.id} onClick={()=>linked?unlinkPhoto(linkModal,p.id):linkPhoto(linkModal,p.id)} style={{borderRadius:10,overflow:"hidden",border:`2px solid ${linked?T.accent:T.border}`,cursor:"pointer",transition:"all .2s"}}>
                    <img src={p.src} alt={p.caption} style={{width:"100%",height:72,objectFit:"cover",display:"block"}}/>
                    <p style={{color:linked?T.accent:T.muted,fontSize:10,fontWeight:700,margin:"4px 6px 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{linked?"✓ ":""}{p.caption}</p>
                  </div>
                );
              })}
            </div>
            <button className="btn" onClick={()=>setLinkModal(null)} style={{...pBtn(T),marginTop:14}}>Done ✓</button>
          </ModalWrap>
        );
      })()}
    </div>
  );
}

/* Rich Task Row — paragraph, list, sub-tasks, sticky, link */
function RichTaskRow({task,T,onToggle,onRemove,onUpdate,isEditing,setEditing,onLink,allPhotos,onUnlink}){
  const [noteOpen,setNoteOpen]=useState(false);
  const [note,setNote]=useState(task.notes||"");
  const [subInput,setSubInput]=useState("");
  const [editText,setEditText]=useState(task.text);
  const linkedPhotos=(task.links||[]).map(lid=>allPhotos.find(p=>p.id===lid)).filter(Boolean);

  const addSub=()=>{
    if(!subInput.trim())return;
    onUpdate({subTasks:[...(task.subTasks||[]),{id:uid(),text:subInput.trim(),done:false}]});
    setSubInput("");
  };
  const toggleSub=id=>onUpdate({subTasks:(task.subTasks||[]).map(s=>s.id===id?{...s,done:!s.done}:s)});
  const removeSub=id=>onUpdate({subTasks:(task.subTasks||[]).filter(s=>s.id!==id)});

  return(
    <div style={{borderBottom:`1px solid ${T.border}`,paddingBottom:10,marginBottom:10}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:9}}>
        {/* checkbox */}
        <div onClick={onToggle} style={{width:24,height:24,borderRadius:7,border:`2px solid ${task.done?T.green:T.muted}`,background:task.done?T.green:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,transition:"all .2s",boxShadow:task.done?`0 0 10px ${T.green}60`:"none"}}>
          {task.done&&<span style={{color:"#1a1a1a",fontSize:14,fontWeight:700}}>✓</span>}
        </div>
        {/* text / edit */}
        <div style={{flex:1}}>
          {isEditing?(
            <input value={editText} onChange={e=>setEditText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){onUpdate({text:editText});setEditing(false)}}} onBlur={()=>{onUpdate({text:editText});setEditing(false)}} autoFocus style={{...inp(T),padding:"6px 10px",fontSize:13,marginBottom:4}}/>
          ):(
            <span onClick={()=>setEditing(true)} title="Click to edit" style={{color:task.done?T.muted:T.text,textDecoration:task.done?"line-through":"none",fontSize:14,fontWeight:700,cursor:"text"}}>{task.text}</span>
          )}
          {task.time&&<span style={{color:T.muted,fontSize:11,marginLeft:7}}>⏰ {task.time}</span>}
        </div>
        {/* action icons */}
        <div style={{display:"flex",gap:4,flexShrink:0}}>
          <button onClick={()=>setNoteOpen(!noteOpen)} title="Add notes / sub-tasks" style={iconBtn(T,"#a78bfa")}>📋</button>
          <button onClick={onLink} title="Link photos" style={iconBtn(T,"#93c5fd")}>🔗</button>
          <button onClick={()=>setEditing(!isEditing)} title="Edit" style={iconBtn(T,T.muted)}>✏️</button>
          <button onClick={onRemove} title="Delete" style={iconBtn(T,T.red)}>🗑️</button>
        </div>
      </div>

      {/* Linked photos */}
      {linkedPhotos.length>0&&(
        <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap",paddingLeft:33}}>
          {linkedPhotos.map(p=>(
            <div key={p.id} style={{position:"relative"}}>
              <img src={p.src} alt={p.caption} style={{width:50,height:38,objectFit:"cover",borderRadius:7,border:`1px solid ${T.border}`}}/>
              <button onClick={()=>onUnlink(p.id)} style={{position:"absolute",top:-5,right:-5,width:15,height:15,borderRadius:"50%",background:"#f87171",border:"none",color:"white",fontSize:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>×</button>
            </div>
          ))}
          <span style={{color:T.muted,fontSize:10,fontWeight:700,alignSelf:"center"}}>🔗</span>
        </div>
      )}

      {/* Expandable notes / sub-tasks panel */}
      {noteOpen&&(
        <div style={{marginTop:8,marginLeft:33,background:"rgba(255,255,255,.05)",borderRadius:11,padding:11,border:`1px solid ${T.border}`}}>
          <p style={{color:T.accent,fontSize:11,fontWeight:700,marginBottom:7,fontFamily:"'Fredoka One',cursive"}}>📋 TASK DETAILS</p>
          {/* Notes textarea */}
          <textarea value={note} onChange={e=>{setNote(e.target.value);onUpdate({notes:e.target.value})}} placeholder="Add notes, context, paragraph, list... anything!"
            style={{width:"100%",minHeight:70,background:"rgba(255,255,255,.06)",border:`1px solid ${T.border}`,borderRadius:9,color:T.text,padding:10,fontSize:13,resize:"vertical",fontFamily:"'Comic Neue',cursive",outline:"none",fontWeight:700,lineHeight:1.6,marginBottom:9}}/>
          {/* Sub-tasks */}
          <p style={{color:T.muted,fontSize:11,fontWeight:700,marginBottom:6}}>✅ Sub-tasks / Checklist:</p>
          {(task.subTasks||[]).map(s=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
              <div onClick={()=>toggleSub(s.id)} style={{width:18,height:18,borderRadius:5,border:`2px solid ${s.done?T.green:T.muted}`,background:s.done?T.green:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
                {s.done&&<span style={{color:"#1a1a1a",fontSize:11}}>✓</span>}
              </div>
              <span style={{color:s.done?T.muted:T.text,fontSize:13,fontWeight:700,flex:1,textDecoration:s.done?"line-through":"none"}}>{s.text}</span>
              <button onClick={()=>removeSub(s.id)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:15}}>×</button>
            </div>
          ))}
          <div style={{display:"flex",gap:6}}>
            <input value={subInput} onChange={e=>setSubInput(e.target.value)} placeholder="Add sub-task..." onKeyDown={e=>e.key==="Enter"&&addSub()} style={{...inp(T),flex:1,padding:"7px 11px",fontSize:12}}/>
            <button onClick={addSub} style={{padding:"7px 13px",background:`${T.accent}25`,border:`1px solid ${T.accent}`,borderRadius:9,color:T.accent,fontWeight:700,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontSize:12}}>+ Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ UPDATES */
function UpdatesTab({T,date,dayData,saveDay}){
  const [text,setText]=useState("");
  const [editId,setEditId]=useState(null), [editText,setEditText]=useState("");
  const data=dayData(date), updates=[...(data.updates||[])].reverse();
  const add=()=>{const t=text.trim();if(!t)return;const d=dayData(date);d.updates=[...(d.updates||[]),{id:uid(),text:t,createdAt:Date.now()}];saveDay(date,d);setText("")};
  const remove=id=>{const d=dayData(date);d.updates=d.updates.filter(u=>u.id!==id);saveDay(date,d)};
  const saveEdit=id=>{if(!editText.trim())return;const d=dayData(date);d.updates=d.updates.map(u=>u.id===id?{...u,text:editText,editedAt:Date.now()}:u);saveDay(date,d);setEditId(null)};
  return(
    <div>
      <div style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:18,padding:16,marginBottom:16}}>
        <h3 style={{color:T.accent,margin:"0 0 11px",fontSize:15,fontFamily:"'Fredoka One',cursive"}}>📝 Log an Update</h3>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Progress, blockers, thoughts... (Ctrl+Enter saves)" onKeyDown={e=>e.key==="Enter"&&e.ctrlKey&&add()}
          style={{width:"100%",minHeight:88,background:"rgba(255,255,255,.07)",border:`2px solid ${T.border}`,borderRadius:11,color:T.text,padding:13,fontSize:14,resize:"vertical",fontFamily:"'Comic Neue',cursive",outline:"none",fontWeight:700,lineHeight:1.7,marginBottom:9}}/>
        <button className="btn" onClick={add} style={pBtn(T)}>💾 Save Update</button>
      </div>
      {updates.map(u=>(
        <div key={u.id} className="card" style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:15,padding:15,marginBottom:9}}>
          {editId===u.id?(
            <>
              <textarea value={editText} onChange={e=>setEditText(e.target.value)} style={{width:"100%",minHeight:78,background:"rgba(255,255,255,.07)",border:`2px solid ${T.accent}`,borderRadius:10,color:T.text,padding:11,fontSize:14,resize:"vertical",fontFamily:"'Comic Neue',cursive",outline:"none",fontWeight:700,marginBottom:7}}/>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>saveEdit(u.id)} style={{padding:"7px 13px",background:`${T.green}20`,border:`2px solid ${T.green}`,borderRadius:9,color:T.green,fontWeight:700,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontSize:12}}>💾</button>
                <button onClick={()=>setEditId(null)} style={{padding:"7px 13px",background:"rgba(255,255,255,.07)",border:`1px solid ${T.border}`,borderRadius:9,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700,fontSize:12}}>✖</button>
              </div>
            </>
          ):(
            <>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <p style={{color:T.muted,fontSize:10,fontWeight:700,margin:"0 0 7px"}}>🕐 {fmtDT(u.createdAt)}{u.editedAt?" (edited)":""}</p>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={()=>{setEditId(u.id);setEditText(u.text)}} style={iconBtn(T,T.muted)}>✏️</button>
                  <button onClick={()=>remove(u.id)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18}}>×</button>
                </div>
              </div>
              <p style={{color:T.text,margin:0,fontSize:14,lineHeight:1.7,whiteSpace:"pre-wrap",fontWeight:700}}>{u.text}</p>
            </>
          )}
        </div>
      ))}
      {!updates.length&&<Empty T={T} msg="No updates yet. Log your first one! 📝"/>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ STICKY */
function StickyTab({T,date,dayData,saveDay,addReminder}){
  const [showAdd,setShowAdd]=useState(false), [editNote,setEditNote]=useState(null);
  const data=dayData(date), notes=data.sticky||[];
  const remove=id=>{const d=dayData(date);d.sticky=d.sticky.filter(s=>s.id!==id);saveDay(date,d)};
  const saveNote=n=>{const d=dayData(date);d.sticky=[...(d.sticky||[]),{id:uid(),...n,createdAt:Date.now()}];saveDay(date,d);if(n.reminder&&n.dt)addReminder({id:uid(),text:n.text,dt:n.dt,fired:false});setShowAdd(false)};
  const saveEdited=(id,n)=>{const d=dayData(date);d.sticky=d.sticky.map(s=>s.id===id?{...s,...n,editedAt:Date.now()}:s);saveDay(date,d);setEditNote(null)};
  return(
    <div>
      <button className="btn" onClick={()=>setShowAdd(true)} style={{...pBtn(T),width:"auto",padding:"11px 22px",marginBottom:16,display:"inline-block"}}>➕ New Sticky Note</button>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:14}}>
        {notes.map((n,i)=>(
          <div key={n.id} className="card" style={{background:n.color||"#fef08a",borderRadius:13,padding:15,position:"relative",minHeight:115,boxShadow:"0 5px 20px rgba(0,0,0,.4)",transform:`rotate(${[-2,-1,0,1,2][i%5]}deg)`,transition:"all .25s"}}>
            <div style={{position:"absolute",top:7,right:7,display:"flex",gap:3}}>
              <button onClick={()=>setEditNote(n)} style={{background:"rgba(0,0,0,.15)",border:"none",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button>
              <button onClick={()=>remove(n.id)} style={{background:"rgba(0,0,0,.15)",border:"none",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>×</button>
            </div>
            <p style={{color:"#1a1a1a",margin:"0 44px 7px 0",fontSize:13,lineHeight:1.6,fontFamily:"'Comic Neue',cursive",fontWeight:700,fontStyle:"italic"}}>{n.text}</p>
            <p style={{color:"rgba(0,0,0,.5)",margin:0,fontSize:10,fontWeight:700}}>{fmtTime(n.createdAt)}</p>
            {n.dt&&<p style={{color:"#1a1a1a",margin:"4px 0 0",fontSize:10,fontWeight:700}}>⏰ {fmtDT(new Date(n.dt))}</p>}
          </div>
        ))}
      </div>
      {!notes.length&&<Empty T={T} msg="No sticky notes! 📌"/>}
      {showAdd&&<StickyModal T={T} onClose={()=>setShowAdd(false)} onSave={saveNote}/>}
      {editNote&&<StickyModal T={T} existing={editNote} onClose={()=>setEditNote(null)} onSave={n=>saveEdited(editNote.id,n)}/>}
    </div>
  );
}

function StickyModal({T,onClose,onSave,existing}){
  const [text,setText]=useState(existing?.text||"");
  const [color,setColor]=useState(existing?.color||"#fef08a");
  const [reminder,setReminder]=useState(!!(existing?.dt));
  const [dt,setDt]=useState(existing?.dt||"");
  const COLORS=["#fef08a","#86efac","#93c5fd","#f9a8d4","#fca5a1","#d8b4fe","#fdba74","#a5f3fc","#fde68a","#d9f99d"];
  return(
    <ModalWrap T={T} title={existing?"✏️ Edit Note":"📌 New Sticky Note"} onClose={onClose}>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Write your note..." autoFocus
        style={{width:"100%",minHeight:105,background:color,border:"none",borderRadius:11,color:"#1a1a1a",padding:13,fontSize:14,resize:"vertical",fontFamily:"'Comic Neue',cursive",outline:"none",fontStyle:"italic",fontWeight:700,marginBottom:12}}/>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {COLORS.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:28,height:28,borderRadius:"50%",background:c,border:color===c?"3px solid white":"2px solid rgba(255,255,255,.2)",cursor:"pointer",transform:color===c?"scale(1.2)":"scale(1)",transition:"transform .15s"}}/>)}
      </div>
      <label style={{display:"flex",alignItems:"center",gap:8,color:T.text,fontSize:13,fontWeight:700,marginBottom:11,cursor:"pointer"}}>
        <input type="checkbox" checked={reminder} onChange={e=>setReminder(e.target.checked)} style={{width:16,height:16,accentColor:T.accent}}/> ⏰ Set Reminder
      </label>
      {reminder&&<input type="datetime-local" value={dt} onChange={e=>setDt(e.target.value)} style={{...inp(T),marginBottom:12}}/>}
      <div style={{display:"flex",gap:8}}>
        <button onClick={onClose} style={{flex:1,padding:11,background:"rgba(255,255,255,.06)",border:`1px solid ${T.border}`,borderRadius:11,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700}}>Cancel</button>
        <button className="btn" onClick={()=>{if(!text.trim())return;onSave({text:text.trim(),color,reminder,dt})}} style={{...pBtn(T),flex:1}}>Save 📌</button>
      </div>
    </ModalWrap>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ ATTENDANCE — with time in/out */
function AttendanceTab({T,today,userId}){
  const [viewMonth,setViewMonth]=useState(today.slice(0,7));
  const [att,setAtt]=useState(()=>S.get(`tlp_att_${userId}`,{}));
  const [editDay,setEditDay]=useState(null);

  const setDay=(key,patch)=>{const upd={...att,[key]:{...att[key],...patch}};setAtt(upd);S.set(`tlp_att_${userId}`,upd)};

  const [year,month]=viewMonth.split("-").map(Number);
  const daysInMonth=new Date(year,month,0).getDate();
  const firstDay=new Date(year,month-1,1).getDay();
  const days=Array.from({length:daysInMonth},(_,i)=>{
    const key=`${viewMonth}-${String(i+1).padStart(2,"0")}`;
    return{num:i+1,key,data:att[key]||null};
  });

  const presentDays=days.filter(d=>d.data?.status==="present").length;
  const absentDays=days.filter(d=>d.data?.status==="absent").length;
  const marked=presentDays+absentDays;
  const pct=marked?Math.round(presentDays/marked*100):0;

  const months=[];
  for(let i=5;i>=0;i--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);months.push(d.toISOString().slice(0,7));}

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:9,marginBottom:14}}>
        {[{icon:"✅",label:"Present",val:presentDays,c:T.green},{icon:"❌",label:"Absent",val:absentDays,c:T.red},{icon:"📊",label:"Attendance",val:`${pct}%`,c:T.accent},{icon:"📆",label:"Days",val:daysInMonth,c:T.accent2}].map(s=>(
          <div key={s.label} className="card" style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:14,padding:"13px 11px",textAlign:"center"}}>
            <div style={{fontSize:30}}>{s.icon}</div>
            <div style={{color:s.c,fontSize:22,fontFamily:"'Bangers',cursive",letterSpacing:1}}>{s.val}</div>
            <div style={{color:T.muted,fontSize:10,fontWeight:700}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:14,padding:"12px 16px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontWeight:700,fontSize:13}}>Attendance Rate</span>
          <span style={{fontFamily:"'Bangers',cursive",fontSize:18,color:pct>=75?T.green:pct>=50?T.accent:T.red}}>{pct}%</span>
        </div>
        <div style={{height:9,background:"rgba(255,255,255,.1)",borderRadius:9,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${T.green},${T.accent2})`,borderRadius:9,transition:"width .7s ease"}}/>
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto",scrollbarWidth:"none",paddingBottom:3}}>
        {months.map(m=><button key={m} onClick={()=>setViewMonth(m)} style={{padding:"6px 13px",borderRadius:17,border:`2px solid ${viewMonth===m?T.accent:T.border}`,background:viewMonth===m?`${T.accent}25`:"transparent",color:viewMonth===m?T.accent:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700,fontSize:11,whiteSpace:"nowrap",flexShrink:0}}>
          {new Date(m+"-15").toLocaleString("en",{month:"short",year:"numeric"})}
        </button>)}
      </div>

      <div style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:18,padding:16}}>
        <h3 style={{color:T.accent2,margin:"0 0 12px",fontFamily:"'Bangers',cursive",fontSize:20,letterSpacing:2}}>
          {new Date(viewMonth+"-15").toLocaleString("en",{month:"long",year:"numeric"})}
        </h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:7}}>
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{textAlign:"center",color:T.muted,fontSize:10,fontWeight:700,padding:"3px 0"}}>{d}</div>)}
          {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
          {days.map(d=>{
            const isToday=d.key===today;
            const status=d.data?.status;
            const bg=status==="present"?T.green:status==="absent"?T.red:"rgba(255,255,255,.06)";
            const col=status?"#1a1a1a":isToday?T.accent:T.muted;
            return(
              <div key={d.key}>
                <div onClick={()=>d.key<=today&&setEditDay(d.key)} style={{aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:9,background:bg,border:`2px solid ${isToday&&!status?T.accent2:status?"transparent":T.border}`,fontSize:11,fontWeight:700,color:col,boxShadow:status?`0 2px 8px ${status==="present"?T.green+"70":T.red+"70"}`:"none",transition:"all .25s",cursor:d.key<=today?"pointer":"default"}}>
                  {d.num}
                </div>
                {d.key<=today&&(
                  <div style={{display:"flex",gap:1,marginTop:2}}>
                    <button onClick={()=>setDay(d.key,{status:"present"})} style={{flex:1,background:status==="present"?T.green:"rgba(74,222,128,.18)",border:"none",borderRadius:"0 0 0 6px",cursor:"pointer",fontSize:7,fontWeight:700,color:status==="present"?"#1a1a1a":T.green,padding:"2px 0"}}>P</button>
                    <button onClick={()=>setDay(d.key,{status:"absent"})} style={{flex:1,background:status==="absent"?T.red:"rgba(248,113,113,.18)",border:"none",borderRadius:"0 0 6px 0",cursor:"pointer",fontSize:7,fontWeight:700,color:status==="absent"?"#1a1a1a":T.red,padding:"2px 0"}}>A</button>
                  </div>
                )}
                {d.data?.timeIn&&<div style={{textAlign:"center",fontSize:7,color:T.muted,fontWeight:700,lineHeight:1.1}}>{d.data.timeIn}</div>}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:8}}>
          {[{c:T.green,l:"Present"},{c:T.red,l:"Absent"},{c:"rgba(255,255,255,.1)",l:"Not Marked"}].map(x=><span key={x.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,fontWeight:700,color:T.muted}}><div style={{width:12,height:12,background:x.c,borderRadius:3}}/>{x.l}</span>)}
        </div>
        <p style={{color:T.muted,fontSize:10,marginTop:7,fontStyle:"italic",fontWeight:700}}>👆 Click a date to log Time In/Out · P = Present · A = Absent</p>
      </div>

      {/* Time In/Out modal */}
      {editDay&&(()=>{
        const d=att[editDay]||{};
        const[tIn,setTIn]=useState(d.timeIn||""); const[tOut,setTOut]=useState(d.timeOut||"");
        return(
          <ModalWrap T={T} title={`⏰ Time Log — ${editDay}`} onClose={()=>setEditDay(null)}>
            <p style={{color:T.muted,fontSize:13,fontWeight:700,marginBottom:14}}>Record your time in and time out for this day.</p>
            {[["Time In",tIn,setTIn],["Time Out",tOut,setTOut]].map(([label,v,s])=>(
              <div key={label} style={{marginBottom:12}}>
                <label style={lbl}>{label.toUpperCase()}</label>
                <input type="time" value={v} onChange={e=>s(e.target.value)} style={inp(T)}/>
              </div>
            ))}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditDay(null)} style={{flex:1,padding:11,background:"rgba(255,255,255,.07)",border:`1px solid ${T.border}`,borderRadius:11,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700}}>Cancel</button>
              <button className="btn" onClick={()=>{setDay(editDay,{timeIn:tIn,timeOut:tOut});setEditDay(null)}} style={{...pBtn(T),flex:1}}>💾 Save</button>
            </div>
          </ModalWrap>
        );
      })()}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ PHOTOS */
function PhotosTab({T,date,today,dayData,saveDay,userId}){
  const [showUpload,setShowUpload]=useState(false);
  const [caption,setCaption]=useState(""), [tag,setTag]=useState(""), [hidden,setHidden]=useState(false);
  const [viewPhoto,setViewPhoto]=useState(null), [editPhoto,setEditPhoto]=useState(null);
  const [pinModal,setPinModal]=useState(false), [pinInput,setPinInput]=useState(""), [pinUnlocked,setPinUnlocked]=useState(false);
  const [setupPin]=useState(()=>!S.get(`tlp_hp_${userId}`,""));
  const [newPin,setNewPin]=useState("");
  const fileRef=useRef();

  const data=dayData(date), allPhotos=data.photos||[];
  const visiblePhotos=allPhotos.filter(p=>!p.hidden||pinUnlocked);

  const handleFiles=files=>{
    Array.from(files).forEach(f=>{const r=new FileReader();r.onload=ev=>{const d=dayData(date);d.photos=[...(d.photos||[]),{id:uid(),src:ev.target.result,caption:caption||f.name.replace(/\.[^.]+$/,""),tag:tag||"General",hidden,date,addedAt:Date.now()}];saveDay(date,d)};r.readAsDataURL(f)});
    setCaption("");setTag("");setHidden(false);setShowUpload(false);
  };

  const remove=id=>{const d=dayData(date);d.photos=d.photos.filter(p=>p.id!==id);saveDay(date,d)};
  const savePhotoEdit=(id,cap,tg)=>{const d=dayData(date);d.photos=d.photos.map(p=>p.id===id?{...p,caption:cap,tag:tg}:p);saveDay(date,d);setEditPhoto(null)};

  const groups=visiblePhotos.reduce((acc,p)=>{const t=p.tag||"General";acc[t]=[...(acc[t]||[]),p];return acc;},{});

  return(
    <div>
      <div style={{display:"flex",gap:9,marginBottom:16,flexWrap:"wrap"}}>
        <button className="btn" onClick={()=>setShowUpload(true)} style={{...pBtn(T),width:"auto",padding:"11px 20px"}}>📸 Add Photos</button>
        {!pinUnlocked&&allPhotos.some(p=>p.hidden)&&<button onClick={()=>setPinModal(true)} style={{padding:"11px 16px",background:"rgba(255,165,0,.2)",border:"2px solid rgba(255,165,0,.45)",borderRadius:12,color:"#ffa500",fontWeight:700,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontSize:13}}>🔒 Unlock Hidden</button>}
      </div>
      {Object.entries(groups).map(([tag,photos])=>(
        <div key={tag} style={{marginBottom:20}}>
          <h3 style={{color:T.accent,fontFamily:"'Fredoka One',cursive",fontSize:18,margin:"0 0 9px",display:"flex",alignItems:"center",gap:7}}>
            📂 {tag} <span style={{color:T.muted,fontSize:12,fontWeight:400}}>({photos.length})</span>
          </h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))",gap:9}}>
            {photos.map(p=>(
              <div key={p.id} className="card" style={{background:T.card,border:`2px solid ${T.border}`,borderRadius:12,overflow:"hidden",position:"relative"}}>
                <img src={p.src} alt={p.caption} onClick={()=>setViewPhoto(p)} style={{width:"100%",height:120,objectFit:"cover",display:"block",cursor:"pointer"}}/>
                <div style={{padding:"7px 9px"}}>
                  <p style={{color:T.text,fontSize:11,fontWeight:700,margin:"0 0 1px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.caption}</p>
                  <p style={{color:T.muted,fontSize:9,margin:0}}>📅 {p.date} · {fmtTime(p.addedAt)}</p>
                  {p.hidden&&<span style={{color:"#ffa500",fontSize:9,fontWeight:700}}>🔒</span>}
                </div>
                <div style={{position:"absolute",top:5,right:5,display:"flex",gap:3}}>
                  <button onClick={()=>setEditPhoto(p)} style={{background:"rgba(0,0,0,.6)",border:"none",borderRadius:6,width:22,height:22,color:"white",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button>
                  <button onClick={()=>remove(p.id)} style={{background:"rgba(0,0,0,.6)",border:"none",borderRadius:6,width:22,height:22,color:"white",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {!visiblePhotos.length&&<Empty T={T} msg="No photos yet! Add screenshots, client photos, receipts... 📸"/>}

      {showUpload&&(
        <ModalWrap T={T} title="📸 Add Photos" onClose={()=>setShowUpload(false)}>
          <input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Caption / Name..." style={{...inp(T),marginBottom:9}}/>
          <input value={tag} onChange={e=>setTag(e.target.value)} placeholder="Folder Tag (e.g. Star Health Quotations, Client Docs)" style={{...inp(T),marginBottom:9}}/>
          <label style={{display:"flex",alignItems:"center",gap:8,color:T.text,fontSize:13,fontWeight:700,marginBottom:13,cursor:"pointer"}}>
            <input type="checkbox" checked={hidden} onChange={e=>setHidden(e.target.checked)} style={{width:15,height:15,accentColor:T.accent}}/> 🔒 Keep hidden (PIN required)
          </label>
          <div onClick={()=>fileRef.current.click()} style={{border:`3px dashed ${T.accent}`,borderRadius:13,padding:"24px 16px",textAlign:"center",cursor:"pointer"}}
            onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFiles(e.dataTransfer.files)}}>
            <div style={{fontSize:40}}>📁</div>
            <p style={{color:T.accent,fontWeight:700,margin:"7px 0 3px"}}>Click or drag photos here</p>
            <p style={{color:T.muted,fontSize:11}}>JPG, PNG, GIF, WEBP</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
        </ModalWrap>
      )}

      {editPhoto&&(()=>{
        const[ec,setEc]=useState(editPhoto.caption); const[et,setEt]=useState(editPhoto.tag);
        return(<ModalWrap T={T} title="✏️ Edit Photo" onClose={()=>setEditPhoto(null)}>
          <img src={editPhoto.src} alt="" style={{width:"100%",borderRadius:9,marginBottom:11,maxHeight:190,objectFit:"contain"}}/>
          <input value={ec} onChange={e=>setEc(e.target.value)} placeholder="Caption..." style={{...inp(T),marginBottom:9}}/>
          <input value={et} onChange={e=>setEt(e.target.value)} placeholder="Tag/Folder..." style={{...inp(T),marginBottom:12}}/>
          <div style={{display:"flex",gap:8}}><button onClick={()=>setEditPhoto(null)} style={{flex:1,padding:11,background:"rgba(255,255,255,.07)",border:`1px solid ${T.border}`,borderRadius:11,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700}}>Cancel</button><button className="btn" onClick={()=>savePhotoEdit(editPhoto.id,ec,et)} style={{...pBtn(T),flex:1}}>💾 Save</button></div>
        </ModalWrap>);
      })()}

      {viewPhoto&&(<ModalWrap T={T} title={viewPhoto.caption} onClose={()=>setViewPhoto(null)}>
        <img src={viewPhoto.src} alt={viewPhoto.caption} style={{width:"100%",borderRadius:11,marginBottom:9,maxHeight:"60vh",objectFit:"contain"}}/>
        <p style={{color:T.muted,fontSize:12,fontWeight:700}}>📅 {viewPhoto.date} · Added {fmtTime(viewPhoto.addedAt)}</p>
        <p style={{color:T.accent,fontSize:12,fontWeight:700}}>📂 {viewPhoto.tag}</p>
      </ModalWrap>)}

      {pinModal&&(<ModalWrap T={T} title="🔒 Hidden Photos" onClose={()=>setPinModal(false)}>
        {setupPin?(
          <><p style={{color:T.muted,fontSize:13,fontWeight:700,marginBottom:11}}>Set a 4-digit PIN:</p>
          <input type="password" maxLength={4} value={newPin} onChange={e=>setNewPin(e.target.value)} style={{...inp(T),fontSize:24,textAlign:"center",letterSpacing:10,marginBottom:12}}/>
          <button className="btn" onClick={()=>{if(newPin.length===4){S.set(`tlp_hp_${userId}`,newPin);setPinModal(false);setPinUnlocked(true)}}} style={pBtn(T)}>Set PIN 🔐</button></>
        ):(
          <><input type="password" maxLength={4} value={pinInput} onChange={e=>setPinInput(e.target.value)} placeholder="Enter PIN" style={{...inp(T),fontSize:24,textAlign:"center",letterSpacing:10,marginBottom:12}}/>
          <button className="btn" onClick={()=>{if(pinInput===S.get(`tlp_hp_${userId}`,"")){setPinUnlocked(true);setPinModal(false)}else setPinInput("")}} style={pBtn(T)}>Unlock 🔓</button></>
        )}
      </ModalWrap>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ SUMMARIES */
function SummariesTab({T,date,dayData,profile}){
  const [generated,setGenerated]=useState(""), [view,setView]=useState("generate");
  const key=`tlp_sum_${profile.id}`;
  const [saved,setSaved]=useState(()=>S.get(key,[]));

  const gen=()=>{
    const data=dayData(date), tasks=data.tasks||[], done=tasks.filter(t=>t.done).length, total=tasks.length;
    const pct=total?Math.round(done/total*100):0;
    const subDone=tasks.reduce((a,t)=>{const subs=t.subTasks||[];return a+subs.filter(s=>s.done).length},0);
    const subTotal=tasks.reduce((a,t)=>(a+(t.subTasks||[]).length),0);
    setGenerated([
      `🌷 TULIP AI SUMMARY — ${fmtDate(date)}`,`For: ${profile.name} (${profile.career})`,``,
      total?`✅ Main Tasks: ${done}/${total} (${pct}%)`:`📋 No tasks logged.`,
      subTotal?`📋 Sub-tasks: ${subDone}/${subTotal} completed`:``,
      pct===100?`🏆 Outstanding! Perfect task completion!`:pct>=80?`🔥 Excellent performance!`:pct>=60?`💪 Solid effort today!`:pct>=40?`📈 Good progress — keep going!`:total?`⚡ Tough day? Tomorrow is a fresh start!`:``,
      (data.updates||[]).length?`📝 Updates logged: ${data.updates.length}`:``,
      (data.sticky||[]).length?`📌 Sticky notes: ${data.sticky.length}`:``,
      (data.photos||[]).length?`📸 Photos saved: ${data.photos.length}`:``,
      data.endNote?`💬 Your note: "${data.endNote.slice(0,80)}${data.endNote.length>80?"...":""}"` : ``,
      ``,`🌷 Keep logging, keep growing — Life, Logged Beautifully!`
    ].filter(Boolean).join("\n"));
  };

  const save=()=>{if(!generated)return;const s=[{id:uid(),date,text:generated,createdAt:Date.now()},...saved].slice(0,50);setSaved(s);S.set(key,s);setGenerated("");setView("saved")};
  const del=id=>{const s=saved.filter(x=>x.id!==id);setSaved(s);S.set(key,s)};

  return(
    <div>
      <div style={{display:"flex",gap:7,marginBottom:16}}>
        {["generate","saved"].map(v=><button key={v} onClick={()=>setView(v)} style={{padding:"8px 18px",borderRadius:17,border:`2px solid ${view===v?T.accent:T.border}`,background:view===v?`${T.accent}25`:"transparent",color:view===v?T.accent:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700,fontSize:12,textTransform:"capitalize"}}>{v}</button>)}
      </div>
      {view==="generate"&&(<>
        <button className="btn" onClick={gen} style={{width:"100%",marginBottom:13,padding:13,background:`linear-gradient(135deg,${T.accent}25,${T.accent2}15)`,border:`2px solid ${T.accent}45`,borderRadius:15,color:T.accent2,fontWeight:700,fontSize:16,cursor:"pointer",fontFamily:"'Bangers',cursive",letterSpacing:2}}>
          🤖 GENERATE AI SUMMARY
        </button>
        {generated&&(
          <div style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:18,padding:18}}>
            <pre style={{whiteSpace:"pre-wrap",color:T.text,lineHeight:1.8,fontSize:13,fontFamily:"'Comic Neue',cursive",fontWeight:700,margin:0}}>{generated}</pre>
            <button className="btn" onClick={save} style={{...pBtn(T),marginTop:13}}>💾 Save Summary</button>
          </div>
        )}
      </>)}
      {view==="saved"&&(<>
        {!saved.length&&<Empty T={T} msg="No saved summaries. Generate one! 🤖"/>}
        {saved.map(s=>(
          <div key={s.id} className="card" style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:16,padding:16,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
              <p style={{color:T.muted,fontSize:10,fontWeight:700,margin:"0 0 9px"}}>📅 {s.date} · {fmtDT(s.createdAt)}</p>
              <button onClick={()=>del(s.id)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18}}>×</button>
            </div>
            <pre style={{whiteSpace:"pre-wrap",color:T.text,lineHeight:1.8,fontSize:13,fontFamily:"'Comic Neue',cursive",fontWeight:700,margin:0}}>{s.text}</pre>
          </div>
        ))}
      </>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ CUSTOM TAB */
function CustomTab({T,tabId,date,userId}){
  const [text,setText]=useState(""), [editId,setEditId]=useState(null), [editText,setEditText]=useState("");
  const key=`tlp_ct_${userId}_${tabId}_${date}`;
  const [notes,setNotes]=useState(()=>S.get(key,[]));
  const save2=n=>{setNotes(n);S.set(key,n)};
  const add=()=>{const t=text.trim();if(!t)return;save2([...notes,{id:uid(),text:t,createdAt:Date.now()}]);setText("")};
  const remove=id=>save2(notes.filter(n=>n.id!==id));
  const saveEdit=id=>{if(!editText.trim())return;save2(notes.map(n=>n.id===id?{...n,text:editText,editedAt:Date.now()}:n));setEditId(null)};
  return(
    <div>
      <div style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:18,padding:16,marginBottom:16}}>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Add an entry... (Ctrl+Enter)" onKeyDown={e=>e.key==="Enter"&&e.ctrlKey&&add()}
          style={{width:"100%",minHeight:85,background:"rgba(255,255,255,.07)",border:`2px solid ${T.border}`,borderRadius:11,color:T.text,padding:12,fontSize:14,resize:"vertical",fontFamily:"'Comic Neue',cursive",outline:"none",fontWeight:700,lineHeight:1.7,marginBottom:9}}/>
        <button className="btn" onClick={add} style={pBtn(T)}>➕ Add Entry</button>
      </div>
      {[...notes].reverse().map(n=>(
        <div key={n.id} className="card" style={{background:T.card,backdropFilter:"blur(20px)",border:`2px solid ${T.border}`,borderRadius:14,padding:14,marginBottom:9}}>
          {editId===n.id?(
            <><textarea value={editText} onChange={e=>setEditText(e.target.value)} style={{width:"100%",minHeight:76,background:"rgba(255,255,255,.07)",border:`2px solid ${T.accent}`,borderRadius:9,color:T.text,padding:11,fontSize:13,resize:"vertical",fontFamily:"'Comic Neue',cursive",outline:"none",fontWeight:700,marginBottom:7}}/>
            <div style={{display:"flex",gap:7}}><button onClick={()=>saveEdit(n.id)} style={{padding:"6px 12px",background:`${T.green}20`,border:`2px solid ${T.green}`,borderRadius:8,color:T.green,fontWeight:700,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontSize:11}}>💾</button><button onClick={()=>setEditId(null)} style={{padding:"6px 12px",background:"rgba(255,255,255,.07)",border:`1px solid ${T.border}`,borderRadius:8,color:T.muted,cursor:"pointer",fontFamily:"'Comic Neue',cursive",fontWeight:700,fontSize:11}}>✖</button></div></>
          ):(
            <><div style={{display:"flex",justifyContent:"space-between"}}><p style={{color:T.muted,fontSize:10,fontWeight:700,margin:"0 0 7px"}}>🕐 {fmtDT(n.createdAt)}</p><div style={{display:"flex",gap:4}}><button onClick={()=>{setEditId(n.id);setEditText(n.text)}} style={iconBtn(T,T.muted)}>✏️</button><button onClick={()=>remove(n.id)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18}}>×</button></div></div>
            <p style={{color:T.text,margin:0,fontSize:14,lineHeight:1.7,whiteSpace:"pre-wrap",fontWeight:700}}>{n.text}</p></>
          )}
        </div>
      ))}
      {!notes.length&&<Empty T={T} msg="No entries yet. Start adding! ✍️"/>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ SHARED */
function ModalWrap({T,title,onClose,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"fadeIn .2s"}}>
      <div style={{background:T.card,backdropFilter:"blur(24px)",border:`2px solid ${T.border}`,borderRadius:22,padding:24,width:"100%",maxWidth:490,maxHeight:"88vh",overflow:"auto",animation:"slideUp .3s cubic-bezier(.34,1.56,.64,1)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{color:T.accent2,margin:0,fontFamily:"'Fredoka One',cursive",fontSize:22}}>{title}</h3>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.1)",border:"none",color:T.text,cursor:"pointer",fontSize:20,borderRadius:"50%",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AvatarBox({av,size,T}){
  const isImg=typeof av==="string"&&av.startsWith("data:");
  return(
    <div style={{width:size,height:size,borderRadius:Math.round(size*.3),background:`${T.accent}25`,border:`2px solid ${T.accent}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
      {isImg?<img src={av} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<span style={{fontSize:Math.round(size*.54)}}>{av}</span>}
    </div>
  );
}

function Toast({msg,color,T}){
  return(<div style={{position:"fixed",top:18,left:"50%",transform:"translateX(-50%)",zIndex:9998,background:T.card,border:`2px solid ${color||T.accent}`,borderRadius:15,padding:"11px 20px",backdropFilter:"blur(20px)",boxShadow:`0 5px 22px rgba(0,0,0,.5)`,animation:"slideUp .3s ease",fontFamily:"'Comic Neue',cursive",fontWeight:700,color:T.text,fontSize:13,whiteSpace:"nowrap",pointerEvents:"none"}}>{msg}</div>);
}

function Empty({T,msg}){
  return(<div style={{textAlign:"center",padding:"48px 18px",color:T.muted}}><div style={{fontSize:46,marginBottom:10,animation:"float 3s ease-in-out infinite",display:"inline-block"}}>🌷</div><p style={{fontSize:14,fontStyle:"italic",fontWeight:700}}>{msg}</p></div>);
}

const lbl={color:"rgba(255,255,255,.4)",fontSize:10,fontWeight:700,letterSpacing:1,display:"block"};
const inp=T=>({display:"block",width:"100%",padding:"11px 13px",background:"rgba(255,255,255,.07)",border:`2px solid ${T.border}`,borderRadius:12,color:T.text,fontSize:14,fontFamily:"'Comic Neue',cursive",outline:"none",fontWeight:700,transition:"border-color .2s"});
const pBtn=T=>({width:"100%",padding:"13px",background:`linear-gradient(135deg,${T.accent},${T.accent2})`,border:"none",borderRadius:13,color:"#1a0a0a",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'Bangers',cursive",letterSpacing:2,boxShadow:`0 4px 18px ${T.accent}50`,transition:"all .2s"});
const microBtn=T=>({background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.22)",color:"white",borderRadius:9,padding:"4px 11px",cursor:"pointer",fontSize:11,fontFamily:"'Comic Neue',cursive",fontWeight:700});
const iconBtn=(T,c)=>({background:`${c}15`,border:`1px solid ${c}40`,borderRadius:7,color:c,cursor:"pointer",fontSize:13,padding:"3px 7px",fontWeight:700});
