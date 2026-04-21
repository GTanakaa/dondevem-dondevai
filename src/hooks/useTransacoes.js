import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { STORAGE_KEY } from '../utils/formatadores';

// ─── Hook que encapsula toda a lógica de persistência ───────────────────────
export function useTransacoes({ carregarAoFocar = false } = {}) {
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw !== null) setTransacoes(JSON.parse(raw));
      else setTransacoes([]);
    } catch (e) {
      console.error('useTransacoes erro ao carregar:', e);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Carrega automaticamente sempre que a tela entra em foco (opcional)
  useFocusEffect(
    useCallback(() => {
      if (carregarAoFocar) carregar();
    }, [carregar, carregarAoFocar])
  );

  const salvar = useCallback(async (atualizadas) => {
    setTransacoes(atualizadas);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(atualizadas));
  }, []);

  const adicionar = useCallback(
    async (novaTransacao) => {
      const atualizadas = [novaTransacao, ...transacoes];
      await salvar(atualizadas);
    },
    [transacoes, salvar]
  );

  const remover = useCallback(
    async (id) => {
      const atualizadas = transacoes.filter((t) => t.id !== id);
      await salvar(atualizadas);
    },
    [transacoes, salvar]
  );

  const limparTudo = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setTransacoes([]);
  }, []);

  return { transacoes, carregando, carregar, adicionar, remover, limparTudo };
}