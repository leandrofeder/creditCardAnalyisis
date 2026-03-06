# 💳 Dashboard Financeiro

Análise de gastos em cartões de crédito — roda 100% no navegador, sem servidor.

## 🚀 Como usar no GitHub Pages

### 1. Criar o repositório
```bash
git init
git add .
git commit -m "feat: dashboard financeiro"
git remote add origin https://github.com/SEU_USUARIO/dashboard-financeiro.git
git push -u origin main
```

### 2. Ativar GitHub Pages
- Acesse **Settings → Pages**
- Em **Source**, selecione `Deploy from a branch`
- Branch: `main` · Pasta: `/ (root)`
- Clique **Save**

Após ~1 minuto, acesse:
```
https://SEU_USUARIO.github.io/dashboard-financeiro/
```

---

## 📁 Estrutura
```
dashboard-financeiro/
└── index.html   ← arquivo único, tudo embutido
└── README.md
```

## 📂 Arquivos suportados

| Banco | Formato | Como exportar |
|-------|---------|---------------|
| **Nubank** | `.CSV` | App Nubank → Perfil → Meus Extratos → Exportar |
| **Ailos / Viacredi** | `.PDF` | Portal Ailos Cartões → Faturas |
| **Banco Inter** | `.PDF` | Super App Inter → Cartão → Fatura → Baixar PDF |

## 🔒 Privacidade
Todos os arquivos são processados **localmente no seu navegador**.
Nenhum dado financeiro é enviado a qualquer servidor.
