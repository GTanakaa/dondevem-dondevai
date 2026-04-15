import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const STORAGE_KEY = '@minhas_financas:transacoes';
const screenWidth = Dimensions.get('window').width;

// Paletas de Cores Diferentes!
const COLORS_OUTCOME = ['#FF6384', '#FF9F40', '#E74C3C', '#9B59B6', '#F1C40F', '#34495E']; // Cores de alerta
const COLORS_INCOME = ['#2ECC71', '#1ABC9C', '#27AE60', '#16A085', '#F39C12', '#2980B9']; // Cores vivas e alegres

export default function Resumo() {
  const router = useRouter();
  const [chartData, setChartData] = useState([]);
  const [totalValor, setTotalValor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('outcome'); 

  useFocusEffect(
    useCallback(() => {
      loadAndProcessData();
    }, [viewType])
  );

  // Função para formatar em R$ 0.000,00 padrão BR
  const formatBR = (value) => {
    return 'R$ ' + value.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  };

  const loadAndProcessData = async () => {
    setLoading(true);
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData !== null) {
        const transactions = JSON.parse(storedData);

        const transacoesFiltradas = transactions.filter(t => t.type === viewType);
        const total = transacoesFiltradas.reduce((acc, curr) => acc + curr.amount, 0);
        setTotalValor(total);

        if (total > 0) {
          const dadosAgrupados = transacoesFiltradas.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
          }, {});

          let colorIndex = 0;
          // Escolhe a paleta correta dependendo se é Gasto ou Ganho
          const currentPalette = viewType === 'income' ? COLORS_INCOME : COLORS_OUTCOME;

          const formattedData = Object.keys(dadosAgrupados).map((key) => {
            const valor = dadosAgrupados[key];
            const porcentagem = ((valor / total) * 100).toFixed(1); 
            const color = currentPalette[colorIndex % currentPalette.length];
            colorIndex++;

            return {
              name: key, 
              population: valor, 
              color: color,
              percentage: `${porcentagem}%`,
              formattedValue: formatBR(valor)
            };
          });

          formattedData.sort((a, b) => b.population - a.population);
          setChartData(formattedData);
        } else {
          setChartData([]);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar gráfico", error);
    } finally {
      setLoading(false);
    }
  };

  // Cálculo para centralizar grafico de pizza
  const pieCenterOffset = (screenWidth / 4) - 15;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>⬅ Voltar ao Menu</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Resumo Geral</Text>

      {/* ABAS DE ALTERNÂNCIA */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, viewType === 'outcome' && styles.tabActiveOutcome]} onPress={() => setViewType('outcome')}>
          <Text style={[styles.tabText, viewType === 'outcome' && styles.tabTextActive]}>Meus Gastos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, viewType === 'income' && styles.tabActiveIncome]} onPress={() => setViewType('income')}>
          <Text style={[styles.tabText, viewType === 'income' && styles.tabTextActive]}>Meus Ganhos</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 50 }} />
      ) : chartData.length > 0 ? (
        <>
          <View style={styles.chartCard}>
            <PieChart
              data={chartData}
              width={screenWidth - 40}
              height={200}
              chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={pieCenterOffset.toString()} 
              center={[0, 0]}
              hasLegend={false} // <- Reativar caso der problema
            />

            {/* LEGENDA CUSTOMIZADA */}
            <View style={styles.customLegendContainer}>
              {chartData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={styles.legendLeft}>
                    <View style={[styles.legendColorBadge, { backgroundColor: item.color }]} />
                    <Text style={styles.legendName}>{item.name}</Text>
                  </View>
                  <View style={styles.legendRight}>
                    <Text style={styles.legendPercent}>{item.percentage}</Text>
                    <Text style={[styles.legendValue, { color: viewType === 'income' ? '#27ae60' : '#c0392b' }]}>
                      {item.formattedValue}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          
          <View style={[styles.totalContainer, { backgroundColor: viewType === 'income' ? '#2ecc71' : '#e74c3c' }]}>
            <Text style={styles.totalLabel}>Total {viewType === 'income' ? 'Ganho' : 'Gasto'}:</Text>
            <Text style={styles.totalValue}>{formatBR(totalValor)}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Sem dados suficientes aqui.</Text>
        </View>
      )}
      
      {/* Espaçamento extra no final para o ScrollView */}
      <View style={{ height: 40 }} /> 
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 20, paddingTop: 50 },
  backButton: { marginBottom: 15 },
  backButtonText: { color: '#3498db', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginBottom: 20, textAlign: 'center' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#e1e5eb', borderRadius: 8, marginBottom: 20, padding: 4 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 6 },
  tabActiveOutcome: { backgroundColor: '#e74c3c' },
  tabActiveIncome: { backgroundColor: '#2ecc71' },
  tabText: { fontWeight: 'bold', color: '#7f8c8d' },
  tabTextActive: { color: '#fff' },

  chartCard: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3, marginBottom: 20 },
  
  /* ESTILOS DA LEGENDA CUSTOMIZADA */
  customLegendContainer: { paddingHorizontal: 20, marginTop: 15, borderTopWidth: 1, borderTopColor: '#f0f2f5', paddingTop: 15 },
  legendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  legendLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  legendColorBadge: { width: 14, height: 14, borderRadius: 7, marginRight: 10 },
  legendName: { fontSize: 15, color: '#2c3e50', fontWeight: '600' },
  legendRight: { alignItems: 'flex-end' },
  legendPercent: { fontSize: 12, color: '#7f8c8d', fontWeight: 'bold' },
  legendValue: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },

  totalContainer: { padding: 20, borderRadius: 12, alignItems: 'center', elevation: 4 },
  totalLabel: { color: '#fff', fontSize: 16, opacity: 0.9 },
  totalValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 5 },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, color: '#7f8c8d' },
});