// ─── Chaves do AsyncStorage ──────────────────────────────────────────────────
export const STORAGE_KEY = '@minhas_financas:transacoes';
export const LIMITE_KEY   = '@minhas_financas:limite_orcamento';

// ─── Formata número para padrão brasileiro  R$ 1.234,56 ─────────────────────
export const formatarMoeda = (valor = 0) => {
  return (
    'R$ ' +
    valor
      .toFixed(2)
      .replace('.', ',')
      .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
  );
};

// ─── Converte string "dd/mm/yyyy" → Date ────────────────────────────────────
export const converterDataBR = (dataStr) => {
  if (!dataStr) return new Date(0);
  const partes = dataStr.split('/');
  if (partes.length !== 3) return new Date(0);
  return new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
};

// ─── Retorna "mm/yyyy" de uma string de data ─────────────────────────────────
export const chaveMes = (dataStr) => {
  if (!dataStr) return '';
  const partes = dataStr.split('/');
  return `${partes[1]}/${partes[2]}`;
};