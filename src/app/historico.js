import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTransacoes } from '../hooks/useTransacoes';
import { converterDataBR, formatarMoeda } from '../utils/formatadores';

export default function Historico() {
  const router = useRouter();
  const { transacoes, carregando } = useTransacoes({ carregarAoFocar: true });

  const [filterType, setFilterType] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');

  const filteredData = useMemo(() => {
    let result = [...transacoes];

    // Filtro por tipo
    if (filterType !== 'all') {
      result = result.filter((t) => t.type === filterType);
    }

    // Filtro por período
    if (filterPeriod !== 'all') {
      const hoje = new Date();
      const DIAS = { '30days': 30, '3months': 90, 'year': 365 };
      const limite = DIAS[filterPeriod];
      result = result.filter((t) => {
        const diff = Math.ceil(Math.abs(hoje - converterDataBR(t.date)) / (1000 * 60 * 60 * 24));
        return diff <= limite;
      });
    }

    // Mais recente primeiro
    result.sort((a, b) => converterDataBR(b.date) - converterDataBR(a.date));
    return result;
  }, [transacoes, filterType, filterPeriod]);

  // Totais dos registros filtrados
  const { totalEntradas, totalSaidas } = useMemo(() => {
    let entradas = 0, saidas = 0;
    filteredData.forEach((t) => {
      if (t.type === 'income') entradas += t.amount;
      else saidas += t.amount;
    });
    return { totalEntradas: entradas, totalSaidas: saidas };
  }, [filteredData]);

  if (carregando) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#34495e" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.bgImage}
        resizeMode="cover"
        blurRadius={15}
      />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>⬅ Voltar ao Menu</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Histórico Geral</Text>

      {/* Filtros */}
      <View style={styles.filtersWrapper}>
        <Text style={styles.filterLabel}>Tipo</Text>
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'Todos' },
            { key: 'income', label: 'Ganhos' },
            { key: 'outcome', label: 'Gastos' },
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, filterType === key && styles.filterChipActive]}
              onPress={() => setFilterType(key)}
            >
              <Text style={[styles.filterText, filterType === key && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.filterLabel}>Período</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'Sempre' },
            { key: '30days', label: 'Últimos 30 dias' },
            { key: '3months', label: 'Últimos 3 meses' },
            { key: 'year', label: 'Último ano' },
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, filterPeriod === key && styles.filterChipActive, { marginRight: 8 }]}
              onPress={() => setFilterPeriod(key)}
            >
              <Text style={[styles.filterText, filterPeriod === key && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Totalizador */}
      <View style={styles.totalizador}>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>{filteredData.length} registros</Text>
        </View>
        {(filterType === 'all' || filterType === 'income') && totalEntradas > 0 && (
          <View style={styles.totalItem}>
            <Text style={styles.totalEntrada}>+{formatarMoeda(totalEntradas)}</Text>
          </View>
        )}
        {(filterType === 'all' || filterType === 'outcome') && totalSaidas > 0 && (
          <View style={styles.totalItem}>
            <Text style={styles.totalSaida}>-{formatarMoeda(totalSaidas)}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View style={styles.transactionItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.transactionCategory}>{item.category}</Text>
              {item.description ? (
                <Text style={styles.transactionDesc}>{item.description}</Text>
              ) : null}
              <Text style={styles.transactionDate}>📅 {item.date}</Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              { color: item.type === 'income' ? '#2ecc71' : '#e74c3c' },
            ]}>
              {item.type === 'income' ? '+' : '-'} {formatarMoeda(item.amount)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma transação encontrada.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f2f5', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
  bgImage: { position: 'absolute', width: '150%', height: '150%', opacity: 0.08 },

  backButton: { marginBottom: 10 },
  backButtonText: { color: '#3498db', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginBottom: 16 },

  filtersWrapper: {
    backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  filterLabel: { fontSize: 11, fontWeight: 'bold', color: '#95a5a6', textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  filterChip: {
    backgroundColor: '#f0f2f5', paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1, borderColor: '#e1e5eb',
  },
  filterChipActive: { backgroundColor: '#34495e', borderColor: '#34495e' },
  filterText: { color: '#7f8c8d', fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },

  totalizador: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    gap: 8, marginBottom: 12, paddingHorizontal: 2,
  },
  totalItem: {
    backgroundColor: '#fff', borderRadius: 20, paddingVertical: 5,
    paddingHorizontal: 12, borderWidth: 1, borderColor: '#e1e5eb',
  },
  totalLabel: { fontSize: 12, color: '#7f8c8d', fontWeight: '600' },
  totalEntrada: { fontSize: 12, color: '#2ecc71', fontWeight: 'bold' },
  totalSaida: { fontSize: 12, color: '#e74c3c', fontWeight: 'bold' },

  transactionItem: {
    backgroundColor: '#fff', padding: 15, borderRadius: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  transactionCategory: { fontWeight: 'bold', fontSize: 15, color: '#2c3e50' },
  transactionDesc: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  transactionDate: { fontSize: 12, color: '#e67e22', fontWeight: 'bold', marginTop: 5 },
  transactionAmount: { fontWeight: 'bold', fontSize: 15 },

  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#7f8c8d', fontSize: 15 },
});