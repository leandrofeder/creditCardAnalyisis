/* ═══════════════════════════════════════════════
   UTILS.JS — formatadores e helpers
   ═══════════════════════════════════════════════ */

const fmt      = v => `R$ ${Math.abs(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtShort = v => { const n=Math.abs(v); return n>=1000?`R$${(n/1000).toFixed(1)}k`:`R$${n.toFixed(0)}`; };
const fmtDate  = d => { if(!d) return ""; const p=d.split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:d; };
const fmtTs    = ts => ts ?
  new Date(ts).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";

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

function personInitials(name) {
  return name.trim().split(/\s+/).map(w=>w[0]).join("").toUpperCase().slice(0,2);
}

function nextPersonColor(people) {
  const used = new Set(people.map(p => p.color));
  return PERSON_COLORS.find(c => !used.has(c)) || PERSON_COLORS[people.length % PERSON_COLORS.length];
}
