# 💸 Dondevem? Dondevai? — Versão 0.2.0

> Um aplicativo de controle financeiro pessoal que responde às duas perguntas mais importantes da sua vida financeira de forma clara e interativa.

**Status:** Alpha em evolução ativa 🚧

---

## ✨ Funcionalidades

- 🔒 **Privacidade Local First** — Zero dependência de servidores externos. Seus dados financeiros são salvos localmente via `AsyncStorage`. Sem internet, sem nuvem, sem anúncios.
- 📊 **Dashboard Dinâmico** — Resumo mensal com contador animado em tempo real, seletor de mês, barra de progresso e alertas de orçamento.
- 🍕 **Gráfico de Pizza Interativo** — Visualize a proporção dos seus gastos por categoria com um gráfico donut em SVG puro. Toque nas fatias para destacar.
- 🏆 **Ranking de Gastos com Drill-down** — Descubra para onde seu dinheiro vai com um "Top Tier" expansível que detalha categorias e subcategorias.
- ⚡ **Registro Ágil** — Chips de categoria substituem os seletores tradicionais, tornando o registro muito mais rápido no celular.
- 🗑️ **Gestos Nativos (Swipe)** — Arraste transações para a esquerda para apagá-las rapidamente.
- 🔍 **Histórico Inteligente** — Filtros avançados por período e tipo, com totalizador dinâmico de entradas e saídas.
- 💰 **Limite de Orçamento** — Defina uma meta mensal e receba alertas quando atingir 80% ou ultrapassar o limite.
- 📤 **Exportação para Planilha Excel** — Exporte suas transações e popule automaticamente sua planilha de controle via script Python.
- 🎉 **Animações de Recompensa** — Celebração animada ao registrar um novo ganho.

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| **React Native** | Framework principal |
| **Expo & Expo Router** | Ambiente de desenvolvimento e roteamento baseado em arquivos |
| **React Native Reanimated** | Animações fluidas a 60fps na UI thread |
| **React Native Gesture Handler** | Swipe to delete |
| **React Native SVG** | Gráfico de pizza/donut sem dependência externa |
| **React Native Redash** | Texto animado compatível com iOS e Android |
| **React Native Currency Input** | Input de valor no formato R$ brasileiro |
| **AsyncStorage** | Banco de dados local |
| **Expo File System + Sharing** | Exportação de arquivo JSON para o PC |

---

## 🗝️ Armazenamento local

Todas as chaves do `AsyncStorage` ficam centralizadas em `src/utils/formatadores.js`:

```js
STORAGE_KEY  →  '@minhas_financas:transacoes'
LIMITE_KEY   →  '@minhas_financas:limite_orcamento'
```

---

## 📋 Changelog

### v0.2.0
- Gráfico de pizza/donut interativo no Ranking
- Filtro por mês no Resumo Geral
- Limite de orçamento mensal com alertas no Resumo
- Chips de categoria substituem os Pickers (mais ágil no celular)
- Totalizador de entradas e saídas no Histórico
- Tela de exportação para planilha Excel via script Python
- Hook `useTransacoes` centraliza toda a lógica de persistência
- `formatadores.js` centraliza funções e chaves do AsyncStorage
- Correção do contador animado no iOS (`worklet` inline)
- DatePicker no iOS com modal e botão confirmar
- `SafeAreaView` substitui `paddingTop` hardcoded

### v0.1.7
- Dashboard dinâmico com contador animado
- Ranking de gastos com drill-down por subcategoria
- Histórico com filtros por tipo e período
- Swipe to delete nas transações
- Animação de recompensa ao registrar ganho

---

## 🔧 Notas técnicas

**iOS — contador animado:** o `useDerivedValue` do Reanimated roda na UI thread isolada e não acessa funções externas. A formatação monetária é feita inline com a diretiva `'worklet'`.

**Picker removido:** o `@react-native-picker/picker` foi substituído por chips horizontais com `ScrollView`.

**Sem acoplamento entre telas:** `LIMITE_KEY` centralizada em `formatadores.js`.Removendo dependencia entre telas, antes chaamda em `configuracoes.js`.

---

*Desenvolvido por GTanakaa*
