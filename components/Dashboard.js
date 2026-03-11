/* ═══════════════════════════════════════════════
   components/Dashboard.js
   ═══════════════════════════════════════════════ */

function Dashboard({activePeople, onReset, dark, toggleTheme, onDeleteTransaction, onEditCategory }) {  const transactions = useMemo(() => activePeople.flatMap(p => p.transactions), [activePeople]);
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
  const cards  = useMemo(() => [...new Set(transactions.map(t => t.card))], [transactions]);
  const years  = useMemo(() => [...new Set(transactions.map(t => t.year).filter(Boolean))].sort(), [transactions]);
  const months = useMemo(() => {
    const parseM = s => { const p=s.match(/(\w+)\/(\d{4})/); if(!p) return 0; const mo={jan:1,fev:2,mar:3,abr:4,mai:5,jun:6,jul:7,ago:8,set:9,out:10,nov:11,dez:12}; return parseInt(p[2])*100+(mo[p[1].toLowerCase().slice(0,3)]||0); };
    return [...new Set(transactions.map(t => t.month))]
      .filter(m => m && /^[A-Za-z]{3}\/\d{4}$/.test(m))
      .sort((a,b) => parseM(a)-parseM(b));  }, [transactions]);
  const uniqueCards = useMemo(() => [...new Set(transactions.map(t => t.card))], [transactions]);

  const filtered = useMemo(() => {
    const { search, searchTags=[], selectedPerson, selectedCard, selectedYear, selectedMonth, categoryFilter=[], txnType, amountMin, amountMax } = filters;
    const allTerms = [...searchTags, ...(search.trim() ? [search.trim()] : [])];
    return transactions.filter(t => {
      if(selectedPerson!=="all"&&t.person!==selectedPerson) return false;
      if(selectedCard!=="all"&&t.card!==selectedCard) return false;
      if(selectedYear!=="all"&&t.year!==selectedYear) return false;
      if(selectedMonth!=="all"&&t.month!==selectedMonth) return false;
      if(categoryFilter.length>0&&!categoryFilter.includes(t.category)) return false;
      if(allTerms.length>0 && !allTerms.some(term =>
        t.title.toLowerCase().includes(term.toLowerCase()) ||
        t.category.toLowerCase().includes(term.toLowerCase())
      )) return false;
      if(txnType==="expense"&&t.category==="Encargos/Juros") return false;
      if(txnType==="charge"&&t.category!=="Encargos/Juros") return false;
      if(amountMin&&Math.abs(t.amount)<parseFloat(amountMin)) return false;
      if(amountMax&&Math.abs(t.amount)>parseFloat(amountMax)) return false;
      return true;
    }).sort((a,b) => {
      if(sortBy==="amount"){const d=Math.abs(a.amount)-Math.abs(b.amount);return sortDir==="desc"?-d:d;}
      if(sortBy==="date"){const d=a.date.localeCompare(b.date);return sortDir==="desc"?-d:d;}
      const d=String(a[sortBy]).localeCompare(String(b[sortBy]));return sortDir==="desc"?-d:d;
    });
  }, [transactions, filters, sortBy, sortDir]);
  const expenses     = useMemo(() => filters.txnType==="charge" ? filtered.filter(t=>t.category==="Encargos/Juros") : filtered.filter(t=>t.category!=="Encargos/Juros"), [filtered, filters.txnType]);
  const totalExp     = useMemo(() => expenses.reduce((s,t) => s+Math.abs(t.amount), 0), [expenses]);
  const totalCharge  = useMemo(() => filtered.filter(t=>t.category==="Encargos/Juros"&&t.amount>0).reduce((s,t)=>s+t.amount,0), [filtered]);
  const totalFatura  = useMemo(() => totalExp + (filters.txnType==="charge" ? 0 : totalCharge), [totalExp, totalCharge, filters.txnType]);
  const catBreakdown = useMemo(() => { const map={}; expenses.forEach(t=>{map[t.category]=(map[t.category]||0)+t.amount;}); return Object.entries(map).map(([name,value])=>({name,value:+value.toFixed(2)})).sort((a,b)=>b.value-a.value); }, [expenses]);
  const catStats     = useMemo(() => {
    const base  = filtered.filter(t => t.category!=="Encargos/Juros");
    const total = base.reduce((s,t) => s+t.amount, 0);
    const map   = {};
    base.forEach(t => { map[t.category]=(map[t.category]||0)+t.amount; });
    return {map, total};
  }, [filtered]);

  const monthlyTrend = useMemo(() => {
    const map  = {};
    const base = filters.txnType==="charge" ? filtered : filtered.filter(t=>t.category!=="Encargos/Juros");
    base.forEach(t => {
      if(!map[t.month]) map[t.month]={month:t.month,total:0};
      map[t.month].total += t.amount;
      map[t.month][t.card] = (map[t.month][t.card]||0)+t.amount;
      if(t.person) map[t.month][t.person]=(map[t.month][t.person]||0)+t.amount;
    });
    const parseM = s => { const p=s.match(/(\w+)\/(\d{4})/); if(!p) return 0; const mo={jan:1,fev:2,mar:3,abr:4,mai:5,jun:6,jul:7,ago:8,set:9,out:10,nov:11,dez:12}; return parseInt(p[2])*100+(mo[p[1].toLowerCase().slice(0,3)]||0); };
    return Object.values(map).map(m => ({...m, total:+m.total.toFixed(2)})).sort((a,b) => parseM(a.month)-parseM(b.month));
  }, [filtered, filters.txnType]);

  const topMerchants = useMemo(() => {
    const map = {};
    expenses.forEach(t => {
      const key = t.title.replace(/ - Parcela \d+\/\d+/g,"").trim();
      if(!map[key]) map[key]={name:key,total:0,count:0};
      map[key].total += t.amount;
      map[key].count++;
    });
    return Object.values(map).sort((a,b)=>b.total-a.total).slice(0,10).map(m=>({...m,total:+m.total.toFixed(2)}));
  }, [expenses]);

  const cardStats = useMemo(() => uniqueCards.map(card => {
    const txns = filters.txnType==="charge"
      ? filtered.filter(t=>t.card===card)
      : filtered.filter(t=>t.card===card&&t.category!=="Encargos/Juros");
    return {card, total:txns.reduce((s,t)=>s+t.amount,0), count:txns.length};
  }), [filtered, uniqueCards, filters.txnType]);

  const toggleSort = field => {
    if(sortBy===field) setSortDir(d => d==="desc"?"asc":"desc");
    else { setSortBy(field); setSortDir("desc"); }
  };

  const tabContent = () => {
    switch(activeTab){
      case "overview":     return <OverviewTab filtered={filtered} expenses={expenses} totalExp={totalExp} totalCharge={totalCharge} totalFatura={totalFatura} catBreakdown={catBreakdown} topMerchants={topMerchants} cardStats={cardStats} setFilters={setFilters} setActiveTab={setActiveTab} uniqueCards={uniqueCards} monthlyTrend={monthlyTrend} activePeople={activePeople} onDeleteTransaction={onDeleteTransaction} onEditCategory={onEditCategory}/>;
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
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab}/>
        <FilterDrawer open={filterOpen} onClose={()=>setFilterOpen(false)} filters={filters} setFilters={setFilters} activePeople={activePeople} cards={cards} years={years} months={months} catStats={catStats}/>
      </div>
    </div>
  );
}
