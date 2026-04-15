import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = '@minhas_financas:transacoes';

export default function Historico() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'outcome'
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all', '30days', '3months', 'year'

  // Carregar dados sempre que abrir a tela
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData !== null) {
        setTransactions(JSON.parse(storedData));
      }
    } catch (error) {
      console.error("Erro ao carregar histórico", error);
    } finally {
      setLoading(false);
    }
  };

  // LÓGICA DE FILTROS
  useEffect(() => {
    applyFilters();
  }, [transactions, filterType, filterPeriod]);

  // Função  objeto Date real
  const parseDateBR = (dateStr) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date(0);
    return new Date(parts[2], parts[1] - 1, parts[0]);
  };

  const applyFilters = () => {
    let result = [...transactions];

    // 1. Filtrar por Tipo
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    // 2. Filtrar por Período
    if (filterPeriod !== 'all') {
      const hoje = new Date();
      result = result.filter(t => {
        const dataTransacao = parseDateBR(t.date);
        const diffTempo = Math.abs(hoje - dataTransacao);
        const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

        if (filterPeriod === '30days') return diffDias <= 30;
        if (filterPeriod === '3months') return diffDias <= 90;
        if (filterPeriod === 'year') return diffDias <= 365;
        return true;
      });
    }

    // 3. Ordenar da mais recente para a mais antiga
    result.sort((a, b) => parseDateBR(b.date) - parseDateBR(a.date));

    setFilteredData(result);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#34495e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* BUTTON de Rtorno ao menu */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>⬅ Voltar ao Menu</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Histórico Geral</Text>

      {/* MENU DE FILTROS */}
      <View style={styles.filtersWrapper}>
        <Text style={styles.filterLabel}>Tipo de Transação:</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
            onPress={() => setFilterType('all')}>
            <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterType === 'income' && styles.filterChipActive]}
            onPress={() => setFilterType('income')}>
            <Text style={[styles.filterText, filterType === 'income' && styles.filterTextActive]}>Ganhos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterType === 'outcome' && styles.filterChipActive]}
            onPress={() => setFilterType('outcome')}>
            <Text style={[styles.filterText, filterType === 'outcome' && styles.filterTextActive]}>Gastos</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.filterLabel}>Período:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollFilters}>
          <TouchableOpacity 
            style={[styles.filterChip, filterPeriod === 'all' && styles.filterChipActive]}
            onPress={() => setFilterPeriod('all')}>
            <Text style={[styles.filterText, filterPeriod === 'all' && styles.filterTextActive]}>Sempre</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterPeriod === '30days' && styles.filterChipActive]}
            onPress={() => setFilterPeriod('30days')}>
            <Text style={[styles.filterText, filterPeriod === '30days' && styles.filterTextActive]}>Últimos 30 Dias</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterPeriod === '3months' && styles.filterChipActive]}
            onPress={() => setFilterPeriod('3months')}>
            <Text style={[styles.filterText, filterPeriod === '3months' && styles.filterTextActive]}>Últimos 3 Meses</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterPeriod === 'year' && styles.filterChipActive]}
            onPress={() => setFilterPeriod('year')}>
            <Text style={[styles.filterText, filterPeriod === 'year' && styles.filterTextActive]}>Último Ano</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* LISTA DE RESULTADOS */}
      <Text style={styles.resultCount}>Exibindo {filteredData.length} registros</Text>
      
      <FlatList 
        data={filteredData}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.transactionItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.transactionCategory}>{item.category}</Text>
              {item.description ? <Text style={styles.transactionDesc}>{item.description}</Text> : null}
              {/* DATA DESTACADA EM LARANJA */}
              <Text style={styles.transactionDate}>📅 {item.date}</Text> 
            </View>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: item.type === 'income' ? '#2ecc71' : '#e74c3c' }}>
              {item.type === 'income' ? '+' : '-'} R$ {item.amount.toFixed(2)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma transação encontrada com estes filtros.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 20, paddingTop: 50 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  backButton: { marginBottom: 15 },
  backButtonText: { color: '#3498db', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginBottom: 20 },
  
  filtersWrapper: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  filterLabel: { fontSize: 13, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 8, marginTop: 5 },
  filterRow: { flexDirection: 'row', marginBottom: 10 },
  scrollFilters: { flexDirection: 'row', paddingBottom: 5 },
  
  filterChip: { backgroundColor: '#f0f2f5', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#e1e5eb' },
  filterChipActive: { backgroundColor: '#34495e', borderColor: '#34495e' },
  filterText: { color: '#7f8c8d', fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },

  resultCount: { fontSize: 13, color: '#95a5a6', marginBottom: 10, marginLeft: 5 },

  transactionItem: { backgroundColor: '#fff', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  transactionCategory: { fontWeight: 'bold', fontSize: 16, color: '#2c3e50' },
  transactionDesc: { fontSize: 13, color: '#7f8c8d', marginTop: 2 },
  transactionDate: { fontSize: 13, color: '#e67e22', fontWeight: 'bold', marginTop: 5 }, // Laranja e maior para destaque

  emptyContainer: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#7f8c8d', textAlign: 'center', fontSize: 15 }
});