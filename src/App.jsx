import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════
const APP_NAME    = "GreenHub";
const TAGLINE     = "Một điểm chạm · Vạn hành trình xanh của tuổi trẻ IUH";
const DEFAULT_PWD = "mhxiuh26";
const CAMPAIGN_START = new Date("2026-06-10T00:00:00");
const CAMPAIGN_END   = new Date("2026-07-01T23:59:59");

const ROLES = [
  { id:"admin",         label:"Admin",                level:7, color:"#f59e0b" },
  { id:"chihuy_truong", label:"Chỉ huy cấp trường",  level:6, color:"#ef4444" },
  { id:"chihuy_xa",     label:"Chỉ huy cấp xã",      level:5, color:"#f97316" },
  { id:"doitruong",     label:"Đội trưởng",           level:4, color:"#8b5cf6" },
  { id:"doipho",        label:"Đội phó",              level:3, color:"#3b82f6" },
  { id:"uyvien",        label:"Ủy viên BCH",          level:2, color:"#06b6d4" },
  { id:"chiensi",       label:"Chiến sĩ",             level:1, color:"#22c55e" },
];
const getRoleInfo  = id => ROLES.find(r=>r.id===id)||ROLES[6];
const getRoleLevel = id => getRoleInfo(id).level;

const LOAI_HINH = [
  { id:"thuongtru",      label:"Thường trực" },
  { id:"khongthuongtru", label:"Không thường trực" },
];

const SEED_MAT_TRAN = [
  { id:"mt1", name:"Mặt trận Gò Vấp",     color:"#16a34a", emoji:"🌿", x:18, y:22, loaiHinh:"thuongtru" },
  { id:"mt2", name:"Mặt trận Bình Thạnh", color:"#0891b2", emoji:"💧", x:42, y:13, loaiHinh:"thuongtru" },
  { id:"mt3", name:"Mặt trận Thủ Đức",    color:"#d97706", emoji:"☀️", x:68, y:20, loaiHinh:"thuongtru" },
  { id:"mt4", name:"Mặt trận Hóc Môn",    color:"#dc2626", emoji:"🔥", x:82, y:40, loaiHinh:"thuongtru" },
  { id:"mt5", name:"Mặt trận Củ Chi",     color:"#7c3aed", emoji:"⚡", x:70, y:63, loaiHinh:"thuongtru" },
  { id:"mt6", name:"Mặt trận Bình Chánh", color:"#059669", emoji:"🌊", x:44, y:70, loaiHinh:"thuongtru" },
  { id:"mt7", name:"Mặt trận Nhà Bè",     color:"#db2777", emoji:"🌸", x:20, y:60, loaiHinh:"thuongtru" },
  { id:"mt8", name:"Không thường trực",   color:"#65a30d", emoji:"🌱", x:8,  y:40, loaiHinh:"khongthuongtru" },
];

// ═══════════════════════════════════════════════
//  COLORS
// ═══════════════════════════════════════════════
const C = {
  bg:"#f0fdf4", card:"#ffffff", deep:"#dcfce7",
  pri:"#16a34a", priL:"#22c55e", priD:"#15803d",
  acc:"#84cc16", ora:"#f97316",
  txt:"#14532d", mid:"#166534", soft:"#4ade80", mute:"#86efac",
  bdr:"#bbf7d0", bdrM:"#86efac",
  sun:"#fbbf24", sunBg:"#fef9c3",
  err:"#ef4444", errBg:"#fef2f2",
};

// ═══════════════════════════════════════════════
//  STORAGE
// ═══════════════════════════════════════════════
const SK = "gh2026_";
const db = {
  get: async k => { try { const v=localStorage.getItem(SK+k); return v?JSON.parse(v):null; } catch{return null;} },
  set: async (k,v) => { try { localStorage.setItem(SK+k,JSON.stringify(v)); } catch{} },
};

// ═══════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════
const uid    = () => Math.random().toString(36).slice(2,10);
const now    = () => Date.now();
const tAgo   = ms => { const s=(now()-ms)/1000; if(s<60) return "vừa xong"; if(s<3600) return `${Math.floor(s/60)} phút trước`; if(s<86400) return `${Math.floor(s/3600)} giờ trước`; return `${Math.floor(s/86400)} ngày trước`; };
const hashPwd = s => btoa(s+"|gh2026");
const getCountdown = () => {
  const t=CAMPAIGN_END-new Date(); if(t<=0) return {done:true,days:0,hours:0,mins:0,secs:0,total:22,gone:22};
  const days=Math.floor(t/86400000),hours=Math.floor((t%86400000)/3600000),mins=Math.floor((t%3600000)/60000),secs=Math.floor((t%60000)/1000);
  const total=Math.ceil((CAMPAIGN_END-CAMPAIGN_START)/86400000);
  const gone=Math.max(0,Math.ceil((new Date()-CAMPAIGN_START)/86400000));
  return {done:false,days,hours,mins,secs,total,gone};
};

const authUsers = {
  login: async (email,pwd) => {
    const users=await db.get("users")||{};
    const u=Object.values(users).find(u=>u.email===email);
    if(!u) return {error:"Email không tồn tại"};
    if(u.password!==hashPwd(pwd)) return {error:"Mật khẩu không đúng"};
    return {user:u};
  },
  register: async data => {
    const users=await db.get("users")||{};
    if(Object.values(users).find(u=>u.email===data.email)) return {error:"Email đã được sử dụng"};
    const id=uid();
    const u={id,...data,password:hashPwd(DEFAULT_PWD),role:"chiensi",createdAt:now(),approved:true};
    users[id]=u; await db.set("users",users); return {user:u};
  },
  update: async (id,data) => {
    const users=await db.get("users")||{};
    users[id]={...users[id],...data}; await db.set("users",users); return users[id];
  },
};

// ═══════════════════════════════════════════════
//  TINY UI COMPONENTS
// ═══════════════════════════════════════════════
const Btn = ({children,onClick,variant="primary",disabled,full,style={},...p}) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding:"13px 22px", borderRadius:14, border:"none",
    cursor:disabled?"not-allowed":"pointer",
    fontWeight:800, fontSize:16, transition:"all .15s",
    opacity:disabled?.6:1, width:full?"100%":undefined,
    background: variant==="primary"?`linear-gradient(135deg,${C.priL},${C.pri})`
              : variant==="danger"?"#fef2f2":"#f1f5f9",
    color: variant==="primary"?"#fff":variant==="danger"?C.err:C.txt,
    boxShadow: variant==="primary"?`0 4px 16px ${C.pri}33`:"none",
    ...style
  }} {...p}>{children}</button>
);

const Input = ({label,error,...p}) => (
  <div style={{marginBottom:16}}>
    {label&&<label style={{display:"block",fontWeight:700,color:C.txt,fontSize:15,marginBottom:6}}>{label}</label>}
    <input style={{
      width:"100%", boxSizing:"border-box",
      background:C.bg, border:`2px solid ${error?C.err:C.bdr}`,
      borderRadius:12, padding:"13px 16px", fontSize:16, color:C.txt, outline:"none"
    }} {...p}/>
    {error&&<div style={{color:C.err,fontSize:13,marginTop:4}}>{error}</div>}
  </div>
);

const Select = ({label,options,error,...p}) => (
  <div style={{marginBottom:16}}>
    {label&&<label style={{display:"block",fontWeight:700,color:C.txt,fontSize:15,marginBottom:6}}>{label}</label>}
    <select style={{
      width:"100%", boxSizing:"border-box",
      background:C.bg, border:`2px solid ${error?C.err:C.bdr}`,
      borderRadius:12, padding:"13px 16px", fontSize:16, color:C.txt, outline:"none"
    }} {...p}>
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
    {error&&<div style={{color:C.err,fontSize:13,marginTop:4}}>{error}</div>}
  </div>
);

const Badge = ({children,color=C.pri,size=13}) => (
  <span style={{background:`${color}18`,color,fontSize:size,fontWeight:700,padding:"3px 10px",borderRadius:20,border:`1px solid ${color}33`}}>{children}</span>
);

// ═══════════════════════════════════════════════
//  MARQUEE (chạy chữ)
// ═══════════════════════════════════════════════
function Marquee({text}) {
  if(!text) return null;
  return (
    <div style={{
      background:`linear-gradient(90deg,${C.priD},${C.pri},${C.priD})`,
      overflow:"hidden", padding:"9px 0", flexShrink:0
    }}>
      <div style={{
        display:"inline-flex", alignItems:"center", whiteSpace:"nowrap",
        animation:"marqueeRun 35s linear infinite",
        color:"#fff", fontSize:15, fontWeight:700
      }}>
        {[0,1,2,3,4].map(i=>(
          <span key={i} style={{marginRight:60}}>
            <span style={{marginRight:10}}>📢</span>{text}<span style={{margin:"0 20px"}}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  NOTIFICATION TOAST
// ═══════════════════════════════════════════════
function NotifToast({notifs,onDismiss}) {
  if(!notifs.length) return null;
  return (
    <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:1000,width:"calc(100% - 32px)",maxWidth:460,animation:"slideDown .4s ease"}}>
      <div style={{background:"#fff",borderRadius:16,boxShadow:"0 8px 32px #0003",border:`1px solid ${C.bdr}`,display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
        <div style={{width:44,height:44,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${C.priL},${C.pri})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{notifs[0].icon||"🌿"}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:800,color:C.txt,fontSize:15}}>{notifs[0].title}</div>
          <div style={{color:"#94a3b8",fontSize:13,marginTop:2,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{notifs[0].body}</div>
        </div>
        <button onClick={()=>onDismiss(notifs[0].id)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:22,padding:"0 4px",flexShrink:0}}>×</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  COUNTDOWN
// ═══════════════════════════════════════════════
function Countdown() {
  const [cd,setCd]=useState(getCountdown());
  useEffect(()=>{const t=setInterval(()=>setCd(getCountdown()),1000);return()=>clearInterval(t);},[]);
  const pct=Math.min(100,Math.round((cd.gone/cd.total)*100));
  return (
    <div style={{background:`linear-gradient(135deg,${C.pri},${C.priD})`,borderRadius:18,padding:"18px 20px",color:"#fff"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div>
          <div style={{fontSize:13,opacity:.8}}>⏳ Chiến dịch MHX 2026</div>
          <div style={{fontWeight:800,fontSize:16,marginTop:3}}>10/06 → 01/07 · Ngày {cd.gone}/{cd.total}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:26,fontWeight:900,fontVariantNumeric:"tabular-nums",letterSpacing:-1}}>
            {cd.days}d {String(cd.hours).padStart(2,"0")}:{String(cd.mins).padStart(2,"0")}:{String(cd.secs).padStart(2,"0")}
          </div>
          <div style={{fontSize:12,opacity:.7}}>còn lại</div>
        </div>
      </div>
      <div style={{background:"#ffffff33",borderRadius:20,height:8}}>
        <div style={{background:"#4ade80",height:8,borderRadius:20,width:`${pct}%`,transition:"width 1s"}}/>
      </div>
      <div style={{fontSize:12,opacity:.7,marginTop:6,textAlign:"right"}}>{pct}% hoàn thành</div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  POST CARD
// ═══════════════════════════════════════════════
function PostCard({post,viewer,allUsers,matTran,onLike,onComment}) {
  const [showCmt,setShowCmt]=useState(false);
  const [cmtText,setCmtText]=useState("");
  const [imgFull,setImgFull]=useState(false);
  const author=allUsers[post.authorId];
  const mt=matTran.find(m=>m.id===post.matTranId);
  const liked=post.likes?.includes(viewer?.id);
  const isAnon=post.anonymous;
  const reveal=getRoleLevel(viewer?.role)>=4 || viewer?.role==="admin";
  const dispName=isAnon?(reveal?`${author?.hoTen}`:"Chiến sĩ ẩn danh"):author?.hoTen;
  return (
    <>
      <div style={{background:C.card,borderRadius:20,marginBottom:16,boxShadow:`0 2px 16px ${C.pri}08`,border:`1px solid ${C.bdr}`,overflow:"hidden"}}>
        <div style={{height:4,background:`linear-gradient(90deg,${mt?.color||C.pri},${mt?.color||C.pri}44)`}}/>
        <div style={{padding:"16px 18px 0"}}>
          <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
            <div style={{width:48,height:48,borderRadius:"50%",fontSize:22,background:`${mt?.color||C.pri}22`,border:`2px solid ${mt?.color||C.pri}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {isAnon&&!reveal?"🕵️":"🌿"}
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontWeight:800,color:C.txt,fontSize:16}}>{dispName}</span>
                {isAnon&&!reveal&&<Badge color="#64748b" size={12}>ẩn danh</Badge>}
                {isAnon&&reveal&&<Badge color={C.err} size={12}>🔓 chỉ bạn thấy</Badge>}
              </div>
              <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap",alignItems:"center"}}>
                {mt&&<Badge color={mt.color} size={12}>{mt.emoji} {mt.name}</Badge>}
                {post.type==="diemdanh"&&<Badge color={C.pri} size={12}>✅ Điểm danh</Badge>}
                {post.type==="diary"&&<Badge color={C.sun} size={12}>📔 Nhật ký</Badge>}
                <span style={{fontSize:13,color:"#94a3b8"}}>{tAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
          {post.title&&<div style={{fontWeight:800,color:C.txt,fontSize:17,marginBottom:8}}>{post.title}</div>}
          <div style={{color:"#374151",fontSize:16,lineHeight:1.8,marginBottom:14}}>{post.content}</div>
        </div>
        {post.imageData&&<img src={post.imageData} alt="" onClick={()=>setImgFull(true)} style={{width:"100%",maxHeight:300,objectFit:"cover",cursor:"zoom-in",display:"block"}}/>}
        <div style={{padding:"12px 18px",display:"flex",gap:20,borderTop:`1px solid ${C.bg}`}}>
          <button onClick={()=>onLike(post.id)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:liked?"#ef4444":"#94a3b8",fontWeight:800,fontSize:15,padding:0}}>
            {liked?"❤️":"🤍"} {post.likes?.length||0}
          </button>
          <button onClick={()=>setShowCmt(!showCmt)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontWeight:800,fontSize:15,padding:0}}>
            💬 {post.comments?.length||0}
          </button>
        </div>
        {showCmt&&(
          <div style={{padding:"0 18px 16px",borderTop:`1px solid ${C.bg}`}}>
            {post.comments?.map((c,i)=>{const cu=allUsers[c.authorId];return(
              <div key={i} style={{display:"flex",gap:10,marginTop:12,alignItems:"flex-start"}}>
                <div style={{fontSize:18}}>🌿</div>
                <div style={{background:C.bg,borderRadius:12,padding:"8px 14px",flex:1}}>
                  <span style={{fontWeight:800,color:C.pri,fontSize:14}}>{cu?.hoTen} </span>
                  <span style={{color:"#374151",fontSize:15}}>{c.text}</span>
                </div>
              </div>
            );})}
            <div style={{display:"flex",gap:10,marginTop:12}}>
              <div style={{fontSize:20}}>🌿</div>
              <input value={cmtText} onChange={e=>setCmtText(e.target.value)} placeholder="Viết bình luận..."
                onKeyDown={e=>{if(e.key==="Enter"&&cmtText.trim()){onComment(post.id,cmtText.trim());setCmtText("");}}}
                style={{flex:1,background:C.bg,border:`2px solid ${C.bdr}`,borderRadius:24,padding:"10px 16px",fontSize:15,outline:"none",color:C.txt}}/>
            </div>
          </div>
        )}
      </div>
      {imgFull&&<div onClick={()=>setImgFull(false)} style={{position:"fixed",inset:0,background:"#000000ee",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center"}}><img src={post.imageData} alt="" style={{maxWidth:"95vw",maxHeight:"90vh",borderRadius:16}}/></div>}
    </>
  );
}

// ═══════════════════════════════════════════════
//  COMPOSE MODAL
// ═══════════════════════════════════════════════
function ComposeModal({viewer,matTran,onSubmit,onClose}) {
  const [type,setType]=useState("share");
  const [content,setContent]=useState("");
  const [title,setTitle]=useState("");
  const [anon,setAnon]=useState(false);
  const [matTranId,setMt]=useState(viewer?.matTranId||matTran[0]?.id||"");
  const [img,setImg]=useState(null);
  const [mood,setMood]=useState("😊");
  const MOODS=["😊","💪","😄","🥵","😴","🤩","🥺"];
  const imgRef=useRef();
  const pickImg=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setImg(ev.target.result);r.readAsDataURL(f);};
  return (
    <div style={{position:"fixed",inset:0,background:"#00000066",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:560,boxShadow:`0 -8px 40px ${C.pri}22`,maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:44,height:6,background:C.bdr,borderRadius:4,margin:"16px auto 0"}}/>
        <div style={{display:"flex",gap:8,padding:"18px 20px 0"}}>
          {[["share","🌿 Chia sẻ"],["diary","📔 Nhật ký"],["diemdanh","✅ Điểm danh"]].map(([t,l])=>(
            <button key={t} onClick={()=>setType(t)} style={{flex:1,padding:"10px 0",borderRadius:14,border:"none",cursor:"pointer",background:type===t?`linear-gradient(135deg,${C.priL},${C.pri})`:"#f1f5f9",color:type===t?"#fff":"#94a3b8",fontWeight:800,fontSize:14}}>{l}</button>
          ))}
        </div>
        <div style={{padding:"16px 20px 36px"}}>
          {type==="diary"&&<>
            <Input label="Tiêu đề" placeholder="Nhật ký ngày..." value={title} onChange={e=>setTitle(e.target.value)}/>
            <div style={{display:"flex",gap:8,marginBottom:14}}>{MOODS.map(m=><button key={m} onClick={()=>setMood(m)} style={{fontSize:26,background:mood===m?C.deep:"none",border:`2px solid ${mood===m?C.priL:"transparent"}`,borderRadius:12,padding:"4px 8px",cursor:"pointer"}}>{m}</button>)}</div>
          </>}
          {type==="diemdanh"&&<div style={{background:C.deep,borderRadius:16,padding:"18px",marginBottom:14,textAlign:"center"}}><div style={{fontSize:40,marginBottom:6}}>✅</div><div style={{fontWeight:800,color:C.txt,fontSize:18}}>Điểm danh hoạt động</div><div style={{color:C.mid,fontSize:15,marginTop:4}}>{new Date().toLocaleDateString("vi-VN",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"})}</div></div>}
          <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder={type==="share"?"Chia sẻ khoảnh khắc chiến dịch...":type==="diary"?"Hôm nay bạn đã làm gì?...":"Ghi chú hoạt động hôm nay..."} rows={4}
            style={{width:"100%",background:C.bg,border:`2px solid ${C.bdr}`,borderRadius:14,padding:"14px 16px",fontSize:16,color:C.txt,outline:"none",resize:"none",boxSizing:"border-box",lineHeight:1.75,marginBottom:12}}/>
          <input ref={imgRef} type="file" accept="image/*" style={{display:"none"}} onChange={pickImg}/>
          {img?<div style={{position:"relative",marginBottom:12}}><img src={img} alt="" style={{width:"100%",borderRadius:12,maxHeight:200,objectFit:"cover"}}/><button onClick={()=>setImg(null)} style={{position:"absolute",top:8,right:8,background:"#fff",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:16}}>✕</button></div>
            :<button onClick={()=>imgRef.current?.click()} style={{width:"100%",padding:"13px",background:C.deep,border:`2px dashed ${C.bdrM}`,borderRadius:12,cursor:"pointer",color:C.pri,fontWeight:800,fontSize:15,marginBottom:12}}>📷 Thêm ảnh</button>}
          <Select label="Mặt trận" value={matTranId} options={matTran.map(m=>({value:m.id,label:`${m.emoji} ${m.name}`}))} onChange={e=>setMt(e.target.value)}/>
          <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:anon?C.deep:C.bg,borderRadius:14,border:`2px solid ${anon?C.bdrM:C.bdr}`,marginBottom:18,cursor:"pointer"}} onClick={()=>setAnon(!anon)}>
            <div style={{width:48,height:28,borderRadius:14,background:anon?C.pri:"#e2e8f0",position:"relative",flexShrink:0}}>
              <div style={{position:"absolute",top:3,left:anon?23:3,width:22,height:22,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px #0002"}}/>
            </div>
            <div><div style={{fontWeight:800,color:C.txt,fontSize:15}}>{anon?"🕵️ Đang đăng ẩn danh":"Đăng ẩn danh"}</div><div style={{color:"#94a3b8",fontSize:13}}>Chỉ đội trưởng trở lên thấy tên bạn</div></div>
          </div>
          <Btn full onClick={()=>{if(!content.trim()&&type!=="diemdanh")return;onSubmit({type,title,content,imageData:img,anonymous:anon,matTranId,mood:type==="diary"?mood:null,createdAt:now()});onClose();}}>🚀 Đăng bài</Btn>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  MAP SCREEN
// ═══════════════════════════════════════════════
function MapScreen({posts,viewer,matTran,onSelectMt,onSelectCenter,logoUrl,onUploadLogo}) {
  const [hov,setHov]=useState(null);
  const logoRef=useRef();
  const todayCnt=posts.filter(p=>now()-p.createdAt<86400000).length;
  const handleLogo=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>onUploadLogo(ev.target.result);r.readAsDataURL(f);};
  return (
    <div style={{position:"relative",width:"100%",height:"100%",overflow:"hidden",background:`linear-gradient(160deg,${C.deep} 0%,#e8faf0 50%,${C.bg} 100%)`}}>
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.35}}>
        <defs><pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill={C.bdrM}/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#dots)"/>
      </svg>
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        <defs><filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        {matTran.map(t=><line key={`hq-${t.id}`} x1={`${t.x}%`} y1={`${t.y}%`} x2="47%" y2="40%" stroke={t.color} strokeWidth="1.5" strokeOpacity=".2"/>)}
        {matTran.map((t,i)=>{const t2=matTran[(i+1)%matTran.length];return <line key={`ln-${t.id}`} x1={`${t.x}%`} y1={`${t.y}%`} x2={`${t2.x}%`} y2={`${t2.y}%`} stroke={C.priL} strokeWidth="2" strokeOpacity=".4" filter="url(#glow)"/>;})}
      </svg>

      {/* CENTER LOGO */}
      <div style={{position:"absolute",left:"47%",top:"40%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:6,zIndex:5}}>
        <div style={{position:"relative"}} onClick={onSelectCenter}>
          <div style={{width:110,height:110,borderRadius:"50%",background:logoUrl?"transparent":`linear-gradient(135deg,${C.pri},${C.priD})`,boxShadow:`0 0 0 10px ${C.pri}33,0 0 0 20px ${C.pri}11,0 4px 32px ${C.pri}77`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:46,border:`4px solid #fff`,cursor:"pointer",animation:"hqPulse 3s infinite",overflow:"hidden"}}>
            {logoUrl?<img src={logoUrl} alt="logo" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🌿"}
          </div>
          {getRoleLevel(viewer?.role)>=7&&<div onClick={e=>{e.stopPropagation();logoRef.current?.click();}} style={{position:"absolute",bottom:0,right:0,width:26,height:26,borderRadius:"50%",background:C.pri,border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:13}}>📷</div>}
        </div>
        <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogo}/>
        <div style={{background:C.pri,color:"#fff",fontSize:11,fontWeight:800,padding:"4px 14px",borderRadius:20,letterSpacing:1,whiteSpace:"nowrap",boxShadow:`0 2px 10px ${C.pri}44`}}>GreenHub · IUH</div>
      </div>

      {/* TEAM NODES */}
      {matTran.map((mt,idx)=>{
        const cnt=posts.filter(p=>p.matTranId===mt.id).length;
        const unread=posts.filter(p=>p.matTranId===mt.id&&now()-p.createdAt<3600000).length;
        const isH=hov===mt.id;
        return (
          <div key={mt.id} style={{position:"absolute",left:`${mt.x}%`,top:`${mt.y}%`,transform:"translate(-50%,-50%)",cursor:"pointer",zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",gap:6,animation:`floatNode 3s ease-in-out ${idx*.3}s infinite`}}
            onClick={()=>onSelectMt(mt)} onMouseEnter={()=>setHov(mt.id)} onMouseLeave={()=>setHov(null)}>
            {isH&&<div style={{position:"absolute",width:68,height:68,borderRadius:"50%",border:`2px solid ${mt.color}`,animation:"ring 1s infinite",top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>}
            <div style={{width:isH?56:46,height:isH?56:46,borderRadius:"50%",background:isH?`linear-gradient(135deg,${mt.color},${mt.color}cc)`:`linear-gradient(135deg,${mt.color}cc,${mt.color}88)`,boxShadow:isH?`0 0 0 6px ${mt.color}33,0 6px 24px ${mt.color}88`:`0 0 0 3px ${mt.color}22,0 3px 12px ${mt.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isH?26:22,transition:"all .25s",border:`2.5px solid ${mt.color}dd`,position:"relative"}}>
              {mt.emoji}
              {unread>0&&<div style={{position:"absolute",top:-6,right:-6,background:C.ora,color:"#fff",width:22,height:22,borderRadius:"50%",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:"2.5px solid #fff",boxShadow:"0 2px 8px #0003"}}>{unread>9?"9+":unread}</div>}
            </div>
            <div style={{fontWeight:800,fontSize:isH?13:12,color:isH?mt.color:C.mid,background:isH?`${mt.color}15`:"#ffffffdd",padding:"4px 10px",borderRadius:20,border:isH?`1px solid ${mt.color}44`:"1px solid #e2e8f0",transition:"all .25s",whiteSpace:"nowrap",boxShadow:"0 1px 4px #0001"}}>{mt.name}</div>
          </div>
        );
      })}

      {/* BOTTOM */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"28px 16px 16px",background:`linear-gradient(to top,${C.bg} 65%,transparent)`,pointerEvents:"none"}}>
        {viewer?.loaiHinh==="thuongtru"&&<div style={{pointerEvents:"auto",marginBottom:12}}><Countdown/></div>}
        <div style={{background:"#ffffffee",borderRadius:18,padding:"14px 18px",border:`1px solid ${C.bdr}`,boxShadow:`0 4px 20px ${C.pri}11`,pointerEvents:"auto",backdropFilter:"blur(8px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,color:C.txt,fontSize:18,fontFamily:"Pacifico, cursive",letterSpacing:.5}}>🗺️ Mặt trận chiến dịch</div>
              <div style={{color:"#94a3b8",fontSize:14,marginTop:3}}>
                <span style={{color:C.pri,fontWeight:700}}>{posts.length}</span> hoạt động ·{" "}
                <span style={{color:C.ora,fontWeight:700}}>{todayCnt}</span> hôm nay ·{" "}
                <span style={{fontWeight:700}}>{matTran.length} mặt trận</span>
              </div>
            </div>
            <div style={{color:"#94a3b8",fontSize:13,textAlign:"right",lineHeight:1.6}}>Chạm logo<br/>để xem tin 👆</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  FEED SCREEN
// ═══════════════════════════════════════════════
function FeedScreen({posts,viewer,allUsers,matTran,filterMt,onLike,onComment,onBack}) {
  const mt=matTran.find(m=>m.id===filterMt);
  const sorted=[...posts.filter(p=>filterMt?p.matTranId===filterMt:true)].sort((a,b)=>b.createdAt-a.createdAt);
  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{background:"#fff",padding:"14px 18px",borderBottom:`1px solid ${C.bdr}`,display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button onClick={onBack} style={{background:C.bg,border:`2px solid ${C.bdr}`,borderRadius:12,padding:"8px 14px",cursor:"pointer",color:C.pri,fontSize:18,fontWeight:700}}>←</button>
        {mt?<><div style={{width:38,height:38,borderRadius:"50%",fontSize:20,background:`${mt.color}22`,border:`2px solid ${mt.color}55`,display:"flex",alignItems:"center",justifyContent:"center"}}>{mt.emoji}</div><div style={{flex:1}}><div style={{fontWeight:800,color:C.txt,fontSize:17}}>{mt.name}</div><div style={{color:"#94a3b8",fontSize:13}}>{sorted.length} hoạt động</div></div></>
          :<div style={{flex:1}}><div style={{fontWeight:800,color:C.txt,fontSize:17}}>🌿 GreenHub · Tất cả mặt trận</div><div style={{color:"#94a3b8",fontSize:13}}>{sorted.length} hoạt động</div></div>}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 14px 32px"}}>
        {sorted.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"#94a3b8"}}><div style={{fontSize:48}}>🌱</div><div style={{marginTop:12,fontWeight:700,fontSize:17}}>Chưa có hoạt động nào</div></div>}
        {sorted.map(p=><PostCard key={p.id} post={p} viewer={viewer} allUsers={allUsers} matTran={matTran} onLike={onLike} onComment={onComment}/>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  ADMIN SCREEN (full CRUD)
// ═══════════════════════════════════════════════
function AdminScreen({allUsers,matTran,posts,onAddMt,onEditMt,onDeleteMt,onUpdateRole,marqueeText,onSaveMarquee,logoUrl,onUploadLogo}) {
  const [tab,setTab]=useState("dashboard");
  const [search,setSearch]=useState("");
  const [marq,setMarq]=useState(marqueeText||"");
  const [newMt,setNewMt]=useState({name:"",emoji:"🌿",color:"#16a34a",loaiHinh:"thuongtru"});
  const [editMt,setEditMt]=useState(null);
  const logoRef=useRef();
  const handleLogo=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>onUploadLogo(ev.target.result);r.readAsDataURL(f);};

  const userList=Object.values(allUsers);
  const filtered=userList.filter(u=>u.hoTen?.toLowerCase().includes(search.toLowerCase())||u.mssv?.includes(search)||u.email?.includes(search));

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${C.pri},${C.priD})`,padding:"16px 18px",flexShrink:0}}>
        <div style={{fontWeight:800,color:"#fff",fontSize:19}}>⚙️ Quản trị GreenHub</div>
        <div style={{color:"#bbf7d0",fontSize:14,marginTop:3}}>{userList.length} tài khoản · {matTran.length} mặt trận</div>
      </div>
      {/* Tabs */}
      <div style={{display:"flex",gap:6,padding:"10px 14px",background:C.bg,flexShrink:0,overflowX:"auto"}}>
        {[["dashboard","📊"],["users","👥"],["fronts","🗺️"],["settings","⚙️"]].map(([t,ic])=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 16px",borderRadius:12,border:"none",cursor:"pointer",background:tab===t?C.pri:C.card,color:tab===t?"#fff":C.mid,fontWeight:800,fontSize:14,whiteSpace:"nowrap"}}>{ic} {t==="dashboard"?"Dashboard":t==="users"?"Chiến sĩ":t==="fronts"?"Mặt trận":"Cài đặt"}</button>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 14px 40px"}}>

        {/* DASHBOARD */}
        {tab==="dashboard"&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
            {[
              {icon:"👥",val:userList.length,label:"Tổng chiến sĩ",color:C.pri},
              {icon:"📌",val:userList.filter(u=>u.loaiHinh==="thuongtru").length,label:"Thường trực",color:"#3b82f6"},
              {icon:"🔄",val:userList.filter(u=>u.loaiHinh==="khongthuongtru").length,label:"Không TT",color:"#8b5cf6"},
              {icon:"✅",val:posts.filter(p=>p.type==="diemdanh"&&new Date(p.createdAt).toDateString()===new Date().toDateString()).length,label:"Điểm danh hôm nay",color:C.ora},
              {icon:"📝",val:posts.length,label:"Tổng bài đăng",color:"#06b6d4"},
              {icon:"🗺️",val:matTran.length,label:"Mặt trận",color:C.acc},
            ].map(s=>(
              <div key={s.label} style={{background:"#fff",borderRadius:16,padding:"18px 14px",textAlign:"center",border:`1px solid ${C.bdr}`,boxShadow:`0 2px 10px ${s.color}11`}}>
                <div style={{fontSize:30}}>{s.icon}</div>
                <div style={{fontWeight:900,color:s.color,fontSize:28,lineHeight:1,margin:"8px 0 4px"}}>{s.val}</div>
                <div style={{color:"#94a3b8",fontSize:13}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{fontWeight:800,color:C.txt,fontSize:16,marginBottom:12}}>Phân bổ vai trò</div>
          {ROLES.map(r=>{const cnt=userList.filter(u=>u.role===r.id).length;if(!cnt)return null;return(
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,background:"#fff",borderRadius:12,padding:"12px 16px",border:`1px solid ${C.bdr}`}}>
              <Badge color={r.color} size={13}>{r.label}</Badge>
              <div style={{flex:1,background:C.bg,borderRadius:20,height:10,overflow:"hidden"}}>
                <div style={{height:10,borderRadius:20,background:r.color,width:`${Math.max(5,(cnt/Math.max(userList.length,1))*100)}%`,transition:"width .5s"}}/>
              </div>
              <div style={{fontWeight:800,color:r.color,fontSize:16,minWidth:28,textAlign:"right"}}>{cnt}</div>
            </div>
          );})}
        </>}

        {/* USERS */}
        {tab==="users"&&<>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Tìm theo tên, MSSV, email..."
            style={{width:"100%",boxSizing:"border-box",background:"#fff",border:`2px solid ${C.bdr}`,borderRadius:14,padding:"12px 16px",fontSize:15,outline:"none",color:C.txt,marginBottom:14}}/>
          {filtered.map(u=>{
            const ri=getRoleInfo(u.role);
            const mt=matTran.find(m=>m.id===u.matTranId);
            return(
              <div key={u.id} style={{background:"#fff",borderRadius:16,padding:"14px 16px",marginBottom:10,border:`1px solid ${C.bdr}`}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,color:C.txt,fontSize:16}}>{u.hoTen}</div>
                    <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                      <Badge color={ri.color} size={13}>{ri.label}</Badge>
                      {mt&&<Badge color={mt.color} size={13}>{mt.emoji} {mt.name}</Badge>}
                      <Badge color={u.loaiHinh==="thuongtru"?C.pri:"#94a3b8"} size={13}>{u.loaiHinh==="thuongtru"?"Thường trực":"Không TT"}</Badge>
                    </div>
                    <div style={{color:"#94a3b8",fontSize:13,marginTop:6}}>{u.mssv} · {u.email}</div>
                  </div>
                  <select value={u.role} onChange={e=>onUpdateRole(u.id,e.target.value)} style={{background:C.bg,border:`2px solid ${C.bdr}`,borderRadius:10,padding:"6px 10px",fontSize:13,color:C.txt,outline:"none",flexShrink:0}}>
                    {ROLES.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </>}

        {/* FRONTS - full CRUD */}
        {tab==="fronts"&&<>
          {/* Add new */}
          <div style={{background:"#fff",borderRadius:18,padding:"18px",marginBottom:16,border:`1px solid ${C.bdr}`}}>
            <div style={{fontWeight:800,color:C.txt,fontSize:16,marginBottom:14}}>➕ Thêm mặt trận mới</div>
            <Input label="Tên mặt trận" placeholder="Mặt trận Quận 1..." value={newMt.name} onChange={e=>setNewMt(f=>({...f,name:e.target.value}))}/>
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              <div style={{flex:1}}>
                <label style={{fontSize:15,fontWeight:700,color:C.txt,display:"block",marginBottom:6}}>Emoji</label>
                <input value={newMt.emoji} onChange={e=>setNewMt(f=>({...f,emoji:e.target.value}))} style={{width:"100%",boxSizing:"border-box",background:C.bg,border:`2px solid ${C.bdr}`,borderRadius:12,padding:"12px",fontSize:24,textAlign:"center",outline:"none"}}/>
              </div>
              <div style={{flex:1}}>
                <label style={{fontSize:15,fontWeight:700,color:C.txt,display:"block",marginBottom:6}}>Màu sắc</label>
                <input type="color" value={newMt.color} onChange={e=>setNewMt(f=>({...f,color:e.target.value}))} style={{width:"100%",height:50,border:`2px solid ${C.bdr}`,borderRadius:12,cursor:"pointer"}}/>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontWeight:700,color:C.txt,fontSize:15,marginBottom:6}}>Loại hình mặt trận *</label>
              <select value={newMt.loaiHinh||"thuongtru"} onChange={e=>setNewMt(f=>({...f,loaiHinh:e.target.value}))} style={{width:"100%",background:C.bg,border:`2px solid ${C.bdr}`,borderRadius:12,padding:"13px 16px",fontSize:16,color:C.txt,outline:"none",boxSizing:"border-box"}}>
                <option value="thuongtru">📌 Thường trực</option>
                <option value="khongthuongtru">🔄 Không thường trực</option>
              </select>
            </div>
            <Btn full onClick={()=>{if(!newMt.name.trim())return;onAddMt({...newMt,id:"mt"+uid(),x:Math.random()*65+10,y:Math.random()*55+10});setNewMt({name:"",emoji:"🌿",color:"#16a34a",loaiHinh:"thuongtru"});}}>Thêm mặt trận</Btn>
          </div>

          {/* List + Edit/Delete */}
          {matTran.map(m=>(
            <div key={m.id} style={{background:"#fff",borderRadius:16,padding:"14px 16px",marginBottom:10,border:`1px solid ${C.bdr}`}}>
              {editMt===m.id?(
                <div>
                  <Input label="Tên mặt trận" value={m.name} onChange={e=>onEditMt({...m,name:e.target.value})}/>
                  <div style={{display:"flex",gap:10,marginBottom:12}}>
                    <input value={m.emoji} onChange={e=>onEditMt({...m,emoji:e.target.value})} style={{flex:1,background:C.bg,border:`2px solid ${C.bdr}`,borderRadius:12,padding:"10px",fontSize:22,textAlign:"center",outline:"none"}}/>
                    <input type="color" value={m.color} onChange={e=>onEditMt({...m,color:e.target.value})} style={{flex:1,height:46,border:`2px solid ${C.bdr}`,borderRadius:12,cursor:"pointer"}}/>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <Btn variant="outline" style={{flex:1,padding:"10px"}} onClick={()=>setEditMt(null)}>Hủy</Btn>
                    <Btn style={{flex:1,padding:"10px"}} onClick={()=>setEditMt(null)}>✅ Lưu</Btn>
                  </div>
                </div>
              ):(
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:`${m.color}22`,border:`2px solid ${m.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{m.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,color:C.txt,fontSize:16}}>{m.name}</div>
                    <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                    <span style={{fontSize:12,color:"#94a3b8"}}>{posts.filter(p=>p.matTranId===m.id).length} bài đăng</span>
                    <span style={{fontSize:12,fontWeight:700,color:m.loaiHinh==="thuongtru"?C.pri:"#8b5cf6",background:m.loaiHinh==="thuongtru"?C.deep:"#f5f3ff",padding:"1px 8px",borderRadius:20}}>{m.loaiHinh==="thuongtru"?"📌 Thường trực":"🔄 Không TT"}</span>
                  </div>
                  </div>
                  <button onClick={()=>setEditMt(m.id)} style={{background:C.deep,border:`1px solid ${C.bdrM}`,borderRadius:10,padding:"7px 14px",cursor:"pointer",color:C.pri,fontWeight:700,fontSize:14}}>✏️ Sửa</button>
                  <button onClick={()=>{if(window.confirm(`Xóa "${m.name}"?`))onDeleteMt(m.id);}} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"7px 14px",cursor:"pointer",color:C.err,fontWeight:700,fontSize:14}}>🗑️</button>
                </div>
              )}
            </div>
          ))}
        </>}

        {/* SETTINGS */}
        {tab==="settings"&&<>
          {/* Logo upload */}
          <div style={{background:"#fff",borderRadius:18,padding:"20px",marginBottom:16,border:`1px solid ${C.bdr}`}}>
            <div style={{fontWeight:800,color:C.txt,fontSize:16,marginBottom:14}}>🌿 Logo GreenHub</div>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:`${C.pri}22`,border:`3px solid ${C.bdrM}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",fontSize:32,flexShrink:0}}>
                {logoUrl?<img src={logoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🌿"}
              </div>
              <div style={{flex:1}}>
                <div style={{color:C.txt,fontSize:15,marginBottom:8}}>Logo hiển thị ở giữa bản đồ và trang đăng nhập</div>
                <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogo}/>
                <Btn onClick={()=>logoRef.current?.click()} style={{fontSize:14,padding:"10px 18px"}}>📷 Đổi logo</Btn>
              </div>
            </div>
          </div>

          {/* Marquee */}
          <div style={{background:"#fff",borderRadius:18,padding:"20px",marginBottom:16,border:`1px solid ${C.bdr}`}}>
            <div style={{fontWeight:800,color:C.txt,fontSize:16,marginBottom:6}}>📢 Chạy chữ thông báo</div>
            <div style={{color:"#94a3b8",fontSize:14,marginBottom:14}}>Hiển thị trên đầu màn hình cho tất cả chiến sĩ</div>
            <textarea value={marq} onChange={e=>setMarq(e.target.value)} placeholder="VD: Chiến dịch Mùa Hè Xanh 2026 chính thức khai mạc! Toàn thể chiến sĩ hãy điểm danh đầy đủ!" rows={3}
              style={{width:"100%",boxSizing:"border-box",background:C.bg,border:`2px solid ${C.bdr}`,borderRadius:12,padding:"14px 16px",fontSize:15,color:C.txt,outline:"none",resize:"vertical",lineHeight:1.7,marginBottom:12}}/>
            {marq&&<div style={{background:C.deep,borderRadius:12,padding:"12px 16px",marginBottom:12,overflow:"hidden"}}>
              <div style={{fontSize:13,color:C.mid,fontWeight:700,marginBottom:6}}>Xem trước:</div>
              <div style={{color:C.pri,fontWeight:700,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>📢 {marq}</div>
            </div>}
            <div style={{display:"flex",gap:10}}>
              <Btn variant="outline" style={{flex:1,padding:"11px"}} onClick={()=>{setMarq("");onSaveMarquee("");}}>Xóa</Btn>
              <Btn style={{flex:2,padding:"11px"}} onClick={()=>onSaveMarquee(marq)}>💾 Lưu & Phát</Btn>
            </div>
          </div>

          {/* Units info */}
          <div style={{background:"#fff",borderRadius:18,padding:"20px",border:`1px solid ${C.bdr}`}}>
            <div style={{fontWeight:800,color:C.txt,fontSize:16,marginBottom:14}}>🏫 Thống kê đơn vị</div>
            {["Khoa","Viện","CLB"].map(type=>{
              const cnt=userList.filter(u=>u.donViType===type).length;
              if(!cnt) return null;
              return(
                <div key={type} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,background:C.bg,borderRadius:12,padding:"12px 16px"}}>
                  <div style={{fontWeight:800,color:C.txt,fontSize:16,minWidth:50}}>{type}</div>
                  <div style={{flex:1,background:C.bdr,borderRadius:20,height:10,overflow:"hidden"}}>
                    <div style={{height:10,borderRadius:20,background:C.pri,width:`${(cnt/Math.max(userList.length,1))*100}%`}}/>
                  </div>
                  <div style={{fontWeight:800,color:C.pri,fontSize:16}}>{cnt}</div>
                </div>
              );
            })}
            <div style={{marginTop:14}}>
              {[...new Set(userList.map(u=>u.donViTen).filter(Boolean))].slice(0,10).map(ten=>{
                const cnt=userList.filter(u=>u.donViTen===ten).length;
                return <div key={ten} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.bg}`,fontSize:14,color:C.txt}}><span>{ten}</span><Badge color={C.pri} size={13}>{cnt}</Badge></div>;
              })}
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  STATS SCREEN
// ═══════════════════════════════════════════════
function StatsScreen({posts,allUsers,matTran}) {
  const userList=Object.values(allUsers);
  const topMt=matTran.map(m=>({...m,cnt:posts.filter(p=>p.matTranId===m.id).length})).sort((a,b)=>b.cnt-a.cnt);
  return (
    <div style={{padding:"18px 14px 80px",overflowY:"auto",height:"100%",boxSizing:"border-box"}}>
      <div style={{fontWeight:800,color:C.txt,fontSize:18,marginBottom:18}}>📊 Thống kê chiến dịch</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        {[
          {ic:"👥",v:userList.length,l:"Tổng chiến sĩ",c:C.pri},
          {ic:"✅",v:posts.filter(p=>p.type==="diemdanh").length,l:"Tổng điểm danh",c:C.ora},
          {ic:"📝",v:posts.length,l:"Tổng bài đăng",c:"#06b6d4"},
          {ic:"⚡",v:posts.filter(p=>now()-p.createdAt<86400000).length,l:"Hôm nay",c:C.acc},
        ].map(s=>(
          <div key={s.l} style={{background:"#fff",borderRadius:16,padding:"18px 14px",textAlign:"center",border:`1px solid ${C.bdr}`}}>
            <div style={{fontSize:30}}>{s.ic}</div>
            <div style={{fontWeight:900,color:s.c,fontSize:28,lineHeight:1,margin:"8px 0 4px"}}>{s.v}</div>
            <div style={{color:"#94a3b8",fontSize:13}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{fontWeight:800,color:C.txt,fontSize:16,marginBottom:12}}>🏆 Mặt trận hoạt động nhất</div>
      {topMt.map((m,i)=>(
        <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:14,padding:"14px 16px",marginBottom:10,border:`1px solid ${C.bdr}`}}>
          <div style={{fontSize:20,minWidth:30}}>{["🥇","🥈","🥉"][i]||`#${i+1}`}</div>
          <div style={{width:36,height:36,borderRadius:"50%",background:`${m.color}22`,border:`2px solid ${m.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{m.emoji}</div>
          <div style={{flex:1,fontWeight:700,color:C.txt,fontSize:15}}>{m.name}</div>
          <div style={{background:`${m.color}11`,color:m.color,fontWeight:800,fontSize:15,padding:"4px 12px",borderRadius:20}}>{m.cnt}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  PROFILE SCREEN
// ═══════════════════════════════════════════════
function ProfileScreen({viewer,posts,matTran,onLogout,onChangePwd}) {
  const [showPwd,setShowPwd]=useState(false);
  const [oldPwd,setOldPwd]=useState("");
  const [newPwd,setNewPwd]=useState("");
  const [pwdMsg,setPwdMsg]=useState("");
  const myPosts=posts.filter(p=>p.authorId===viewer.id).sort((a,b)=>b.createdAt-a.createdAt);
  const ri=getRoleInfo(viewer.role);
  const mt=matTran.find(m=>m.id===viewer.matTranId);
  const changePwd=async()=>{
    const res=await authUsers.login(viewer.email,oldPwd);
    if(res.error){setPwdMsg("Mật khẩu cũ không đúng");return;}
    if(newPwd.length<6){setPwdMsg("Mật khẩu mới phải ≥ 6 ký tự");return;}
    await onChangePwd(newPwd); setPwdMsg("✅ Đổi mật khẩu thành công!"); setOldPwd(""); setNewPwd("");
  };
  return (
    <div style={{height:"100%",overflowY:"auto",padding:"18px 14px 80px",boxSizing:"border-box"}}>
      <div style={{background:`linear-gradient(135deg,${C.pri},${C.priD})`,borderRadius:20,padding:"22px",marginBottom:18,color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:60,height:60,borderRadius:"50%",background:"#ffffff33",border:"2px solid #ffffff66",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>🌿</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:20}}>{viewer.hoTen}</div>
            <div style={{opacity:.8,fontSize:14,marginTop:3}}>{viewer.mssv} · {viewer.donViType} {viewer.donViTen}</div>
            <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
              <span style={{background:"#ffffff33",padding:"3px 12px",borderRadius:20,fontSize:13,fontWeight:700}}>{ri.label}</span>
              {mt&&<span style={{background:"#ffffff33",padding:"3px 12px",borderRadius:20,fontSize:13,fontWeight:700}}>{mt.emoji} {mt.name}</span>}
              <span style={{background:"#ffffff33",padding:"3px 12px",borderRadius:20,fontSize:13,fontWeight:700}}>{viewer.loaiHinh==="thuongtru"?"Thường trực":"Không TT"}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:20,marginTop:18,paddingTop:18,borderTop:"1px solid #ffffff22"}}>
          {[{l:"Bài đăng",v:myPosts.length},{l:"Điểm danh",v:myPosts.filter(p=>p.type==="diemdanh").length},{l:"Nhật ký",v:myPosts.filter(p=>p.type==="diary").length}].map(s=>(
            <div key={s.l} style={{textAlign:"center",flex:1}}><div style={{fontWeight:900,fontSize:24}}>{s.v}</div><div style={{opacity:.7,fontSize:13}}>{s.l}</div></div>
          ))}
        </div>
      </div>

      <div style={{background:"#fff",borderRadius:18,padding:"18px",marginBottom:16,border:`1px solid ${C.bdr}`}}>
        <button onClick={()=>setShowPwd(!showPwd)} style={{width:"100%",background:"none",border:"none",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",color:C.txt,fontWeight:800,fontSize:16,padding:0}}>
          🔐 Đổi mật khẩu <span style={{color:"#94a3b8"}}>{showPwd?"▲":"▼"}</span>
        </button>
        {showPwd&&<div style={{marginTop:16}}>
          {pwdMsg&&<div style={{padding:"10px 14px",borderRadius:10,fontSize:14,marginBottom:12,background:pwdMsg.includes("✅")?C.deep:C.errBg,color:pwdMsg.includes("✅")?C.pri:C.err,fontWeight:700}}>{pwdMsg}</div>}
          <Input label="Mật khẩu cũ" type="password" value={oldPwd} onChange={e=>setOldPwd(e.target.value)}/>
          <Input label="Mật khẩu mới" type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)}/>
          <Btn full onClick={changePwd}>Xác nhận đổi mật khẩu</Btn>
        </div>}
      </div>

      <div style={{fontWeight:800,color:C.txt,fontSize:16,marginBottom:12}}>📌 Bài đăng của tôi</div>
      {myPosts.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}><div style={{fontSize:44}}>✍️</div><div style={{marginTop:10,fontWeight:700,fontSize:16}}>Chưa có bài đăng nào</div></div>}
      {myPosts.map(p=>(
        <div key={p.id} style={{background:"#fff",borderRadius:14,padding:"14px 16px",marginBottom:10,border:`1px solid ${C.bdr}`}}>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:p.content?8:0}}>
            <Badge color={p.type==="diemdanh"?C.pri:p.type==="diary"?C.sun:C.acc} size={13}>{p.type==="diemdanh"?"✅ Điểm danh":p.type==="diary"?"📔 Nhật ký":"🌿 Chia sẻ"}</Badge>
            <span style={{fontSize:13,color:"#94a3b8"}}>{tAgo(p.createdAt)}</span>
          </div>
          {p.title&&<div style={{fontWeight:800,color:C.txt,fontSize:15,marginBottom:6}}>{p.title}</div>}
          {p.content&&<div style={{color:"#374151",fontSize:15,lineHeight:1.7}}>{p.content}</div>}
        </div>
      ))}

      <button onClick={onLogout} style={{width:"100%",marginTop:18,padding:"14px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:14,color:C.err,fontWeight:800,cursor:"pointer",fontSize:16}}>🚪 Đăng xuất</button>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  LOGIN SCREEN
// ═══════════════════════════════════════════════
function LoginScreen({onLogin,onGoRegister,logoUrl}) {
  const [email,setEmail]=useState("");
  const [pwd,setPwd]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const submit=async()=>{
    if(!email||!pwd){setErr("Vui lòng nhập đầy đủ");return;}
    setLoading(true);setErr("");
    const res=await authUsers.login(email.trim().toLowerCase(),pwd);
    setLoading(false);
    if(res.error) setErr(res.error); else onLogin(res.user);
  };
  return (
    <div style={{position:"fixed",inset:0,background:`linear-gradient(160deg,${C.priD} 0%,${C.pri} 45%,${C.acc} 100%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 16px",overflowY:"auto",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:480}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:110,height:110,borderRadius:"50%",background:"#ffffff33",border:"4px solid #ffffff66",boxShadow:"0 0 0 18px #ffffff11",display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,margin:"0 auto 18px",overflow:"hidden"}}>
            {logoUrl?<img src={logoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🌿"}
          </div>
          <h1 style={{color:"#fff",margin:"0 0 10px",fontSize:52,fontFamily:"Pacifico, cursive",letterSpacing:1,textShadow:"0 3px 20px #0005"}}>{APP_NAME}</h1>
          <p style={{color:"#e8fdf0",margin:0,fontSize:22,fontFamily:"Pacifico, cursive",lineHeight:1.8,padding:"0 12px",textShadow:"0 2px 12px #0004"}}>{TAGLINE}</p>
        </div>
        <div style={{background:"#fff",borderRadius:24,padding:"28px 24px",boxShadow:`0 20px 60px ${C.priD}44`}}>
          <h2 style={{margin:"0 0 22px",color:C.txt,fontSize:20,fontWeight:800}}>Đăng nhập</h2>
          {err&&<div style={{background:C.errBg,color:C.err,padding:"12px 16px",borderRadius:12,fontSize:15,marginBottom:16,fontWeight:700}}>{err}</div>}
          <Input label="Email" type="email" placeholder="email@iuh.edu.vn" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          <Input label="Mật khẩu" type="password" placeholder="••••••••" value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          <Btn full onClick={submit} disabled={loading}>{loading?"Đang đăng nhập...":"Đăng nhập 🚀"}</Btn>
          <div style={{textAlign:"center",marginTop:18,fontSize:15,color:"#94a3b8"}}>Chưa có tài khoản? <button onClick={onGoRegister} style={{background:"none",border:"none",color:C.pri,fontWeight:800,cursor:"pointer",fontSize:15}}>Đăng ký ngay</button></div>
          <div style={{textAlign:"center",marginTop:10,fontSize:13,color:"#cbd5e1"}}>Mật khẩu mặc định: <strong>{DEFAULT_PWD}</strong></div>
        </div>
        <div style={{textAlign:"center",marginTop:20,color:"#ffffff88",fontSize:12}}>Built & Developed by Nguyen Thai Tan · Faculty of Civil Engineering IUH · Youth Union & Student Association IUH 2026</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  REGISTER SCREEN
// ═══════════════════════════════════════════════
function RegisterScreen({onBack,onSuccess,matTran}) {
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({email:"",sdt:"",mssv:"",donViType:"Khoa",donViTen:"",cccd:"",ngayCap:"",matTranId:"",loaiHinh:"thuongtru",hoTen:""});
  const [err,setErr]=useState({});
  const [loading,setLoading]=useState(false);
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const v1=()=>{const e={};if(!form.hoTen.trim())e.hoTen="Vui lòng nhập họ tên";if(!form.email.includes("@"))e.email="Email không hợp lệ";if(form.sdt.length<9)e.sdt="SĐT không hợp lệ";if(!form.mssv.trim())e.mssv="Vui lòng nhập MSSV/MSNV";setErr(e);return!Object.keys(e).length;};
  const v2=()=>{const e={};if(!form.donViTen.trim())e.donViTen="Vui lòng nhập đơn vị";if(form.cccd.length<12)e.cccd="CCCD cần 12 số";if(!form.ngayCap)e.ngayCap="Vui lòng chọn ngày cấp";if(!form.matTranId)e.matTranId="Vui lòng chọn mặt trận";setErr(e);return!Object.keys(e).length;};
  const submit=async()=>{if(!v2())return;setLoading(true);const res=await authUsers.register({...form,email:form.email.trim().toLowerCase()});setLoading(false);if(res.error)setErr({submit:res.error});else onSuccess(res.user);};
  return (
    <div style={{position:"fixed",inset:0,background:`linear-gradient(160deg,${C.priD},${C.pri} 50%,${C.acc})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 16px",overflowY:"auto",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:480}}>
        <div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:40,marginBottom:8}}>🌿</div><h1 style={{color:"#fff",margin:"0 0 6px",fontFamily:"Pacifico, cursive",fontSize:34,letterSpacing:1}}>{APP_NAME}</h1><p style={{color:"#e8fdf0",margin:0,fontSize:16,fontFamily:"Pacifico, cursive"}}>Đăng ký tài khoản chiến sĩ</p></div>
        <div style={{background:"#fff",borderRadius:24,padding:"26px 22px",boxShadow:`0 20px 60px ${C.priD}44`}}>
          <div style={{display:"flex",gap:8,marginBottom:22}}>{[1,2].map(s=><div key={s} style={{flex:1,height:5,borderRadius:4,background:step>=s?C.pri:C.bdr,transition:"background .3s"}}/>)}</div>
          <h2 style={{margin:"0 0 20px",color:C.txt,fontSize:18,fontWeight:800}}>{step===1?"👤 Thông tin cá nhân":"📋 Thông tin chiến dịch"}</h2>
          {err.submit&&<div style={{background:C.errBg,color:C.err,padding:"12px 16px",borderRadius:12,fontSize:14,marginBottom:16,fontWeight:700}}>{err.submit}</div>}
          {step===1&&<><Input label="Họ và tên *" placeholder="Nguyễn Văn A" value={form.hoTen} onChange={e=>upd("hoTen",e.target.value)} error={err.hoTen}/><Input label="Email *" type="email" placeholder="21xxxxxx@st.iuh.edu.vn" value={form.email} onChange={e=>upd("email",e.target.value)} error={err.email}/><Input label="Số điện thoại *" type="tel" placeholder="09xxxxxxxx" value={form.sdt} onChange={e=>upd("sdt",e.target.value)} error={err.sdt}/><Input label="MSSV/MSNV *" placeholder="21xxxxxxxx / GV..." value={form.mssv} onChange={e=>upd("mssv",e.target.value)} error={err.mssv}/><Btn full onClick={()=>{if(v1())setStep(2);}}>Tiếp theo →</Btn></>}
          {step===2&&<>
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              <div style={{flex:1}}><Select label="Loại đơn vị *" value={form.donViType} options={["Khoa","Viện","CLB"].map(d=>({value:d,label:d}))} onChange={e=>upd("donViType",e.target.value)}/></div>
              <div style={{flex:2}}><Input label="Tên đơn vị *" placeholder="Khoa Xây dựng" value={form.donViTen} onChange={e=>upd("donViTen",e.target.value)} error={err.donViTen}/></div>
            </div>
            <Input label="Số CCCD * (12 số)" placeholder="0xxxxxxxxxx" value={form.cccd} onChange={e=>upd("cccd",e.target.value.replace(/\D/g,""))} error={err.cccd}/>
            <Input label="Ngày cấp CCCD *" type="date" value={form.ngayCap} onChange={e=>upd("ngayCap",e.target.value)} error={err.ngayCap}/>
            <Select label="Chọn mặt trận *" value={form.matTranId} error={err.matTranId} options={[{value:"",label:"-- Chọn mặt trận --"},...matTran.map(m=>({value:m.id,label:`${m.emoji} ${m.name}`}))]} onChange={e=>upd("matTranId",e.target.value)}/>
            <Select label="Loại hình tham gia *" value={form.loaiHinh} options={LOAI_HINH.map(l=>({value:l.id,label:l.label}))} onChange={e=>upd("loaiHinh",e.target.value)}/>
            <div style={{display:"flex",gap:10}}><Btn variant="outline" style={{flex:1,padding:"13px"}} onClick={()=>setStep(1)}>← Quay lại</Btn><Btn style={{flex:2,padding:"13px"}} onClick={submit} disabled={loading}>{loading?"Đang đăng ký...":"Hoàn tất đăng ký ✅"}</Btn></div>
          </>}
        </div>
        <div style={{textAlign:"center",marginTop:16}}><button onClick={onBack} style={{background:"none",border:"none",color:"#ffffff99",cursor:"pointer",fontSize:14}}>← Quay lại đăng nhập</button></div>
        <div style={{textAlign:"center",marginTop:10,color:"#ffffff66",fontSize:12}}>Built & Developed by Nguyen Thai Tan · Faculty of Civil Engineering IUH · Youth Union & Student Association IUH 2026</div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════
//  HEADER RIGHT (bell + user card + dropdown)
// ═══════════════════════════════════════════════
function HeaderRight({viewer, matTran, notifs, onCompose, onLogout, onGoProfile}) {
  const [open, setOpen] = useState(false);
  const ri  = getRoleInfo(viewer?.role);
  const mt  = matTran.find(m=>m.id===viewer?.matTranId);
  const sub = mt ? `${mt.name}` : ri.label;
  return (
    <div style={{display:"flex",gap:10,alignItems:"center",position:"relative"}}>
      {/* Bell */}
      <div style={{position:"relative",cursor:"pointer"}}>
        <div style={{fontSize:30}}>🔔</div>
        {notifs.length>0&&<div style={{position:"absolute",top:-4,right:-4,background:C.ora,color:"#fff",width:22,height:22,borderRadius:"50%",fontSize:12,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #fff",animation:"bellBounce .5s ease"}}>{notifs.length>9?"9+":notifs.length}</div>}
      </div>
      {/* Name card */}
      <div onClick={()=>setOpen(!open)} style={{cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"flex-end",padding:"4px 10px",borderRadius:12,background:open?C.deep:C.bg,border:`1.5px solid ${open?C.bdrM:C.bdr}`,transition:"all .2s"}}>
        <div style={{fontWeight:800,color:ri.color,fontSize:15,whiteSpace:"nowrap"}}>{viewer?.hoTen?.split(" ").slice(-2).join(" ")}</div>
        <div style={{fontSize:12,color:"#94a3b8",whiteSpace:"nowrap"}}>{sub}</div>
      </div>
      {/* Dropdown */}
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 10px)",right:0,background:"#fff",borderRadius:18,boxShadow:"0 8px 32px #0002",border:`1px solid ${C.bdr}`,minWidth:220,zIndex:200,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
          {/* User info */}
          <div style={{background:`linear-gradient(135deg,${C.pri},${C.priD})`,padding:"16px 18px"}}>
            <div style={{fontWeight:800,color:"#fff",fontSize:16}}>{viewer?.hoTen}</div>
            <div style={{color:"#bbf7d0",fontSize:13,marginTop:2}}>{ri.label} {mt?`· ${mt.emoji} ${mt.name}`:""}</div>
            <div style={{color:"#bbf7d0",fontSize:12,marginTop:2}}>{viewer?.email}</div>
          </div>
          {/* Actions */}
          {[
            {icon:"✍️", label:"Đăng bài / Chia sẻ",  action:()=>{onCompose();setOpen(false);}},
            {icon:"👤", label:"Trang cá nhân",         action:()=>{onGoProfile();setOpen(false);}},
          ].map(item=>(
            <button key={item.label} onClick={item.action} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:"none",border:"none",borderBottom:`1px solid ${C.bg}`,cursor:"pointer",color:C.txt,fontSize:15,fontWeight:600,textAlign:"left"}}>
              <span style={{fontSize:20}}>{item.icon}</span>{item.label}
            </button>
          ))}
          <button onClick={()=>{onLogout();setOpen(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:"#fef2f2",border:"none",cursor:"pointer",color:C.err,fontSize:15,fontWeight:700,textAlign:"left"}}>
            <span style={{fontSize:20}}>🚪</span>Đăng xuất
          </button>
        </div>
      )}
      {open&&<div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setOpen(false)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════
export default function App() {
  const [viewer,setViewer]         = useState(null);
  const [allUsers,setAllUsers]     = useState({});
  const [posts,setPosts]           = useState([]);
  const [matTran,setMatTran]       = useState(SEED_MAT_TRAN);
  const [screen,setScreen]         = useState("auth");
  const [feedMt,setFeedMt]         = useState(null);
  const [compose,setCompose]       = useState(false);
  const [notifs,setNotifs]         = useState([]);
  const [loaded,setLoaded]         = useState(false);
  const [logoUrl,setLogoUrl]       = useState(null);
  const [marqueeText,setMarquee]   = useState("");

  useEffect(()=>{(async()=>{
    const u=await db.get("users");       if(u) setAllUsers(u);
    const p=await db.get("posts");       if(p) setPosts(p);
    const m=await db.get("matTran");     if(m) setMatTran(m);
    const lg=await db.get("logoUrl");    if(lg) setLogoUrl(lg);
    const mq=await db.get("marquee");    if(mq) setMarquee(mq);
    const v=await db.get("session");
    if(v){const users=await db.get("users")||{};const ok=Object.values(users).find(u=>u.id===v.id);if(ok){setViewer(ok);setScreen("map");}else await db.set("session",null);}
    setLoaded(true);
  })();},[]);

  // Seed admin
  useEffect(()=>{
    if(!loaded) return;
    (async()=>{
      const users=await db.get("users")||{};
      if(!Object.values(users).find(u=>u.email==="thaitanbq@gmail.com")){
        const id="admin_thaitanbq";
        users[id]={id,hoTen:"Nguyễn Thái Tân",email:"thaitanbq@gmail.com",mssv:"ADMIN",sdt:"0900000000",donViType:"Khoa",donViTen:"Xây dựng IUH",cccd:"000000000000",ngayCap:"2020-01-01",matTranId:"",loaiHinh:"thuongtru",role:"admin",password:hashPwd(DEFAULT_PWD),createdAt:now(),approved:true};
        await db.set("users",users); setAllUsers({...users});
      }
    })();
  },[loaded]);

  const login=async u=>{setViewer(u);await db.set("session",u);setScreen("map");};
  const logout=async()=>{setViewer(null);await db.set("session",null);setScreen("auth");};
  const changePwd=async pwd=>{const u=await authUsers.update(viewer.id,{password:hashPwd(pwd)});setViewer(u);await db.set("session",u);const users=await db.get("users")||{};setAllUsers(users);};
  const uploadLogo=async url=>{setLogoUrl(url);await db.set("logoUrl",url);};
  const saveMarquee=async txt=>{setMarquee(txt);await db.set("marquee",txt);};

  const addPost=async data=>{
    const np={id:uid(),...data,authorId:viewer.id,likes:[],comments:[],createdAt:now()};
    const u=[np,...posts]; setPosts(u); await db.set("posts",u);
    const mt=matTran.find(m=>m.id===data.matTranId);
    const icon=data.type==="diemdanh"?"✅":data.type==="diary"?"📔":"🌿";
    const title=data.type==="diemdanh"?`${data.anonymous?"Ai đó":viewer.hoTen} vừa điểm danh!`:data.type==="diary"?`📔 Nhật ký mới từ ${data.anonymous?"Ẩn danh":viewer.hoTen}`:`🌿 ${data.anonymous?"Ẩn danh":viewer.hoTen} vừa đăng bài`;
    const nid=uid(); setNotifs(n=>[{id:nid,icon,title,body:data.content?.slice(0,60)||(mt?`tại ${mt.name}`:""),time:now()},...n].slice(0,20));
    setTimeout(()=>setNotifs(n=>n.filter(x=>x.id!==nid)),5000);
  };
  const doLike=async id=>{const u=posts.map(p=>{if(p.id!==id)return p;const l=p.likes||[];return{...p,likes:l.includes(viewer.id)?l.filter(x=>x!==viewer.id):[...l,viewer.id]};});setPosts(u);await db.set("posts",u);};
  const doComment=async(id,text)=>{const u=posts.map(p=>{if(p.id!==id)return p;return{...p,comments:[...(p.comments||[]),{authorId:viewer.id,text,createdAt:now()}]};});setPosts(u);await db.set("posts",u);};
  const addMt=async mt=>{const u=[...matTran,mt];setMatTran(u);await db.set("matTran",u);};
  const editMt=async mt=>{const u=matTran.map(m=>m.id===mt.id?mt:m);setMatTran(u);await db.set("matTran",u);};
  const deleteMt=async id=>{const u=matTran.filter(m=>m.id!==id);setMatTran(u);await db.set("matTran",u);};
  const updateRole=async(uid2,role)=>{await authUsers.update(uid2,{role});const users=await db.get("users")||{};setAllUsers(users);};

  const rl=getRoleLevel(viewer?.role);

  if(!loaded) return(
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${C.pri},${C.priD})`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14}}>
      <div style={{fontSize:52,animation:"spin 2s linear infinite"}}>🌿</div>
      <div style={{color:"#fff",fontFamily:"Pacifico, cursive",fontSize:26,letterSpacing:1}}>GreenHub đang khởi động...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if(screen==="auth") return <LoginScreen onLogin={login} onGoRegister={()=>setScreen("register")} logoUrl={logoUrl}/>;
  if(screen==="register") return <RegisterScreen onBack={()=>setScreen("auth")} onSuccess={login} matTran={matTran}/>;

  const TABS=[
    {id:"map",  icon:"🗺️", label:"Mặt trận"},
    ...(rl>=5?[{id:"stats",icon:"📊",label:"Thống kê"}]:[]),
    {id:"write",icon:"✍️", label:"Đăng bài"},
    ...(rl>=7?[{id:"admin",icon:"⚙️",label:"Quản trị"}]:[]),
    {id:"profile",icon:"👤",label:"Tôi"},
  ];

  return (
    <div style={{height:"100vh",width:"100%",background:C.bg,fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <NotifToast notifs={notifs} onDismiss={id=>setNotifs(n=>n.filter(x=>x.id!==id))}/>

      {/* Header */}
      <div style={{background:"#fff",padding:"12px 18px",borderBottom:`1px solid ${C.bdr}`,display:"flex",alignItems:"center",gap:12,flexShrink:0,boxShadow:`0 2px 12px ${C.pri}0a`}}>
        <div style={{width:46,height:46,borderRadius:"50%",background:`linear-gradient(135deg,${C.priL},${C.pri})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,overflow:"hidden",flexShrink:0}}>
          {logoUrl?<img src={logoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🌿"}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:900,color:C.txt,fontSize:24,fontFamily:"Pacifico, cursive",letterSpacing:.5}}>{APP_NAME}</div>
          <div style={{color:C.mid,fontSize:13,fontFamily:"Pacifico, cursive",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",letterSpacing:.3}}>{TAGLINE}</div>
        </div>
        <HeaderRight viewer={viewer} matTran={matTran} notifs={notifs} onCompose={()=>setCompose(true)} onLogout={logout} onGoProfile={()=>setScreen("profile")}/>
      </div>

      {/* Marquee */}
      {marqueeText&&<Marquee text={marqueeText}/>}

      {/* Content */}
      <div style={{flex:1,overflow:"hidden",position:"relative"}}>
        {screen==="map"&&!feedMt&&<MapScreen posts={posts} viewer={viewer} matTran={matTran} onSelectMt={m=>{setFeedMt(m.id);setScreen("feed");}} onSelectCenter={()=>{setFeedMt(null);setScreen("feed");}} logoUrl={logoUrl} onUploadLogo={uploadLogo}/>}
        {screen==="feed"&&<FeedScreen posts={posts} viewer={viewer} allUsers={allUsers} matTran={matTran} filterMt={feedMt} onLike={doLike} onComment={doComment} onBack={()=>{setScreen("map");setFeedMt(null);}}/>}
        {screen==="stats"&&rl>=5&&<div style={{height:"100%",overflowY:"auto"}}><StatsScreen posts={posts} allUsers={allUsers} matTran={matTran}/></div>}
        {screen==="admin"&&rl>=7&&<AdminScreen allUsers={allUsers} matTran={matTran} posts={posts} onAddMt={addMt} onEditMt={editMt} onDeleteMt={deleteMt} onUpdateRole={updateRole} marqueeText={marqueeText} onSaveMarquee={saveMarquee} logoUrl={logoUrl} onUploadLogo={uploadLogo}/>}
        {screen==="profile"&&<ProfileScreen viewer={viewer} posts={posts} matTran={matTran} onLogout={logout} onChangePwd={changePwd}/>}
      </div>

      {/* Bottom nav */}
      <div style={{background:"#fff",borderTop:`1px solid ${C.bdr}`,display:"flex",flexShrink:0,boxShadow:`0 -2px 12px ${C.pri}0a`,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>{if(t.id==="write"){setCompose(true);return;}setScreen(t.id);if(t.id!=="feed")setFeedMt(null);}} style={{flex:1,padding:"10px 0 12px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:t.id==="write"?C.pri:(screen===t.id?C.pri:"#94a3b8"),position:"relative"}}>
            {t.id==="write"?<div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${C.priL},${C.pri})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:`0 4px 16px ${C.pri}55`,marginTop:-10}}>✍️</div>:<><span style={{fontSize:22}}>{t.icon}</span>{screen===t.id&&<div style={{position:"absolute",bottom:4,width:22,height:3,background:C.pri,borderRadius:2}}/>}</>}
            <span style={{fontSize:13,fontWeight:screen===t.id||t.id==="write"?800:500}}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{background:"#fff",borderTop:`1px solid ${C.bdr}`,textAlign:"center",padding:"6px 0 8px",fontSize:13,color:"#94a3b8",letterSpacing:.3,flexShrink:0}}>
        Built & Developed by <strong style={{color:C.mid}}>Nguyen Thai Tan</strong> · Faculty of Civil Engineering IUH · Youth Union & Student Association IUH · 2026
      </div>

      {compose&&<ComposeModal viewer={viewer} matTran={matTran} onSubmit={addPost} onClose={()=>setCompose(false)}/>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes marqueeRun{0%{transform:translateX(100vw)}100%{transform:translateX(-100%)}}
        @keyframes bellBounce{0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
        @keyframes slideDown{from{transform:translateX(-50%) translateY(-20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
        @keyframes floatNode{0%,100%{transform:translate(-50%,-50%) translateY(0)}50%{transform:translate(-50%,-50%) translateY(-7px)}}
        @keyframes ring{0%{transform:translate(-50%,-50%) scale(1);opacity:.7}100%{transform:translate(-50%,-50%) scale(1.8);opacity:0}}
        @keyframes hqPulse{0%,100%{box-shadow:0 0 0 8px #16a34a33,0 0 0 16px #16a34a11,0 4px 28px #16a34a66}50%{box-shadow:0 0 0 14px #16a34a11,0 0 0 24px #16a34a08,0 4px 28px #16a34a88}}
        button:active{opacity:.8;transform:scale(.97)}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.bdr};border-radius:4px}
      `}</style>
    </div>
  );
}