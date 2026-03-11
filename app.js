/* ═══════════════════════════════════════════════
   APP.JS — componente raiz App
   ═══════════════════════════════════════════════ */

// ─── RECHARTS — verificação de carregamento ───
if (typeof Recharts === "undefined") {
  document.getElementById("root").innerHTML =
    '<div style="color:#ef4444;font-family:monospace;padding:40px;text-align:center">⚠️ Recharts não carregou.</div>';
  throw new Error("Recharts not loaded");
}

// ═══════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════
function App() {
  const [dark, toggleTheme]            = useTheme();
  const [screen,            setScreen]            = useState("home");
  const [people,            setPeople]            = useState(() => loadPeople());
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
    const result = addOrReplacePerson(personData);
    if(!result.ok && result.reason==="big")
      alert("⚠️ Dados grandes demais para cache. Os dados serão usados nesta sessão mas não ficarão salvos.");
    setPeople(loadPeople());
    setScreen("home");
  };

  const handleRemovePerson = name => {
    removePerson(name);
    setPeople(loadPeople());
  };

  const handleAddFiles = name => {
    const person = people.find(p => p.name === name);
    if(person) { setAddFilesPerson(person); setScreen("add-files"); }
  };

  const handleMergeFiles = (name, newTransactions, newFileNames) => {
    const result = mergePersonFiles(name, newTransactions, newFileNames);
    if(!result.ok && result.reason==="big")
      alert("⚠️ Dados grandes demais para cache. Os dados serão usados nesta sessão mas não ficarão salvos.");
    setPeople(loadPeople());
    setAddFilesPerson(null);
    setScreen("home");
  };

  const handleDeleteTransaction = useCallback((personName, date, title, amount) => {
    setPeople(prevPeople => {
      const updated = prevPeople.map(p => {
        if(p.name !== personName) return p;
        let removed = false;
        return {
          ...p,
          transactions: p.transactions.filter(t => {
            if(!removed && t.date===date && t.title===title && t.amount===amount) {
              removed = true; return false;
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
        if(p.name !== personName) return p;
        return {
          ...p,
          transactions: p.transactions.map(t => {
            if(t.date===date && t.title===title && t.amount===amount)
              return {...t, category: newCategory};
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

  if(screen==="add-files" && addFilesPerson) return (
    <AddFilesScreen person={addFilesPerson} onMerge={handleMergeFiles} onBack={()=>{setAddFilesPerson(null);setScreen("home");}} dark={dark} toggleTheme={toggleTheme}/>
  );

  if(screen==="dashboard" && activePeople.length>0) return (
    <Dashboard activePeople={activePeople} dark={dark} toggleTheme={toggleTheme} onReset={handleReset} onDeleteTransaction={handleDeleteTransaction} onEditCategory={handleEditCategory}/>
  );

  return (
    <HomeScreen people={people} onOpenDashboard={handleOpenDashboard} onAddPerson={()=>setScreen("upload")} onRemovePerson={handleRemovePerson} onAddFiles={handleAddFiles} dark={dark} toggleTheme={toggleTheme}/>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
