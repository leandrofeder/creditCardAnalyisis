/* ═function TransactionItem({ t, activePeople, onDelete, onEditCategory, striped, idx }) {
  const [editingCat, setEditingCat] = useState(false);════════════════════════════════════════════
   components/TransactionItem.js
   ═══════════════════════════════════════════════ */

function TransactionItem({t, activePeople, onDelete, onEditCategory, striped, idx }) {
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
