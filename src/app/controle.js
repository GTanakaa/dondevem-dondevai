import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CurrencyInput from 'react-native-currency-input';

const STORAGE_KEY = '@minhas_financas:transacoes';

// --- CATEGORIAS E SUBCATEGORIAS ---
const EXPENSE_CATEGORIES = {
  'Comida': {
    'Restaurante': null,
    'Fast-food': null,
    'iFood': null,
    'Carne (Churrasco)': null,
    'Mercado': null,
    'Bebidas': ['Cerveja', 'Destilados', 'Vinhos', 'Água', 'Sucos'] // Sub-subcategorias
  },
  'Investimento': {
    'ETFs': null,
    'FIIs': null,
    'Ações': null,
    'Criptos': null,
    'CDI': null,
    'Tesouro Direto': null,
    'LCI/LCA': null,
    'Poupança': null
  },
  'Roupa': {
    'Dia a dia (Camisetas/Calças)': null,
    'Calçados': null,
    'Acessórios (Bolsas/Óculos)': null,
    'Roupa Íntima/Meias': null,
    'Inverno/Casacos': null,
    'Roupas Esportivas': null
  },
  'Lazer': {
    'Cinema': null,
    'Futebol': null,
    'Jogo/Video-Game': null,
    'Teatro': null,
    'Show': null,
    'SPA': null,
    'Viagem': null,
    'Academia': null,
    'Outras atividades físicas': null
  },
  'Outros': null
};

const INCOME_CATEGORIES = {
  'CLT': null,
  'Contrato PJ': null,
  'Investimentos': null,
  'Outros': null
};

export default function Controle() {
  const router = useRouter();
  
  // Estados principais
  const [transactionType, setTransactionType] = useState('outcome');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [transactions, setTransactions] = useState([]);

  // Estados dos menus em cascata
  const [category, setCategory] = useState('Comida');
  const [subCategory, setSubCategory] = useState('Restaurante');
  const [subSubCategory, setSubSubCategory] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const storedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedData !== null) setTransactions(JSON.parse(storedData));
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar os dados.");
      }
    }
    loadData();
  }, []);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  // Button Ganho e Gasto
  const handleTypeChange = (type) => {
    setTransactionType(type);
    const initialCategory = type === 'income' ? 'CLT' : 'Comida';
    handleCategoryChange(initialCategory, type);
    setDescription('');
  };

  // Categoria >>  subcategorias
  const handleCategoryChange = (selectedCategory, currentType = transactionType) => {
    setCategory(selectedCategory);
    
    const currentStructure = currentType === 'outcome' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const subs = currentStructure[selectedCategory];

    if (subs && typeof subs === 'object' && !Array.isArray(subs)) {
      const firstSub = Object.keys(subs)[0];
      setSubCategory(firstSub);
      
      const subSubs = subs[firstSub];
      setSubSubCategory(subSubs && Array.isArray(subSubs) ? subSubs[0] : '');
    } else {
      setSubCategory('');
      setSubSubCategory('');
    }
  };

  // Quando a Subcategoria muda, verifica se existem sub-subcategorias
  const handleSubCategoryChange = (selectedSub) => {
    setSubCategory(selectedSub);
    
    const currentStructure = transactionType === 'outcome' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const subSubs = currentStructure[category][selectedSub];
    
    setSubSubCategory(subSubs && Array.isArray(subSubs) ? subSubs[0] : '');
  };

  const handleAddTransaction = async () => {
    if (!amount || amount <= 0) {
      Alert.alert("Aviso", "Por favor, insira um valor válido maior que zero.");
      return;
    }

    // Monta o baseado nas subcategorias escolhidas
    let subDetails = [];
    if (subCategory) subDetails.push(subCategory);
    if (subSubCategory) subDetails.push(subSubCategory);

    let prefix = subDetails.length > 0 ? `[${subDetails.join(' > ')}] ` : '';
    
    //  PJ sem nome
    let userText = description;
    if (transactionType === 'income' && category === 'Contrato PJ' && description === '') {
      userText = 'Empresa não informada';
    }

    // Se o usuário não digitou nada, salva. Se digitou, adiciona um hífen.
    let finalDescription = userText ? `${prefix}- ${userText}` : prefix.trim();

    const newTransaction = {
      id: Math.random().toString(),
      type: transactionType,
      category: category, // Mantém a categoria macro pura para os gráficos não quebrarem
      description: finalDescription,
      amount: amount,
      date: date.toLocaleDateString('pt-BR')
    };

    const updatedTransactions = [newTransaction, ...transactions];
    
    try {
      setTransactions(updatedTransactions);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTransactions));
      setAmount(0);
      setDescription('');
      setDate(new Date());
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar a transação.");
    }
  };

  const handleDeleteTransaction = (id) => {
    Alert.alert("Apagar", "Tem certeza que deseja remover esta transação?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: async () => {
          const updatedTransactions = transactions.filter(t => t.id !== id);
          setTransactions(updatedTransactions);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTransactions));
        }
      }
    ]);
  };

  const currentStructure = transactionType === 'outcome' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const mainCategories = Object.keys(currentStructure);
  const hasSubCategories = currentStructure[category] !== null;
  const hasSubSubCategories = hasSubCategories && Array.isArray(currentStructure[category][subCategory]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>⬅ Voltar ao Menu</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Novo Registro</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, transactionType === 'outcome' && styles.tabActiveOutcome]} onPress={() => handleTypeChange('outcome')}>
          <Text style={[styles.tabText, transactionType === 'outcome' && styles.tabTextActive]}>Gasto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, transactionType === 'income' && styles.tabActiveIncome]} onPress={() => handleTypeChange('income')}>
          <Text style={[styles.tabText, transactionType === 'income' && styles.tabTextActive]}>Ganho</Text>
        </TouchableOpacity>
      </View>

      {/* 1. PICKER PRINCIPAL */}
      <Text style={styles.labelPicker}>Categoria Principal:</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={category} onValueChange={(val) => handleCategoryChange(val)} style={styles.picker}>
          {mainCategories.map((cat) => <Picker.Item key={cat} label={cat} value={cat} />)}
        </Picker>
      </View>

      {/* 2. PICKER SUBCATEGORIA (Aparece se existir) */}
      {hasSubCategories && (
        <>
          <Text style={styles.labelPicker}>Subcategoria:</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={subCategory} onValueChange={(val) => handleSubCategoryChange(val)} style={styles.picker}>
              {Object.keys(currentStructure[category]).map((sub) => <Picker.Item key={sub} label={sub} value={sub} />)}
            </Picker>
          </View>
        </>
      )}

      {/* 3. PICKER SUB-SUBCATEGORIA (Aparece para Bebidas) */}
      {hasSubSubCategories && (
        <>
          <Text style={styles.labelPicker}>Qual Tipo?</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={subSubCategory} onValueChange={(val) => setSubSubCategory(val)} style={styles.picker}>
              {currentStructure[category][subCategory].map((subSub) => <Picker.Item key={subSub} label={subSub} value={subSub} />)}
            </Picker>
          </View>
        </>
      )}

      {/* INPUT VALOR */}
      <CurrencyInput
        value={amount}
        onChangeValue={setAmount}
        prefix="R$ "
        delimiter="."
        separator=","
        precision={2}
        minValue={0}
        style={styles.input}
        keyboardType="numeric"
      />

      {/* INPUT DATA */}
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateText}>📅 Data: {date.toLocaleDateString('pt-BR')}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* INPUT DESCRIÇÃO */}
      <TextInput 
        placeholder={category === 'Contrato PJ' ? "Qual empresa/serviço?" : "Notas extras (Opcional)"} 
        style={styles.input}
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleAddTransaction}>
        <Text style={styles.saveButtonText}>Adicionar Registro</Text>
      </TouchableOpacity>

      {/* HISTÓRICO RECENTE */}
      <View style={styles.divider} />
      <Text style={styles.label}>Últimos 5 Registros:</Text>
      
      <View style={{ paddingBottom: 40 }}>
        {transactions.slice(0, 5).map((item) => (
          <TouchableOpacity 
            key={item.id}
            style={styles.transactionItem} 
            onLongPress={() => handleDeleteTransaction(item.id)} 
            delayLongPress={500}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.transactionCategory}>{item.category}</Text>
              {item.description ? <Text style={styles.transactionDesc}>{item.description}</Text> : null}
              <Text style={styles.transactionDate}>{item.date}</Text>
            </View>
            <Text style={{ fontWeight: 'bold', color: item.type === 'income' ? '#2ecc71' : '#e74c3c' }}>
              {item.type === 'income' ? '+' : '-'} R$ {item.amount.toFixed(2)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, backgroundColor: '#f0f2f5', paddingTop: 50 },
  backButton: { marginBottom: 15 },
  backButtonText: { color: '#3498db', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#e1e5eb', borderRadius: 8, marginBottom: 15, padding: 4 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 6 },
  tabActiveOutcome: { backgroundColor: '#e74c3c' },
  tabActiveIncome: { backgroundColor: '#2ecc71' },
  tabText: { fontWeight: 'bold', color: '#7f8c8d' },
  tabTextActive: { color: '#fff' },
  
  labelPicker: { fontSize: 13, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 5, marginLeft: 2 },
  pickerContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ecf0f1', borderRadius: 8, marginBottom: 12, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ecf0f1', fontSize: 16 },
  dateButton: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ecf0f1' },
  dateText: { fontSize: 16, color: '#2c3e50' },
  
  saveButton: { backgroundColor: '#3498db', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  divider: { height: 1, backgroundColor: '#bdc3c7', marginVertical: 20 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#34495e', marginBottom: 10 },
  
  transactionItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#ecf0f1' },
  transactionCategory: { fontWeight: 'bold', fontSize: 15, color: '#2c3e50' },
  transactionDesc: { fontSize: 13, color: '#7f8c8d', marginTop: 3 },
  transactionDate: { fontSize: 11, color: '#bdc3c7', marginTop: 5 }
});