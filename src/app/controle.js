import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CurrencyInput from 'react-native-currency-input';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTransacoes } from '../hooks/useTransacoes';
import { formatarMoeda } from '../utils/formatadores';

const { width, height } = Dimensions.get('window');

const EXPENSE_CATEGORIES = {
  'Comida': {
    'Restaurante': null, 'Fast-food': null, 'iFood': null,
    'Carne (Churrasco)': null, 'Mercado': null,
    'Bebidas': ['Cerveja', 'Destilados', 'Vinhos', 'Água', 'Sucos'],
  },
  'Investimento': {
    'ETFs': null, 'FIIs': null, 'Ações': null, 'Criptos': null,
    'CDI': null, 'Tesouro Direto': null, 'LCI/LCA': null, 'Poupança': null,
  },
  'Roupa': {
    'Dia a dia (Camisetas/Calças)': null, 'Calçados': null,
    'Acessórios (Bolsas/Óculos)': null, 'Roupa Íntima/Meias': null,
    'Inverno/Casacos': null, 'Roupas Esportivas': null,
  },
  'Lazer': {
    'Cinema': null, 'Futebol': null, 'Jogo/Video-Game': null, 'Teatro': null,
    'Show': null, 'SPA': null, 'Viagem': null, 'Academia': null,
    'Outras atividades físicas': null,
  },
  'Outros': null,
};

const INCOME_CATEGORIES = {
  'CLT': null, 'Contrato PJ': null, 'Investimentos': null, 'Outros': null,
};

export default function Controle() {
  const router = useRouter();
  const { transacoes, carregar, adicionar, remover } = useTransacoes();

  const [transactionType, setTransactionType] = useState('outcome');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('Comida');
  const [subCategory, setSubCategory] = useState('Restaurante');
  const [subSubCategory, setSubSubCategory] = useState('');
  const [showVideo, setShowVideo] = useState(false);

  // Carrega os dados ao montar a tela
  useEffect(() => { carregar(); }, []);

  // ── Handlers de tipo e categoria ──────────────────────────────────────────
  const handleTypeChange = (type) => {
    setTransactionType(type);
    handleCategoryChange(type === 'income' ? 'CLT' : 'Comida', type);
    setDescription('');
    setAmount(0);
  };

  const handleCategoryChange = (selectedCategory, currentType = transactionType) => {
    setCategory(selectedCategory);
    const structure = currentType === 'outcome' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const subs = structure[selectedCategory];
    if (subs && typeof subs === 'object' && !Array.isArray(subs)) {
      const firstSub = Object.keys(subs)[0];
      setSubCategory(firstSub);
      const subSubs = subs[firstSub];
      setSubSubCategory(Array.isArray(subSubs) ? subSubs[0] : '');
    } else {
      setSubCategory('');
      setSubSubCategory('');
    }
  };

  // ── DatePicker — comportamento diferente iOS vs Android ───────────────────
  const handleDateChange = (event, selectedDate) => {
    // No Android, fecha automaticamente ao selecionar; no iOS fica aberto
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleConfirmDateIOS = () => setShowDatePicker(false);

  // ── Adicionar transação ───────────────────────────────────────────────────
  const handleAddTransaction = async () => {
    if (!amount || amount <= 0) {
      Alert.alert('Aviso', 'Por favor, insira um valor válido.');
      return;
    }

    const subDetails = [subCategory, subSubCategory].filter(Boolean);
    const prefix = subDetails.length > 0 ? `[${subDetails.join(' > ')}] ` : '';
    const finalDescription = description ? `${prefix}- ${description}` : prefix.trim();

    const newTransaction = {
      id: Date.now().toString(),
      type: transactionType,
      category,
      description: finalDescription,
      amount,
      date: date.toLocaleDateString('pt-BR'),
    };

    try {
      await adicionar(newTransaction);
      if (transactionType === 'income') {
        setShowVideo(true);
        setTimeout(() => setShowVideo(false), 2500);
      }
      setAmount(0);
      setDescription('');
    } catch {
      Alert.alert('Erro', 'Falha ao salvar. Tente novamente.');
    }
  };

  // ── Deletar transação ─────────────────────────────────────────────────────
  const handleDeleteTransaction = (id) => {
    Alert.alert('Apagar', 'Tem certeza que deseja remover esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar', style: 'destructive',
        onPress: async () => {
          try { await remover(id); } catch { Alert.alert('Erro', 'Não foi possível apagar.'); }
        },
      },
    ]);
  };

  const currentStructure = transactionType === 'outcome' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const hasSubCategories = currentStructure[category] !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.bgImage}
          resizeMode="cover"
          blurRadius={15}
        />

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>⬅ Voltar ao Menu</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Novo Registro</Text>

        {/* Tab Gasto / Ganho */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, transactionType === 'outcome' && styles.tabActiveOutcome]}
            onPress={() => handleTypeChange('outcome')}
          >
            <Text style={[styles.tabText, transactionType === 'outcome' && styles.tabTextActive]}>
              Gasto
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, transactionType === 'income' && styles.tabActiveIncome]}
            onPress={() => handleTypeChange('income')}
          >
            <Text style={[styles.tabText, transactionType === 'income' && styles.tabTextActive]}>
              Ganho
            </Text>
          </TouchableOpacity>
        </View>

        {/* Categoria principal — chips */}
        <Text style={[styles.label, styles.labelMb]}>Categoria Principal</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          {Object.keys(currentStructure).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                category === cat && (transactionType === 'outcome' ? styles.chipActiveOutcome : styles.chipActiveIncome),
              ]}
              onPress={() => handleCategoryChange(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Subcategoria — chips */}
        {hasSubCategories && (
          <>
            <Text style={[styles.label, styles.labelMb]}>Subcategoria</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
              style={styles.chipsScroll}
            >
              {Object.keys(currentStructure[category]).map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={[
                    styles.chip,
                    subCategory === sub && (transactionType === 'outcome' ? styles.chipActiveOutcome : styles.chipActiveIncome),
                  ]}
                  onPress={() => setSubCategory(sub)}
                >
                  <Text style={[styles.chipText, subCategory === sub && styles.chipTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Valor */}
        <Text style={[styles.label, styles.labelMb]}>Valor</Text>
        <CurrencyInput
          value={amount}
          onChangeValue={setAmount}
          prefix="R$ "
          delimiter="."
          separator=","
          precision={2}
          style={styles.input}
          keyboardType="numeric"
          placeholderTextColor="#bdc3c7"
        />

        {/* Data */}
        <Text style={[styles.label, styles.labelMb]}>Data</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>📅 {date.toLocaleDateString('pt-BR')}</Text>
        </TouchableOpacity>

        {/* DatePicker — iOS mostra modal com botão confirmar */}
        {showDatePicker && Platform.OS === 'ios' && (
          <Modal transparent animationType="slide">
            <View style={styles.dateModalOverlay}>
              <View style={styles.dateModalBox}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  locale="pt-BR"
                  textColor="#2c3e50"
                />
                <TouchableOpacity style={styles.dateConfirmBtn} onPress={handleConfirmDateIOS}>
                  <Text style={styles.dateConfirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* DatePicker Android (inline) */}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Notas extras */}
        <Text style={[styles.label, styles.labelMb]}>Notas (Opcional)</Text>
        <TextInput
          placeholder="Ex: almoço com cliente"
          placeholderTextColor="#bdc3c7"
          style={styles.input}
          value={description}
          onChangeText={setDescription}
        />

        {/* Botão salvar */}
        <TouchableOpacity style={styles.saveButton} onPress={handleAddTransaction}>
          <Text style={styles.saveButtonText}>Adicionar Registro</Text>
        </TouchableOpacity>

        {/* Últimos 5 registros */}
        <View style={styles.divider} />
        <View style={styles.ultimosHeader}>
          <Text style={styles.label}>Últimos registros — arraste para apagar</Text>
          <TouchableOpacity onPress={() => router.push('/historico')}>
            <Text style={styles.verTodosLink}>Ver todos →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingBottom: 40 }}>
          {transacoes.slice(0, 5).map((item) => (
            <Swipeable
              key={item.id}
              renderRightActions={() => (
                <View style={styles.deleteSwipeBox}>
                  <Text style={styles.deleteSwipeText}>🗑️ Apagar</Text>
                </View>
              )}
              onSwipeableOpen={() => handleDeleteTransaction(item.id)}
            >
              <View style={styles.transactionItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.transactionCategory}>{item.category}</Text>
                  {item.description ? (
                    <Text style={styles.transactionDesc} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                  <Text style={styles.transactionDate}>{item.date}</Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: item.type === 'income' ? '#2ecc71' : '#e74c3c' },
                ]}>
                  {item.type === 'income' ? '+' : '-'} {formatarMoeda(item.amount)}
                </Text>
              </View>
            </Swipeable>
          ))}
        </View>
      </ScrollView>

      {/* GIF de comemoracao ao adicionar ganho */}
      <Modal visible={showVideo} transparent>
        <Animated.View
          entering={FadeIn.duration(500)}
          exiting={FadeOut.duration(500)}
          style={styles.videoOverlay}
        >
          <Image
            source={require('../../assets/videos/moneydrop.gif')}
            style={{ width, height }}
            resizeMode="contain"
          />
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f2f5' },
  container: { flex: 1, padding: 25, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  bgImage: { position: 'absolute', width: '150%', height: '150%', opacity: 0.08 },

  backButton: { marginBottom: 15 },
  backButtonText: { color: '#3498db', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50' },

  tabContainer: {
    flexDirection: 'row', backgroundColor: '#e1e5eb',
    borderRadius: 10, marginBottom: 20, padding: 4,
  },
  tab: { flex: 1, padding: 11, alignItems: 'center', borderRadius: 8 },
  tabActiveOutcome: { backgroundColor: '#e74c3c' },
  tabActiveIncome: { backgroundColor: '#2ecc71' },
  tabText: { fontWeight: 'bold', color: '#7f8c8d', fontSize: 15 },
  tabTextActive: { color: '#fff' },

  label: { fontSize: 12, fontWeight: 'bold', color: '#95a5a6', marginLeft: 2, textTransform: 'uppercase' },
  labelMb: { marginBottom: 6 },

  // Chips de categoria
  chipsScroll: { marginBottom: 16 },
  chipsRow: { gap: 8, paddingVertical: 2, paddingHorizontal: 1 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#dde1e7',
  },
  chipActiveOutcome: { backgroundColor: '#e74c3c', borderColor: '#e74c3c' },
  chipActiveIncome:  { backgroundColor: '#2ecc71', borderColor: '#2ecc71' },
  chipText: { fontSize: 13, color: '#7f8c8d', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },

  // Header dos últimos registros
  ultimosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  verTodosLink: { fontSize: 13, color: '#3498db', fontWeight: 'bold' },

  input: {
    backgroundColor: '#fff', padding: 15, borderRadius: 10,
    marginBottom: 16, borderWidth: 1, borderColor: '#ecf0f1', fontSize: 16, color: '#2c3e50',
  },
  dateText: { fontSize: 16, color: '#2c3e50' },

  // DatePicker iOS modal
  dateModalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dateModalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30,
  },
  dateConfirmBtn: {
    marginHorizontal: 20, marginTop: 4, backgroundColor: '#3498db',
    borderRadius: 10, padding: 14, alignItems: 'center',
  },
  dateConfirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  saveButton: { backgroundColor: '#3498db', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 4 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#e1e5eb', marginVertical: 20 },

  transactionItem: {
    backgroundColor: '#fff', padding: 15, borderRadius: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, borderWidth: 1, borderColor: '#ecf0f1',
  },
  transactionCategory: { fontWeight: 'bold', color: '#2c3e50', fontSize: 15 },
  transactionDesc: { fontSize: 12, color: '#95a5a6', marginTop: 2 },
  transactionDate: { fontSize: 11, color: '#bdc3c7', marginTop: 3 },
  transactionAmount: { fontWeight: 'bold', fontSize: 15 },

  deleteSwipeBox: {
    backgroundColor: '#e74c3c', justifyContent: 'center', alignItems: 'flex-end',
    paddingRight: 20, borderRadius: 10, marginBottom: 10, flex: 1,
  },
  deleteSwipeText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  videoOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
});