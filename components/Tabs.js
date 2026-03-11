/* ═══════════════════════════════════════════════
   components/Tabs.js
   ComparisonPanel, OverviewTab, TransactionsTab,
   CategoriesTab, TrendsTab, BottomNav
   ═══════════════════════════════════════════════ */

const { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
        XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = Recharts;

// ─── COMPARISON PANEL ─────────────────────────
function ComparisonPanel({ activePeople, filtered }) {
  const isMobile = useWindowWidth() < 768;
  const ttStyle = {background:"var(--bg-card)",border:"1px solid var(--border-med)",borderRadius:8,fontSize:11,fontFamily:"'DM Mono',monospace",color:"var(--text-primary)"};

  const stats = activePeople.map(p => {
    const pTxns = filtered.filter(t => t.person === p.name);
    const exp   = pTxns.filter(t => t.amount > 0 && t.category !== "Encargos/Juros");
    const total = exp.reduce((s,t) => s+t.amount, 0);
    const cats  = {};
    exp.forEach(t => { cats[t.category] = (cats[t.category]||0) + t.amount; });
    const topCat = Object.entries(cats).sort((a,b) => b[1]-a[1])[0];
    return {...p, total, count:exp.length, avg:exp.length>0?total/exp.length:0, topCat:topCat?{name:topCat[0],value:topCat[1]}:null};
  });

  const maxTotal = Math.max(...stats.map(s => s.total), 1);
  const catChartData = Object.keys(CAT_COLORS).map(cat => {
    const entry = {cat: cat.split("/")[0]};
    stats.forEach(s => { entry[s.name] = +filtered.filter(t=>t.person===s.name&&t.category===cat&&t.amount>0&&t.category!=="Encargos/Juros").reduce((sum,t)=>sum+t.amount,0).toFixed(2); });
    return entry;
  }).filter(d => stats.some(s => d[s.name]>0))
    .sort((a,b) => stats.reduce((s,p)=>s+(b[p.name]||0),0) - stats.reduce((s,p)=>s+(a[p.name]||0),0))
    .slice(0,8);

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
  const ttStyle = {background:"var(--bg-card)",border:"1px solid var(--border-med)",borderRadius:8,fontSize:11,fontFamily:"'DM Mono',monospace",color:"var(--text-primary)"};
  const showComparison = activePeople.length > 1;

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
            const color = CARD_COLORS[cs.card]||"#818cf8";
            const pct   = totalExp>0?(cs.total/totalExp*100):0;
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
              const color = CAT_COLORS[c.name]||"#6b7280";
              const pct   = totalExp>0?((c.value/totalExp)*100).toFixed(1):"0";
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
  const [limit, setLimit] = useState(50);
  const expenses = filtered.filter(t => Math.abs(t.amount) > 0 && t.amount !== 0);
  const total    = filtered.reduce((s,t) => s+Math.abs(t.amount), 0);

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
  const ttStyle  = {background:"var(--bg-card)",border:"1px solid var(--border-med)",borderRadius:8,fontSize:11,fontFamily:"'DM Mono',monospace",color:"var(--text-primary)"};

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
          const color   = CAT_COLORS[cat.name]||"#6b7280";
          const pct     = totalExp>0?((cat.value/totalExp)*100).toFixed(1):"0";
          const catTxns = expenses.filter(t => t.category===cat.name);
          const top     = catTxns.sort((a,b)=>b.amount-a.amount)[0];
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
  const isMobile    = useWindowWidth() < 768;
  const ttStyle     = {background:"var(--bg-card)",border:"1px solid var(--border-med)",borderRadius:8,fontSize:11,fontFamily:"'DM Mono',monospace",color:"var(--text-primary)"};
  const encargos    = filtered.filter(t => t.category==="Encargos/Juros" && t.amount>0);
  const totalEnc    = encargos.reduce((s,t) => s+t.amount, 0);
  const monthAvg    = monthlyTrend.length>0 ? monthlyTrend.reduce((s,m)=>s+m.total,0)/monthlyTrend.length : 0;
  const maxMonth    = monthlyTrend.reduce((mx,m) => m.total>mx.total?m:mx, {total:0,month:"—"});
  const showPersonBars = activePeople.length > 1;

  return (
    <div className="anim-fade-up">
      <div className="trends-top-grid">
        <KpiCard icon="📅" label="MESES"     value={monthlyTrend.length}   color="#818cf8"/>
        <KpiCard icon="📉" label="MÉDIA/MÊS" value={fmtShort(monthAvg)}    color="#06b6d4"/>
        <KpiCard icon="🔺" label="PICO"      sub={maxMonth.month} value={fmtShort(maxMonth.total)} color="#f97316"/>
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
            {showPersonBars
              ? activePeople.map(p=><Bar key={p.name} dataKey={p.name} stackId="a" fill={p.color} radius={[2,2,0,0]}/>)
              : uniqueCards.map(c=><Bar key={c} dataKey={c} stackId="a" fill={CARD_COLORS[c]||"#818cf8"} radius={[2,2,0,0]}/>)}
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
  const TABS = [
    {id:"overview",    icon:"📊", label:"Visão"},
    {id:"transactions",icon:"📋", label:"Gastos"},
    {id:"categories",  icon:"🗂️", label:"Categorias"},
    {id:"trends",      icon:"📈", label:"Tendências"},
  ];
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
