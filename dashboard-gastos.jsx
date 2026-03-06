import { useState, useMemo, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (v) =>
  `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CATEGORY_COLORS = {
  "Supermercado":           "#22c55e",
  "Gastronomia":            "#f97316",
  "Transporte":             "#3b82f6",
  "Tecnologia/Assinaturas": "#8b5cf6",
  "Compras Online":         "#06b6d4",
  "Gasolina":               "#eab308",
  "Saúde":                  "#ec4899",
  "Padaria/Alimentação":    "#a78bfa",
  "Academia/Saúde":         "#14b8a6",
  "Cafés/Pequenos":         "#fb923c",
  "Parcelamentos":          "#64748b",
  "Encargos/Juros":         "#ef4444",
  "Pagamento":              "#10b981",
  "Estacionamento":         "#94a3b8",
  "Presentes/Bazar":        "#f43f5e",
  "Educação":               "#0ea5e9",
  "Telecomunicações":       "#38bdf8",
  "Seguros":                "#d97706",
  "Outros":                 "#6b7280",
};

const CARD_COLORS = { Nubank: "#8c52ff", Ailos: "#00a86b", Inter: "#ff6b00" };

function categorize(title) {
  const t = title.toLowerCase();
  if (t.includes("uber") || t.includes("99app") || t.includes("transporte")) return "Transporte";
  if (t.includes("koch") || t.includes("supermercado") || t.includes("sams club") || t.includes("hipermercado") || t.includes("cooper") || t.includes("mercado garcia") || t.includes("cs koch")) return "Supermercado";
  if (t.includes("farmacia") || t.includes("saude") || t.includes("otica") || t.includes("medic")) return "Saúde";
  if (t.includes("fitland") || t.includes("academia")) return "Academia/Saúde";
  if (t.includes("apple") || t.includes("microsoft") || t.includes("canva") || t.includes("hostgator") || t.includes("applecombill")) return "Tecnologia/Assinaturas";
  if (t.includes("amazon") || t.includes("shopee") || t.includes("mercadolivre")) return "Compras Online";
  if (t.includes("posto") || t.includes("gasolina") || t.includes("zandona") || t.includes("autopost")) return "Gasolina";
  if (t.includes("restaurant") || t.includes("takumi") || t.includes("toscana") || t.includes("boli") || t.includes("ohana") || t.includes("acai") || t.includes("sushi") || t.includes("brunch") || t.includes("bier") || t.includes("ecke") || t.includes("fogao") || t.includes("pasteis") || t.includes("napoli") || t.includes("kalzone") || t.includes("baitah") || t.includes("divino") || t.includes("sitio") || t.includes("china e brasil") || t.includes("allesblau") || t.includes("alemao") || t.includes("point da praia") || t.includes("frogpay") || t.includes("polaco") || t.includes("dinho")) return "Gastronomia";
  if (t.includes("padaria") || t.includes("panificadora") || t.includes("girassol") || t.includes("royale") || t.includes("dona norma")) return "Padaria/Alimentação";
  if (t.includes("cafe vending") || t.includes("aromapress") || t.includes("54656637") || t.includes("raiden") || t.includes("cappta")) return "Cafés/Pequenos";
  if (t.includes("pagamento recebido")) return "Pagamento";
  if (t.includes("parcela") || t.includes("siapi") || t.includes("panasonic") || t.includes("prata fina") || t.includes("isabela") || t.includes("s v comercio")) return "Parcelamentos";
  if (t.includes("juros") || t.includes("multa") || t.includes("iof") || t.includes("saldo em") || t.includes("rotativo") || t.includes("mora")) return "Encargos/Juros";
  if (t.includes("estacionamento")) return "Estacionamento";
  if (t.includes("martini") || t.includes("bazar") || t.includes("reuter") || t.includes("tecnofesta") || t.includes("milium") || t.includes("cacau")) return "Presentes/Bazar";
  if (t.includes("leiturinha") || t.includes("escola") || t.includes("rede top")) return "Educação";
  if (t.includes("vivo") || t.includes("intercel") || t.includes("rcga") || t.includes("vivov")) return "Telecomunicações";
  if (t.includes("allianz") || t.includes("seguro")) return "Seguros";
  return "Outros";
}

// ─────────────────────────────────────────────
// PARSERS
// ─────────────────────────────────────────────
function parseCSV(text, filename) {
  const lines = text.trim().split("\n").slice(1);
  const monthMatch = filename.match(/(\d{4}-\d{2})/);
  const label = monthMatch
    ? new Date(monthMatch[1] + "-01").toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "")
    : filename.replace(/\.[^.]+$/, "");

  return lines.map(line => {
    const parts = line.split(",");
    if (parts.length < 3) return null;
    const date = parts[0].trim();
    const amount = parseFloat(parts[parts.length - 1].trim());
    const title = parts.slice(1, parts.length - 1).join(",").trim().replace(/^"|"$/g, "");
    if (!date || isNaN(amount)) return null;
    return { date, title, amount, card: "Nubank", month: label, category: categorize(title) };
  }).filter(Boolean);
}

async function loadPdfJs() {
  if (window.pdfjsLib) return;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

async function parsePDF(file) {
  await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
  let fullText = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    fullText += content.items.map(i => i.str).join(" ") + "\n";
  }

  const fname = file.name.toLowerCase();
  const isAilos = fname.includes("fatura_") || fullText.includes("AILOS") || fullText.includes("VIACREDI");
  const isInter = fname.includes("inter") || fullText.includes("Banco Inter") || fullText.includes("bancointer");
  const card = isAilos ? "Ailos" : isInter ? "Inter" : "PDF";

  const yearMatch = fullText.match(/20(25|26)/)?.[0] || "2026";
  const monthNameMatch = fullText.match(/fatura de (\w+)/i);
  const ptMonthMap = { janeiro:"Jan", fevereiro:"Fev", março:"Mar", marco:"Mar", abril:"Abr", maio:"Mai", junho:"Jun", julho:"Jul", agosto:"Ago", setembro:"Set", outubro:"Out", novembro:"Nov", dezembro:"Dez" };
  const rawMonth = monthNameMatch?.[1]?.toLowerCase() || "";
  const monthLabel = (ptMonthMap[rawMonth] || rawMonth || file.name.replace(/\.[^.]+$/, "")) + "/" + yearMatch;

  const transactions = [];
  const ptNum = { JAN:"01", FEV:"02", MAR:"03", ABR:"04", MAI:"05", JUN:"06", JUL:"07", AGO:"08", SET:"09", OUT:"10", NOV:"11", DEZ:"12" };

  if (isAilos) {
    const matches = [...fullText.matchAll(/(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+([^R\n]{3,60}?)\s+R\$\s*([\d.]+,\d{2})/gi)];
    for (const m of matches) {
      const amount = parseFloat(m[4].replace(/\./g, "").replace(",", "."));
      const title = m[3].replace(/\s{2,}/g, " ").trim();
      if (!isNaN(amount) && amount > 0 && title.length > 1) {
        transactions.push({ date: `${yearMatch}-${ptNum[m[2].toUpperCase()]||"01"}-${m[1].padStart(2,"0")}`, title, amount, card, month: monthLabel, category: categorize(title) });
      }
    }
  }

  if (isInter) {
    const ptM = { jan:"01", fev:"02", mar:"03", abr:"04", mai:"05", jun:"06", jul:"07", ago:"08", set:"09", out:"10", nov:"11", dez:"12" };
    const matches = [...fullText.matchAll(/(\d{2})\s+de\s+(\w+)\.\s+(\d{4})\s+([^\n]+?)\s+([\d.]+,\d{2})/gi)];
    for (const m of matches) {
      const mon = ptM[m[2].toLowerCase().slice(0, 3)] || "01";
      const amount = parseFloat(m[5].replace(/\./g, "").replace(",", "."));
      const title = m[4].trim().replace(/[-–]\s*$/, "").trim();
      if (!isNaN(amount) && amount > 0 && title.length > 1 && !title.match(/LEANDRO|VENCIMENTO|VALOR/i)) {
        transactions.push({ date: `${m[3]}-${mon}-${m[1].padStart(2,"0")}`, title, amount, card, month: monthLabel, category: categorize(title) });
      }
    }
  }

  return transactions;
}

async function processFile(file) {
  if (file.name.toLowerCase().endsWith(".csv")) {
    const text = await file.text();
    return parseCSV(text, file.name);
  }
  if (file.name.toLowerCase().endsWith(".pdf")) {
    return await parsePDF(file);
  }
  return [];
}

// ─────────────────────────────────────────────
// UPLOAD SCREEN
// ─────────────────────────────────────────────
function UploadScreen({ onLoad }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState("");
  const inputRef = useRef();

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => f.name.endsWith(".csv") || f.name.endsWith(".pdf"));
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))];
    });
  };

  const handleProcess = async () => {
    if (!files.length) return;
    setLoading(true);
    const all = [];
    for (const file of files) {
      setProgress(`Processando ${file.name}…`);
      try {
        const txns = await processFile(file);
        all.push(...txns);
      } catch(e) { console.error(e); }
    }
    setLoading(false);
    setProgress("");
    onLoad(all, files.map(f => f.name));
  };

  const guessCard = (name) => {
    const n = name.toLowerCase();
    if (n.includes("nubank")) return { label: "Nubank", color: "#8c52ff" };
    if (n.includes("inter"))  return { label: "Inter",  color: "#ff6b00" };
    if (n.includes("fatura_") || n.includes("ailos")) return { label: "Ailos", color: "#00a86b" };
    return { label: "PDF/CSV", color: "#64748b" };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #080810; } ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        .drop-zone { transition: all 0.2s; }
        .drop-zone:hover { border-color: #6366f1 !important; background: #0f0f1e !important; }
        .file-row { transition: background 0.1s; }
        .file-row:hover { background: #0f172a !important; }
        .file-row:hover .rm-btn { opacity: 1 !important; }
        .rm-btn { opacity: 0; transition: opacity 0.15s; }
        .cta-btn { transition: all 0.18s; }
        .cta-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(99,102,241,.35) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease both; }
        @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        .pulse { animation: pulse 1.4s ease-in-out infinite; }
      `}</style>

      <div className="fade-up" style={{ width: "100%", maxWidth: 620 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>💳</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, color: "#f1f5f9", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
            Dashboard Financeiro
          </h1>
          <p style={{ color: "#334155", fontSize: 12, margin: 0, letterSpacing: "0.06em" }}>
            ANÁLISE DE GASTOS EM CARTÕES DE CRÉDITO
          </p>
        </div>

        {/* Drop zone */}
        <div className="drop-zone"
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${drag ? "#6366f1" : "#1e293b"}`, borderRadius: 16,
            padding: "36px 24px", textAlign: "center",
            background: drag ? "#0f0f20" : "#0c0c18", cursor: "pointer", marginBottom: 16,
          }}>
          <input ref={inputRef} type="file" multiple accept=".csv,.pdf" style={{ display: "none" }} onChange={e => addFiles(e.target.files)} />
          <div style={{ fontSize: 36, marginBottom: 8 }}>{drag ? "📂" : "⬆️"}</div>
          <div style={{ color: "#cbd5e1", fontSize: 14, marginBottom: 6 }}>
            {drag ? "Solte os arquivos aqui" : "Arraste e solte ou clique para selecionar"}
          </div>
          <div style={{ color: "#334155", fontSize: 11 }}>
            Aceita <span style={{ color: "#818cf8" }}>.CSV (Nubank)</span> · <span style={{ color: "#818cf8" }}>.PDF (Ailos / Inter / outros)</span>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div style={{ background: "#0c0c18", border: "1px solid #0f172a", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #0f172a", fontSize: 9, color: "#334155", letterSpacing: "0.1em" }}>
              {files.length} ARQUIVO{files.length > 1 ? "S" : ""} SELECIONADO{files.length > 1 ? "S" : ""}
            </div>
            {files.map((f, i) => {
              const card = guessCard(f.name);
              return (
                <div key={i} className="file-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: i < files.length - 1 ? "1px solid #0a0a14" : "none", background: "#0c0c18" }}>
                  <span style={{ fontSize: 18 }}>{f.name.endsWith(".pdf") ? "📄" : "📊"}</span>
                  <span style={{ flex: 1, fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                  <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 6, background: card.color + "22", color: card.color, border: `1px solid ${card.color}44`, flexShrink: 0 }}>{card.label}</span>
                  <span style={{ fontSize: 9, color: "#1e293b", flexShrink: 0 }}>{(f.size / 1024).toFixed(0)}KB</span>
                  <button className="rm-btn" onClick={e => { e.stopPropagation(); setFiles(p => p.filter(x => x.name !== f.name)); }}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, padding: "0 2px" }}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Format guide */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { icon: "🟣", label: "Nubank", desc: "Extrato .CSV exportado pelo app Nubank", color: "#8c52ff" },
            { icon: "🟢", label: "Ailos/Viacredi", desc: "Fatura mensal em PDF do cartão Ailos", color: "#00a86b" },
            { icon: "🟠", label: "Banco Inter", desc: "Fatura mensal em PDF do cartão Inter", color: "#ff6b00" },
          ].map(b => (
            <div key={b.label} style={{ background: "#0c0c18", border: `1px solid ${b.color}22`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{b.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: b.color, fontFamily: "'Syne', sans-serif", marginBottom: 3 }}>{b.label}</div>
              <div style={{ fontSize: 9, color: "#334155", lineHeight: 1.5 }}>{b.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button className="cta-btn" onClick={handleProcess} disabled={files.length === 0 || loading}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
            background: files.length > 0 && !loading ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "#0f172a",
            color: files.length > 0 && !loading ? "#fff" : "#1e293b",
            fontSize: 13, fontFamily: "inherit", cursor: files.length > 0 && !loading ? "pointer" : "not-allowed",
            letterSpacing: "0.05em",
          }}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{ width: 13, height: 13, border: "2px solid #ffffff33", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
              <span className="pulse">{progress || "Processando…"}</span>
            </span>
          ) : files.length === 0 ? "Selecione ao menos um arquivo" : `Analisar ${files.length} arquivo${files.length > 1 ? "s" : ""} →`}
        </button>

        <p style={{ textAlign: "center", color: "#0f172a", fontSize: 10, marginTop: 16 }}>
          Processamento 100% local · nenhum dado enviado a servidores externos
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ transactions, fileNames, onReset }) {
  const [activeTab, setActiveTab]           = useState("overview");
  const [selectedCard, setSelectedCard]     = useState("all");
  const [selectedMonth, setSelectedMonth]   = useState("all");
  const [search, setSearch]                 = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy]                 = useState("date");
  const [sortDir, setSortDir]               = useState("desc");

  const cards  = useMemo(() => ["all", ...new Set(transactions.map(t => t.card))], [transactions]);
  const months = useMemo(() => ["all", ...new Set(transactions.map(t => t.month))], [transactions]);
  const allCats = ["all", ...Object.keys(CATEGORY_COLORS)];
  const uniqueCards = useMemo(() => [...new Set(transactions.map(t => t.card))], [transactions]);

  const filtered = useMemo(() => transactions.filter(t => {
    if (selectedCard !== "all" && t.card !== selectedCard) return false;
    if (selectedMonth !== "all" && t.month !== selectedMonth) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    let va = a[sortBy], vb = b[sortBy];
    if (sortBy === "amount") { va = Math.abs(va); vb = Math.abs(vb); }
    if (sortBy === "date")   { va = new Date(va); vb = new Date(vb); }
    return sortDir === "desc" ? (va > vb ? -1 : 1) : (va < vb ? -1 : 1);
  }), [transactions, selectedCard, selectedMonth, categoryFilter, search, sortBy, sortDir]);

  const expenses    = filtered.filter(t => t.amount > 0 && t.category !== "Pagamento" && t.category !== "Encargos/Juros");
  const totalExp    = expenses.reduce((s, t) => s + t.amount, 0);
  const totalCharge = filtered.filter(t => t.category === "Encargos/Juros" && t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalPay    = filtered.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const catBreakdown = useMemo(() => {
    const map = {};
    expenses.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value: +value.toFixed(2) })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const monthlyTrend = useMemo(() => {
    const map = {};
    transactions.filter(t => t.amount > 0 && t.category !== "Pagamento" && t.category !== "Encargos/Juros").forEach(t => {
      if (!map[t.month]) map[t.month] = { month: t.month, total: 0 };
      map[t.month].total += t.amount;
      map[t.month][t.card] = (map[t.month][t.card] || 0) + t.amount;
    });
    return Object.values(map).map(m => ({ ...m, total: +m.total.toFixed(2) }));
  }, [transactions]);

  const topMerchants = useMemo(() => {
    const map = {};
    expenses.forEach(t => {
      const key = t.title.replace(/ - Parcela \d+\/\d+/g, "").trim();
      if (!map[key]) map[key] = { name: key, total: 0, count: 0 };
      map[key].total += t.amount; map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10).map(m => ({ ...m, total: +m.total.toFixed(2) }));
  }, [expenses]);

  const cardStats = useMemo(() => uniqueCards.map(card => {
    const txns = transactions.filter(t => t.card === card && t.amount > 0 && t.category !== "Pagamento" && t.category !== "Encargos/Juros");
    return { card, total: txns.reduce((s, t) => s + t.amount, 0), count: txns.length };
  }), [transactions, uniqueCards]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(field); setSortDir("desc"); }
  };

  const TABS = [
    { id: "overview", label: "📊 Visão Geral" },
    { id: "transactions", label: "📋 Transações" },
    { id: "categories", label: "🗂️ Categorias" },
    { id: "trends", label: "📈 Tendências" },
  ];

  const ttStyle = { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 10, fontFamily: "'DM Mono', monospace" };

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", background: "#080810", minHeight: "100vh", color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; } ::-webkit-scrollbar-track { background: #080810; } ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        .tab-btn { transition: all 0.15s; border: none; cursor: pointer; font-family: inherit; }
        .tab-btn:hover:not(.active-tab) { background: #0f172a !important; color: #94a3b8 !important; }
        .stat-card { transition: transform 0.18s; }
        .stat-card:hover { transform: translateY(-2px); }
        .txn-row:hover { background: #0f172a !important; }
        .txn-row { transition: background 0.08s; }
        .sort-th { cursor: pointer; user-select: none; transition: color 0.1s; }
        .sort-th:hover { color: #818cf8 !important; }
        .cat-card { transition: all 0.15s; cursor: pointer; }
        .cat-card:hover { transform: translateY(-2px); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.3s ease both; }
      `}</style>

      {/* Topbar */}
      <div style={{ background: "#0a0a14", borderBottom: "1px solid #0f172a", padding: "14px 28px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ marginRight: "auto" }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
              💳 Dashboard Financeiro
            </div>
            <div style={{ fontSize: 9, color: "#1e293b", marginTop: 1 }}>{fileNames.join(" · ")} · {transactions.length} transações carregadas</div>
          </div>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`tab-btn${activeTab === tab.id ? " active-tab" : ""}`}
              style={{ padding: "7px 13px", borderRadius: 8, background: activeTab === tab.id ? "#4f46e5" : "transparent", color: activeTab === tab.id ? "#fff" : "#334155", fontSize: 11, letterSpacing: "0.02em" }}>
              {tab.label}
            </button>
          ))}
          <button onClick={onReset} style={{ padding: "7px 13px", borderRadius: 8, border: "1px solid #1e293b", background: "transparent", color: "#334155", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>
            ⬆️ Novos arquivos
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: "#0c0c18", borderBottom: "1px solid #0a0a14", padding: "9px 28px" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Buscar estabelecimento…"
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #1e293b", background: "#0f172a", color: "#e2e8f0", fontSize: 11, fontFamily: "inherit", width: 220 }} />
          {[
            [cards, selectedCard, setSelectedCard, c => c === "all" ? "Todos os cartões" : c],
            [months, selectedMonth, setSelectedMonth, m => m === "all" ? "Todos os meses" : m],
            [allCats, categoryFilter, setCategoryFilter, c => c === "all" ? "Todas as categorias" : c],
          ].map(([opts, val, setter, label], i) => (
            <select key={i} value={val} onChange={e => setter(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #1e293b", background: "#0f172a", color: "#e2e8f0", fontSize: 11, fontFamily: "inherit" }}>
              {opts.map(o => <option key={o} value={o}>{label(o)}</option>)}
            </select>
          ))}
          {(search || selectedCard !== "all" || selectedMonth !== "all" || categoryFilter !== "all") && (
            <button onClick={() => { setSearch(""); setSelectedCard("all"); setSelectedMonth("all"); setCategoryFilter("all"); }}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ef444433", background: "transparent", color: "#ef4444", fontSize: 10, fontFamily: "inherit", cursor: "pointer" }}>
              ✕ Limpar
            </button>
          )}
          <span style={{ marginLeft: "auto", fontSize: 9, color: "#1e293b" }}>{filtered.length} transações</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "22px 28px" }} className="fade-up">

        {/* ─── OVERVIEW ─── */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 18 }}>
              {[
                { l: "Total Gastos",   v: fmt(totalExp),                         s: `${expenses.length} compras`,  c: "#f97316", i: "💸" },
                { l: "Encargos/Juros", v: fmt(totalCharge),                      s: "Juros, IOF, multas",          c: "#ef4444", i: "⚠️" },
                { l: "Pagamentos",     v: fmt(totalPay),                         s: "Créditos recebidos",           c: "#22c55e", i: "✅" },
                { l: "Ticket Médio",   v: fmt(totalExp / (expenses.length || 1)), s: "por transação",              c: "#818cf8", i: "📊" },
              ].map(k => (
                <div key={k.l} className="stat-card" style={{ background: "#0c0c18", border: "1px solid #0f172a", borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{k.i}</div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: k.c, fontFamily: "'Syne', sans-serif" }}>{k.v}</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>{k.l}</div>
                  <div style={{ fontSize: 9, color: "#1e293b", marginTop: 2 }}>{k.s}</div>
                </div>
              ))}
            </div>

            {cardStats.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(cardStats.length, 4)}, 1fr)`, gap: 12, marginBottom: 18 }}>
                {cardStats.map(cs => (
                  <div key={cs.card} className="stat-card"
                    onClick={() => setSelectedCard(cs.card === selectedCard ? "all" : cs.card)}
                    style={{ background: `linear-gradient(135deg, ${CARD_COLORS[cs.card]||"#6366f1"}18, #0c0c18)`, border: `1px solid ${CARD_COLORS[cs.card]||"#6366f1"}33`, borderRadius: 14, padding: "16px 18px", cursor: "pointer" }}>
                    <div style={{ fontSize: 12, color: CARD_COLORS[cs.card]||"#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 6 }}>{cs.card}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", fontFamily: "'Syne', sans-serif" }}>{fmt(cs.total)}</div>
                    <div style={{ fontSize: 9, color: "#334155", marginTop: 4 }}>{cs.count} compras</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div style={{ background: "#0c0c18", border: "1px solid #0f172a", borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9", marginBottom: 14, fontFamily: "'Syne', sans-serif" }}>Gastos por Categoria</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <ResponsiveContainer width="45%" height={200}>
                    <PieChart>
                      <Pie data={catBreakdown.slice(0, 10)} dataKey="value" cx="50%" cy="50%" outerRadius={82} innerRadius={38}>
                        {catBreakdown.slice(0, 10).map(e => <Cell key={e.name} fill={CATEGORY_COLORS[e.name]||"#6b7280"} />)}
                      </Pie>
                      <Tooltip formatter={v => fmt(v)} contentStyle={ttStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1, overflowY: "auto", maxHeight: 200 }}>
                    {catBreakdown.map(c => (
                      <div key={c.name} onClick={() => setCategoryFilter(c.name === categoryFilter ? "all" : c.name)}
                        style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, cursor: "pointer" }}>
                        <div style={{ width: 6, height: 6, borderRadius: 1, background: CATEGORY_COLORS[c.name]||"#6b7280", flexShrink: 0 }} />
                        <span style={{ fontSize: 9, color: c.name === categoryFilter ? "#f1f5f9" : "#475569", flex: 1 }}>{c.name}</span>
                        <span style={{ fontSize: 9, color: "#1e293b" }}>{fmt(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ background: "#0c0c18", border: "1px solid #0f172a", borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9", marginBottom: 14, fontFamily: "'Syne', sans-serif" }}>Top 10 Estabelecimentos</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topMerchants} layout="vertical" margin={{ left: 0, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0a0a14" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 8, fill: "#1e293b" }} tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                    <YAxis type="category" dataKey="name" width={115} tick={{ fontSize: 8, fill: "#475569" }} />
                    <Tooltip formatter={v => fmt(v)} contentStyle={ttStyle} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {topMerchants.map((_, i) => <Cell key={i} fill={`hsl(${205+i*16},65%,${54-i*2}%)`} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: "#0c0c18", border: "1px solid #0f172a", borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9", marginBottom: 12, fontFamily: "'Syne', sans-serif" }}>Últimas 20 Transações</div>
              {filtered.slice(0, 20).map((t, i) => (
                <div key={i} className="txn-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 6, borderBottom: "1px solid #0c0c18" }}>
                  <div style={{ width: 6, height: 6, borderRadius: 1, background: CATEGORY_COLORS[t.category]||"#6b7280", flexShrink: 0 }} />
                  <div style={{ fontSize: 9, color: "#1e293b", width: 78, flexShrink: 0 }}>{t.date}</div>
                  <div style={{ flex: 1, fontSize: 11, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  <div style={{ fontSize: 9, color: CARD_COLORS[t.card]||"#64748b", width: 48, flexShrink: 0 }}>{t.card}</div>
                  <div style={{ fontSize: 9, color: "#1e293b", width: 110, flexShrink: 0, textAlign: "right" }}>{t.category}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: t.amount < 0 ? "#22c55e" : "#f1f5f9", width: 100, textAlign: "right", flexShrink: 0 }}>
                    {t.amount < 0 ? "+" : ""}{fmt(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TRANSACTIONS ─── */}
        {activeTab === "transactions" && (
          <div style={{ background: "#0c0c18", border: "1px solid #0f172a", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "88px 76px 1fr 98px 148px 108px", padding: "10px 16px", borderBottom: "2px solid #0f172a", fontSize: 9, color: "#1e293b", letterSpacing: "0.1em" }}>
              {[["date","DATA"],["card","CARTÃO"],["title","DESCRIÇÃO"],[null,"MÊS"],["category","CATEGORIA"],["amount","VALOR"]].map(([f,l]) => (
                <div key={l} className={f?"sort-th":""} onClick={() => f && toggleSort(f)}
                  style={{ display: "flex", alignItems: "center", gap: 3, color: f && sortBy === f ? "#818cf8" : "#1e293b" }}>
                  {l}{f && sortBy === f && <span style={{ fontSize: 11 }}>{sortDir==="desc"?"↓":"↑"}</span>}
                </div>
              ))}
            </div>
            <div style={{ maxHeight: 640, overflowY: "auto" }}>
              {filtered.map((t, i) => (
                <div key={i} className="txn-row" style={{ display: "grid", gridTemplateColumns: "88px 76px 1fr 98px 148px 108px", padding: "9px 16px", borderBottom: "1px solid #080810", background: i%2===0?"#0c0c18":"#0e0e18", alignItems: "center" }}>
                  <div style={{ fontSize: 9, color: "#1e293b" }}>{t.date}</div>
                  <div style={{ fontSize: 10, color: CARD_COLORS[t.card]||"#64748b", fontWeight: 500 }}>{t.card}</div>
                  <div style={{ fontSize: 11, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{t.title}</div>
                  <div style={{ fontSize: 9, color: "#1e293b" }}>{t.month}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: 1, background: CATEGORY_COLORS[t.category]||"#6b7280", flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.category}</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, textAlign: "right", color: t.amount<0?"#22c55e":t.category==="Encargos/Juros"?"#ef4444":"#f1f5f9" }}>
                    {t.amount<0?"+":""}{fmt(t.amount)}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#1e293b", fontSize: 12 }}>Nenhuma transação encontrada</div>}
            </div>
            <div style={{ padding: "10px 16px", background: "#0e0e18", borderTop: "1px solid #0f172a", display: "flex", justifyContent: "space-between", fontSize: 10 }}>
              <span style={{ color: "#1e293b" }}>{filtered.length} transações</span>
              <span style={{ color: "#f1f5f9", fontWeight: 600 }}>Total débitos: {fmt(filtered.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0))}</span>
            </div>
          </div>
        )}

        {/* ─── CATEGORIES ─── */}
        {activeTab === "categories" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {catBreakdown.map(cat => {
              const catTxns = expenses.filter(t => t.category === cat.name);
              const pct = ((cat.value / totalExp) * 100).toFixed(1);
              const color = CATEGORY_COLORS[cat.name] || "#6b7280";
              return (
                <div key={cat.name} className="cat-card stat-card"
                  style={{ background: "#0c0c18", border: `1px solid ${color}22`, borderRadius: 14, padding: 18 }}
                  onClick={() => { setCategoryFilter(cat.name); setActiveTab("transactions"); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9", fontFamily: "'Syne', sans-serif" }}>{cat.name}</span>
                      </div>
                      <div style={{ fontSize: 9, color: "#1e293b" }}>{catTxns.length} transações</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'Syne', sans-serif" }}>{fmt(cat.value)}</div>
                      <div style={{ fontSize: 9, color: "#1e293b" }}>{pct}% do total</div>
                    </div>
                  </div>
                  <div style={{ background: "#0f172a", borderRadius: 3, height: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
                  </div>
                  <div style={{ marginTop: 10, fontSize: 9, color: "#1e293b" }}>
                    Maior: {catTxns.sort((a,b)=>b.amount-a.amount)[0]?.title.slice(0,32)||"—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── TRENDS ─── */}
        {activeTab === "trends" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#0c0c18", border: "1px solid #0f172a", borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9", marginBottom: 14, fontFamily: "'Syne', sans-serif" }}>Gastos por Cartão / Mês</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0a0a14" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#1e293b" }} />
                  <YAxis tick={{ fontSize: 9, fill: "#1e293b" }} tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={ttStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {uniqueCards.map(c => <Bar key={c} dataKey={c} fill={CARD_COLORS[c]||"#818cf8"} radius={[3,3,0,0]} />)}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "#0c0c18", border: "1px solid #0f172a", borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9", marginBottom: 14, fontFamily: "'Syne', sans-serif" }}>Evolução Total</div>
              <ResponsiveContainer width="100%" height={170}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0a0a14" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#1e293b" }} />
                  <YAxis tick={{ fontSize: 9, fill: "#1e293b" }} tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={ttStyle} />
                  <Line type="monotone" dataKey="total" stroke="#818cf8" strokeWidth={2} dot={{ fill: "#818cf8", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "#0c0c18", border: "1px solid #0f172a", borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9", marginBottom: 14, fontFamily: "'Syne', sans-serif" }}>Ranking de Categorias</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={catBreakdown.slice(0, 12)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0a0a14" />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#1e293b" }} angle={-25} textAnchor="end" height={46} />
                  <YAxis tick={{ fontSize: 9, fill: "#1e293b" }} tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={ttStyle} />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {catBreakdown.slice(0,12).map(e => <Cell key={e.name} fill={CATEGORY_COLORS[e.name]||"#6b7280"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {transactions.filter(t => t.category === "Encargos/Juros" && t.amount > 0).length > 0 && (
              <div style={{ background: "#0c0c18", border: "1px solid #ef444422", borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#ef4444", marginBottom: 14, fontFamily: "'Syne', sans-serif" }}>⚠️ Encargos e Juros Detectados</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 14 }}>
                  {transactions.filter(t => t.category === "Encargos/Juros" && t.amount > 0).map((t, i) => (
                    <div key={i} style={{ background: "#0f172a", borderRadius: 10, padding: "10px 14px", borderLeft: "3px solid #ef4444" }}>
                      <div style={{ fontSize: 9, color: "#334155", marginBottom: 3 }}>{t.date} · {t.card}</div>
                      <div style={{ fontSize: 10, color: "#e2e8f0", marginBottom: 5 }}>{t.title}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>{fmt(t.amount)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "10px 14px", background: "#ef444410", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#ef4444" }}>Total desperdiçado em encargos</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#ef4444", fontFamily: "'Syne', sans-serif" }}>
                    {fmt(transactions.filter(t => t.category === "Encargos/Juros" && t.amount > 0).reduce((s, t) => s + t.amount, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────
export default function App() {
  const [transactions, setTransactions] = useState(null);
  const [fileNames, setFileNames]       = useState([]);

  if (!transactions) {
    return <UploadScreen onLoad={(txns, names) => { setTransactions(txns); setFileNames(names); }} />;
  }
  return <Dashboard transactions={transactions} fileNames={fileNames} onReset={() => { setTransactions(null); setFileNames([]); }} />;
}
