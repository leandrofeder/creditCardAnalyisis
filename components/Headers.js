/* ═══════════════════════════════════════════════
   components/Headers.js
   MobileHeader, DesktopHeader
   ═══════════════════════════════════════════════ */

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

  return (
    <div className="mobile-header">
      <div className="mh-top">
        <div className="mh-title-wrap">
          <div className="mh-title">
            {activePeople.length>1?"Dashboard":activePeople[0]?.name||"Dashboard"}
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

// ─── DESKTOP HEADER ───────────────────────────
function DesktopHeader({ activeTab, filters, setFilters, activePeople, txnCount }) {
  const set = (key,val) => setFilters(f=>({...f,[key]:val}));
  const { searchTags=[], categoryFilter=[] } = filters;
  const tabTitles = {overview:"Visão Geral",transactions:"Transações",categories:"Categorias",trends:"Tendências"};
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
  const hasAnyFilter = !(!filters.search && searchTags.length===0 && filters.selectedPerson==="all" && filters.selectedCard==="all" && filters.selectedYear==="all" && filters.selectedMonth==="all" && categoryFilter.length===0 && filters.txnType==="all" && !filters.amountMin && !filters.amountMax);

  const handleSearchKeyDown = e => {
    if (e.key === "Enter" && filters.search.trim()) {
      e.preventDefault();
      setFilters(f => ({...f, searchTags: [...(f.searchTags||[]), filters.search.trim()], search: ""}));
    }
    if (e.key === "Backspace" && !filters.search && searchTags.length > 0) {
      setFilters(f => ({...f, searchTags: f.searchTags.slice(0, -1)}));
    }
  };

  return (
    <>
      <div className="desktop-header">
        <div className="dh-left">
          <div className="dh-title">{tabTitles[activeTab]||"Dashboard"}</div>
          <div className="dh-sub">{viewLabel} · {txnCount} transações</div>
        </div>
        <div className="dh-search-wrap">
          {searchTags.length > 0 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:5}}>
              {searchTags.map((tag,i)=>(
                <span key={i}
                  onClick={()=>setFilters(f=>({...f,searchTags:f.searchTags.filter((_,j)=>j!==i)}))}
                  style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:6,cursor:"pointer",background:"var(--accent-glow)",border:"1px solid var(--accent-border)",color:"var(--accent-text)",fontSize:10,fontFamily:"'DM Mono',monospace"}}>
                  {tag} <span style={{opacity:.7}}>✕</span>
                </span>
              ))}
            </div>
          )}
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input dh-search-input"
              type="text"
              placeholder={searchTags.length > 0 ?
                `+ busca (Enter) · ${searchTags.length} tag${searchTags.length>1?"s":""}` : "Buscar… Enter p/ adicionar tag"}
              value={filters.search}
              onChange={e=>set("search",e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            {filters.search&&<button className="dh-search-clear" onClick={()=>set("search","")}>✕</button>}
          </div>
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
