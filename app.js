/* ═══════════════════════════════════════════════
   DASHBOARD FINANCEIRO — APP.JS
   Multi-pessoa | Cache local | Análise de casal
   ═══════════════════════════════════════════════ */
const { useState, useMemo, useRef, useEffect, useCallback } = React;

// ─── THEME ────────────────────────────────────
function useTheme() {
  const [dark, setDark] = useState(() => {
    const s = localStorage.getItem("fin-theme");
    return s ? s === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    const html = document.documentElement;
    const meta = document.getElementById("meta-theme-color");
    if (dark) { html.classList.remove("light"); meta?.setAttribute("content","#06060f"); }
    else       { html.classList.add("light");    meta?.setAttribute("content","#f0f2f8"); }
    localStorage.setItem("fin-theme", dark ? "dark" : "light");
  }, [dark]);
  return [dark, () => setDark(d => !d)];
}

// ─── WINDOW WIDTH HOOK ────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(()=>typeof window!=="undefined"?window.innerWidth:1024);
  useEffect(()=>{
    const fn=()=>setW(window.innerWidth);
    window.addEventListener("resize",fn,{passive:true});
    return()=>window.removeEventListener("resize",fn);
  },[]);
  return w;
}

// ─── RECHARTS ─────────────────────────────────
if (typeof Recharts === "undefined") {
  document.getElementById("root").innerHTML =
    '<div style="color:#ef4444;font-family:monospace;padding:40px;text-align:center">⚠️ Recharts não carregou.</div>';
  throw new Error("Recharts not loaded");
}
const { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
        XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = Recharts;

// ─── FORMATTERS ───────────────────────────────
const fmt      = v => `R$ ${Math.abs(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtShort = v => { const n=Math.abs(v); return n>=1000?`R$${(n/1000).toFixed(1)}k`:`R$${n.toFixed(0)}`; };
const fmtDate  = d => { if(!d) return ""; const p=d.split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:d; };
const fmtTs    = ts => ts ? new Date(ts).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";

// ─── CONSTANTS ────────────────────────────────
const CAT_COLORS = {
  "Supermercado":"#22c55e","Gastronomia":"#f97316","Delivery":"#f43f5e",
  "Transporte":"#3b82f6","Tecnologia/Assinaturas":"#8b5cf6",
  "Compras Online":"#06b6d4","Gasolina":"#eab308",
  "Saúde":"#ec4899","Padaria/Alimentação":"#a78bfa","Academia/Saúde":"#14b8a6",
  "Cafés/Pequenos":"#fb923c","Conveniência":"#c026d3","Parcelamentos":"#64748b",
  "Encargos/Juros":"#ef4444","Estacionamento":"#94a3b8",
  "Presentes/Bazar":"#f43f5e","Educação":"#0ea5e9","Telecomunicações":"#38bdf8",
  "Seguros":"#d97706","Outros":"#6b7280",
};
const CARD_COLORS   = { Nubank:"#8c52ff", Ailos:"#00a86b", Inter:"#ff6b00" };
const PERSON_COLORS = ["#6366f1","#f43f5e","#f97316","#10b981","#06b6d4","#8b5cf6","#eab308","#ec4899"];

// ─── CATEGORY GROUPS (for quick-select presets) ──
const CAT_GROUPS = [
  { label:"🍽️ Alimentação", cats:["Supermercado","Gastronomia","Delivery","Padaria/Alimentação","Cafés/Pequenos","Conveniência"] },
  { label:"🚗 Transporte",   cats:["Transporte","Gasolina","Estacionamento"] },
  { label:"🏥 Saúde",        cats:["Saúde","Academia/Saúde"] },
  { label:"💻 Digital",      cats:["Tecnologia/Assinaturas","Compras Online"] },
];

// ─── PT MONTHS HELPER ─────────────────────────
const PT_MO_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function normalizeMonthLabel(raw) {
  if (!raw) return raw;
  if (/^[A-Za-z]{3}\/\d{4}$/.test(raw)) return raw.charAt(0).toUpperCase() + raw.slice(1);
  const m = raw.match(/^([a-záéíóúãõç]+)\.?\s+(?:de\s+)?(\d{4})$/i);
  if (m) {
    const ptMap = {jan:"Jan",fev:"Fev",mar:"Mar",abr:"Abr",mai:"Mai",jun:"Jun",
                   jul:"Jul",ago:"Ago",set:"Set",out:"Out",nov:"Nov",dez:"Dez"};
    const abbr = ptMap[m[1].toLowerCase().slice(0,3)];
    if (abbr) return `${abbr}/${m[2]}`;
  }
  return raw;
}

// ─── CATEGORIZER ──────────────────────────────
function categorize(title) {
  const t = title.toLowerCase();
  if(t.includes("uber")||t.includes("99app")||t.includes("*99")) return "Transporte";
  if(t.includes("fitland")||t.includes("koch")||t.includes("supermercado")||t.includes("rede top")||t.includes("sams club")||t.includes("hipermercado")||t.includes("cooper")||t.includes("mercado garcia")||t.includes("cs koch")||t.includes("atacadao")||t.includes("carrefour")) return "Supermercado";
  if(t.includes("farmacia")||t.includes("saude")||t.includes("otica")||t.includes("medic")||t.includes("drogasil")) return "Saúde";
  if(t.includes("academia")||t.includes("smartfit")||t.includes("bluefit")) return "Academia/Saúde";
  if(t.includes("apple")||t.includes("microsoft")||t.includes("canva")||t.includes("hostgator")||t.includes("applecombill")||t.includes("netflix")||t.includes("spotify")||t.includes("amazon prime")||t.includes("youtube")||t.includes("chatgpt")||t.includes("openai")||t.includes("dropbox")||t.includes("adobe")||t.includes("icloud")||t.includes("amazonprimebr")) return "Tecnologia/Assinaturas";
  if(t.includes("amazon")||t.includes("shopee")||t.includes("mercadolivre")||t.includes("magazine")||t.includes("americanas")||t.includes("aliexpress")) return "Compras Online";
  if(t.includes("posto")||t.includes("gasolina")||t.includes("zandona")||t.includes("autopost")||t.includes("combustivel")||t.includes("shell")||t.includes("martini comercio de")||t.includes("ipiranga")) return "Gasolina";
  if(t.includes("ifood")||t.includes("rappi")||t.includes("delivery")||t.includes("loggi")||t.includes("motoboy")||t.includes("ifd")) return "Delivery";
  if(t.includes("restaurant")||t.includes("takumi")||t.includes("toscana")||t.includes("boli")||t.includes("ohana")||t.includes("acai")||t.includes("sushi")||t.includes("brunch")||t.includes("bier")||t.includes("ecke")||t.includes("fogao")||t.includes("pasteis")||t.includes("napoli")||t.includes("kalzone")||t.includes("divino")||t.includes("sitio")||t.includes("allesblau")||t.includes("frogpay")||t.includes("polaco")||t.includes("dinho")||t.includes("burger")||t.includes("lanchonete")||t.includes("churrascar")||t.includes("pizz")||t.includes("grill")||t.includes("bistro")) return "Gastronomia";
  if(t.includes("padaria")||t.includes("panificadora")||t.includes("girassol")||t.includes("royale")||t.includes("dona norma")||t.includes("papicori")||t.includes("")) return "Padaria/Alimentação";
  if(t.includes("cafe vending")||t.includes("aromapress")||t.includes("raiden")||t.includes("cappta")||t.includes("starbucks")||t.includes("cafe")) return "Cafés/Pequenos";
  if(t.includes("54656637adan")||t.includes("baitah")||t.includes("convenienc")||t.includes("conveni")||t.includes("loja conv")||t.includes("am pm")||t.includes("am/pm")||t.includes("shell select")||t.includes("br mania")||t.includes("extra")) return "Conveniência";
  if(t.includes("pagamento recebido")||t.includes("pagamento efetuado")) return "Pagamento";
  if(t.includes("parcela")||t.includes("siapi")||t.includes("panasonic")||t.includes("prata fina")||t.includes("isabela")||t.includes("s v comercio")) return "Parcelamentos";
  if(t.includes("juros")||t.includes("multa")||t.includes("iof")||t.includes("saldo em")||t.includes("rotativo")||t.includes("mora")) return "Encargos/Juros";
  if(t.includes("estacionamento")||t.includes("estapar")||t.includes("blumenau norte shoppin")||t.includes("parking")) return "Estacionamento";
  if(t.includes("bazar")||t.includes("reuter")||t.includes("tecnofesta")||t.includes("milium")||t.includes("cacau")||t.includes("oboticario")) return "Presentes/Bazar";
  if(t.includes("leiturinha")||t.includes("escola")||t.includes("universidade")||t.includes("curso")) return "Educação";
  if(t.includes("vivo")||t.includes("intercel")||t.includes("rcga")||t.includes("claro")||t.includes("tim ")||t.includes("oi ")) return "Telecomunicações";
  if(t.includes("allianz")||t.includes("seguro")||t.includes("bradesco seguros")) return "Seguros";
  return "Outros";
}

// ─── PARSERS ──────────────────────────────────
function parseCSV(text, filename, personName) {
  const lines = text.trim().split(/\r?\n/).slice(1);
  const m = filename.match(/(\d{4}-\d{2})/);
  const label = m
    ? `${PT_MO_SHORT[parseInt(m[1].slice(5, 7), 10) - 1]}/${m[1].slice(0, 4)}`
    : filename.replace(/\.[^.]+$/, "");
  return lines.map(line => {
    const parts=[]; let cur="",inQ=false;
    for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){inQ=!inQ;}else if(ch===','&&!inQ){parts.push(cur);cur="";}else{cur+=ch;}}
    parts.push(cur);
    if(parts.length<3) return null;
    const date=parts[0].trim();
    const amount=parseFloat(parts[parts.length-1].trim().replace(",","."));
    const title=parts.slice(1,parts.length-1).join(",").trim().replace(/^"|"$/g,"");
    if(!date||isNaN(amount)) return null;
    const year=date.split("-")[0]||new Date().getFullYear().toString();
    return {date,title,amount,card:"Nubank",month:label,year,category:categorize(title),person:personName};
  }).filter(Boolean);
}

async function loadPdfJs() {
  if(window.pdfjsLib) return;
  await new Promise((res,rej)=>{
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload=res; s.onerror=rej; document.head.appendChild(s);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

async function parsePDF(file, personName) {
  await loadPdfJs();
  const buf=await file.arrayBuffer();
  const pdf=await window.pdfjsLib.getDocument({data:buf}).promise;
  let text="";
  for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p);const content=await page.getTextContent();text+=content.items.map(i=>i.str).join(" ")+"\n";}
  const fname=file.name.toLowerCase();
  const isAilos=fname.includes("fatura_")||text.includes("AILOS")||text.includes("VIACREDI");
  const isInter=fname.includes("inter")||text.includes("Banco Inter")||text.includes("bancointer");
  const card=isAilos?"Ailos":isInter?"Inter":"PDF";
  const yearMatch=text.match(/20\d{2}/);
  const year=yearMatch?.[0]||new Date().getFullYear().toString();
  const mMatch=text.match(/fatura de (\w+)/i);
  const ptMap={janeiro:"Jan",fevereiro:"Fev",março:"Mar",marco:"Mar",abril:"Abr",maio:"Mai",junho:"Jun",julho:"Jul",agosto:"Ago",setembro:"Set",outubro:"Out",novembro:"Nov",dezembro:"Dez"};
  const rawM=mMatch?.[1]?.toLowerCase()||"";
  const isYearOnly=/^\d+$/.test(rawM);
  const fileBase=file.name.replace(/\.[^.]+$/,"").replace(/^\d{4}$/,"arquivo");
  const monthPart=ptMap[rawM]||(!isYearOnly?rawM:null)||fileBase;
  const monthLabel=normalizeMonthLabel(`${monthPart}/${year}`);
  const txns=[];
  const ptNum={JAN:"01",FEV:"02",MAR:"03",ABR:"04",MAI:"05",JUN:"06",JUL:"07",AGO:"08",SET:"09",OUT:"10",NOV:"11",DEZ:"12"};
  if(isAilos){
    const matches=[...text.matchAll(/(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+([^R\n]{3,60}?)\s+R\$\s*([\d.]+,\d{2})/gi)];
    for(const m of matches){const amount=parseFloat(m[4].replace(/\./g,"").replace(",","."));const title=m[3].replace(/\s{2,}/g," ").trim();if(!isNaN(amount)&&amount>0&&title.length>1)txns.push({date:`${year}-${ptNum[m[2].toUpperCase()]||"01"}-${m[1].padStart(2,"0")}`,title,amount,card,month:monthLabel,year,category:categorize(title),person:personName});}
  }
  if(isInter){
    const ptM={jan:"01",fev:"02",mar:"03",abr:"04",mai:"05",jun:"06",jul:"07",ago:"08",set:"09",out:"10",nov:"11",dez:"12"};
    const matches=[...text.matchAll(/(\d{2})\s+de\s+(\w+)\.\s+(\d{4})\s+([^\n]+?)\s+([\d.]+,\d{2})/gi)];
    for(const m of matches){const mon=ptM[m[2].toLowerCase().slice(0,3)]||"01";const amount=parseFloat(m[5].replace(/\./g,"").replace(",","."));const title=m[4].trim().replace(/[-–]\s*$/,"").trim();if(!isNaN(amount)&&amount>0&&title.length>1&&!title.match(/LEANDRO|VENCIMENTO|VALOR/i))txns.push({date:`${m[3]}-${mon}-${m[1].padStart(2,"0")}`,title,amount,card,month:monthLabel,year:m[3],category:categorize(title),person:personName});}
  }
  return txns;
}

const EXCLUDED_TITLES = [
  "pagamento recebido","pagamento efetuado","crédito em rotativo",
  "credito em rotativo","saldo em rotativo","crédito rotativo",
  "credito rotativo","saldo em atraso","estorno","reembolso",
  "cashback","devolução","devolucao",
];

function isExcludedTransaction(t) {
  if (t.amount <= 0) return true;
  const tl = t.title.toLowerCase();
  return EXCLUDED_TITLES.some(ex => tl.includes(ex));
}

async function processFile(file, personName) {
  let txns=[];
  if(file.name.toLowerCase().endsWith(".csv")){const text=await file.text();txns=parseCSV(text,file.name,personName);}
  else if(file.name.toLowerCase().endsWith(".pdf")) txns=await parsePDF(file,personName);
  return txns.filter(t => !isExcludedTransaction(t));
}

// ─── CACHE  ───────────────────────────────────
const CACHE_KEY   = "fin-dash-v2";
const CACHE_LIMIT = 6 * 1024 * 1024;

function loadPeople() {
  try {
    const raw=localStorage.getItem(CACHE_KEY);
    if(!raw) return [];
    const data=JSON.parse(raw);
    return Array.isArray(data?.people) ? data.people : [];
  } catch(e){ return []; }
}

function savePeople(people) {
  try {
    const payload=JSON.stringify({people,updatedAt:Date.now()});
    if(payload.length>CACHE_LIMIT) return {ok:false,reason:"big"};
    localStorage.setItem("fin-dash-v2",payload);
    return {ok:true};
  } catch(e){ return {ok:false,reason:"error"}; }
}

function addOrReplacePerson(person) {
  const people=loadPeople();
  const idx=people.findIndex(p=>p.name.toLowerCase()===person.name.toLowerCase());
  if(idx>=0) people[idx]=person; else people.push(person);
  return savePeople(people);
}

function mergePersonFiles(name, newTransactions, newFileNames) {
  const people=loadPeople();
  const idx=people.findIndex(p=>p.name.toLowerCase()===name.toLowerCase());
  if(idx<0) return {ok:false,reason:"not_found"};
  const existing=people[idx];
  const existingKeys=new Set(existing.transactions.map(t=>`${t.date}|${t.title}|${t.amount}`));
  const unique=newTransactions.filter(t=>!existingKeys.has(`${t.date}|${t.title}|${t.amount}`));
  existing.transactions=[...existing.transactions,...unique];
  existing.fileNames=[...new Set([...(existing.fileNames||[]),...newFileNames])];
  existing.savedAt=Date.now();
  people[idx]=existing;
  return savePeople(people);
}

function removePerson(name) {
  const people=loadPeople().filter(p=>p.name.toLowerCase()!==name.toLowerCase());
  savePeople(people);
}

function nextPersonColor(people) {
  const used=new Set(people.map(p=>p.color));
  return PERSON_COLORS.find(c=>!used.has(c))||PERSON_COLORS[people.length%PERSON_COLORS.length];
}

function personInitials(name) {
  return name.trim().split(/\s+/).map(w=>w[0]).join("").toUpperCase().slice(0,2);
}

// ─── PERSON AVATAR ────────────────────────────
function PersonAvatar({ name, color, size=36, fontSize=13 }) {
  return (
    <div style={{
      width:size,height:size,borderRadius:"50%",
      background:color+"28",border:`2px solid ${color}`,
      color,display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize,flexShrink:0,
      letterSpacing:"-0.02em",userSelect:"none",
    }}>{personInitials(name)}</div>
  );
}

// ─── TRANSACTION ITEM ─────────────────────────
function TransactionItem({ t, activePeople, onDelete, onEditCategory, striped, idx }) {
  const [editingCat, setEditingCat] = useState(false);
  const color     = CAT_COLORS[t.category] || "#6b7280";
  const cardColor = CARD_COLORS[t.card]    || "#64748b";
  const pColor    = activePeople.find(p => p.name === t.person)?.color;

  const handleDelete = e => {
    e.stopPropagation();
    if (window.confirm(`Remover "${t.title.slice(0,50)}"?`)) {
      onDelete && onDelete(t.person, t.date, t.title, t.amount);
    }
  };

  const handleCatChange = e => {
    e.stopPropagation();
    onEditCategory && onEditCategory(t.person, t.date, t.title, t.amount, e.target.value);
    setEditingCat(false);
  };

  return (
    <div className="txn-item tap" style={striped && idx%2!==0 ? {background:"var(--bg-card-hover)"} : {}}>
      <div className="txn-icon" style={{background:color+"20"}}>
        <div className="txn-icon-dot" style={{background:color}}/>
      </div>
      <div className="txn-meta">
        <div className="txn-title">{t.title}</div>
        <div className="txn-info">
          <span>{fmtDate(t.date)}</span>
          <span className="txn-card-badge" style={{background:cardColor+"20",color:cardColor}}>{t.card}</span>
          {editingCat ? (
            <select
              className="cat-inline-select"
              value={t.category}
              autoFocus
              onChange={handleCatChange}
              onBlur={() => setEditingCat(false)}
              onClick={e => e.stopPropagation()}
            >
              {Object.keys(CAT_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <span
              className="txn-cat-badge"
              title="Clique para editar categoria"
              onClick={e => { e.stopPropagation(); setEditingCat(true); }}
            >{t.category}</span>
          )}
          {pColor && activePeople.length > 1 && (
            <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:pColor+"20",color:pColor,flexShrink:0}}>{t.person}</span>
          )}
          {t.month && <span style={{color:"var(--text-ghost)",fontSize:9,flexShrink:0}}>{t.month}</span>}
        </div>
      </div>
      <div className="txn-amount" style={{color:t.category==="Encargos/Juros"?"#ef4444":"var(--text-primary)"}}>
        {fmt(t.amount)}
      </div>
      {onDelete && (
        <button className="txn-del-btn tap" onClick={handleDelete} title="Remover transação">✕</button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  HOME SCREEN
// ═══════════════════════════════════════════════
function HomeScreen({ people, onOpenDashboard, onAddPerson, onRemovePerson, onAddFiles, dark, toggleTheme }) {
  const canJoin = people.length >= 2;

  const stats = people.map(p => {
    const exp=p.transactions.filter(t=>t.amount>0&&t.category!=="Encargos/Juros");
    return {...p, total:exp.reduce((s,t)=>s+t.amount,0), count:exp.length, cards:[...new Set(p.transactions.map(t=>t.card))]};
  });

  return (
    <div className="upload-screen" style={{justifyContent:"center"}}>
      <div style={{display:"flex",justifyContent:"flex-end",width:"100%",maxWidth:560,marginBottom:0}}>
        <button className="dh-icon-btn tap" onClick={toggleTheme} style={{marginBottom:8}}>{dark?"☀️":"🌙"}</button>
      </div>

      <div className="upload-inner anim-fade-up" style={{maxWidth:560}}>
        <div className="upload-header" style={{marginBottom:28}}>
          <span className="upload-emoji">{people.length>=2?"💑":"💳"}</span>
          <div className="upload-title">Dashboard Financeiro</div>
          <div className="upload-sub">{people.length===0?"Comece adicionando uma pessoa":people.length===1?"Adicione outra pessoa para análise conjunta":"Análise individual ou em conjunto"}</div>
        </div>

        {stats.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
            {stats.map(p=>(
              <div key={p.name} className="section-card" style={{borderLeft:`3px solid ${p.color}`}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                  <PersonAvatar name={p.name} color={p.color} size={42} fontSize={16}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,color:p.color,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{fontSize:11,color:"var(--text-faint)"}}>{p.count} compras</span>
                      <span style={{fontSize:14,fontWeight:500,color:p.color,fontFamily:"'DM Mono',monospace"}}>{fmtShort(p.total)}</span>
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
                  {p.cards.map(c=>(
                    <span key={c} style={{fontSize:9,padding:"2px 7px",borderRadius:5,background:(CARD_COLORS[c]||"#64748b")+"20",color:CARD_COLORS[c]||"#64748b",border:`1px solid ${(CARD_COLORS[c]||"#64748b")}44`}}>{c}</span>
                  ))}
                  <span style={{fontSize:9,color:"var(--text-ghost)"}}>💾 {fmtTs(p.savedAt)}</span>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <button className="tap-btn" onClick={()=>onOpenDashboard([p.name])}
                    style={{flex:1,minWidth:0,padding:"8px 10px",borderRadius:8,border:`1px solid ${p.color}60`,background:p.color+"18",color:p.color,fontSize:11,cursor:"pointer",fontFamily:"'DM Mono',monospace",textAlign:"center"}}>
                    Ver {p.name.split(" ")[0]} →
                  </button>
                  <button className="tap-btn" onClick={()=>onAddFiles(p.name)}
                    style={{flex:1,minWidth:0,padding:"8px 10px",borderRadius:8,border:"1px solid var(--border-med)",background:"var(--bg-input)",color:"var(--text-sec)",fontSize:11,cursor:"pointer",fontFamily:"'DM Mono',monospace",textAlign:"center"}}>
                    📁 Arquivos
                  </button>
                  <button className="tap-btn" onClick={()=>{if(window.confirm(`Remover os dados de ${p.name}?`))onRemovePerson(p.name);}}
                    style={{padding:"8px 10px",borderRadius:8,border:"1px solid #ef444430",background:"#ef444408",color:"#ef4444",fontSize:11,cursor:"pointer",fontFamily:"'DM Mono',monospace",textAlign:"center"}}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {canJoin&&(
          <button className="upload-cta ready tap-btn" style={{marginBottom:10}}
            onClick={()=>onOpenDashboard(people.map(p=>p.name))}>
            💑 Analisar juntos — {people.map(p=>p.name).join(" + ")}
          </button>
        )}

        <button className="tap-btn" onClick={onAddPerson}
          style={{width:"100%",padding:"14px",borderRadius:12,border:"1px solid var(--border-med)",background:"var(--bg-input)",color:"var(--text-sec)",fontSize:13,cursor:"pointer",fontFamily:"'DM Mono',monospace",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .15s"}}
          onMouseOver={e=>e.currentTarget.style.borderColor="var(--border-strong)"}
          onMouseOut={e=>e.currentTarget.style.borderColor="var(--border-med)"}>
          + Adicionar {people.length===0?"pessoa":"outra pessoa"}
        </button>

        <div className="upload-privacy" style={{marginTop:14}}>🔒 100% local · seus dados não saem do dispositivo</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  ADD FILES SCREEN
// ═══════════════════════════════════════════════
function AddFilesScreen({ person, onMerge, onBack, dark, toggleTheme }) {
  const [files,    setFiles]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const addFiles = raw => {
    const valid=Array.from(raw).filter(f=>f.name.endsWith(".csv")||f.name.endsWith(".pdf"));
    setFiles(prev=>{const names=new Set(prev.map(f=>f.name));return [...prev,...valid.filter(f=>!names.has(f.name))];});
  };
  const handleDrop = e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };

  const handleProcess = async () => {
    if(!files.length) return;
    setLoading(true);
    const all=[];
    for(const file of files){setProgress(`Lendo ${file.name}…`);try{all.push(...(await processFile(file,person.name)));}catch(e){console.error(e);}}
    setLoading(false); setProgress("");
    if(!all.length){alert("Nenhuma transação encontrada nos novos arquivos.");return;}
    onMerge(person.name, all, files.map(f=>f.name));
  };

  const guessCard = n => {
    const l=n.toLowerCase();
    if(l.includes("nubank")) return {label:"Nubank",color:"#8c52ff"};
    if(l.includes("inter"))  return {label:"Inter", color:"#ff6b00"};
    if(l.includes("fatura_")||l.includes("ailos")) return {label:"Ailos",color:"#00a86b"};
    return {label:"PDF/CSV",color:"#64748b"};
  };

  return (
    <div className="upload-screen">
      <div style={{display:"flex",justifyContent:"space-between",width:"100%",maxWidth:480}}>
        <button className="dh-icon-btn tap" onClick={onBack}>←</button>
        <button className="dh-icon-btn tap" onClick={toggleTheme}>{dark?"☀️":"🌙"}</button>
      </div>

      <div className="upload-inner anim-fade-up">
        <div style={{display:"flex",alignItems:"center",gap:12,background:"var(--bg-card)",border:`1px solid ${person.color}40`,borderRadius:14,padding:"12px 16px",marginBottom:20}}>
          <PersonAvatar name={person.name} color={person.color} size={40} fontSize={15}/>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:person.color}}>{person.name}</div>
            <div style={{fontSize:10,color:"var(--text-faint)",marginTop:2}}>{person.transactions.length} transações carregadas</div>
          </div>
        </div>

        {person.fileNames&&person.fileNames.length>0&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:10,color:"var(--text-faint)",letterSpacing:".1em",marginBottom:8}}>ARQUIVOS JÁ CARREGADOS</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {person.fileNames.map((fn,i)=>{
                const card=guessCard(fn);
                return (
                  <span key={i} style={{fontSize:9,padding:"3px 8px",borderRadius:6,background:card.color+"15",color:card.color,border:`1px solid ${card.color}30`,fontFamily:"'DM Mono',monospace"}}>{fn}</span>
                );
              })}
            </div>
          </div>
        )}

        <div className="upload-header" style={{marginBottom:20}}>
          <span className="upload-emoji">📁</span>
          <div className="upload-title">Adicionar arquivos</div>
          <div className="upload-sub">Selecione novos arquivos para {person.name}</div>
        </div>

        <input ref={inputRef} type="file" multiple accept=".csv,.pdf" style={{display:"none"}} onChange={e=>addFiles(e.target.files)}/>
        <div className={`upload-drop-zone tap${dragOver?" drag-over":""}`}
          onClick={()=>inputRef.current?.click()}
          onDragOver={e=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={handleDrop}>
          <span className="upload-drop-icon">{dragOver?"📂":"📁"}</span>
          <span className="upload-drop-text">Selecionar ou soltar arquivos</span>
          <span className="upload-drop-hint">.CSV (Nubank) · .PDF (Ailos / Inter)</span>
        </div>

        {files.length>0&&(
          <div className="upload-file-list">
            <div className="ufl-header">{files.length} NOVO{files.length>1?"S":""} ARQUIVO{files.length>1?"S":""}</div>
            {files.map((f,i)=>{
              const card=guessCard(f.name);
              return (
                <div key={i} className="ufl-item">
                  <span className="ufl-icon">{f.name.endsWith(".pdf")?"📄":"📊"}</span>
                  <div className="ufl-meta"><div className="ufl-name">{f.name}</div><div className="ufl-size">{(f.size/1024).toFixed(0)} KB</div></div>
                  <span className="ufl-tag" style={{background:card.color+"20",color:card.color,borderColor:card.color+"50"}}>{card.label}</span>
                  <button className="ufl-del tap" onClick={()=>setFiles(p=>p.filter(x=>x.name!==f.name))}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        <button className={`upload-cta tap-btn${files.length>0&&!loading?" ready":" disabled"}`} onClick={handleProcess} disabled={files.length===0||loading}>
          {loading?(<><span className="spinner"/><span className="anim-pulse">{progress||"Processando…"}</span></>):
            files.length===0?"Selecione ao menos um arquivo":`Adicionar ${files.length} arquivo${files.length>1?"s":""} a ${person.name} →`}
        </button>
        <div className="upload-privacy" style={{marginTop:14}}>🔒 100% local · seus dados não saem do dispositivo</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  UPLOAD SCREEN
// ═══════════════════════════════════════════════
function UploadScreen({ existingPeople, onLoad, onBack, dark, toggleTheme }) {
  const [step,        setStep]        = useState("name");
  const [personName,  setPersonName]  = useState("");
  const [personColor, setPersonColor] = useState(()=>nextPersonColor(existingPeople||[]));
  const [files,       setFiles]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [progress,    setProgress]    = useState("");
  const [dragOver,    setDragOver]    = useState(false);
  const inputRef   = useRef();
  const nameRef    = useRef();

  useEffect(()=>{ if(step==="name") nameRef.current?.focus(); },[step]);

  const addFiles = raw => {
    const valid=Array.from(raw).filter(f=>f.name.endsWith(".csv")||f.name.endsWith(".pdf"));
    setFiles(prev=>{const names=new Set(prev.map(f=>f.name));return [...prev,...valid.filter(f=>!names.has(f.name))];});
  };
  const handleDrop = e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };

  const handleProcess = async () => {
    if(!files.length) return;
    setLoading(true);
    const all=[];
    for(const file of files){setProgress(`Lendo ${file.name}…`);try{all.push(...(await processFile(file,personName)));}catch(e){console.error(e);}}
    setLoading(false); setProgress("");
    if(!all.length){alert("Nenhuma transação encontrada.");return;}
    onLoad({name:personName,color:personColor,transactions:all,fileNames:files.map(f=>f.name),savedAt:Date.now()});
  };

  const guessCard = n => {
    const l=n.toLowerCase();
    if(l.includes("nubank")) return {label:"Nubank",color:"#8c52ff"};
    if(l.includes("inter"))  return {label:"Inter", color:"#ff6b00"};
    if(l.includes("fatura_")||l.includes("ailos")) return {label:"Ailos",color:"#00a86b"};
    return {label:"PDF/CSV",color:"#64748b"};
  };

  if(step==="name") return (
    <div className="upload-screen">
      <div style={{display:"flex",justifyContent:"space-between",width:"100%",maxWidth:480}}>
        {onBack?<button className="dh-icon-btn tap" onClick={onBack}>←</button>:<span/>}
        <button className="dh-icon-btn tap" onClick={toggleTheme}>{dark?"☀️":"🌙"}</button>
      </div>

      <div className="upload-inner anim-fade-up">
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:"var(--accent)",color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>1</div>
          <div style={{fontSize:10,color:"var(--accent-text)",letterSpacing:".06em"}}>IDENTIFICAÇÃO</div>
          <div style={{flex:1,height:1,background:"var(--border-med)"}}/>
          <div style={{width:24,height:24,borderRadius:"50%",background:"var(--bg-input)",color:"var(--text-faint)",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>2</div>
          <div style={{fontSize:10,color:"var(--text-faint)",letterSpacing:".06em"}}>ARQUIVOS</div>
        </div>

        <div className="upload-header" style={{marginBottom:28}}>
          <span className="upload-emoji">👤</span>
          <div className="upload-title">Quem é você?</div>
          <div className="upload-sub">Identifique o dono dos arquivos</div>
        </div>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:"var(--text-faint)",letterSpacing:".1em",marginBottom:8}}>NOME</div>
          <input ref={nameRef}
            className="search-input"
            style={{width:"100%",padding:"14px 16px",fontSize:14,borderRadius:12}}
            placeholder="Ex: Ana, João, Casal…"
            value={personName}
            onChange={e=>setPersonName(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&personName.trim())setStep("files");}}
          />
        </div>

        <div style={{marginBottom:28}}>
          <div style={{fontSize:10,color:"var(--text-faint)",letterSpacing:".1em",marginBottom:10}}>COR DO PERFIL</div>
          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            {PERSON_COLORS.map(c=>(
              <button key={c} className="tap" onClick={()=>setPersonColor(c)}
                style={{width:32,height:32,borderRadius:"50%",background:c,border:`3px solid ${personColor===c?"var(--text-primary)":"transparent"}`,cursor:"pointer",transition:"transform .15s",flexShrink:0}}
                onMouseOver={e=>e.currentTarget.style.transform="scale(1.2)"}
                onMouseOut={e=>e.currentTarget.style.transform="scale(1)"}/>
            ))}
            {personName.trim()&&<PersonAvatar name={personName} color={personColor} size={42} fontSize={15}/>}
          </div>
        </div>

        <button className={`upload-cta tap-btn${personName.trim()?" ready":" disabled"}`}
          onClick={()=>{if(personName.trim())setStep("files");}} disabled={!personName.trim()}>
          Continuar → Selecionar arquivos
        </button>
      </div>
    </div>
  );

  return (
    <div className="upload-screen">
      <div style={{display:"flex",justifyContent:"space-between",width:"100%",maxWidth:480}}>
        <button className="dh-icon-btn tap" onClick={()=>setStep("name")}>←</button>
        <button className="dh-icon-btn tap" onClick={toggleTheme}>{dark?"☀️":"🌙"}</button>
      </div>

      <div className="upload-inner anim-fade-up">
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:"var(--bg-input)",color:"var(--text-faint)",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>1</div>
          <div style={{fontSize:10,color:"var(--text-faint)",letterSpacing:".06em"}}>IDENTIFICAÇÃO</div>
          <div style={{flex:1,height:1,background:"var(--border-med)"}}/>
          <div style={{width:24,height:24,borderRadius:"50%",background:"var(--accent)",color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>2</div>
          <div style={{fontSize:10,color:"var(--accent-text)",letterSpacing:".06em"}}>ARQUIVOS</div>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:12,background:"var(--bg-card)",border:`1px solid ${personColor}40`,borderRadius:14,padding:"12px 16px",marginBottom:20}}>
          <PersonAvatar name={personName} color={personColor} size={40} fontSize={15}/>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:personColor}}>{personName}</div>
            <div style={{fontSize:10,color:"var(--text-faint)",marginTop:2}}>Selecione os arquivos desta pessoa</div>
          </div>
          <button className="tap" onClick={()=>setStep("name")} style={{marginLeft:"auto",fontSize:11,color:"var(--text-dim)",background:"none",border:"none",cursor:"pointer"}}>✏️ editar</button>
        </div>

        <input ref={inputRef} type="file" multiple accept=".csv,.pdf" style={{display:"none"}} onChange={e=>addFiles(e.target.files)}/>
        <div className={`upload-drop-zone tap${dragOver?" drag-over":""}`}
          onClick={()=>inputRef.current?.click()}
          onDragOver={e=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={handleDrop}>
          <span className="upload-drop-icon">{dragOver?"📂":"📁"}</span>
          <span className="upload-drop-text">Selecionar ou soltar arquivos</span>
          <span className="upload-drop-hint">.CSV (Nubank) · .PDF (Ailos / Inter)</span>
        </div>

        {files.length>0&&(
          <div className="upload-file-list">
            <div className="ufl-header">{files.length} ARQUIVO{files.length>1?"S":""}</div>
            {files.map((f,i)=>{
              const card=guessCard(f.name);
              return (
                <div key={i} className="ufl-item">
                  <span className="ufl-icon">{f.name.endsWith(".pdf")?"📄":"📊"}</span>
                  <div className="ufl-meta"><div className="ufl-name">{f.name}</div><div className="ufl-size">{(f.size/1024).toFixed(0)} KB</div></div>
                  <span className="ufl-tag" style={{background:card.color+"20",color:card.color,borderColor:card.color+"50"}}>{card.label}</span>
                  <button className="ufl-del tap" onClick={()=>setFiles(p=>p.filter(x=>x.name!==f.name))}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        <div className="upload-cards-guide">
          {[{icon:"🟣",label:"Nubank",desc:"CSV pelo app",color:"#8c52ff"},{icon:"🟢",label:"Ailos",desc:"Fatura PDF",color:"#00a86b"},{icon:"🟠",label:"Inter",desc:"Fatura PDF",color:"#ff6b00"}].map(b=>(
            <div key={b.label} className="ucg-item" style={{borderColor:b.color+"30"}}>
              <div className="ucg-icon">{b.icon}</div>
              <div className="ucg-name" style={{color:b.color}}>{b.label}</div>
              <div className="ucg-desc">{b.desc}</div>
            </div>
          ))}
        </div>

        <button className={`upload-cta tap-btn${files.length>0&&!loading?" ready":" disabled"}`} onClick={handleProcess} disabled={files.length===0||loading}>
          {loading?(<><span className="spinner"/><span className="anim-pulse">{progress||"Processando…"}</span></>):
            files.length===0?"Selecione ao menos um arquivo":`Analisar ${files.length} arquivo${files.length>1?"s":""} →`}
        </button>
        <div className="upload-privacy">🔒 100% local · seus dados não saem do dispositivo</div>
      </div>
    </div>
  );
}

// ─── MULTI-SEARCH INPUT ───────────────────────
function MultiSearchInput({ search, searchTags, setFilters, placeholder="Buscar… (Enter p/ adicionar)", small=false }) {
  const set = (key, val) => setFilters(f => ({...f, [key]: val}));

  const handleKeyDown = e => {
    if (e.key === "Enter" && search.trim()) {
      e.preventDefault();
      setFilters(f => ({...f, searchTags: [...(f.searchTags||[]), search.trim()], search: ""}));
    }
    if (e.key === "Backspace" && !search && searchTags && searchTags.length > 0) {
      setFilters(f => ({...f, searchTags: f.searchTags.slice(0, -1)}));
    }
  };

  const removeTag = idx => {
    setFilters(f => ({...f, searchTags: f.searchTags.filter((_,i) => i !== idx)}));
  };

  return (
    <div>
      {searchTags && searchTags.length > 0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>
          {searchTags.map((tag, i) => (
            <span key={i}
              onClick={() => removeTag(i)}
              style={{
                display:"inline-flex",alignItems:"center",gap:4,
                padding:"3px 8px",borderRadius:6,cursor:"pointer",
                background:"var(--accent-glow)",border:"1px solid var(--accent-border)",
                color:"var(--accent-text)",fontSize:small?9:10,
                fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap",
              }}>
              {tag} <span style={{opacity:.7}}>✕</span>
            </span>
          ))}
        </div>
      )}
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder={searchTags && searchTags.length > 0 ? "+ outra busca (Enter)" : placeholder}
          value={search}
          onChange={e => set("search", e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {search && <button className="search-clear" onClick={() => set("search", "")}>✕</button>}
      </div>
      {search && (
        <div style={{fontSize:9,color:"var(--text-faint)",marginTop:4,letterSpacing:".04em"}}>
          ↵ Enter para adicionar como tag · Backspace para remover última
        </div>
      )}
    </div>
  );
}

// ─── CATEGORY FILTER SECTION (shared) ────────
// Used in both FilterSidebar and FilterDrawer
function CategoryFilterSection({ categoryFilter, setFilters, catStats, compact=false }) {
  const cats = categoryFilter || [];
  
  const toggleCat = name => {
    setFilters(f => {
      const current = f.categoryFilter || [];
      const next = current.includes(name)
        ? current.filter(c => c !== name)
        : [...current, name];
      return {...f, categoryFilter: next};
    });
  };

  const applyGroup = groupCats => {
    setFilters(f => {
      const current = f.categoryFilter || [];
      // If all group cats already selected, deselect them; otherwise select all
      const allSelected = groupCats.every(c => current.includes(c));
      if (allSelected) {
        return {...f, categoryFilter: current.filter(c => !groupCats.includes(c))};
      } else {
        const merged = [...new Set([...current, ...groupCats])];
        return {...f, categoryFilter: merged};
      }
    });
  };

  const clearAll = () => setFilters(f => ({...f, categoryFilter: []}));

  // Combined total for selected cats
  const selectedTotal = cats.length > 0 && catStats
    ? cats.reduce((s, c) => s + (catStats.map[c] || 0), 0)
    : 0;

  return (
    <div>
      {/* Quick-select group presets */}
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
        {CAT_GROUPS.map(g => {
          const allSel = g.cats.every(c => cats.includes(c));
          const someSel = g.cats.some(c => cats.includes(c));
          return (
            <button
              key={g.label}
              className="tap"
              onClick={() => applyGroup(g.cats)}
              style={{
                padding:"4px 9px",borderRadius:7,fontSize:10,
                border:`1px solid ${allSel?"var(--accent-border)":someSel?"var(--accent-border)":"var(--border-med)"}`,
                background: allSel?"var(--accent-glow)":someSel?"var(--accent-glow)":"var(--bg-input)",
                color: (allSel||someSel)?"var(--accent-text)":"var(--text-dim)",
                cursor:"pointer",whiteSpace:"nowrap",
                fontFamily:"'DM Mono',monospace",
                opacity: someSel&&!allSel ? 0.85 : 1,
              }}>
              {g.label}{someSel&&!allSel?" ·":""}
            </button>
          );
        })}
      </div>

      {/* Combined total banner */}
      {cats.length > 1 && catStats && selectedTotal > 0 && (
        <div style={{
          marginBottom:10,padding:"7px 10px",borderRadius:8,
          background:"var(--accent-glow)",border:"1px solid var(--accent-border)",
          display:"flex",justifyContent:"space-between",alignItems:"center",
        }}>
          <span style={{fontSize:10,color:"var(--accent-text)"}}>{cats.length} categorias</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:500,color:"var(--accent-text)"}}>{fmtShort(selectedTotal)}</span>
        </div>
      )}

      {/* "Todas" chip + individual chips */}
      <div className="chips-row">
        <button
          className={`chip tap${cats.length===0?" active":""}`}
          onClick={clearAll}>
          Todas
        </button>
        {Object.entries(CAT_COLORS).map(([name, color]) => {
          const val = catStats?.map?.[name] || 0;
          const pct = catStats?.total > 0 ? ((val/catStats.total)*100).toFixed(0) : 0;
          const isEmpty = val === 0;
          const isActive = cats.includes(name);
          return (
            <button
              key={name}
              className={`cat-chip tap${isActive?" active":""}`}
              onClick={() => toggleCat(name)}
              style={isActive
                ? {borderColor:color+"60",background:color+"20",color,opacity:1}
                : isEmpty ? {opacity:.35} : {}
              }>
              <span className="dot" style={{background:color}}/>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
              {!isEmpty && (
                <span style={{
                  fontSize:9,flexShrink:0,marginLeft:4,
                  color: isActive ? "inherit" : color,
                  opacity:.85,fontWeight:500,
                }}>{pct}%</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── FILTER SIDEBAR ───────────────────────────
function FilterSidebar({ activeTab, setActiveTab, filters, setFilters, activePeople, cards, years, months, totalCount, catStats, dark, toggleTheme, onReset }) {
  const { search, searchTags=[], selectedPerson, selectedCard, selectedYear, selectedMonth, categoryFilter=[], txnType, amountMin, amountMax } = filters;
  const set = (key,val) => setFilters(f=>({...f,[key]:val}));
  const hasFilter = !!search || searchTags.length > 0 || selectedPerson!=="all" || selectedCard!=="all" || selectedYear!=="all" || selectedMonth!=="all" || categoryFilter.length>0 || txnType!=="all" || !!amountMin || !!amountMax;
  const filterCount = [
    search, searchTags.length > 0,
    selectedPerson!=="all", selectedCard!=="all", selectedYear!=="all",
    selectedMonth!=="all", categoryFilter.length>0, txnType!=="all",
    !!amountMin, !!amountMax,
  ].filter(Boolean).length;
  const clearAll = () => setFilters(f=>({...f, search:"", searchTags:[], selectedPerson:"all", selectedCard:"all", selectedYear:"all", selectedMonth:"all", categoryFilter:[], txnType:"all", amountMin:"", amountMax:""}));
  const filteredMonths = useMemo(()=>{
    const base=["all",...months.filter(m=>m!=="all")];
    if(selectedYear==="all") return base;
    return ["all",...months.filter(m=>m!=="all"&&m.endsWith(selectedYear))];
  },[months,selectedYear]);
  const TABS=[{id:"overview",icon:"📊",label:"Visão Geral"},{id:"transactions",icon:"📋",label:"Transações"},{id:"categories",icon:"🗂️",label:"Categorias"},{id:"trends",icon:"📈",label:"Tendências"}];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">💳 Dashboard</div>
        <div className="sidebar-logo-sub">{totalCount} TRANSAÇÕES FILTRADAS</div>
      </div>

      <nav className="sidebar-nav">
        {TABS.map(t=>(
          <button key={t.id} className={`nav-item tap${activeTab===t.id?" active":""}`} onClick={()=>setActiveTab(t.id)}>
            <span className="nav-icon">{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-filters">
        <div className="filter-section">
          <div className="filter-label">
            BUSCAR
            {(search || searchTags.length > 0) && (
              <button className="filter-label-clear" onClick={() => setFilters(f => ({...f, search:"", searchTags:[]}))}>limpar</button>
            )}
          </div>
          <MultiSearchInput search={search} searchTags={searchTags} setFilters={setFilters} small />
        </div>

        {activePeople.length>1&&(
          <div className="filter-section">
            <div className="filter-label">PESSOA</div>
            <div className="chips-row">
              <button className={`chip tap${selectedPerson==="all"?" active":""}`} onClick={()=>set("selectedPerson","all")}>Todos</button>
              {activePeople.map(p=>(
                <button key={p.name} className={`cat-chip tap${selectedPerson===p.name?" active":""}`}
                  onClick={()=>set("selectedPerson",p.name)}
                  style={selectedPerson===p.name?{borderColor:p.color+"60",background:p.color+"15",color:p.color}:{}}>
                  <PersonAvatar name={p.name} color={p.color} size={16} fontSize={7}/>{p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="filter-section">
          <div className="filter-label">CARTÃO</div>
          <div className="chips-row">
            <button className={`chip tap${selectedCard==="all"?" active":""}`} onClick={()=>set("selectedCard","all")}>Todos</button>
            {cards.map(c=><button key={c} className={`chip tap${selectedCard===c?" active":""}`} onClick={()=>set("selectedCard",c)}>{c}</button>)}
          </div>
        </div>

        {years.length>1&&(
          <div className="filter-section">
            <div className="filter-label">ANO</div>
            <div className="chips-row">
              <button className={`chip tap${selectedYear==="all"?" active":""}`} onClick={()=>set("selectedYear","all")}>Todos</button>
              {years.map(y=><button key={y} className={`chip tap${selectedYear===y?" active":""}`} onClick={()=>{set("selectedYear",y);set("selectedMonth","all");}}>{y}</button>)}
            </div>
          </div>
        )}

        <div className="filter-section">
          <div className="filter-label">MÊS</div>
          <div className="chips-scroll">{filteredMonths.map(m=><button key={m} className={`chip tap${selectedMonth===m?" active":""}`} onClick={()=>set("selectedMonth",m)}>{m==="all"?"Todos":m}</button>)}</div>
        </div>

        <div className="filter-section">
          <div className="filter-label">TIPO</div>
          <div className="type-grid">
            {[{v:"all",l:"Tudo"},{v:"expense",l:"Gastos"},{v:"charge",l:"Encargos"}].map(({v,l})=>(
              <button key={v} className={`type-btn tap${txnType===v?" active":""}`} onClick={()=>set("txnType",v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-label">VALOR (R$) {(amountMin||amountMax)&&<button className="filter-label-clear" onClick={()=>{set("amountMin","");set("amountMax","");}}>limpar</button>}</div>
          <div className="range-row">
            <input className="range-input" type="number" placeholder="Mín" value={amountMin} onChange={e=>set("amountMin",e.target.value)} min="0"/>
            <span className="range-sep">—</span>
            <input className="range-input" type="number" placeholder="Máx" value={amountMax} onChange={e=>set("amountMax",e.target.value)} min="0"/>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-label">
            CATEGORIA
            {categoryFilter.length>0&&(
              <button className="filter-label-clear" onClick={()=>set("categoryFilter",[])}>
                limpar {categoryFilter.length > 1 ? `(${categoryFilter.length})` : ""}
              </button>
            )}
          </div>
          <CategoryFilterSection
            categoryFilter={categoryFilter}
            setFilters={setFilters}
            catStats={catStats}
            compact
          />
        </div>
      </div>

      {hasFilter&&(
        <div className="active-filters-sidebar">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:9,color:"var(--text-faint)",letterSpacing:".08em"}}>{filterCount} FILTRO{filterCount>1?"S":""} ATIVO{filterCount>1?"S":""}</span>
            <button onClick={clearAll} style={{fontSize:9,color:"var(--danger)",background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>Limpar tudo</button>
          </div>
          {search&&<span className="active-filter-tag" onClick={()=>set("search","")}>"{search}" ✕</span>}
          {searchTags.map((tag,i)=>(
            <span key={i} className="active-filter-tag" onClick={()=>setFilters(f=>({...f,searchTags:f.searchTags.filter((_,j)=>j!==i)}))}>"{tag}" ✕</span>
          ))}
          {selectedPerson!=="all"&&<span className="active-filter-tag" onClick={()=>set("selectedPerson","all")}>{selectedPerson} ✕</span>}
          {selectedCard!=="all"&&<span className="active-filter-tag" onClick={()=>set("selectedCard","all")}>{selectedCard} ✕</span>}
          {selectedYear!=="all"&&<span className="active-filter-tag" onClick={()=>set("selectedYear","all")}>{selectedYear} ✕</span>}
          {selectedMonth!=="all"&&<span className="active-filter-tag" onClick={()=>set("selectedMonth","all")}>{selectedMonth} ✕</span>}
          {txnType!=="all"&&<span className="active-filter-tag" onClick={()=>set("txnType","all")}>{txnType} ✕</span>}
          {categoryFilter.map(c=>(
            <span key={c} className="active-filter-tag"
              style={{background:(CAT_COLORS[c]||"#6b7280")+"18",borderColor:(CAT_COLORS[c]||"#6b7280")+"40",color:CAT_COLORS[c]||"#6b7280"}}
              onClick={()=>setFilters(f=>({...f,categoryFilter:f.categoryFilter.filter(x=>x!==c)}))}>
              <span style={{width:6,height:6,borderRadius:2,background:CAT_COLORS[c]||"#6b7280",display:"inline-block",marginRight:2}}/>
              {c} ✕
            </span>
          ))}
          {(amountMin||amountMax)&&<span className="active-filter-tag" onClick={()=>{set("amountMin","");set("amountMax","");}}>R${amountMin||"0"}–{amountMax||"∞"} ✕</span>}
        </div>
      )}

      <div className="sidebar-bottom">
        <button className="sidebar-action-btn theme tap" onClick={toggleTheme}>{dark?"☀️":"🌙"} {dark?"Claro":"Escuro"}</button>
        <button className="sidebar-action-btn danger tap" onClick={onReset}>🏠 Início</button>
      </div>
    </aside>
  );
}

// ─── MOBILE HEADER ────────────────────────────
function MobileHeader({ filters, setFilters, activePeople, txnCount, dark, toggleTheme, onOpenFilter, onReset }) {
  const [showSearch, setShowSearch] = useState(false);
  const set = (key,val) => setFilters(f=>({...f,[key]:val}));
  const { searchTags=[], categoryFilter=[] } = filters;
  const filterCount = [
    filters.search, searchTags.length > 0,
    filters.selectedPerson!=="all", filters.selectedCard!=="all",
    filters.selectedYear!=="all", filters.selectedMonth!=="all",
    categoryFilter.length>0, filters.txnType!=="all",
    !!filters.amountMin, !!filters.amountMax,
  ].filter(Boolean).length;
  const activePerson = activePeople.find(p=>p.name===filters.selectedPerson);

  return (
    <div className="mobile-header">
      <div className="mh-top">
        <div style={{flex:1,minWidth:0}}>
          <div className="mh-title" style={{display:"flex",alignItems:"center",gap:6}}>
            {activePerson?<PersonAvatar name={activePerson.name} color={activePerson.color} size={22} fontSize={8}/>:"💳"}
            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activePerson?.name||activePeople.length>1?"Dashboard":activePeople[0]?.name||"Dashboard"}</span>
          </div>
          <div className="mh-sub">{txnCount} transações</div>
        </div>
        <button className="mh-btn tap" onClick={()=>setShowSearch(s=>!s)}>🔍</button>
        <button className="mh-btn tap" onClick={onOpenFilter} style={filterCount>0?{borderColor:"var(--accent-border)",background:"var(--accent-glow)"}:{}}>
          ⚙️{filterCount>0&&<span className="mh-badge">{filterCount}</span>}
        </button>
        <button className="mh-btn tap" onClick={toggleTheme}>{dark?"☀️":"🌙"}</button>
        <button className="mh-btn tap" onClick={onReset} style={{fontSize:13}}>🏠</button>
      </div>
      {showSearch&&(
        <div className="mobile-search-row">
          <MultiSearchInput
            search={filters.search}
            searchTags={filters.searchTags||[]}
            setFilters={setFilters}
            placeholder="Buscar… (Enter p/ adicionar)"
            small
          />
        </div>
      )}
      {filterCount>0&&(
        <div className="mh-chips">
          {searchTags.map((tag,i)=>(
            <span key={i} className="chip active" style={{fontSize:10}} onClick={()=>setFilters(f=>({...f,searchTags:f.searchTags.filter((_,j)=>j!==i)}))}>"{tag}" ✕</span>
          ))}
          {filters.search&&<span className="chip active" style={{fontSize:10}} onClick={()=>set("search","")}>"{filters.search}" ✕</span>}
          {filters.selectedPerson!=="all"&&<span className="chip active" style={{fontSize:10}} onClick={()=>set("selectedPerson","all")}>{filters.selectedPerson} ✕</span>}
          {filters.selectedCard!=="all"&&<span className="chip active" style={{fontSize:10}} onClick={()=>set("selectedCard","all")}>{filters.selectedCard} ✕</span>}
          {filters.selectedYear!=="all"&&<span className="chip active" style={{fontSize:10}} onClick={()=>set("selectedYear","all")}>{filters.selectedYear} ✕</span>}
          {filters.selectedMonth!=="all"&&<span className="chip active" style={{fontSize:10}} onClick={()=>set("selectedMonth","all")}>{filters.selectedMonth} ✕</span>}
          {categoryFilter.map(c=>(
            <span key={c} className="chip active" style={{fontSize:10,background:(CAT_COLORS[c]||"#6b7280")+"20",borderColor:(CAT_COLORS[c]||"#6b7280")+"40",color:CAT_COLORS[c]||"#6b7280"}}
              onClick={()=>setFilters(f=>({...f,categoryFilter:f.categoryFilter.filter(x=>x!==c)}))}>
              {c} ✕
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MOBILE FILTER DRAWER ─────────────────────
function FilterDrawer({ open, onClose, filters, setFilters, activePeople, cards, years, months, catStats }) {
  if(!open) return null;
  const { search, searchTags=[], selectedPerson, selectedCard, selectedYear, selectedMonth, categoryFilter=[], txnType, amountMin, amountMax } = filters;
  const set = (key,val) => setFilters(f=>({...f,[key]:val}));
  const hasFilter = !!search || searchTags.length > 0 || selectedPerson!=="all" || selectedCard!=="all" || selectedYear!=="all" || selectedMonth!=="all" || categoryFilter.length>0 || txnType!=="all" || !!amountMin || !!amountMax;
  const clearAll = () => setFilters(f=>({...f, search:"", searchTags:[], selectedPerson:"all", selectedCard:"all", selectedYear:"all", selectedMonth:"all", categoryFilter:[], txnType:"all", amountMin:"", amountMax:""}));
  const filteredMonths = selectedYear==="all"?["all",...months.filter(m=>m!=="all")]:["all",...months.filter(m=>m!=="all"&&m.endsWith(selectedYear))];
  return (
    <>
      <div className="drawer-overlay" onClick={onClose}/>
      <div className="drawer">
        <div className="drawer-close-arrow">
          <button onClick={onClose} title="Fechar filtros">↓</button>
        </div>
        <div className="drawer-body">
          <div className="drawer-title-row">
            <span className="drawer-title">Filtros</span>
            {hasFilter&&<button className="drawer-clear-btn tap" onClick={clearAll}>Limpar tudo</button>}
          </div>

          <div className="filter-section">
            <div className="filter-label">BUSCAR</div>
            <MultiSearchInput search={search} searchTags={searchTags} setFilters={setFilters} />
          </div>

          {activePeople.length>1&&(
            <div className="filter-section">
              <div className="filter-label">PESSOA</div>
              <div className="chips-row">
                <button className={`chip tap${selectedPerson==="all"?" active":""}`} onClick={()=>set("selectedPerson","all")}>Todos</button>
                {activePeople.map(p=>(
                  <button key={p.name} className={`cat-chip tap${selectedPerson===p.name?" active":""}`} onClick={()=>set("selectedPerson",p.name)} style={selectedPerson===p.name?{borderColor:p.color+"60",background:p.color+"15",color:p.color}:{}}>
                    <PersonAvatar name={p.name} color={p.color} size={16} fontSize={7}/>{p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="filter-section">
            <div className="filter-label">CARTÃO</div>
            <div className="chips-row">
              <button className={`chip tap${selectedCard==="all"?" active":""}`} onClick={()=>set("selectedCard","all")}>Todos</button>
              {cards.map(c=><button key={c} className={`chip tap${selectedCard===c?" active":""}`} onClick={()=>set("selectedCard",c)}>{c}</button>)}
            </div>
          </div>
          {years.length>1&&(
            <div className="filter-section">
              <div className="filter-label">ANO</div>
              <div className="chips-row">
                <button className={`chip tap${selectedYear==="all"?" active":""}`} onClick={()=>set("selectedYear","all")}>Todos</button>
                {years.map(y=><button key={y} className={`chip tap${selectedYear===y?" active":""}`} onClick={()=>{set("selectedYear",y);set("selectedMonth","all");}}>{y}</button>)}
              </div>
            </div>
          )}
          <div className="filter-section">
            <div className="filter-label">MÊS</div>
            <div className="chips-scroll">{filteredMonths.map(m=><button key={m} className={`chip tap${selectedMonth===m?" active":""}`} onClick={()=>set("selectedMonth",m)}>{m==="all"?"Todos":m}</button>)}</div>
          </div>
          <div className="filter-section">
            <div className="filter-label">TIPO</div>
            <div className="chips-row">{[{v:"all",l:"Tudo"},{v:"expense",l:"Gastos"},{v:"charge",l:"Encargos"}].map(({v,l})=><button key={v} className={`chip tap${txnType===v?" active":""}`} onClick={()=>set("txnType",v)}>{l}</button>)}</div>
          </div>
          <div className="filter-section">
            <div className="filter-label">VALOR (R$)</div>
            <div className="range-row">
              <input className="range-input" type="number" placeholder="Mínimo" value={amountMin} onChange={e=>set("amountMin",e.target.value)} min="0"/>
              <span className="range-sep">até</span>
              <input className="range-input" type="number" placeholder="Máximo" value={amountMax} onChange={e=>set("amountMax",e.target.value)} min="0"/>
            </div>
          </div>
          <div className="filter-section">
            <div className="filter-label">
              CATEGORIA
              {categoryFilter.length>0&&(
                <button className="filter-label-clear" onClick={()=>set("categoryFilter",[])}>
                  limpar {categoryFilter.length > 1 ? `(${categoryFilter.length})` : ""}
                </button>
              )}
            </div>
            <CategoryFilterSection
              categoryFilter={categoryFilter}
              setFilters={setFilters}
              catStats={catStats}
            />
          </div>
          <button className="drawer-apply-btn tap-btn" onClick={onClose}>Aplicar filtros</button>
        </div>
      </div>
    </>
  );
}

// ─── DESKTOP HEADER ───────────────────────────
function DesktopHeader({ activeTab, filters, setFilters, activePeople, txnCount }) {
  const set = (key,val) => setFilters(f=>({...f,[key]:val}));
  const { searchTags=[], categoryFilter=[] } = filters;
  const tabTitles={overview:"Visão Geral",transactions:"Transações",categories:"Categorias",trends:"Tendências"};
  const clearAll = () => setFilters(f=>({...f, search:"", searchTags:[], selectedPerson:"all", selectedCard:"all", selectedYear:"all", selectedMonth:"all", categoryFilter:[], txnType:"all", amountMin:"", amountMax:""}));
  const activeTags=[
    filters.selectedPerson!=="all"&&{key:"selectedPerson",label:`Pessoa: ${filters.selectedPerson}`},
    filters.selectedCard!=="all"&&{key:"selectedCard",label:`Cartão: ${filters.selectedCard}`},
    filters.selectedYear!=="all"&&{key:"selectedYear",label:`Ano: ${filters.selectedYear}`},
    filters.selectedMonth!=="all"&&{key:"selectedMonth",label:`Mês: ${filters.selectedMonth}`},
    filters.txnType!=="all"&&{key:"txnType",label:`Tipo: ${filters.txnType}`},
    (filters.amountMin||filters.amountMax)&&{key:"amount",label:`R$${filters.amountMin||"0"}–${filters.amountMax||"∞"}`},
  ].filter(Boolean);
  const activePerson = activePeople.find(p=>p.name===filters.selectedPerson);
  const viewLabel = activePerson?activePerson.name:activePeople.length>1?"Juntos":activePeople[0]?.name||"";
  const hasAnyFilter = !!filters.search || searchTags.length > 0 || activeTags.length > 0 || categoryFilter.length > 0;

  const handleSearchKeyDown = e => {
    if (e.key === "Enter" && filters.search.trim()) {
      e.preventDefault();
      setFilters(f => ({...f, searchTags:[...(f.searchTags||[]), f.search.trim()], search:""}));
    }
    if (e.key === "Backspace" && !filters.search && searchTags.length > 0) {
      setFilters(f => ({...f, searchTags: f.searchTags.slice(0,-1)}));
    }
  };

  return (
    <>
      <div className="desktop-header">
        <div className="dh-title">{tabTitles[activeTab]||activeTab}</div>
        {viewLabel&&<>
          <span className="dh-sep">·</span>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {activePerson&&<PersonAvatar name={activePerson.name} color={activePerson.color} size={20} fontSize={8}/>}
            {!activePerson&&activePeople.length>1&&<span>💑</span>}
            <span className="dh-subtitle" style={{color:activePerson?.color||"var(--text-faint)"}}>{viewLabel}</span>
          </div>
        </>}
        <span className="dh-sep">·</span><div className="dh-subtitle">{txnCount} transações</div>
        <div className="dh-search-wrap">
          <span className="dh-search-icon">🔍</span>
          <input
            className="dh-search"
            type="text"
            placeholder={searchTags.length > 0 ? `+ busca (Enter) · ${searchTags.length} tag${searchTags.length>1?"s":""}` : "Buscar… Enter p/ adicionar tag"}
            value={filters.search}
            onChange={e=>set("search",e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {filters.search&&<button className="dh-search-clear" onClick={()=>set("search","")}>✕</button>}
        </div>
      </div>
      {hasAnyFilter&&(
        <div className="active-filter-bar">
          <span className="af-label">FILTROS:</span>
          {searchTags.map((tag,i)=>(
            <span key={i} className="af-tag" onClick={()=>setFilters(f=>({...f,searchTags:f.searchTags.filter((_,j)=>j!==i)}))}>🔍 "{tag}" ✕</span>
          ))}
          {filters.search&&<span className="af-tag" onClick={()=>set("search","")}>"{filters.search}" ✕</span>}
          {activeTags.map(tag=>(
            <span key={tag.key} className="af-tag" onClick={()=>{if(tag.key==="amount"){set("amountMin","");set("amountMax","");}else set(tag.key,"all");}}>{tag.label} ✕</span>
          ))}
          {categoryFilter.map(c=>(
            <span key={c} className="af-tag"
              style={{background:(CAT_COLORS[c]||"#6b7280")+"15",borderColor:(CAT_COLORS[c]||"#6b7280")+"40",color:CAT_COLORS[c]||"#6b7280"}}
              onClick={()=>setFilters(f=>({...f,categoryFilter:f.categoryFilter.filter(x=>x!==c)}))}>
              <span style={{width:6,height:6,borderRadius:2,background:CAT_COLORS[c]||"#6b7280",display:"inline-block",marginRight:3}}/>
              {c} ✕
            </span>
          ))}
          <button className="af-clear-all" onClick={clearAll}>Limpar tudo</button>
        </div>
      )}
    </>
  );
}

// ─── KPI CARD ─────────────────────────────────
function KpiCard({ icon, label, value, sub, color, onClick }) {
  return (
    <div className={`kpi-card${onClick?" clickable":""}`} onClick={onClick}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-value" style={{color}}>{value}</div>
      <div className="kpi-label">{label}</div>
      {sub&&<div className="kpi-sub">{sub}</div>}
    </div>
  );
}

// ─── COMPARISON PANEL ─────────────────────────
function ComparisonPanel({ activePeople, filtered }) {
  const isMobile = useWindowWidth() < 768;
  const ttStyle={background:"var(--bg-card)",border:"1px solid var(--border-med)",borderRadius:8,fontSize:11,fontFamily:"'DM Mono',monospace",color:"var(--text-primary)"};
  const stats=activePeople.map(p=>{
    const pTxns=filtered.filter(t=>t.person===p.name);
    const exp=pTxns.filter(t=>t.amount>0&&t.category!=="Encargos/Juros");
    const total=exp.reduce((s,t)=>s+t.amount,0);
    const cats={};exp.forEach(t=>{cats[t.category]=(cats[t.category]||0)+t.amount;});
    const topCat=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
    return {...p,total,count:exp.length,avg:exp.length>0?total/exp.length:0,topCat:topCat?{name:topCat[0],value:topCat[1]}:null};
  });
  const maxTotal=Math.max(...stats.map(s=>s.total),1);
  const catChartData=Object.keys(CAT_COLORS).map(cat=>{
    const entry={cat:cat.split("/")[0]};
    stats.forEach(s=>{entry[s.name]=+filtered.filter(t=>t.person===s.name&&t.category===cat&&t.amount>0&&t.category!=="Encargos/Juros").reduce((sum,t)=>sum+t.amount,0).toFixed(2);});
    return entry;
  }).filter(d=>stats.some(s=>d[s.name]>0)).sort((a,b)=>stats.reduce((s,p)=>s+(b[p.name]||0),0)-stats.reduce((s,p)=>s+(a[p.name]||0),0)).slice(0,8);

  return (
    <div className="section-card dash-grid-full" style={{borderTop:"3px solid var(--accent)",marginBottom:14}}>
      <div className="section-header">
        <div><div className="section-title">💑 Análise Comparativa</div><div className="section-sub">gastos lado a lado</div></div>
      </div>
      <div className="comparison-persons-grid">
        {stats.map(s=>(
          <div key={s.name} style={{background:s.color+"10",border:`1px solid ${s.color}30`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <PersonAvatar name={s.name} color={s.color} size={30} fontSize={11}/>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,color:s.color}}>{s.name}</div>
            </div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:500,color:"var(--text-primary)",marginBottom:4}}>{fmtShort(s.total)}</div>
            <div style={{fontSize:10,color:"var(--text-faint)",marginBottom:8}}>{s.count} compras · ticket {fmtShort(s.avg)}</div>
            <div className="prog-bar"><div className="prog-fill" style={{width:`${(s.total/maxTotal)*100}%`,background:s.color}}/></div>
            <div style={{fontSize:10,color:"var(--text-faint)",marginTop:4}}>{((s.total/maxTotal)*100).toFixed(0)}% do maior</div>
            {s.topCat&&<div style={{marginTop:8,fontSize:10,color:"var(--text-muted)"}}>↑ <span style={{color:CAT_COLORS[s.topCat.name]||"#6b7280"}}>{s.topCat.name}</span>: {fmtShort(s.topCat.value)}</div>}
          </div>
        ))}
      </div>
      {catChartData.length>0&&(
        <>
          <div style={{fontSize:11,color:"var(--text-faint)",marginBottom:10,letterSpacing:".06em"}}>CATEGORIAS COMPARADAS</div>
          <ResponsiveContainer width="100%" height={isMobile?160:220}>
            <BarChart data={catChartData} margin={{left:-10,right:4}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)"/>
              <XAxis dataKey="cat" tick={{fontSize:9,fill:"var(--text-faint)"}} angle={-20} textAnchor="end" height={44}/>
              <YAxis tick={{fontSize:9,fill:"var(--text-faint)"}} tickFormatter={fmtShort} width={46}/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={ttStyle}/>
              <Legend wrapperStyle={{fontSize:10,fontFamily:"'DM Mono',monospace"}}/>
              {stats.map(s=><Bar key={s.name} dataKey={s.name} fill={s.color} radius={[3,3,0,0]}/>)}
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────
function OverviewTab({ filtered, expenses, totalExp, totalCharge, catBreakdown, topMerchants, cardStats, setFilters, setActiveTab, uniqueCards, monthlyTrend, activePeople, onDeleteTransaction, onEditCategory }) {
  const isMobile = useWindowWidth() < 768;
  const ttStyle={background:"var(--bg-card)",border:"1px solid var(--border-med)",borderRadius:8,fontSize:11,fontFamily:"'DM Mono',monospace",color:"var(--text-primary)"};
  const showComparison=activePeople.length>1;

  return (
    <div className="anim-fade-up">
      <div className="kpi-grid anim-children">
        <KpiCard icon="💸" label="TOTAL GASTOS"   value={fmtShort(totalExp)}    sub={`${expenses.length} compras`} color="#f97316"/>
        <KpiCard icon="⚠️" label="ENCARGOS/JUROS" value={fmtShort(totalCharge)} sub="Clique p/ filtrar" color="#ef4444" onClick={()=>setFilters(f=>({...f,txnType:"charge"}))}/>
        <KpiCard icon="📊" label="TICKET MÉDIO"   value={fmtShort(totalExp/(expenses.length||1))} sub="por transação" color="#818cf8"/>
        <KpiCard icon="🛒" label="COMPRAS"         value={expenses.length} sub="transações" color="#06b6d4"/>
      </div>

      {showComparison&&<ComparisonPanel activePeople={activePeople} filtered={filtered}/>}

      {cardStats.length>0&&(
        <div className="card-stats-grid">
          {cardStats.map(cs=>{
            const color=CARD_COLORS[cs.card]||"#818cf8";
            const pct=totalExp>0?(cs.total/totalExp*100):0;
            return (
              <div key={cs.card} className="card-stat tap anim-fade-up" style={{"--color":color}} onClick={()=>setFilters(f=>({...f,selectedCard:f.selectedCard===cs.card?"all":cs.card}))}>
                <div className="cs-header"><div><div className="cs-name" style={{color}}>{cs.card}</div><div className="cs-count">{cs.count} compras</div></div><div className="cs-value">{fmt(cs.total)}</div></div>
                <div className="prog-bar"><div className="prog-fill" style={{width:`${pct}%`,background:color}}/></div>
                <div className="prog-pct">{pct.toFixed(1)}% do total</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="dash-grid">
        <div className="section-card dash-grid-left anim-fade-up">
          <div className="section-header"><div><div className="section-title">Por Categoria</div><div className="section-sub">top 8</div></div><button className="section-action" onClick={()=>setActiveTab("categories")}>ver todas →</button></div>
          <ResponsiveContainer width="100%" height={isMobile?170:200}>
            <PieChart><Pie data={catBreakdown.slice(0,8)} dataKey="value" cx="50%" cy="50%" outerRadius={isMobile?75:90} innerRadius={isMobile?38:48}>{catBreakdown.slice(0,8).map(e=><Cell key={e.name} fill={CAT_COLORS[e.name]||"#6b7280"}/>)}</Pie><Tooltip formatter={v=>fmt(v)} contentStyle={ttStyle}/></PieChart>
          </ResponsiveContainer>
          <div style={{marginTop:8}}>
            {catBreakdown.slice(0,5).map(c=>{
              const color=CAT_COLORS[c.name]||"#6b7280";
              const pct=totalExp>0?((c.value/totalExp)*100).toFixed(1):"0";
              return (<div key={c.name} className="cat-breakdown-item tap" onClick={()=>{setFilters(f=>({...f,categoryFilter:[c.name]}));setActiveTab("transactions");}}><span className="cat-dot" style={{background:color}}/><span className="cat-name">{c.name}</span><span className="cat-pct">{pct}%</span><span className="cat-amt">{fmt(c.value)}</span></div>);
            })}
          </div>
        </div>
        <div className="section-card dash-grid-right anim-fade-up">
          <div className="section-header"><div><div className="section-title">Tendência Mensal</div></div><button className="section-action" onClick={()=>setActiveTab("trends")}>detalhar →</button></div>
          <ResponsiveContainer width="100%" height={isMobile?160:200}>
            <AreaChart data={monthlyTrend} margin={{left:-10,right:4}}>
              <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)"/>
              <XAxis dataKey="month" tick={{fontSize:9,fill:"var(--text-faint)"}}/>
              <YAxis tick={{fontSize:9,fill:"var(--text-faint)"}} tickFormatter={fmtShort} width={48}/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={ttStyle}/>
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#areaGrad)" dot={{fill:"#6366f1",r:3}}/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{marginTop:16}}>
            <div style={{fontSize:11,color:"var(--text-faint)",letterSpacing:".08em",marginBottom:10}}>TOP ESTABELECIMENTOS</div>
            {topMerchants.slice(0,5).map((m,i)=>(
              <div key={m.name} className="merch-row tap" onClick={()=>setFilters(f=>({...f,searchTags:[...(f.searchTags||[]),m.name.slice(0,20)]}))}>
                <span className="merch-rank">#{i+1}</span><span className="merch-name">{m.name}</span><span className="merch-count" style={{minWidth:52}}>{m.count}x</span><span className="merch-amount">{fmt(m.total)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="dash-grid-full anim-fade-up">
          <div className="section-header" style={{marginBottom:8}}><div className="section-title">Últimas Transações</div><button className="section-action" onClick={()=>setActiveTab("transactions")}>ver todas →</button></div>
          <div className="txn-list">
            {filtered.slice(0,8).map((t,i)=>(
              <TransactionItem key={i} t={t} idx={i} activePeople={activePeople} onDelete={onDeleteTransaction} onEditCategory={onEditCategory}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TRANSACTIONS TAB ─────────────────────────
function TransactionsTab({ filtered, sortBy, sortDir, toggleSort, activePeople, onDeleteTransaction, onEditCategory }) {
  const [limit,setLimit]=useState(50);
  const expenses=filtered.filter(t=>Math.abs(t.amount)>0&&t.amount!==0);
  const total=filtered.reduce((s,t)=>s+Math.abs(t.amount),0);
  return (
    <div className="anim-fade-up">
      <div className="sort-strip">
        <span className="sort-label">ORDENAR:</span>
        {[["date","Data"],["amount","Valor"],["card","Cartão"],["title","Nome"],["category","Categoria"],["person","Pessoa"]].map(([f,l])=>(
          <button key={f} className={`sort-btn tap${sortBy===f?" active":""}`} onClick={()=>toggleSort(f)}>{l}{sortBy===f&&(sortDir==="desc"?" ↓":" ↑")}</button>
        ))}
      </div>
      <div className="summary-bar">
        <div className="summary-bar-left">{filtered.length} transações · {expenses.length} gastos · {Math.min(filtered.length,limit)} exibidos</div>
        <div className="summary-bar-right">Total: {fmt(total)}</div>
      </div>
      {filtered.length===0?(
        <div className="empty-state"><div className="empty-state-icon">🔍</div><div className="empty-state-title">Nenhuma transação encontrada</div><div className="empty-state-sub">Tente ajustar os filtros</div></div>
      ):(
        <div className="txn-list">
          {filtered.slice(0,limit).map((t,i)=>(
            <TransactionItem key={`${t.date}-${t.title}-${t.amount}-${i}`} t={t} idx={i} striped activePeople={activePeople} onDelete={onDeleteTransaction} onEditCategory={onEditCategory}/>
          ))}
          {filtered.length>limit&&<button className="load-more-btn tap" onClick={()=>setLimit(l=>l+50)}>Carregar mais ({filtered.length-limit} restantes)</button>}
        </div>
      )}
    </div>
  );
}

// ─── CATEGORIES TAB ───────────────────────────
function CategoriesTab({ catBreakdown, expenses, totalExp, setFilters, setActiveTab }) {
  const isMobile = useWindowWidth() < 768;
  const ttStyle={background:"var(--bg-card)",border:"1px solid var(--border-med)",borderRadius:8,fontSize:11,fontFamily:"'DM Mono',monospace",color:"var(--text-primary)"};
  return (
    <div className="anim-fade-up">
      <div className="summary-bar" style={{marginBottom:14}}><span className="summary-bar-left">{catBreakdown.length} categorias · {expenses.length} transações</span><span className="summary-bar-right">{fmt(totalExp)}</span></div>
      <div className="section-card" style={{marginBottom:14}}>
        <div className="section-header"><div className="section-title">Distribuição</div></div>
        <ResponsiveContainer width="100%" height={isMobile?220:280}>
          <BarChart data={catBreakdown.slice(0,isMobile?8:10)} layout="vertical" margin={{left:isMobile?-4:4,right:isMobile?8:16}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false}/>
            <XAxis type="number" tick={{fontSize:isMobile?8:9,fill:"var(--text-faint)"}} tickFormatter={fmtShort}/>
            <YAxis type="category" dataKey="name" tick={{fontSize:isMobile?9:10,fill:"var(--text-muted)"}} width={isMobile?90:110}/>
            <Tooltip formatter={v=>fmt(v)} contentStyle={ttStyle}/>
            <Bar dataKey="value" radius={[0,4,4,0]}>{catBreakdown.slice(0,isMobile?8:10).map(e=><Cell key={e.name} fill={CAT_COLORS[e.name]||"#6b7280"}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="cat-cards-grid">
        {catBreakdown.map(cat=>{
          const color=CAT_COLORS[cat.name]||"#6b7280";
          const pct=totalExp>0?((cat.value/totalExp)*100).toFixed(1):"0";
          const catTxns=expenses.filter(t=>t.category===cat.name);
          const top=catTxns.sort((a,b)=>b.amount-a.amount)[0];
          return (
            <div key={cat.name} className="section-card tap anim-fade-up" style={{cursor:"pointer"}} onClick={()=>{setFilters(f=>({...f,categoryFilter:[cat.name]}));setActiveTab("transactions");}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><span className="cat-dot" style={{background:color,width:11,height:11}}/><span style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>{cat.name}</span></div>
                <div style={{textAlign:"right"}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:500,color}}>{fmt(cat.value)}</div><div style={{fontSize:9,color:"var(--text-faint)"}}>{pct}% · {catTxns.length} itens</div></div>
              </div>
              <div className="prog-bar"><div className="prog-fill" style={{width:`${pct}%`,background:color}}/></div>
              {top&&<div style={{fontSize:10,color:"var(--text-faint)",marginTop:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>↑ {top.title.slice(0,42)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TRENDS TAB ───────────────────────────────
function TrendsTab({ filtered, monthlyTrend, catBreakdown, uniqueCards, activePeople }) {
  const isMobile = useWindowWidth() < 768;
  const ttStyle={background:"var(--bg-card)",border:"1px solid var(--border-med)",borderRadius:8,fontSize:11,fontFamily:"'DM Mono',monospace",color:"var(--text-primary)"};
  const encargos=filtered.filter(t=>t.category==="Encargos/Juros"&&t.amount>0);
  const totalEnc=encargos.reduce((s,t)=>s+t.amount,0);
  const monthAvg=monthlyTrend.length>0?monthlyTrend.reduce((s,m)=>s+m.total,0)/monthlyTrend.length:0;
  const maxMonth=monthlyTrend.reduce((mx,m)=>m.total>mx.total?m:mx,{total:0,month:"—"});
  const showPersonBars=activePeople.length>1;

  return (
    <div className="anim-fade-up">
      <div className="trends-top-grid">
        <KpiCard icon="📅" label="MESES" value={monthlyTrend.length} color="#818cf8"/>
        <KpiCard icon="📉" label="MÉDIA/MÊS" value={fmtShort(monthAvg)} color="#06b6d4"/>
        <KpiCard icon="🔺" label={`PICO`} sub={maxMonth.month} value={fmtShort(maxMonth.total)} color="#f97316"/>
      </div>
      <div className="section-card" style={{marginBottom:14}}>
        <div className="section-header"><div className="section-title">{showPersonBars?"Gastos por Pessoa / Mês":"Gastos por Cartão / Mês"}</div></div>
        <ResponsiveContainer width="100%" height={isMobile?180:240}>
          <BarChart data={monthlyTrend} margin={{left:isMobile?-16:-10,right:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)"/>
            <XAxis dataKey="month" tick={{fontSize:isMobile?8:9,fill:"var(--text-faint)"}} interval={isMobile?"preserveStartEnd":0}/>
            <YAxis tick={{fontSize:isMobile?8:9,fill:"var(--text-faint)"}} tickFormatter={fmtShort} width={isMobile?38:48}/>
            <Tooltip formatter={v=>fmt(v)} contentStyle={ttStyle}/>
            <Legend wrapperStyle={{fontSize:10,fontFamily:"'DM Mono',monospace"}}/>
            {showPersonBars?activePeople.map(p=><Bar key={p.name} dataKey={p.name} stackId="a" fill={p.color} radius={[2,2,0,0]}/>):uniqueCards.map(c=><Bar key={c} dataKey={c} stackId="a" fill={CARD_COLORS[c]||"#818cf8"} radius={[2,2,0,0]}/>)}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="section-card" style={{marginBottom:14}}>
        <div className="section-header"><div className="section-title">Evolução Total</div></div>
        <ResponsiveContainer width="100%" height={isMobile?150:180}>
          <AreaChart data={monthlyTrend} margin={{left:isMobile?-16:-10,right:4}}>
            <defs><linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)"/>
            <XAxis dataKey="month" tick={{fontSize:isMobile?8:9,fill:"var(--text-faint)"}} interval={isMobile?"preserveStartEnd":0}/>
            <YAxis tick={{fontSize:isMobile?8:9,fill:"var(--text-faint)"}} tickFormatter={fmtShort} width={isMobile?38:48}/>
            <Tooltip formatter={v=>fmt(v)} contentStyle={ttStyle}/>
            <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} fill="url(#totalGrad)" dot={{fill:"#6366f1",r:isMobile?2:4,strokeWidth:0}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="section-card" style={{marginBottom:14}}>
        <div className="section-header"><div className="section-title">Top Categorias</div></div>
        <ResponsiveContainer width="100%" height={isMobile?180:220}>
          <BarChart data={catBreakdown.slice(0,isMobile?6:8)} margin={{left:isMobile?-16:-10,right:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)"/>
            <XAxis dataKey="name" tick={{fontSize:isMobile?8:9,fill:"var(--text-faint)"}} angle={-25} textAnchor="end" height={isMobile?44:52}/>
            <YAxis tick={{fontSize:isMobile?8:9,fill:"var(--text-faint)"}} tickFormatter={fmtShort} width={isMobile?38:48}/>
            <Tooltip formatter={v=>fmt(v)} contentStyle={ttStyle}/>
            <Bar dataKey="value" radius={[4,4,0,0]}>{catBreakdown.slice(0,isMobile?6:8).map(e=><Cell key={e.name} fill={CAT_COLORS[e.name]||"#6b7280"}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {encargos.length>0&&(
        <div className="alert-card danger">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:"#ef4444"}}>⚠️ Encargos Detectados</span>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:500,color:"#ef4444"}}>{fmt(totalEnc)}</span>
          </div>
          {encargos.map((t,i)=>(
            <div key={i} className="charge-item">
              <div style={{fontSize:9,color:"var(--text-faint)",marginBottom:3}}>{fmtDate(t.date)} · {t.card}{t.person&&activePeople.length>1?` · ${t.person}`:""}</div>
              <div style={{fontSize:11,color:"var(--text-sec)",marginBottom:4}}>{t.title}</div>
              <div style={{fontSize:15,fontWeight:500,color:"#ef4444",fontFamily:"'DM Mono',monospace"}}>{fmt(t.amount)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────
function BottomNav({ activeTab, setActiveTab }) {
  const TABS=[{id:"overview",icon:"📊",label:"Visão"},{id:"transactions",icon:"📋",label:"Gastos"},{id:"categories",icon:"🗂️",label:"Categorias"},{id:"trends",icon:"📈",label:"Tendências"}];
  return (
    <nav className="bottom-nav">
      {TABS.map(t=>(
        <button key={t.id} className={`bnav-btn tap${activeTab===t.id?" active":""}`} onClick={()=>setActiveTab(t.id)}>
          <span className="bni">{t.icon}</span><span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── DASHBOARD ────────────────────────────────
function Dashboard({ activePeople, onReset, dark, toggleTheme, onDeleteTransaction, onEditCategory }) {
  const transactions=useMemo(()=>activePeople.flatMap(p=>p.transactions),[activePeople]);
  const [activeTab,  setActiveTab]  = useState("overview");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy,     setSortBy]     = useState("date");
  const [sortDir,    setSortDir]    = useState("desc");
  const [filters, setFilters] = useState({
    search:"", searchTags:[],
    selectedPerson:"all", selectedCard:"all",
    selectedYear:"all", selectedMonth:"all",
    categoryFilter:[], txnType:"all",
    amountMin:"", amountMax:"",
  });

  const cards   = useMemo(()=>[...new Set(transactions.map(t=>t.card))],[transactions]);
  const years   = useMemo(()=>[...new Set(transactions.map(t=>t.year).filter(Boolean))].sort(),[transactions]);
  const months  = useMemo(()=>{
    const parseM=s=>{const p=s.match(/(\w+)\/(\d{4})/);if(!p)return 0;const mo={jan:1,fev:2,mar:3,abr:4,mai:5,jun:6,jul:7,ago:8,set:9,out:10,nov:11,dez:12};return parseInt(p[2])*100+(mo[p[1].toLowerCase().slice(0,3)]||0);};
    return [...new Set(transactions.map(t=>t.month))]
      .filter(m => m && /^[A-Za-z]{3}\/\d{4}$/.test(m))
      .sort((a,b)=>parseM(a)-parseM(b));
  },[transactions]);
  const uniqueCards=useMemo(()=>[...new Set(transactions.map(t=>t.card))],[transactions]);

  const filtered=useMemo(()=>{
    const { search, searchTags=[], selectedPerson, selectedCard, selectedYear, selectedMonth, categoryFilter=[], txnType, amountMin, amountMax } = filters;
    const allTerms = [...searchTags, ...(search.trim() ? [search.trim()] : [])];

    return transactions.filter(t=>{
      if(selectedPerson!=="all"&&t.person!==selectedPerson) return false;
      if(selectedCard!=="all"&&t.card!==selectedCard) return false;
      if(selectedYear!=="all"&&t.year!==selectedYear) return false;
      if(selectedMonth!=="all"&&t.month!==selectedMonth) return false;
      // Multi-category filter: show transaction if its category is in the selected list
      if(categoryFilter.length>0&&!categoryFilter.includes(t.category)) return false;
      if(allTerms.length>0 && !allTerms.some(term=>
        t.title.toLowerCase().includes(term.toLowerCase()) ||
        t.category.toLowerCase().includes(term.toLowerCase())
      )) return false;
      if(txnType==="expense"&&t.category==="Encargos/Juros") return false;
      if(txnType==="charge"&&t.category!=="Encargos/Juros") return false;
      if(amountMin&&Math.abs(t.amount)<parseFloat(amountMin)) return false;
      if(amountMax&&Math.abs(t.amount)>parseFloat(amountMax)) return false;
      return true;
    }).sort((a,b)=>{
      if(sortBy==="amount"){const d=Math.abs(a.amount)-Math.abs(b.amount);return sortDir==="desc"?-d:d;}
      if(sortBy==="date"){const d=a.date.localeCompare(b.date);return sortDir==="desc"?-d:d;}
      const d=String(a[sortBy]).localeCompare(String(b[sortBy]));return sortDir==="desc"?-d:d;
    });
  },[transactions,filters,sortBy,sortDir]);

  const expenses     = useMemo(()=>{
    if(filters.txnType==="charge") return filtered.filter(t=>t.category==="Encargos/Juros");
    return filtered.filter(t=>t.category!=="Encargos/Juros");
  },[filtered,filters.txnType]);
  const totalExp     = useMemo(()=>expenses.reduce((s,t)=>s+Math.abs(t.amount),0),[expenses]);
  const totalCharge  = useMemo(()=>filtered.filter(t=>t.category==="Encargos/Juros"&&t.amount>0).reduce((s,t)=>s+t.amount,0),[filtered]);
  const catBreakdown = useMemo(()=>{const map={};expenses.forEach(t=>{map[t.category]=(map[t.category]||0)+t.amount;});return Object.entries(map).map(([name,value])=>({name,value:+value.toFixed(2)})).sort((a,b)=>b.value-a.value);},[expenses]);
  const catStats = useMemo(()=>{
    const base=filtered.filter(t=>t.category!=="Encargos/Juros");
    const total=base.reduce((s,t)=>s+t.amount,0);
    const map={};
    base.forEach(t=>{map[t.category]=(map[t.category]||0)+t.amount;});
    return {map,total};
  },[filtered]);
  const monthlyTrend = useMemo(()=>{
    const map={};
    filtered.filter(t=>t.category!=="Encargos/Juros").forEach(t=>{
      if(!map[t.month]) map[t.month]={month:t.month,total:0};
      map[t.month].total+=t.amount;
      map[t.month][t.card]=(map[t.month][t.card]||0)+t.amount;
      if(t.person) map[t.month][t.person]=(map[t.month][t.person]||0)+t.amount;
    });
    const parseM=s=>{const p=s.match(/(\w+)\/(\d{4})/);if(!p)return 0;const mo={jan:1,fev:2,mar:3,abr:4,mai:5,jun:6,jul:7,ago:8,set:9,out:10,nov:11,dez:12};return parseInt(p[2])*100+(mo[p[1].toLowerCase().slice(0,3)]||0);};
    return Object.values(map).map(m=>({...m,total:+m.total.toFixed(2)})).sort((a,b)=>parseM(a.month)-parseM(b.month));
  },[filtered]);
  const topMerchants=useMemo(()=>{const map={};expenses.forEach(t=>{const key=t.title.replace(/ - Parcela \d+\/\d+/g,"").trim();if(!map[key])map[key]={name:key,total:0,count:0};map[key].total+=t.amount;map[key].count++;});return Object.values(map).sort((a,b)=>b.total-a.total).slice(0,10).map(m=>({...m,total:+m.total.toFixed(2)}));},[expenses]);
  const cardStats=useMemo(()=>uniqueCards.map(card=>{const txns=filtered.filter(t=>t.card===card&&t.category!=="Encargos/Juros");return {card,total:txns.reduce((s,t)=>s+t.amount,0),count:txns.length};}),[filtered,uniqueCards]);
  const toggleSort=field=>{if(sortBy===field)setSortDir(d=>d==="desc"?"asc":"desc");else{setSortBy(field);setSortDir("desc");}};

  const tabContent=()=>{
    switch(activeTab){
      case "overview":     return <OverviewTab filtered={filtered} expenses={expenses} totalExp={totalExp} totalCharge={totalCharge} catBreakdown={catBreakdown} topMerchants={topMerchants} cardStats={cardStats} setFilters={setFilters} setActiveTab={setActiveTab} uniqueCards={uniqueCards} monthlyTrend={monthlyTrend} activePeople={activePeople} onDeleteTransaction={onDeleteTransaction} onEditCategory={onEditCategory}/>;
      case "transactions": return <TransactionsTab filtered={filtered} sortBy={sortBy} sortDir={sortDir} toggleSort={toggleSort} activePeople={activePeople} onDeleteTransaction={onDeleteTransaction} onEditCategory={onEditCategory}/>;
      case "categories":   return <CategoriesTab catBreakdown={catBreakdown} expenses={expenses} totalExp={totalExp} setFilters={setFilters} setActiveTab={setActiveTab}/>;
      case "trends":       return <TrendsTab filtered={filtered} monthlyTrend={monthlyTrend} catBreakdown={catBreakdown} uniqueCards={uniqueCards} activePeople={activePeople}/>;
      default: return null;
    }
  };

  return (
    <div className="app-shell">
      <FilterSidebar activeTab={activeTab} setActiveTab={setActiveTab} filters={filters} setFilters={setFilters} activePeople={activePeople} cards={cards} years={years} months={months} totalCount={filtered.length} catStats={catStats} dark={dark} toggleTheme={toggleTheme} onReset={onReset}/>
      <div className="main-area">
        <DesktopHeader activeTab={activeTab} filters={filters} setFilters={setFilters} activePeople={activePeople} txnCount={filtered.length}/>
        <MobileHeader filters={filters} setFilters={setFilters} activePeople={activePeople} txnCount={filtered.length} dark={dark} toggleTheme={toggleTheme} onOpenFilter={()=>setFilterOpen(true)} onReset={onReset}/>
        <div className="content-wrap">{tabContent()}</div>
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab}/>
      <FilterDrawer open={filterOpen} onClose={()=>setFilterOpen(false)} filters={filters} setFilters={setFilters} activePeople={activePeople} cards={cards} years={years} months={months} catStats={catStats}/>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════
function App() {
  const [dark, toggleTheme] = useTheme();
  const [screen,            setScreen]            = useState("home");
  const [people,            setPeople]            = useState(()=>loadPeople());
  const [activePersonNames, setActivePersonNames] = useState([]);
  const [addFilesPerson,    setAddFilesPerson]    = useState(null);

  const activePeople = useMemo(
    () => people.filter(p => activePersonNames.includes(p.name)),
    [people, activePersonNames]
  );

  const handleOpenDashboard = names => {
    setActivePersonNames(names);
    setScreen("dashboard");
  };

  const handlePersonLoaded = personData => {
    const result=addOrReplacePerson(personData);
    if(!result.ok&&result.reason==="big")
      alert("⚠️ Dados grandes demais para cache. Os dados serão usados nesta sessão mas não ficarão salvos.");
    setPeople(loadPeople());
    setScreen("home");
  };

  const handleRemovePerson = name => {
    removePerson(name);
    setPeople(loadPeople());
  };

  const handleAddFiles = name => {
    const person=people.find(p=>p.name===name);
    if(person){setAddFilesPerson(person);setScreen("add-files");}
  };

  const handleMergeFiles = (name, newTransactions, newFileNames) => {
    const result=mergePersonFiles(name, newTransactions, newFileNames);
    if(!result.ok&&result.reason==="big")
      alert("⚠️ Dados grandes demais para cache. Os dados serão usados nesta sessão mas não ficarão salvos.");
    setPeople(loadPeople());
    setAddFilesPerson(null);
    setScreen("home");
  };

  const handleDeleteTransaction = useCallback((personName, date, title, amount) => {
    setPeople(prevPeople => {
      const updated = prevPeople.map(p => {
        if (p.name !== personName) return p;
        let removed = false;
        return {
          ...p,
          transactions: p.transactions.filter(t => {
            if (!removed && t.date === date && t.title === title && t.amount === amount) {
              removed = true;
              return false;
            }
            return true;
          })
        };
      });
      savePeople(updated);
      return updated;
    });
  }, []);

  const handleEditCategory = useCallback((personName, date, title, amount, newCategory) => {
    setPeople(prevPeople => {
      const updated = prevPeople.map(p => {
        if (p.name !== personName) return p;
        return {
          ...p,
          transactions: p.transactions.map(t => {
            if (t.date === date && t.title === title && t.amount === amount) {
              return { ...t, category: newCategory };
            }
            return t;
          })
        };
      });
      savePeople(updated);
      return updated;
    });
  }, []);

  const handleReset = () => {
    setActivePersonNames([]);
    setScreen("home");
  };

  if(screen==="upload") return (
    <UploadScreen existingPeople={people} onLoad={handlePersonLoaded} onBack={()=>setScreen("home")} dark={dark} toggleTheme={toggleTheme}/>
  );

  if(screen==="add-files"&&addFilesPerson) return (
    <AddFilesScreen person={addFilesPerson} onMerge={handleMergeFiles} onBack={()=>{setAddFilesPerson(null);setScreen("home");}} dark={dark} toggleTheme={toggleTheme}/>
  );

  if(screen==="dashboard"&&activePeople.length>0) return (
    <Dashboard activePeople={activePeople} dark={dark} toggleTheme={toggleTheme} onReset={handleReset} onDeleteTransaction={handleDeleteTransaction} onEditCategory={handleEditCategory}/>
  );

  return (
    <HomeScreen people={people} onOpenDashboard={handleOpenDashboard} onAddPerson={()=>setScreen("upload")} onRemovePerson={handleRemovePerson} onAddFiles={handleAddFiles} dark={dark} toggleTheme={toggleTheme}/>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
