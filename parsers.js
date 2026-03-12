// filepath: c:\PROJETOS\creditCardAnalysis\creditCardAnalyisis\parsers.js
/* 
   PARSERS.JS  categorize, parseCSV, parsePDF, processFile
    */

//  CATEGORIZER
// Nomes de categoria devem ser IDÊNTICOS aos de CAT_COLORS / CAT_GROUPS em constants.js
function categorize(title) {
  const t = title.toLowerCase();
  if(t.includes("uber")||t.includes("99app")||t.includes("*99")||t.includes("pop ")) return "Transporte";
  if(t.includes("fitland")||t.includes("viva mais prodtos natur")||t.includes("cappta *mega mais d")||t.includes("koch")||t.includes("supermercado")||t.includes("rede top")||t.includes("comercial ruediger")||t.includes("sams club")||t.includes("superferreira")||t.includes("hipermercado")||t.includes("cooper")||t.includes("mercado garcia")||t.includes("cs koch")||t.includes("atacadao")||t.includes("carrefour")) return "Supermercado";
  if(t.includes("farmacia")||t.includes("saude")||t.includes("otica")||t.includes("medic")||t.includes("drogasil")) return "Saúde";
  if(t.includes("academia")||t.includes("smartfit")||t.includes("bluefit")) return "Academia/Saúde";
  if(t.includes("apple")||t.includes("microsoft")||t.includes("canva")||t.includes("hostgator")||t.includes("applecombill")||t.includes("netflix")||t.includes("spotify")||t.includes("amazon prime")||t.includes("youtube")||t.includes("chatgpt")||t.includes("openai")||t.includes("dropbox")||t.includes("adobe")||t.includes("icloud")||t.includes("amazonprimebr")) return "Tecnologia/Assinaturas";
  if(t.includes("amazon")||t.includes("shopee")||t.includes("mercadolivre")||t.includes("magazine")) return "Compras Online";
  if(t.includes("posto")||t.includes("transportes edemar")||t.includes("combustivel")||t.includes("gasolina")||t.includes("shell")||t.includes("ipiranga")||t.includes("petrob")||t.includes("martini comercio de")) return "Gasolina";
  if(t.includes("restaurante")||t.includes("polacoalimentacao")||t.includes("napoli sorveteria")||t.includes("capitao dog")||t.includes("alemaobatata")||t.includes("boli bowl")||t.includes("hotel sesc blumenau")||t.includes("kalzone")||t.includes("toscana")||t.includes("divino fogao")||t.includes("the best acai")||t.includes("acai da barra")||t.includes("foodbech")||t.includes("hipermercado")||t.includes("lanchonete")||t.includes("pizz")||t.includes("burger")||t.includes("sushi")||t.includes("churrascaria")||t.includes("bar ")||t.includes("grill")||t.includes("aromata")||t.includes("alemaobatata blumenau")) return "Gastronomia";
  if(t.includes("ifood")||t.includes("rappi")||t.includes("delivery")||t.includes("deliv")||t.includes("uber eats")||t.includes("ifd")) return "Delivery";
  if(t.includes("padaria")||t.includes("confeitaria")||t.includes("pao ")||t.includes("bakery")||t.includes("papicori")||t.includes("flsbrunch")||t.includes("panificadora")||t.includes("portus")) return "Padaria/Alimentação";
  if(t.includes("cafe")||t.includes("café")||t.includes("coffee")||t.includes("starbucks")||t.includes("aromapress maquinas")) return "Cafés/Pequenos";
  if(t.includes("conveniencia")||t.includes("loja conv")||t.includes("am pm")||t.includes("am/pm")||t.includes("shell select")||t.includes("br mania")||t.includes("extra")||t.includes("baitah")||t.includes("54656637adan")) return "Conveniência";
  if(t.includes("pagamento recebido")||t.includes("pagamento efetuado")) return "Pagamento";
  if(t.includes("parcela")||t.includes("siapi")||t.includes("panasonic")||t.includes("prata fina")||t.includes("isabela")||t.includes("s v comercio")) return "Parcelamentos";
  if(t.includes("juros")||t.includes("multa")||t.includes("iof")||t.includes("saldo em")||t.includes("rotativo")||t.includes("mora")) return "Encargos/Juros";
  if(t.includes("estacionamento")||t.includes("cloudpark")||t.includes("estapar")||t.includes("blumenau norte shoppin")||t.includes("parking")||t.includes("cs park")) return "Estacionamento";
  if(t.includes("bazar")||t.includes("reuter")||t.includes("tecnofesta")||t.includes("milium")||t.includes("cacau")||t.includes("oboticario")||t.includes("havan")||t.includes("floricultura")) return "Presentes/Bazar";
  if(t.includes("leiturinha")||t.includes("escola")||t.includes("universidade")||t.includes("curso")) return "Educação";
  if(t.includes("vivo")||t.includes("intercel")||t.includes("rcga")||t.includes("claro")||t.includes("tim ")||t.includes("oi ")) return "Telecomunicações";  if(t.includes("allianz")||t.includes("seguro")||t.includes("bradesco seguros")) return "Seguros";
  if(t.includes("salao")||t.includes("braun")||t.includes("barbearia")||t.includes("salão")||t.includes("barbearia")||t.includes("barbeiro")||t.includes("cabeleireiro")||t.includes("cabeleireira")||t.includes("beleza")||t.includes("estetica")||t.includes("estética")||t.includes("manicure")||t.includes("pedicure")||t.includes("sobrancelha")||t.includes("depilacao")||t.includes("depilação")||t.includes("spa ")||t.includes("nail ")||t.includes("nails")||t.includes("cosmetico")||t.includes("cosmeticos")||t.includes("beauty")||t.includes("studio hair")||t.includes("hair ")) return "Beleza";
  if(t.includes("pet")||t.includes("veterinario")||t.includes("veterinária")||t.includes("veterinario")||t.includes("veterinário")||t.includes("petshop")||t.includes("pet shop")||t.includes("racao")||t.includes("ração")||t.includes("agro")||t.includes("clinica vet")||t.includes("animal")||t.includes("canil")||t.includes("cobasi")) return "Pet";
  return "Outros";
}

//  CSV PARSER (Nubank) 
function parseCSV(text, filename, personName) {
  const lines = text.trim().split(/\r?\n/).slice(1);
  return lines.map(line => {
    const parts = []; let cur = "", inQ = false;
    for(let i = 0; i < line.length; i++) {
      const ch = line[i];
      if(ch === '"') { inQ = !inQ; }
      else if(ch === ',' && !inQ) { parts.push(cur); cur = ""; }
      else { cur += ch; }
    }
    parts.push(cur);
    if(parts.length < 3) return null;
    const date      = parts[0].trim();
    const rawAmount = parseFloat(parts[parts.length-1].trim().replace(",","."));
    const amount    = rawAmount; // Nubank: gastos=positivo, pagamentos=negativo
    const title     = parts.slice(1, parts.length-1).join(",").trim().replace(/^"|"$/g,"");
    if(!date || isNaN(amount)) return null;
    // Deriva mes/ano da data da transacao "2025-12-10" -> "Dez/2025"
    const dp    = date.split("-");
    const yr    = dp[0] || String(new Date().getFullYear());
    const monI  = parseInt(dp[1] || "1", 10) - 1;
    const month = (PT_MO_SHORT[monI] || "???") + "/" + yr;
    return { date, title, amount, card:"Nubank", month, year:yr, category:categorize(title), person:personName };
  }).filter(Boolean);
}

//  PDF.JS LOADER 
async function loadPdfJs() {
  if(window.pdfjsLib) return;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

//  PDF: agrupa itens por coordenada Y em linhas 
function pdfItemsToLines(items) {
  const rows = [];
  for(const item of items) {
    if(!item.str || !item.str.trim()) continue;
    const y = Math.round(item.transform[5]);
    let row = rows.find(r => Math.abs(r.y - y) <= 3);
    if(!row) { row = {y, parts:[]}; rows.push(row); }
    row.parts.push({ x: item.transform[4], str: item.str });
  }
  rows.sort((a, b) => b.y - a.y); // PDF: Y cresce de baixo p/ cima, invertemos
  return rows.map(r => {
    r.parts.sort((a, b) => a.x - b.x);
    return r.parts.map(p => p.str).join("  ");
  });
}

//  PDF PARSER 
async function parsePDF(file, personName) {
  await loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({data: buf}).promise;

  let text  = "";
  let lines = [];
  for(let p = 1; p <= pdf.numPages; p++) {
    const page    = await pdf.getPage(p);
    const content = await page.getTextContent();
    lines = lines.concat(pdfItemsToLines(content.items));
    text += content.items.map(i => i.str).join(" ") + " ";
  }

  const fname   = file.name.toLowerCase();
  const isAilos = fname.includes("fatura_") || text.includes("AILOS") || text.includes("VIACREDI");
  const isInter = fname.includes("inter")   || text.includes("Banco Inter") || text.includes("bancointer");
  const card    = isAilos ? "Ailos" : isInter ? "Inter" : "PDF";

  const txns  = [];
  const ptNum = {JAN:"01",FEV:"02",MAR:"03",ABR:"04",MAI:"05",JUN:"06",JUL:"07",AGO:"08",SET:"09",OUT:"10",NOV:"11",DEZ:"12"};

  // 
  // AILOS
  // 
  if(isAilos) {
    const yearMatch = text.match(/20\d{2}/);
    const year      = yearMatch ? yearMatch[0] : String(new Date().getFullYear());

    // Mes da fatura
    const ptMap  = {janeiro:"Jan",fevereiro:"Fev","marco":"Mar",marco:"Mar",abril:"Abr",maio:"Mai",junho:"Jun",julho:"Jul",agosto:"Ago",setembro:"Set",outubro:"Out",novembro:"Nov",dezembro:"Dez"};
    const mMatch = text.match(/fatura de (\w+)/i);
    const rawM   = mMatch && mMatch[1] ? mMatch[1].toLowerCase() : "";
    const vcMatch= text.match(/(?:vencimento|fechamento|validade)[^\d]*(\d{2})\/(\d{2})\/(\d{4})/i);
    var monthLabel;
    if(ptMap[rawM]) {
      monthLabel = ptMap[rawM] + "/" + year;
    } else if(vcMatch) {
      monthLabel = (PT_MO_SHORT[parseInt(vcMatch[2],10)-1] || "???") + "/" + vcMatch[3];
    } else {
      const dtMatch = text.match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/);
      monthLabel = dtMatch
        ? (PT_MO_SHORT[parseInt(dtMatch[2],10)-1] || "???") + "/" + dtMatch[3]
        : "???/" + year;
    }

    const yearForMonth = function(mon) {
      const m = text.match(new RegExp(mon + "[\\s\\S]{0,60}?(20\\d{2})", "i"));
      return m ? m[1] : year;
    };

    const movIdx = (function() {
      var i = text.search(/MOVIMENTA[\S\s]{0,6}DA\s+CONTA/i);
      if(i < 0) i = text.search(/LAN[\S\s]{0,8}MENTOS\s*[-\u2013]\s*AILOS/i);
      if(i < 0) i = text.search(/SALDO\s+ANTERIOR/i);
      return i;
    })();
    const dataDescrIdx = text.search(/DATA\s+DESCRI/i);
    const allTotalDE   = Array.from(text.matchAll(/TOTAL\s+DE\s+\w/gi));
    const totalDeIdx   = allTotalDE.length ? allTotalDE[allTotalDE.length-1].index : text.length;

    console.log("[Ailos] movIdx="+movIdx+" dataDescrIdx="+dataDescrIdx+" totalDeIdx="+totalDeIdx+" month="+monthLabel);

    // 1. MOVIMENTACOES (encargos/juros)
    if(movIdx >= 0 && dataDescrIdx > movIdx) {
      const movText = text.slice(movIdx, dataDescrIdx);
      const movRx   = /(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.+?)\s+(-?)R\$\s*([\d.]+,\d{2})/gi;
      const entries = [];
      for(const m of movText.matchAll(movRx)) {
        const neg   = m[4] === "-";
        const amt   = parseFloat(m[5].replace(/\./g,"").replace(",","."));
        const title = m[3].replace(/\s{2,}/g," ").trim();
        if(/^(SALDO\s+ANTERIOR|MOVIMENTA|PAGTO|PAGAMENTO)/i.test(title)) continue;
        entries.push({day:m[1], mon:m[2].toUpperCase(), title, amt, neg});
      }
      const bkt = {};
      for(const e of entries) if(!e.neg) bkt[e.amt.toFixed(2)] = (bkt[e.amt.toFixed(2)] || 0) + 1;
      for(const e of entries) if(e.neg && (bkt[e.amt.toFixed(2)] || 0) > 0) bkt[e.amt.toFixed(2)]--;
      for(const e of entries) {
        if(e.neg) continue;
        const k = e.amt.toFixed(2);
        if((bkt[k] || 0) > 0) {
          bkt[k]--;
          const txYear = yearForMonth(e.mon);
          const mon    = ptNum[e.mon] || "01";
          txns.push({date:txYear+"-"+mon+"-"+e.day.padStart(2,"0"), title:e.title, amount:e.amt, card, month:monthLabel, year:txYear, category:categorize(e.title), person:personName});
        }
      }
    }

    // Saldo residual
    {
      const slice   = (movIdx >= 0 && dataDescrIdx > movIdx) ? text.slice(movIdx, dataDescrIdx) : text.slice(0, dataDescrIdx >= 0 ? dataDescrIdx : text.length);
      const saldoM  = slice.match(/SALDO\s+ANTERIOR\s+R\$\s*([\d.]+,\d{2})/i);
      var residual  = null;
      if(saldoM) {
        const ant = parseFloat(saldoM[1].replace(/\./g,"").replace(",","."));
        var pagto = 0;
        const rx2 = /(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.+?)\s+(-?)R\$\s*([\d.]+,\d{2})/gi;
        for(const m of slice.matchAll(rx2)) {
          if(m[4] === "-" && /^(PAGTO|PAGAMENTO)/i.test(m[3].trim()))
            pagto += parseFloat(m[5].replace(/\./g,"").replace(",","."));
        }
        const r = Math.round((ant - pagto) * 100) / 100;
        if(r > 0.009) residual = r;
      }
      if(!residual) {
        const rA = text.match(/([\d.]+,\d{2})\s+FATURA\s+ANTERIOR/i);
        const rP = text.match(/[-\u2013]\s*([\d.]+,\d{2})\s+PAGAMENTOS?\s+RECEBIDOS/i);
        const rE = text.match(/[+]\s*([\d.]+,\d{2})\s+ENCARGOS/i);
        if(rA && rP) {
          const ant = parseFloat(rA[1].replace(/\./g,"").replace(",","."));
          const pag = parseFloat(rP[1].replace(/\./g,"").replace(",","."));
          const enc = rE ? parseFloat(rE[1].replace(/\./g,"").replace(",",".")) : 0;
          const r   = Math.round((ant - pag - enc) * 100) / 100;
          if(r > 0.009) residual = r;
        }
      }
      console.log("[Ailos] saldoResidual=" + residual);
      if(residual) {
        const cm = text.match(/FECHAMENTO[\s\S]{0,30}?(\d{2})\/(\d{2})\/(\d{4})/i);
        const dt = cm ? cm[3]+"-"+cm[2]+"-"+cm[1] : year+"-01-01";
        txns.push({date:dt, title:"Saldo Anterior (residual)", amount:residual, card, month:monthLabel, year, category:"Encargos/Juros", person:personName});
      }
    }

    // 2. Tabela de compras
    if(dataDescrIdx >= 0) {
      const purText = text.slice(dataDescrIdx, totalDeIdx);
      const purRx   = /(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.+?)\s{3,}(\S[\w\s]{0,30}?)\s+R\$\s*([\d.]+,\d{2})/gi;
      for(const m of purText.matchAll(purRx)) {
        const amount = parseFloat(m[5].replace(/\./g,"").replace(",","."));
        const title  = m[3].replace(/\s+\d{2}\/\d{2}$/,"").replace(/\s{2,}/g," ").trim();
        if(!isNaN(amount) && amount > 0 && title.length > 1
           && !title.match(/^(DATA|DESCRI|CIDADE|TOTAL|SALDO|LEANDRO|P.GINA|REF\s|de\s+\d)/i)) {
          const mon    = ptNum[m[2].toUpperCase()] || "01";
          const txYear = yearForMonth(m[2].toUpperCase());
          txns.push({date:txYear+"-"+mon+"-"+m[1].padStart(2,"0"), title, amount, card, month:monthLabel, year:txYear, category:categorize(title), person:personName});
        }
      }
    }

    console.log("[Ailos] FINAL txns=" + txns.length + " soma=" + txns.reduce(function(s,t){return s+t.amount;},0).toFixed(2));
  }

  // 
  // INTER
  // Mes vem 100% do nome do arquivo: "fatura-inter-2026-01.pdf" -> "Jan/2026"
  // Formato das linhas (confirmado via debug_inter.mjs):
  //   "DD de mon. YYYY  TITULO  (Parcela N de N)  -  R$ VALOR"   (gasto)
  //   "DD de mon. YYYY  TITULO  -  + R$ VALOR"                   (credito - ignorar)
  // 
  if(isInter) {
    // Mes da fatura = nome do arquivo
    const fnMatch  = file.name.match(/(\d{4})-(\d{2})/);
    const fatYear  = fnMatch ? fnMatch[1] : String(new Date().getFullYear());
    const fatMonI  = fnMatch ? parseInt(fnMatch[2], 10) - 1 : 0;
    const fatMonth = (PT_MO_SHORT[fatMonI] || "???") + "/" + fatYear;

    // Regex para linhas do PDF Inter
    // Grupos: (1)dia (2)mes-abr (3)ano (4)titulo (5)"+ " se credito (6)valor
    const interRx = /^(\d{2})\s+de\s+([a-z]{3})\.\s+(\d{4})\s+(.+?)\s+-\s+(\+\s+)?R\$\s*([\d.]+,\d{2})\s*$/i;

    var count = 0;
    for(var li = 0; li < lines.length; li++) {
      const m = interRx.exec(lines[li].trim());
      if(!m) continue;

      const isCredit = !!m[5]; // "+" antes do R$ = pagamento/credito
      if(isCredit) continue;

      const monPdf   = {jan:"01",fev:"02",mar:"03",abr:"04",mai:"05",jun:"06",jul:"07",ago:"08",set:"09",out:"10",nov:"11",dez:"12"};
      const monNum   = monPdf[m[2].toLowerCase()] || "01";
      const txYear   = m[3];
      const amount   = parseFloat(m[6].replace(/\./g,"").replace(",","."));
      const title    = m[4]
        .replace(/\s*\(Parcela\s+\d+\s+de\s+\d+\)\s*/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      if(isNaN(amount) || amount <= 0 || title.length < 2) continue;
      if(/^(PAGAMENTO|SALDO|LIMITE|VENCIMENTO|FEDER|LEANDRO)/i.test(title)) continue;

      txns.push({
        date:     txYear + "-" + monNum + "-" + m[1].padStart(2,"0"),
        title:    title,
        amount:   amount,
        card:     card,
        month:    fatMonth,
        year:     fatYear,
        category: categorize(title),
        person:   personName,
      });
      count++;
    }

    console.log("[Inter] arquivo=" + file.name + " fatMonth=" + fatMonth + " txns=" + count + " soma=" + txns.filter(function(t){return t.card==="Inter";}).reduce(function(s,t){return s+t.amount;},0).toFixed(2));
    if(count === 0) {
      const dbg = lines.filter(function(l){return /\bde\s+[a-z]{3}\.\s+\d{4}/i.test(l);});
      console.warn("[Inter] ZERO txns! Linhas com data (" + dbg.length + "):", dbg.slice(0,10));
    }
  }

  return txns;
}

//  EXCLUSION CHECK 
function isExcludedTransaction(t) {
  if(t.amount <= 0) return true;
  const tl = t.title.toLowerCase();
  return EXCLUDED_TITLES.some(function(ex){ return tl.includes(ex); });
}

//  PROCESS FILE 
async function processFile(file, personName) {
  var txns = [];
  if(file.name.toLowerCase().endsWith(".csv")) {
    const text = await file.text();
    txns = parseCSV(text, file.name, personName);
  } else if(file.name.toLowerCase().endsWith(".pdf")) {
    txns = await parsePDF(file, personName);
  }
  return txns.filter(function(t){ return !isExcludedTransaction(t); });
}
