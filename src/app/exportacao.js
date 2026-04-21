import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { formatarMoeda, STORAGE_KEY } from '../utils/formatadores';

// ── Mapeamento categoria do app → linha da planilha ───────────────────────────
const MESES = ['JAN','FEV','MAR','ABRIL','MAIO','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

const LINHA_INCOME = { 'CLT': 13, 'Contrato PJ': 17, 'Investimentos': 17, 'Outros': 17 };

const LINHA_OUTCOME = {
  'Investimento': 22, 'Investimento_ETFs': 22, 'Investimento_FIIs': 22,
  'Investimento_Ações': 22, 'Investimento_Criptos': 22, 'Investimento_CDI': 22,
  'Investimento_Tesouro Direto': 22, 'Investimento_LCI/LCA': 22, 'Investimento_Poupança': 22,
  'Comida_Restaurante': 51, 'Comida_Fast-food': 51, 'Comida_iFood': 51,
  'Comida_Carne (Churrasco)': 51, 'Comida_Bebidas': 51, 'Comida': 51,
  'Comida_Mercado': 50,
  'Lazer_Cinema': 48, 'Lazer_Futebol': 48, 'Lazer_Jogo/Video-Game': 48,
  'Lazer_Teatro': 48, 'Lazer_Show': 48, 'Lazer_SPA': 48, 'Lazer_Viagem': 48,
  'Lazer_Academia': 38, 'Lazer_Outras atividades físicas': 38, 'Lazer': 48,
  'Roupa_Dia a dia (Camisetas/Calças)': 54, 'Roupa_Calçados': 54,
  'Roupa_Acessórios (Bolsas/Óculos)': 54, 'Roupa_Roupa Íntima/Meias': 54,
  'Roupa_Inverno/Casacos': 54, 'Roupa_Roupas Esportivas': 54, 'Roupa': 54,
  'Outros': 56,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const extrairSubcategoria = (descricao) => {
  if (!descricao) return null;
  const m = descricao.match(/^\[(.*?)\]/);
  if (!m) return null;
  return m[1].split(' > ')[0].trim();
};

const mesDaData = (dateStr) => {
  try {
    const mes = parseInt(dateStr.split('/')[1], 10);
    return MESES[mes - 1] || null;
  } catch { return null; }
};

const linhaDestino = (category, description, type) => {
  if (type === 'income') return LINHA_INCOME[category] ?? 17;
  const sub = extrairSubcategoria(description);
  const chaveCompleta = sub ? `${category}_${sub}` : category;
  return LINHA_OUTCOME[chaveCompleta] ?? LINHA_OUTCOME[category] ?? 56;
};

// ── Tela ──────────────────────────────────────────────────────────────────────
export default function Exportacao() {
  const router = useRouter();
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function carregar() {
        setCarregando(true);
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          setTransacoes(raw ? JSON.parse(raw) : []);
        } finally {
          setCarregando(false);
        }
      }
      carregar();
    }, [])
  );

  // Totais por mês para o preview
  const totaisPorMes = MESES.map((mes) => {
    const gastos = transacoes
      .filter((t) => t.type === 'outcome' && mesDaData(t.date) === mes)
      .reduce((s, t) => s + t.amount, 0);
    const ganhos = transacoes
      .filter((t) => t.type === 'income' && mesDaData(t.date) === mes)
      .reduce((s, t) => s + t.amount, 0);
    return { mes, gastos, ganhos };
  }).filter((m) => m.gastos > 0 || m.ganhos > 0);

  // Exporta o JSON das transações para o usuário compartilhar com o script Python
  const handleExportar = async () => {
    if (transacoes.length === 0) {
      Alert.alert('Aviso', 'Não há transações para exportar.');
      return;
    }

    const isDisponivel = await Sharing.isAvailableAsync();
    if (!isDisponivel) {
      Alert.alert('Indisponível', 'Compartilhamento não disponível neste dispositivo.');
      return;
    }

    setExportando(true);
    try {
      // Salva o JSON no diretório de documentos do app
      const nomeArquivo = `transacoes_${new Date().toISOString().slice(0, 10)}.json`;
      const caminho = FileSystem.documentDirectory + nomeArquivo;

      await FileSystem.writeAsStringAsync(
        caminho,
        JSON.stringify(transacoes, null, 2) // ✅ Sem o parâmetro, ele usa o padrão automático
      );

      // Abre o seletor de compartilhamento (AirDrop, Email, Drive, etc.)
      await Sharing.shareAsync(caminho, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar transações para planilha',
        UTI: 'public.json',
      });
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível exportar. Tente novamente.');
      console.error(e);
    } finally {
      setExportando(false);
    }
  };

  if (carregando) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>⬅ Voltar ao Menu</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Exportar para Planilha</Text>

        {/* Instruções */}
        <View style={styles.instrucaoCard}>
          <Text style={styles.instrucaoTitulo}>Como funciona</Text>
          <View style={styles.passo}>
            <View style={styles.passoBadge}><Text style={styles.passoNum}>1</Text></View>
            <Text style={styles.passoTxt}>Toque em "Exportar JSON" e salve o arquivo no seu PC</Text>
          </View>
          <View style={styles.passo}>
            <View style={styles.passoBadge}><Text style={styles.passoNum}>2</Text></View>
            <Text style={styles.passoTxt}>No PC, coloque o arquivo JSON na mesma pasta do script Python</Text>
          </View>
          <View style={styles.passo}>
            <View style={styles.passoBadge}><Text style={styles.passoNum}>3</Text></View>
            <Text style={styles.passoTxt}>Execute: <Text style={styles.codigo}>python gerar_planilha.py transacoes.json template.xlsx saida.xlsx</Text></Text>
          </View>
          <View style={[styles.passo, { marginBottom: 0 }]}>
            <View style={styles.passoBadge}><Text style={styles.passoNum}>4</Text></View>
            <Text style={styles.passoTxt}>Abra o saida.xlsx — os valores já estarão nas células certas!</Text>
          </View>
        </View>

        {/* Preview dos dados */}
        <Text style={styles.sectionTitle}>Prévia do que será exportado</Text>

        <View style={styles.resumoCard}>
          <View style={styles.resumoHeader}>
            <Text style={styles.resumoNum}>{transacoes.length}</Text>
            <Text style={styles.resumoLabel}>transações no total</Text>
          </View>
          <View style={styles.divider} />

          {totaisPorMes.length === 0 ? (
            <Text style={styles.vazio}>Nenhuma transação registrada ainda.</Text>
          ) : (
            totaisPorMes.map(({ mes, gastos, ganhos }) => (
              <View key={mes} style={styles.mesRow}>
                <Text style={styles.mesNome}>{mes}</Text>
                <View style={styles.mesValores}>
                  {ganhos > 0 && (
                    <Text style={styles.valorGanho}>+{formatarMoeda(ganhos)}</Text>
                  )}
                  {gastos > 0 && (
                    <Text style={styles.valorGasto}>-{formatarMoeda(gastos)}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Botão exportar */}
        <TouchableOpacity
          style={[styles.exportBtn, exportando && styles.exportBtnDisabled]}
          onPress={handleExportar}
          disabled={exportando}
        >
          {exportando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.exportBtnIcon}>📤</Text>
              <Text style={styles.exportBtnTxt}>Exportar JSON</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.dica}>
          O arquivo JSON contém todas as suas transações. O script Python converte para o formato da sua planilha automaticamente.
        </Text>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f2f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
  content: { padding: 24, paddingTop: Platform.OS === 'android' ? 40 : 10 },

  backButton: { marginBottom: 15 },
  backButtonText: { color: '#3498db', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2c3e50', marginBottom: 20 },

  instrucaoCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  instrucaoTitulo: { fontSize: 13, fontWeight: 'bold', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  passo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  passoBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#3498db', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  passoNum: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  passoTxt: { flex: 1, fontSize: 13, color: '#7f8c8d', lineHeight: 20 },
  codigo: { fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontSize: 11, color: '#2c3e50', backgroundColor: '#f0f2f5' },

  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },

  resumoCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  resumoHeader: { alignItems: 'center', marginBottom: 14 },
  resumoNum: { fontSize: 36, fontWeight: 'bold', color: '#2c3e50' },
  resumoLabel: { fontSize: 13, color: '#95a5a6' },
  divider: { height: 1, backgroundColor: '#f0f2f5', marginBottom: 12 },
  vazio: { textAlign: 'center', color: '#bdc3c7', fontSize: 14, paddingVertical: 10 },

  mesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
  mesNome: { fontSize: 14, fontWeight: 'bold', color: '#2c3e50', width: 50 },
  mesValores: { flexDirection: 'row', gap: 12 },
  valorGanho: { fontSize: 13, color: '#2ecc71', fontWeight: '600' },
  valorGasto: { fontSize: 13, color: '#e74c3c', fontWeight: '600' },

  exportBtn: {
    backgroundColor: '#27ae60', borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    marginBottom: 14,
  },
  exportBtnDisabled: { backgroundColor: '#95a5a6' },
  exportBtnIcon: { fontSize: 20 },
  exportBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 17 },

  dica: { fontSize: 12, color: '#bdc3c7', textAlign: 'center', lineHeight: 18 },
});