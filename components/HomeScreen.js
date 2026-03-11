/* ═══════════════════════════════════════════════
   components/HomeScreen.js
   ═══════════════════════════════════════════════ */

function HomeScreen({ people, onOpenDashboard, onAddPerson, onRemovePerson, onAddFiles, dark, toggleTheme }) {
  const canJoin = people.length >= 2;
  const stats = people.map(p => {
    const exp     = p.transactions.filter(t => t.amount>0 && t.category!=="Encargos/Juros");
    const charges = p.transactions.filter(t => t.amount>0 && t.category==="Encargos/Juros");
    const totalExp     = exp.reduce((s,t)=>s+t.amount,0);
    const totalCharge  = charges.reduce((s,t)=>s+t.amount,0);
    const totalFatura  = totalExp + totalCharge;
    return {...p, total:totalFatura, totalExp, totalCharge, count:exp.length, cards:[...new Set(p.transactions.map(t=>t.card))]};
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
                  <PersonAvatar name={p.name} color={p.color} size={42} fontSize={16}/>                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,color:p.color,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{fontSize:11,color:"var(--text-faint)"}}>{p.count} compras</span>
                      <span style={{fontSize:14,fontWeight:500,color:p.color,fontFamily:"'DM Mono',monospace"}}>{fmtShort(p.total)}</span>
                      {p.totalCharge>0&&<span style={{fontSize:10,color:"#ef4444",fontFamily:"'DM Mono',monospace"}}>+{fmtShort(p.totalCharge)} enc.</span>}
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
