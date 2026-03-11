/* ═══════════════════════════════════════════════
   CONSTANTS.JS — desestruturações globais + constantes
   ═══════════════════════════════════════════════ */

// Desestruturação global de React com var (compatível com Babel standalone —
// var pode ser re-declarado entre scripts sem SyntaxError)
var useState    = React.useState;
var useEffect   = React.useEffect;
var useMemo     = React.useMemo;
var useRef      = React.useRef;
var useCallback = React.useCallback;

const CAT_COLORS = {
  "Supermercado":"#22c55e","Gastronomia":"#f97316","Delivery":"#f43f5e",
  "Transporte":"#3b82f6","Tecnologia/Assinaturas":"#8b5cf6",
  "Compras Online":"#06b6d4","Gasolina":"#eab308",
  "Saúde":"#ec4899","Padaria/Alimentação":"#a78bfa","Academia/Saúde":"#14b8a6",
  "Cafés/Pequenos":"#fb923c","Conveniência":"#c026d3","Parcelamentos":"#64748b",
  "Encargos/Juros":"#ef4444","Estacionamento":"#94a3b8",
  "Presentes/Bazar":"#f43f5e","Educação":"#0ea5e9","Telecomunicações":"#38bdf8",
  "Seguros":"#d97706","Outros":"#6b7280",
};

const CARD_COLORS = { Nubank:"#8c52ff", Ailos:"#00a86b", Inter:"#ff6b00" };

const PERSON_COLORS = ["#6366f1","#f43f5e","#f97316","#10b981","#06b6d4","#8b5cf6","#eab308","#ec4899"];

const CAT_GROUPS = [
  { label:"🍽️ Alimentação", cats:["Supermercado","Gastronomia","Delivery","Padaria/Alimentação","Cafés/Pequenos","Conveniência"] },
  { label:"🚗 Transporte",   cats:["Transporte","Gasolina","Estacionamento"] },
  { label:"🏥 Saúde",        cats:["Saúde","Academia/Saúde"] },
  { label:"💻 Digital",      cats:["Tecnologia/Assinaturas","Compras Online"] },
];

const PT_MO_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const EXCLUDED_TITLES = [
  "pagamento recebido","pagamento efetuado","crédito em rotativo",
  "credito em rotativo","saldo em rotativo","crédito rotativo",
  "credito rotativo","saldo em atraso","estorno","reembolso",
  "cashback","devolução","devolucao",
];
