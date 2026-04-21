import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { G, Path, Svg, Text as SvgText } from 'react-native-svg';
import { useTransacoes } from '../hooks/useTransacoes';
import { formatarMoeda } from '../utils/formatadores';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Paleta de cores das fatias ───────────────────────────────────────────────
const CORES = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#e91e63'];

const MEDALS = ['🥇', '🥈', '🥉'];
const getMedal = (i) => MEDALS[i] ?? `${i + 1}º`;

// ─── Gráfico de pizza (donut) em SVG puro ────────────────────────────────────
function GraficoPizza({ dados, total, categoriaSelecionada, onSelecionar }) {
  const TAMANHO = 220;
  const RAIO = 82;
  const RAIO_INTERNO = 50;
  const CX = TAMANHO / 2;
  const CY = TAMANHO / 2;

  const polarParaXY = (angulo, raio) => ({
    x: CX + raio * Math.cos((angulo * Math.PI) / 180),
    y: CY + raio * Math.sin((angulo * Math.PI) / 180),
  });

  const gerarPath = (anguloInicio, anguloFim, raio, raioInt) => {
    const s = polarParaXY(anguloInicio, raio);
    const e = polarParaXY(anguloFim, raio);
    const si = polarParaXY(anguloInicio, raioInt);
    const ei = polarParaXY(anguloFim, raioInt);
    const grande = anguloFim - anguloInicio > 180 ? 1 : 0;
    return [
      `M ${s.x} ${s.y}`,
      `A ${raio} ${raio} 0 ${grande} 1 ${e.x} ${e.y}`,
      `L ${ei.x} ${ei.y}`,
      `A ${raioInt} ${raioInt} 0 ${grande} 0 ${si.x} ${si.y}`,
      'Z',
    ].join(' ');
  };

  let angulo = -90;
  const fatias = dados.map((item, i) => {
    const graus = (item.total / total) * 360;
    const inicio = angulo;
    const fim = angulo + graus;
    angulo = fim;
    const selecionada = categoriaSelecionada === item.categoria;
    return {
      path: gerarPath(inicio, fim, selecionada ? RAIO + 9 : RAIO, selecionada ? RAIO_INTERNO - 5 : RAIO_INTERNO),
      cor: CORES[i % CORES.length],
      categoria: item.categoria,
      selecionada,
    };
  });

  const itemSel = dados.find((d) => d.categoria === categoriaSelecionada);
  const textoCentro = itemSel
    ? `${((itemSel.total / total) * 100).toFixed(0)}%`
    : formatarMoeda(total);
  const legendaCentro = itemSel ? itemSel.categoria : 'Total';

  return (
    <View style={ep.wrapper}>
      <Svg width={TAMANHO} height={TAMANHO}>
        <G>
          {fatias.map((f, i) => (
            <Path
              key={i}
              d={f.path}
              fill={f.cor}
              opacity={categoriaSelecionada && !f.selecionada ? 0.35 : 1}
              onPress={() => onSelecionar(f.selecionada ? null : f.categoria)}
            />
          ))}
          <SvgText x={CX} y={CY - 7} textAnchor="middle"
            fontSize={itemSel ? 24 : 12} fontWeight="bold" fill="#2c3e50">
            {textoCentro}
          </SvgText>
          <SvgText x={CX} y={CY + 13} textAnchor="middle" fontSize={10} fill="#95a5a6">
            {legendaCentro}
          </SvgText>
        </G>
      </Svg>

      {/* Legenda */}
      <View style={ep.legenda}>
        {dados.slice(0, 6).map((item, i) => (
          <TouchableOpacity
            key={item.categoria}
            style={ep.legendaItem}
            onPress={() => onSelecionar(categoriaSelecionada === item.categoria ? null : item.categoria)}
          >
            <View style={[ep.ponto, { backgroundColor: CORES[i % CORES.length] }]} />
            <Text style={[ep.legendaTxt, categoriaSelecionada === item.categoria && ep.legendaTxtAtivo]}
              numberOfLines={1}>
              {item.categoria}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const ep = StyleSheet.create({
  wrapper: {
    alignItems: 'center', backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 8, gap: 10 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ponto: { width: 10, height: 10, borderRadius: 5 },
  legendaTxt: { fontSize: 12, color: '#7f8c8d' },
  legendaTxtAtivo: { fontWeight: 'bold', color: '#2c3e50' },
});

// ─── Tela ─────────────────────────────────────────────────────────────────────
export default function Ranking() {
  const router = useRouter();
  const { transacoes, carregando } = useTransacoes({ carregarAoFocar: true });
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [categoriaPizza, setCategoriaPizza] = useState(null);

  const rankingData = (() => {
    const gastos = transacoes.filter((t) => t.type === 'outcome');
    const grouped = gastos.reduce((acc, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = { categoria: curr.category, total: 0, quantidade: 0, subcategorias: {} };
      }
      acc[curr.category].total += curr.amount;
      acc[curr.category].quantidade += 1;

      const match = curr.description?.match(/^\[(.*?)\]/);
      const subName = match?.[1] || 'Geral / Sem detalhes';

      if (!acc[curr.category].subcategorias[subName]) {
        acc[curr.category].subcategorias[subName] = { nome: subName, total: 0, quantidade: 0 };
      }
      acc[curr.category].subcategorias[subName].total += curr.amount;
      acc[curr.category].subcategorias[subName].quantidade += 1;

      return acc;
    }, {});

    return Object.values(grouped)
      .map((cat) => ({
        ...cat,
        subList: Object.values(cat.subcategorias).sort((a, b) => b.total - a.total),
      }))
      .sort((a, b) => b.total - a.total);
  })();

  const totalGeral = rankingData.reduce((sum, c) => sum + c.total, 0);

  const toggleExpand = (categoria) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategory((prev) => (prev === categoria ? null : categoria));
  };

  if (carregando) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={rankingData}
        keyExtractor={(item) => item.categoria}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>⬅ Voltar ao Menu</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Top Tier de Gastos</Text>
            <Text style={styles.subtitle}>Toque numa fatia ou categoria para destacar</Text>

            {rankingData.length > 0 && (
              <GraficoPizza
                dados={rankingData}
                total={totalGeral}
                categoriaSelecionada={categoriaPizza}
                onSelecionar={setCategoriaPizza}
              />
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          const isExpanded = expandedCategory === item.categoria;
          const percent = totalGeral > 0 ? ((item.total / totalGeral) * 100).toFixed(0) : 0;
          const cor = CORES[index % CORES.length];
          const destacada = categoriaPizza === item.categoria;

          return (
            <View style={[
              styles.cardWrapper,
              index === 0 && !destacada && styles.firstPlaceWrapper,
              destacada && { borderColor: cor, borderWidth: 2 },
            ]}>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => toggleExpand(item.categoria)}
              >
                <View style={[styles.rankBadge, { backgroundColor: cor + '22' }]}>
                  <Text style={styles.rankText}>{getMedal(index)}</Text>
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.categoryText}>{item.categoria}</Text>
                  <Text style={styles.quantityText}>
                    {item.quantidade} {item.quantidade === 1 ? 'vez' : 'vezes'} · {percent}% do total
                  </Text>
                  <View style={styles.miniBar}>
                    <View style={[styles.miniBarFill, { width: `${percent}%`, backgroundColor: cor }]} />
                  </View>
                </View>

                <View style={styles.amountContainer}>
                  <Text style={[styles.amountText, { color: cor }, index === 0 && styles.firstPlaceAmount]}>
                    {formatarMoeda(item.total)}
                  </Text>
                  <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>

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
                      <Text style={styles.subCategoryAmount}>{formatarMoeda(sub.total)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcone}>📊</Text>
            <Text style={styles.emptyTitulo}>Nenhum gasto ainda</Text>
            <Text style={styles.emptyTexto}>
              Adicione seus primeiros gastos na tela{'\n'}"Controle-se" para ver o ranking aqui.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f2f5', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },

  backButton: { marginBottom: 15 },
  backButtonText: { color: '#3498db', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#e74c3c', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#95a5a6', textAlign: 'center', marginBottom: 16, marginTop: 4 },

  cardWrapper: {
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, overflow: 'hidden',
  },
  firstPlaceWrapper: { borderColor: '#f1c40f', borderWidth: 2 },

  card: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rankBadge: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rankText: { fontSize: 20 },
  infoContainer: { flex: 1 },
  categoryText: { fontSize: 17, fontWeight: 'bold', color: '#2c3e50' },
  quantityText: { fontSize: 12, color: '#95a5a6', marginTop: 3 },

  miniBar: { height: 4, backgroundColor: '#ecf0f1', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 2 },

  amountContainer: { alignItems: 'flex-end', gap: 4 },
  amountText: { fontSize: 16, fontWeight: 'bold' },
  firstPlaceAmount: { fontSize: 18 },
  expandIcon: { fontSize: 11, color: '#bdc3c7' },

  subCategoryContainer: { paddingHorizontal: 18, paddingBottom: 14, backgroundColor: '#fafbfc' },
  divider: { height: 1, backgroundColor: '#ecf0f1', marginBottom: 10 },
  subCategoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingLeft: 8 },
  subCategoryName: { fontSize: 14, color: '#34495e', fontWeight: '600' },
  subCategoryQuantity: { fontSize: 11, color: '#95a5a6', marginTop: 2 },
  subCategoryAmount: { fontSize: 14, fontWeight: 'bold', color: '#e67e22' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcone: { fontSize: 48, marginBottom: 16 },
  emptyTitulo: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8, textAlign: 'center' },
  emptyTexto: { fontSize: 14, color: '#95a5a6', textAlign: 'center', lineHeight: 22 },
});