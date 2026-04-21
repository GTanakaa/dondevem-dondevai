import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTransacoes } from '../hooks/useTransacoes';
import { formatarMoeda, LIMITE_KEY } from '../utils/formatadores';

export default function Configuracoes() {
  const router = useRouter();
  const { limparTudo } = useTransacoes();

  const [notifications, setNotifications] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ── Limite de orçamento ───────────────────────────────────────────────────
  const [limiteAtivo, setLimiteAtivo] = useState(false);
  const [limiteTexto, setLimiteTexto] = useState('');
  const [limiteSalvo, setLimiteSalvo] = useState(null);

  // Carrega o limite salvo ao abrir a tela
  useEffect(() => {
    async function carregarLimite() {
      try {
        const raw = await AsyncStorage.getItem(LIMITE_KEY);
        if (raw !== null) {
          const dados = JSON.parse(raw);
          setLimiteAtivo(dados.ativo);
          setLimiteSalvo(dados.valor);
          setLimiteTexto(String(dados.valor));
        }
      } catch (e) {
        console.error('Erro ao carregar limite:', e);
      }
    }
    carregarLimite();
  }, []);

  const handleSalvarLimite = async () => {
    const valor = parseFloat(limiteTexto.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      Alert.alert('Aviso', 'Digite um valor válido para o limite.');
      return;
    }
    try {
      await AsyncStorage.setItem(LIMITE_KEY, JSON.stringify({ ativo: limiteAtivo, valor }));
      setLimiteSalvo(valor);
      Alert.alert('Salvo!', `Limite de ${formatarMoeda(valor)} definido com sucesso.`);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o limite.');
    }
  };

  const handleToggleLimite = async (novoValor) => {
    setLimiteAtivo(novoValor);
    if (limiteSalvo !== null) {
      try {
        await AsyncStorage.setItem(LIMITE_KEY, JSON.stringify({ ativo: novoValor, valor: limiteSalvo }));
      } catch (e) {
        console.error('Erro ao atualizar limite:', e);
      }
    }
  };

  // ── Apagar dados ──────────────────────────────────────────────────────────
  const handleClearData = () => {
    Alert.alert(
      'Atenção! 🚨',
      'Tem certeza que deseja apagar TODOS os seus registros financeiros? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, apagar tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              await limparTudo();
              Alert.alert('Pronto', 'Todo o histórico foi apagado.');
            } catch {
              Alert.alert('Erro', 'Não foi possível apagar os dados.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.bgImage}
          blurRadius={20}
        />

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>⬅ Voltar ao Menu</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Configurações</Text>

        {/* ── Preferências ── */}
        <Text style={styles.sectionTitle}>Preferências</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Lembretes Diários</Text>
              <Text style={styles.settingDesc}>Notificação para registrar gastos</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ true: '#2ecc71', false: '#bdc3c7' }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.settingLabel}>Modo Escuro</Text>
              <Text style={styles.settingDesc}>Em breve</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              disabled
              trackColor={{ true: '#3498db', false: '#bdc3c7' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── Limite de Orçamento ── */}
        <Text style={styles.sectionTitle}>Orçamento Mensal</Text>
        <View style={styles.card}>

          {/* Toggle ativo/inativo */}
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Limite de Gastos</Text>
              <Text style={styles.settingDesc}>
                {limiteAtivo && limiteSalvo
                  ? `Alerta ao atingir ${formatarMoeda(limiteSalvo)}`
                  : 'Receba um alerta ao atingir o limite'}
              </Text>
            </View>
            <Switch
              value={limiteAtivo}
              onValueChange={handleToggleLimite}
              trackColor={{ true: '#f39c12', false: '#bdc3c7' }}
              thumbColor="#fff"
            />
          </View>

          {/* Campo e botão — só aparece quando ativo */}
          {limiteAtivo && (
            <View style={styles.limiteContainer}>
              <View style={styles.limiteInputRow}>
                <Text style={styles.limitePrefix}>R$</Text>
                <TextInput
                  style={styles.limiteInput}
                  value={limiteTexto}
                  onChangeText={setLimiteTexto}
                  keyboardType="numeric"
                  placeholder="0,00"
                  placeholderTextColor="#bdc3c7"
                />
              </View>

              <TouchableOpacity style={styles.limiteSalvarBtn} onPress={handleSalvarLimite}>
                <Text style={styles.limiteSalvarTxt}>Salvar limite</Text>
              </TouchableOpacity>

              {/* Preview do limite salvo */}
              {limiteSalvo && (
                <View style={styles.limitePreview}>
                  <Text style={styles.limitePreviewTxt}>
                    💡 Você será avisado no Resumo quando os gastos do mês ultrapassarem{' '}
                    <Text style={{ fontWeight: 'bold', color: '#f39c12' }}>
                      {formatarMoeda(limiteSalvo)}
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Gestão de Dados ── */}
        <Text style={styles.sectionTitle}>Gestão de Dados</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleClearData}>
            <Text style={styles.dangerIcon}>🗑️</Text>
            <View>
              <Text style={styles.dangerLabel}>Apagar Todo o Histórico</Text>
              <Text style={styles.dangerDesc}>Remove todos os registros permanentemente</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Sobre ── */}
        <Text style={styles.sectionTitle}>Sobre o App</Text>
        <View style={[styles.card, styles.aboutCard]}>
          <Text style={styles.appName}>Dondevem? Dondevai?</Text>
          <Text style={styles.appVersion}>Versão 0.2.0</Text>
          <View style={styles.aboutDivider} />
          <Text style={styles.aboutItem}>🔒 Dados armazenados somente no seu celular</Text>
          <Text style={styles.aboutItem}>📵 Sem internet, sem nuvem, sem anúncios</Text>
          <View style={styles.aboutDivider} />
          <Text style={styles.aboutAuthor}>Desenvolvido por GTanakaa</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { padding: 24, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  bgImage: { position: 'absolute', width: '150%', height: '150%', opacity: 0.07, resizeMode: 'cover' },

  backButton: { marginBottom: 15 },
  backButtonText: { color: '#3498db', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2c3e50', marginBottom: 24 },

  sectionTitle: {
    fontSize: 11, fontWeight: 'bold', color: '#95a5a6',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 10, marginLeft: 4, marginTop: 8,
  },

  card: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, overflow: 'hidden',
  },

  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f2f5',
  },
  settingLabel: { fontSize: 15, color: '#2c3e50', fontWeight: '600' },
  settingDesc: { fontSize: 12, color: '#95a5a6', marginTop: 2 },

  // Limite de orçamento
  limiteContainer: { padding: 16, gap: 12 },
  limiteInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8f9fa', borderRadius: 10,
    borderWidth: 1, borderColor: '#e1e5eb', paddingHorizontal: 14,
  },
  limitePrefix: { fontSize: 18, fontWeight: 'bold', color: '#7f8c8d', marginRight: 8 },
  limiteInput: { flex: 1, fontSize: 22, fontWeight: 'bold', color: '#2c3e50', paddingVertical: 12 },
  limiteSalvarBtn: {
    backgroundColor: '#f39c12', borderRadius: 10,
    padding: 13, alignItems: 'center',
  },
  limiteSalvarTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  limitePreview: {
    backgroundColor: '#fef9f0', borderRadius: 8,
    padding: 12, borderLeftWidth: 3, borderLeftColor: '#f39c12',
  },
  limitePreviewTxt: { fontSize: 13, color: '#7f8c8d', lineHeight: 18 },

  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  dangerIcon: { fontSize: 22 },
  dangerLabel: { fontSize: 15, color: '#e74c3c', fontWeight: '600' },
  dangerDesc: { fontSize: 12, color: '#95a5a6', marginTop: 2 },

  aboutCard: { alignItems: 'center', padding: 24 },
  appName: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  appVersion: { fontSize: 13, color: '#95a5a6' },
  aboutDivider: { height: 1, backgroundColor: '#f0f2f5', width: '100%', marginVertical: 14 },
  aboutItem: { fontSize: 13, color: '#7f8c8d', marginBottom: 6 },
  aboutAuthor: { fontSize: 13, color: '#95a5a6', fontStyle: 'italic' },
});