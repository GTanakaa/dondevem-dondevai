import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = '@minhas_financas:transacoes';

export default function Ranking() {
  const router = useRouter();
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadRankingData();
    }, [])
  );

  const loadRankingData = async () => {
    setLoading(true);
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData !== null) {
        const transactions = JSON.parse(storedData);

        // 1. Pegar apenas os gastos
        const gastos = transactions.filter(t => t.type === 'outcome');

        // 2. Agrupar por categoria e somar valores e quantidades
        const dadosAgrupados = gastos.reduce((acc, curr) => {
          if (acc[curr.category]) {
            acc[curr.category].total += curr.amount;
            acc[curr.category].quantidade += 1;
          } else {
            acc[curr.category] = {
              categoria: curr.category,
              total: curr.amount,
              quantidade: 1,
            };
          }
          return acc;
        }, {});

        // 3. Transformar o objeto num array para ordernar
        const arrayRanking = Object.values(dadosAgrupados);

        // 4. Ordenar do maior gasto (total) para o menor
        arrayRanking.sort((a, b) => b.total - a.total);

        setRankingData(arrayRanking);
      }
    } catch (error) {
      console.error("Erro ao carregar ranking", error);
    } finally {
      setLoading(false);
    }
  };

  // Função  medalha aos 3 primeiros
  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}º`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* BUTTON VOLTAR */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>⬅ Voltar ao Menu</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Top Tier de Gastos</Text>
      <Text style={styles.subtitle}>Onde seu dinheiro está indo?</Text>

      {rankingData.length > 0 ? (
        <FlatList
          data={rankingData}
          keyExtractor={(item) => item.categoria}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View style={[
              styles.card, 
              index === 0 && styles.firstPlaceCard
            ]}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{getMedal(index)}</Text>
              </View>
              
              <View style={styles.infoContainer}>
                <Text style={styles.categoryText}>{item.categoria}</Text>
                <Text style={styles.quantityText}>
                  {item.quantidade} {item.quantidade === 1 ? 'vez' : 'vezes'} neste mês
                </Text>
              </View>

              <Text style={[styles.amountText, index === 0 && styles.firstPlaceAmount]}>
                R$ {item.total.toFixed(2)}
              </Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Sem gastos para ranquear.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 20,
    paddingTop: 50,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    color: '#3498db',
    fontWeight: 'bold',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  firstPlaceCard: {
    borderColor: '#f1c40f',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.15,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  quantityText: {
    fontSize: 13,
    color: '#95a5a6',
    marginTop: 4,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  firstPlaceAmount: {
    fontSize: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
  }
});