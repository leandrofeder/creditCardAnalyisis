/* ═══════════════════════════════════════════════
   PARSERS.JS — categorize, parseCSV, parsePDF, processFile
   ═══════════════════════════════════════════════ */

// ─── CATEGORIZER ──────────────────────────────
function categorize(title) {
  const t = title.toLowerCase();
  if(t.includes("uber")||t.includes("99app")||t.includes("*99")) return "Transporte";
  if(t.includes("fitland")||t.includes("koch")||t.includes("supermercado")||t.includes("rede top")||t.includes("sams club")||t.includes("hipermercado")||t.includes("cooper")||t.includes("mercado garcia")||t.includes("cs koch")||t.includes("atacadao")||t.includes("carrefour")) return "Supermercado";
  if(t.includes("farmacia")||t.includes("saude")||t.includes("otica")||t.includes("medic")||t.includes("drogasil")) return "Saúde";
  if(t.includes("academia")||t.includes("smartfit")||t.includes("bluefit")) return "Academia/Saúde";
  if(t.includes("apple")||t.includes("microsoft")||t.includes("canva")||t.includes("hostgator")||t.includes("applecombill")||t.includes("netflix")||t.includes("spotify")||t.includes("amazon prime")||t.includes("youtube")||t.includes("chatgpt")||t.includes("openai")||t.includes("dropbox")||t.includes("adobe")||t.includes("icloud")||t.includes("amazonprimebr")) return "Tecnologia/Assinaturas";
  if(t.includes("amazon")||t.includes("shopee")||t.includes("mercadolivre")||t.includes("magazine")) return "Compras Online";
  if(t.includes("posto")||t.includes("combustivel")||t.includes("gasolina")||t.includes("shell")||t.includes("ipiranga")||t.includes("petrob")) return "Gasolina";
  if(t.includes("restaurante")||t.includes("lanchonete")||t.includes("pizz")||t.includes("burger")||t.includes("sushi")||t.includes("churrascaria")||t.includes("bar ")||t.includes("grill")) return "Gastronomia";
  if(t.includes("ifood")||t.includes("rappi")||t.includes("delivery")||t.includes("uber eats")) return "Delivery";
  if(t.includes("padaria")||t.includes("confeitaria")||t.includes("pao ")||t.includes("bakery")) return "Padaria/Alimentação";
  if(t.includes("cafe")||t.includes("café")||t.includes("coffee")||t.includes("starbucks")) return "Cafés/Pequenos";
  if(t.includes("conveniencia")||t.includes("loja conv")||t.includes("am pm")||t.includes("am/pm")||t.includes("shell select")||t.includes("br mania")||t.includes("extra")) return "Conveniência";
  if(t.includes("pagamento recebido")||t.includes("pagamento efetuado")) return "Pagamento";
  if(t.includes("parcela")||t.includes("siapi")||t.includes("panasonic")||t.includes("prata fina")||t.includes("isabela")||t.includes("s v comercio")) return "Parcelamentos";
  if(t.includes("juros")||t.includes("multa")||t.includes("iof")||t.includes("saldo em")||t.includes("rotativo")||t.includes("mora")) return "Encargos/Juros";
  if(t.includes("estacionamento")||t.includes("estapar")||t.includes("blumenau norte shoppin")||t.includes("parking")) return "Estacionamento";
  if(t.includes("bazar")||t.includes("reuter")||t.includes("tecnofesta")||t.includes("milium")||t.includes("cacau")||t.includes("oboticario")) return "Presentes/Bazar";
  if(t.includes("leiturinha")||t.includes("escola")||t.includes("universidade")||t.includes("curso")) return "Educação";
  if(t.includes("vivo")||t.includes("intercel")||t.includes("rcga")||t.includes("claro")||t.includes("tim ")||t.includes("oi ")) return "Telecomunicações";
  if(t.includes("allianz")||t.includes("seguro")||t.includes("bradesco seguros")) return "Seguros";
  return "Outros";
}

// ─── CSV PARSER ───────────────────────────────
function parseCSV(text, filename, personName) {
  const lines = text.trim().split(/\r?\n/).slice(1);
  const m = filename.match(/(\d{4}-\d{2})/);
  const label = m
    ? `${PT_MO_SHORT[parseInt(m[1].slice(5, 7), 10) - 1]}/${m[1].slice(0, 4)}`
    : filename.replace(/\.[^.]+$/, "");
  return lines.map(line => {
    const parts=[]; let cur="",inQ=false;
    for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){inQ=!inQ;}else if(ch===','&&!inQ){parts.push(cur);cur="";}else{cur+=ch;}}
    parts.push(cur);
    if(parts.length<3) return null;
    const date=parts[0].trim();
    const rawAmount = parseFloat(parts[parts.length-1].trim().replace(",","."));
    const amount = -(rawAmount);
    const title=parts.slice(1,parts.length-1).join(",").trim().replace(/^"|"$/g,"");
    if(!date||isNaN(amount)) return null;
    const year=date.split("-")[0]||new Date().getFullYear().toString();
    return {date,title,amount,card:"Nubank",month:label,year,category:categorize(title),person:personName};
  }).filter(Boolean);
}

// ─── PDF LOADER ───────────────────────────────
async function loadPdfJs() {
  if(window.pdfjsLib) return;
  await new Promise((res,rej)=>{
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload=res; s.onerror=rej; document.head.appendChild(s);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

// ─── PDF PARSER ───────────────────────────────
async function parsePDF(file, personName) {
  await loadPdfJs();
  const buf=await file.arrayBuffer();
  const pdf=await window.pdfjsLib.getDocument({data:buf}).promise;
  let text="";
  for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p);const content=await page.getTextContent();text+=content.items.map(i=>i.str).join(" ")+"\n";}
  const fname=file.name.toLowerCase();
  const isAilos=fname.includes("fatura_")||text.includes("AILOS")||text.includes("VIACREDI");
  const isInter=fname.includes("inter")||text.includes("Banco Inter")||text.includes("bancointer");
  const card=isAilos?"Ailos":isInter?"Inter":"PDF";
  const yearMatch=text.match(/20\d{2}/);
  const year=yearMatch?.[0]||new Date().getFullYear().toString();
  const mMatch=text.match(/fatura de (\w+)/i);
  const ptMap={janeiro:"Jan",fevereiro:"Fev",março:"Mar",marco:"Mar",abril:"Abr",maio:"Mai",junho:"Jun",julho:"Jul",agosto:"Ago",setembro:"Set",outubro:"Out",novembro:"Nov",dezembro:"Dez"};
  const rawM=mMatch?.[1]?.toLowerCase()||"";
  const isYearOnly=/^\d+$/.test(rawM);
  const fileBase=file.name.replace(/\.[^.]+$/,"").replace(/^\d{4}$/,"arquivo");
  const monthPart=ptMap[rawM]||(!isYearOnly?rawM:null)||fileBase;
  const monthLabel=normalizeMonthLabel(`${monthPart}/${year}`);
  const txns=[];
  const ptNum={JAN:"01",FEV:"02",MAR:"03",ABR:"04",MAI:"05",JUN:"06",JUL:"07",AGO:"08",SET:"09",OUT:"10",NOV:"11",DEZ:"12"};

  if(isAilos){
    const yearForMonth = (monAbbr) => {
      const pattern = new RegExp(monAbbr + '[\\s\\S]{0,60}?(20\\d{2})', 'i');
      const m = text.match(pattern);
      return m ? m[1] : year;
    };

    const movMatches = [...text.matchAll(
      /(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+([^\n]{3,80}?)\s+(-?)R\$\s*([\d.]+,\d{2})/gi
    )];
    for(const m of movMatches){
      const negative = m[4] === '-';
      if(negative) continue;
      const amount = parseFloat(m[5].replace(/\./g,"").replace(",","."));
      const title  = m[3].replace(/\s{2,}/g," ").trim();
      if(!isNaN(amount) && amount > 0 && title.length > 1
         && !title.match(/^(DATA|DESCRI|CIDADE|TOTAL|SALDO|LEANDRO|PÁGINA|Página|REF\s)/i)){
        const mon = ptNum[m[2].toUpperCase()] || "01";
        const txYear = yearForMonth(m[2].toUpperCase());
        txns.push({
          date:`${txYear}-${mon}-${m[1].padStart(2,"0")}`,
          title, amount, card, month:monthLabel, year:txYear,
          category:categorize(title), person:personName
        });
      }
    }

    const compraMatches = [...text.matchAll(
      /(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+([^\n]{3,80}?)\s{2,}([A-ZÁÉÍÓÚÃÕ][A-ZÁÉÍÓÚÃÕ ]{1,25}?)\s+R\$\s*([\d.]+,\d{2})/g
    )];
    for(const m of compraMatches){
      const amount = parseFloat(m[5].replace(/\./g,"").replace(",","."));
      const title  = m[3].replace(/\s{2,}/g," ").trim();
      if(!isNaN(amount) && amount > 0 && title.length > 1
         && !title.match(/^(DATA|DESCRI|CIDADE|TOTAL|SALDO|LEANDRO|PÁGINA|Página|REF\s)/i)){
        const mon = ptNum[m[2].toUpperCase()] || "01";
        const txYear = yearForMonth(m[2].toUpperCase());
        const key = `${txYear}-${mon}-${m[1].padStart(2,"0")}|${title}|${amount}`;
        if(!txns.some(t => `${t.date}|${t.title}|${t.amount}` === key)){
          txns.push({
            date:`${txYear}-${mon}-${m[1].padStart(2,"0")}`,
            title, amount, card, month:monthLabel, year:txYear,
            category:categorize(title), person:personName
          });
        }
      }
    }
  }

  if(isInter){
    const ptM={jan:"01",fev:"02",mar:"03",abr:"04",mai:"05",jun:"06",jul:"07",ago:"08",set:"09",out:"10",nov:"11",dez:"12"};
    const matches=[...text.matchAll(/(\d{2})\s+de\s+(\w+)\.\s+(\d{4})\s+([^\n]+?)\s+([\d.]+,\d{2})/gi)];
    for(const m of matches){const mon=ptM[m[2].toLowerCase().slice(0,3)]||"01";const amount=parseFloat(m[5].replace(/\./g,"").replace(",","."));const title=m[4].trim().replace(/[-–]\s*$/,"").trim();if(!isNaN(amount)&&amount>0&&title.length>1&&!title.match(/LEANDRO|VENCIMENTO|VALOR/i))txns.push({date:`${m[3]}-${mon}-${m[1].padStart(2,"0")}`,title,amount,card,month:monthLabel,year:m[3],category:categorize(title),person:personName});}
  }
  return txns;
}

// ─── EXCLUSION CHECK ──────────────────────────
function isExcludedTransaction(t) {
  if (t.amount <= 0) return true;
  const tl = t.title.toLowerCase();
  return EXCLUDED_TITLES.some(ex => tl.includes(ex));
}

// ─── PROCESS FILE ─────────────────────────────
async function processFile(file, personName) {
  let txns = [];
  if(file.name.toLowerCase().endsWith(".csv")){
    const text = await file.text();
    txns = parseCSV(text, file.name, personName);
  } else if(file.name.toLowerCase().endsWith(".pdf")) {
    txns = await parsePDF(file, personName);
  }
  return txns.filter(t => !isExcludedTransaction(t));
}
