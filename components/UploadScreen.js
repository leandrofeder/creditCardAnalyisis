/* ═══════════════════════════════════════════════
   components/UploadScreen.js
   ═══════════════════════════════════════════════ */

function UploadScreen({ existingPeople, onLoad, onBack, dark, toggleTheme }) {
  const [step,        setStep]        = useState("name");
  const [personName,  setPersonName]  = useState("");
  const [personColor, setPersonColor] = useState(() => nextPersonColor(existingPeople||[]));
  const [files,       setFiles]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [progress,    setProgress]    = useState("");
  const [dragOver,    setDragOver]    = useState(false);
  const inputRef = useRef();
  const nameRef  = useRef();

  useEffect(() => { if(step==="name") nameRef.current?.focus(); }, [step]);

  const addFiles = raw => {
    const valid = Array.from(raw).filter(f => f.name.endsWith(".csv")||f.name.endsWith(".pdf"));
    setFiles(prev => { const names=new Set(prev.map(f=>f.name)); return [...prev,...valid.filter(f=>!names.has(f.name))]; });
  };
  const handleDrop = e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };

  const handleProcess = async () => {
    if(!files.length) return;
    setLoading(true);
    const all = [];
    for(const file of files) { setProgress(`Lendo ${file.name}…`); try { all.push(...(await processFile(file, personName))); } catch(e) { console.error(e); } }
    setLoading(false); setProgress("");
    if(!all.length) { alert("Nenhuma transação encontrada. Verifique o formato dos arquivos."); return; }
    onLoad({name:personName, color:personColor, transactions:all, fileNames:files.map(f=>f.name), savedAt:Date.now()});
  };

  const guessCard = n => {
    const l = n.toLowerCase();
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
          {loading
            ? (<><span className="spinner"/><span className="anim-pulse">{progress||"Processando…"}</span></>)
            : files.length===0?"Selecione ao menos um arquivo":`Analisar ${files.length} arquivo${files.length>1?"s":""} →`}
        </button>
        <div className="upload-privacy">🔒 100% local · seus dados não saem do dispositivo</div>
      </div>
    </div>
  );
}
