/* ═══════════════════════════════════════════════
   components/AddFilesScreen.js
   ═══════════════════════════════════════════════ */

function AddFilesScreen({ person, onMerge, onBack, dark, toggleTheme }) {
  const [files,    setFiles]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const addFiles = raw => {
    const valid = Array.from(raw).filter(f => f.name.endsWith(".csv")||f.name.endsWith(".pdf"));
    setFiles(prev => { const names=new Set(prev.map(f=>f.name)); return [...prev,...valid.filter(f=>!names.has(f.name))]; });
  };
  const handleDrop = e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };

  const handleProcess = async () => {
    if(!files.length) return;
    setLoading(true);
    const all = [];
    for(const file of files) { setProgress(`Lendo ${file.name}…`); try { all.push(...(await processFile(file, person.name))); } catch(e) { console.error(e); } }
    setLoading(false); setProgress("");
    if(!all.length) { alert("Nenhuma transação encontrada nos novos arquivos."); return; }
    onMerge(person.name, all, files.map(f=>f.name));
  };

  const guessCard = n => {
    const l = n.toLowerCase();
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
                const card = guessCard(fn);
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
              const card = guessCard(f.name);
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
          {loading
            ? (<><span className="spinner"/><span className="anim-pulse">{progress||"Processando…"}</span></>)
            : files.length===0?"Selecione ao menos um arquivo":`Adicionar ${files.length} arquivo${files.length>1?"s":""} a ${person.name} →`}
        </button>
        <div className="upload-privacy" style={{marginTop:14}}>🔒 100% local · seus dados não saem do dispositivo</div>
      </div>
    </div>
  );
}
