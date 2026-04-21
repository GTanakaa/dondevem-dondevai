import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ReText } from 'react-native-redash';
import { useTransacoes } from '../hooks/useTransacoes';
import { chaveMes, formatarMoeda, LIMITE_KEY } from '../utils/formatadores';

// ─── Contador animado — worklet inline para funcionar no iOS ─────────────────
function AnimatedNumber({ finalValue, style }) {
  const sv = useSharedValue(0);

  useEffect(() => {
    sv.value = withTiming(finalValue, {
      duration: 1400,
      easing: Easing.out(Easing.exp),
    });
  }, [finalValue]);

  const text = useDerivedValue(() => {
    'worklet';
    const v = sv.value;
    const partes = v.toFixed(2).split('.');
    const inteiro = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return 'R$ ' + inteiro + ',' + partes[1];
  });

  return <ReText text={text} style={style} />;
}

// ─── Helper: "mm/yyyy" → "Janeiro 2025" ─────────────────────────────────────
const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const labelMes = (mmYyyy) => {
  if (!mmYyyy) return '';
  const [mm, yyyy] = mmYyyy.split('/');
  return `${MESES_PT[parseInt(mm, 10) - 1]} ${yyyy}`;
};

// ─── Tela ─────────────────────────────────────────────────────────────────────
export default function Resumo() {
  const router = useRouter();
  const { transacoes, carregando } = useTransacoes({ carregarAoFocar: true });
  const [mesSelecionado, setMesSelecionado] = useState(null);
  const [limite, setLimite] = useState(null); // { ativo, valor }

  // Carrega o limite de orçamento configurado
  useEffect(() => {
    async function carregarLimite() {
      try {
        const raw = await AsyncStorage.getItem(LIMITE_KEY);
        if (raw !== null) setLimite(JSON.parse(raw));
      } catch (e) {
        console.error('Erro ao carregar limite:', e);
      }
    }
    carregarLimite();
  }, []);

  // Meses disponíveis, do mais recente ao mais antigo
  const mesesDisponiveis = useMemo(() => {
    const keys = [...new Set(transacoes.map((t) => chaveMes(t.date)))].filter(Boolean);
    return keys.sort((a, b) => {
      const [ma, ya] = a.split('/').map(Number);
      const [mb, yb] = b.split('/').map(Number);
      return yb !== ya ? yb - ya : mb - ma;
    });
  }, [transacoes]);

  // Seleciona o mês mais recente automaticamente
  useEffect(() => {
    if (mesesDisponiveis.length > 0 && mesSelecionado === null) {
      setMesSelecionado(mesesDisponiveis[0]);
    }
  }, [mesesDisponiveis]);

  // Totais do mês selecionado
  const { totalGastos, totalGanhos, saldo } = useMemo(() => {
    const lista = mesSelecionado
      ? transacoes.filter((t) => chaveMes(t.date) === mesSelecionado)
      : transacoes;
    let gastos = 0, ganhos = 0;
    lista.forEach((t) => {
      if (t.type === 'outcome') gastos += t.amount;
      if (t.type === 'income') ganhos += t.amount;
    });
    return { totalGastos: gastos, totalGanhos: ganhos, saldo: ganhos - gastos };
  }, [transacoes, mesSelecionado]);

  // Cálculos do limite de orçamento
  const limiteAtivo = limite?.ativo && limite?.valor > 0;
  const limiteValor = limite?.valor ?? 0;
  const limitePercent = limiteAtivo ? Math.min((totalGastos / limiteValor) * 100, 100) : 0;
  const limiteUltrapassado = limiteAtivo && totalGastos > limiteValor;
  const limiteProximo = limiteAtivo && !limiteUltrapassado && limitePercent >= 80;

  // Barra de progresso gasto vs ganho (para quando não há limite)
  const gastoPercent = totalGanhos > 0
    ? Math.min((totalGastos / totalGanhos) * 100, 100)
    : 0;

  if (carregando) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.bgImage}
          resizeMode="cover"
          blurRadius={15}
        />

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>⬅ Voltar ao Menu</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Resumo Geral</Text>

        {/* Seletor de mês */}
        {mesesDisponiveis.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthScrollContent}
            style={styles.monthScroll}
          >
            {mesesDisponiveis.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMesSelecionado(m)}
                style={[styles.monthChip, mesSelecionado === m && styles.monthChipActive]}
              >
                <Text style={[styles.monthChipText, mesSelecionado === m && styles.monthChipTextActive]}>
                  {labelMes(m)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Alerta de limite ultrapassado */}
        {limiteUltrapassado && (
          <View style={[styles.alertaCard, styles.alertaVermelho]}>
            <Text style={styles.alertaIcone}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertaTitulo}>Limite ultrapassado!</Text>
              <Text style={styles.alertaTexto}>
                Você gastou {formatarMoeda(totalGastos)} de {formatarMoeda(limiteValor)} definidos.
              </Text>
            </View>
          </View>
        )}

        {/* Alerta de limite próximo (80%) */}
        {limiteProximo && (
          <View style={[styles.alertaCard, styles.alertaAmarelo]}>
            <Text style={styles.alertaIcone}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertaTitulo}>Atenção ao orçamento</Text>
              <Text style={styles.alertaTexto}>
                Você já usou {limitePercent.toFixed(0)}% do limite de {formatarMoeda(limiteValor)}.
              </Text>
            </View>
          </View>
        )}

        {/* Card principal */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Gasto no Mês</Text>
          <AnimatedNumber finalValue={totalGastos} style={styles.totalValue} />
          {mesSelecionado && (
            <Text style={styles.cardSub}>{labelMes(mesSelecionado)}</Text>
          )}
        </View>

        {/* Cards secundários */}
        <View style={styles.infoRow}>
          <View style={[styles.infoCard, { borderLeftColor: '#2ecc71' }]}>
            <Text style={styles.infoLabel}>Entradas</Text>
            <Text style={[styles.infoValue, { color: '#2ecc71' }]}>{formatarMoeda(totalGanhos)}</Text>
          </View>
          <View style={[styles.infoCard, { borderLeftColor: saldo >= 0 ? '#3498db' : '#e74c3c' }]}>
            <Text style={styles.infoLabel}>Saldo Atual</Text>
            <Text style={[styles.infoValue, { color: saldo >= 0 ? '#3498db' : '#e74c3c' }]}>
              {formatarMoeda(saldo)}
            </Text>
          </View>
        </View>

        {/* Barra de limite de orçamento */}
        {limiteAtivo && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Limite de orçamento</Text>
              <Text style={[
                styles.progressPercent,
                { color: limiteUltrapassado ? '#e74c3c' : limiteProximo ? '#f39c12' : '#2ecc71' },
              ]}>
                {limitePercent.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                {
                  width: `${limitePercent}%`,
                  backgroundColor: limiteUltrapassado ? '#e74c3c' : limiteProximo ? '#f39c12' : '#2ecc71',
                },
              ]} />
            </View>
            <Text style={styles.progressFooter}>
              {formatarMoeda(totalGastos)} de {formatarMoeda(limiteValor)}
            </Text>
          </View>
        )}

        {/* Barra gasto vs ganho (quando não há limite ativo) */}
        {!limiteAtivo && totalGanhos > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Gasto do mês</Text>
              <Text style={[
                styles.progressPercent,
                { color: gastoPercent > 90 ? '#e74c3c' : '#3498db' },
              ]}>
                {gastoPercent.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                {
                  width: `${gastoPercent}%`,
                  backgroundColor: gastoPercent > 90 ? '#e74c3c' : '#3498db',
                },
              ]} />
            </View>
            <Text style={styles.progressFooter}>
              {formatarMoeda(totalGastos)} de {formatarMoeda(totalGanhos)}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f2f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
  container: { flex: 1 },
  content: { padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 40 },
  bgImage: { position: 'absolute', width: '150%', height: '150%', opacity: 0.08 },

  backButton: { marginBottom: 15 },
  backButtonText: { color: '#3498db', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginBottom: 20, textAlign: 'center' },

  monthScroll: { marginBottom: 16 },
  monthScrollContent: { gap: 8, paddingVertical: 2 },
  monthChip: {
    paddingVertical: 7, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#dde1e7',
  },
  monthChipActive: { backgroundColor: '#2c3e50', borderColor: '#2c3e50' },
  monthChipText: { fontSize: 13, color: '#7f8c8d', fontWeight: '500' },
  monthChipTextActive: { color: '#fff', fontWeight: 'bold' },

  // Alertas de limite
  alertaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, padding: 14, marginBottom: 14,
    borderLeftWidth: 4,
  },
  alertaVermelho: { backgroundColor: '#fff5f5', borderLeftColor: '#e74c3c' },
  alertaAmarelo: { backgroundColor: '#fffbf0', borderLeftColor: '#f39c12' },
  alertaIcone: { fontSize: 22 },
  alertaTitulo: { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 2 },
  alertaTexto: { fontSize: 12, color: '#7f8c8d' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 28,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  cardLabel: { fontSize: 13, color: '#95a5a6', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  totalValue: { fontSize: 40, fontWeight: 'bold', color: '#e74c3c', marginTop: 10, textAlign: 'center' },
  cardSub: { fontSize: 13, color: '#bdc3c7', marginTop: 6 },

  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  infoCard: {
    flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  infoLabel: { fontSize: 11, color: '#95a5a6', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 },
  infoValue: { fontSize: 16, fontWeight: 'bold' },

  progressCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { fontSize: 13, color: '#7f8c8d' },
  progressPercent: { fontSize: 15, fontWeight: 'bold' },
  progressBar: { height: 8, backgroundColor: '#ecf0f1', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressFooter: { fontSize: 12, color: '#bdc3c7', textAlign: 'right' },
});