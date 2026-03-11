/* ═══════════════════════════════════════════════
   components/Filters.js
   MultiSearchInput, CategoryFilterSection,
   FilterSidebar, FilterDrawer
   ═══════════════════════════════════════════════ */

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
          placeholder={searchTags && searchTags.length > 0 ?
            `+ busca (Enter) · ${searchTags.length} tag${searchTags.length>1?"s":""}` : placeholder}
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

// ─── CATEGORY FILTER SECTION ──────────────────
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

  const selectedTotal = cats.length > 0 && catStats
    ? cats.reduce((s, c) => s + (catStats.map[c] || 0), 0)
    : 0;

  return (
    <div>
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
                border:`1px solid ${allSel||someSel?"var(--accent-border)":"var(--border-med)"}`,
                background: allSel||someSel?"var(--accent-glow)":"var(--bg-input)",
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

      <div className="chips-row">
        <button className={`chip tap${cats.length===0?" active":""}`} onClick={clearAll}>Todas</button>
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
                <span style={{fontSize:9,flexShrink:0,marginLeft:4,color:isActive?"inherit":color,opacity:.85,fontWeight:500}}>{pct}%</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── FILTER SIDEBAR ───────────────────────────
const SIDEBAR_TABS=[
  {id:"overview",icon:"📊",label:"Visão Geral"},
  {id:"transactions",icon:"📋",label:"Transações"},
  {id:"categories",icon:"🗂️",label:"Categorias"},
  {id:"trends",icon:"📈",label:"Tendências"}
];

function FilterSidebar({ activeTab, setActiveTab, filters, setFilters, activePeople, cards, years, months, totalCount, catStats, dark, toggleTheme, onReset }) {
  const { search, searchTags=[], selectedPerson, selectedCard, selectedYear, selectedMonth, categoryFilter=[], txnType, amountMin, amountMax } = filters;
  const set = (key,val) => setFilters(f=>({...f,[key]:val}));
  const hasFilter = !(!search && searchTags.length===0 && selectedPerson==="all" && selectedCard==="all" && selectedYear==="all" && selectedMonth==="all" && categoryFilter.length===0 && txnType==="all" && !amountMin && !amountMax);
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

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">💳 Dashboard</div>
        <div className="sidebar-logo-sub">{totalCount} TRANSAÇÕES FILTRADAS</div>
      </div>

      <nav className="sidebar-nav">
        {SIDEBAR_TABS.map(t=>(
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
          <CategoryFilterSection categoryFilter={categoryFilter} setFilters={setFilters} catStats={catStats} compact/>
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

// ─── FILTER DRAWER (mobile) ───────────────────
function FilterDrawer({ open, onClose, filters, setFilters, activePeople, cards, years, months, catStats }) {
  if(!open) return null;
  const { search, searchTags=[], selectedPerson, selectedCard, selectedYear, selectedMonth, categoryFilter=[], txnType, amountMin, amountMax } = filters;
  const set = (key,val) => setFilters(f=>({...f,[key]:val}));
  const hasFilter = !(!search && searchTags.length===0 && selectedPerson==="all" && selectedCard==="all" && selectedYear==="all" && selectedMonth==="all" && categoryFilter.length===0 && txnType==="all" && !amountMin && !amountMax);
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
            <CategoryFilterSection categoryFilter={categoryFilter} setFilters={setFilters} catStats={catStats}/>
          </div>

          <button className="drawer-apply-btn tap-btn" onClick={onClose}>Aplicar filtros</button>
        </div>
      </div>
    </>
  );
}
