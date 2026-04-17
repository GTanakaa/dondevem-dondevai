import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';

const STORAGE_KEY = '@minhas_financas:transacoes';

// Ativa animações suaves no Android ao expandir os cartões
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Ranking() {
  const router = useRouter();
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar qual categoria está aberta
  const [expandedCategory, setExpandedCategory] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadRankingData();
      setExpandedCategory(null); // Fecha tudo ao entrar na tela
    }, [])
  );

  // Formatar em R$ 0.000,00
  const formatBR = (value) => {
    return 'R$ ' + value.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  };

  const loadRankingData = async () => {
    setLoading(true);
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData !== null) {
        const transactions = JSON.parse(storedData);

        // Pegar apenas os gastos
        const gastos = transactions.filter(t => t.type === 'outcome');

        //  Agrupar por categoria e subcategoria
        const dadosAgrupados = gastos.reduce((acc, curr) => {
          // Cria a categoria se não existir
          if (!acc[curr.category]) {
            acc[curr.category] = {
              categoria: curr.category,
              total: 0,
              quantidade: 0,
              subcategorias: {}
            };
          }

          // Soma na categoria principal
          acc[curr.category].total += curr.amount;
          acc[curr.category].quantidade += 1;

          // MAGIA: Extrair subcategoria dos colchetes
          // Procura algo como "[Restaurante]" ou "[Bebidas > Cerveja]" no início da descrição
          let subName = "Geral / Sem detalhes";
          const match = curr.description ? curr.description.match(/^\[(.*?)\]/) : null;
          
          if (match && match[1]) {
            subName = match[1]; // Pega o texto que estava dentro dos colchetes
          }

          // Cria a subcategoria se não existir
          if (!acc[curr.category].subcategorias[subName]) {
            acc[curr.category].subcategorias[subName] = {
              nome: subName,
              total: 0,
              quantidade: 0
            };
          }

          // Soma na subcategoria
          acc[curr.category].subcategorias[subName].total += curr.amount;
          acc[curr.category].subcategorias[subName].quantidade += 1;

          return acc;
        }, {});

        // Transformar o objeto num array e ordenar
        const arrayRanking = Object.values(dadosAgrupados).map(cat => {
          // Converte o objeto de subcategorias em um array e ordena do maior pro menor
          const subArray = Object.values(cat.subcategorias);
          subArray.sort((a, b) => b.total - a.total);
          
          return {
            ...cat,
            subList: subArray
          };
        });

        // Ordenar as categorias principais da maior para a menor
        arrayRanking.sort((a, b) => b.total - a.total);

        setRankingData(arrayRanking);
      }
    } catch (error) {
      console.error("Erro ao carregar ranking", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (categoriaNome) => {
    // Faz uma animacao abertura + leve
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    if (expandedCategory === categoriaNome) {
      setExpandedCategory(null); // Fecha se clicar no que já está aberto
    } else {
      setExpandedCategory(categoriaNome); // Abre outro
    }
  };

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
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>⬅ Voltar ao Menu</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Top Tier de Gastos</Text>
      <Text style={styles.subtitle}>Toque numa categoria para ver os detalhes</Text>

      {rankingData.length > 0 ? (
        <FlatList
          data={rankingData}
          keyExtractor={(item) => item.categoria}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isExpanded = expandedCategory === item.categoria;

            return (
              <View style={[styles.cardWrapper, index === 0 && styles.firstPlaceWrapper]}>
                
                {/* CARTÃO PRINCIPAL */}
                <TouchableOpacity 
                  style={styles.card} 
                  activeOpacity={0.7}
                  onPress={() => toggleExpand(item.categoria)}
                >
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{getMedal(index)}</Text>
                  </View>
                  
                  <View style={styles.infoContainer}>
                    <Text style={styles.categoryText}>{item.categoria}</Text>
                    <Text style={styles.quantityText}>
                      {item.quantidade} {item.quantidade === 1 ? 'vez' : 'vezes'}
                    </Text>
                  </View>

                  <View style={styles.amountContainer}>
                    <Text style={[styles.amountText, index === 0 && styles.firstPlaceAmount]}>
                      {formatBR(item.total)}
                    </Text>
                    <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>

                {/* SUBCATEGORIAS */}
                {isExpanded && (
                  <View style={styles.subCategoryContainer}>
                    <View style={styles.divider} />
                    
                    {item.subList.map((sub, idx) => (
                      <View key={idx} style={styles.subCategoryRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subCategoryName}>• {sub.nome}</Text>
                          <Text style={styles.subCategoryQuantity}>
                            {sub.quantidade} {sub.quantidade === 1 ? 'registro' : 'registros'}
                          </Text>
                        </View>
                        <Text style={styles.subCategoryAmount}>{formatBR(sub.total)}</Text>
                      </View>
                    ))}
                  </View>
                )}

              </View>
            );
          }}
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
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 20, paddingTop: 50 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  backButton: { marginBottom: 15 },
  backButtonText: { color: '#3498db', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#e74c3c', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', marginBottom: 25, marginTop: 5 },
  
  cardWrapper: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  firstPlaceWrapper: { borderColor: '#f1c40f', borderWidth: 2, transform: [{ scale: 1.01 }], shadowOpacity: 0.15 },
  
  card: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  rankBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rankText: { fontSize: 20, fontWeight: 'bold' },
  infoContainer: { flex: 1 },
  categoryText: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  quantityText: { fontSize: 13, color: '#95a5a6', marginTop: 4 },
  
  amountContainer: { alignItems: 'flex-end', flexDirection: 'row' },
  amountText: { fontSize: 18, fontWeight: 'bold', color: '#e74c3c', marginRight: 8 },
  firstPlaceAmount: { fontSize: 20 },
  expandIcon: { fontSize: 12, color: '#bdc3c7', paddingBottom: 3 },

  /* Estilos do Menu Expandido (Subcategorias) */
  subCategoryContainer: { paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#fafbfc' },
  divider: { height: 1, backgroundColor: '#ecf0f1', marginBottom: 10 },
  subCategoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingLeft: 10 },
  subCategoryName: { fontSize: 14, color: '#34495e', fontWeight: '600' },
  subCategoryQuantity: { fontSize: 11, color: '#95a5a6', marginLeft: 10, marginTop: 2 },
  subCategoryAmount: { fontSize: 14, fontWeight: 'bold', color: '#e67e22' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#7f8c8d' }
});