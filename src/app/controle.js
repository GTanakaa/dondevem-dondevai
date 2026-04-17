import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CurrencyInput from 'react-native-currency-input';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const STORAGE_KEY = '@minhas_financas:transacoes';
const { width, height } = Dimensions.get('window');

const EXPENSE_CATEGORIES = {
  'Comida': { 'Restaurante': null, 'Fast-food': null, 'iFood': null, 'Carne (Churrasco)': null, 'Mercado': null, 'Bebidas': ['Cerveja', 'Destilados', 'Vinhos', 'Água', 'Sucos'] },
  'Investimento': { 'ETFs': null, 'FIIs': null, 'Ações': null, 'Criptos': null, 'CDI': null, 'Tesouro Direto': null, 'LCI/LCA': null, 'Poupança': null },
  'Roupa': { 'Dia a dia (Camisetas/Calças)': null, 'Calçados': null, 'Acessórios (Bolsas/Óculos)': null, 'Roupa Íntima/Meias': null, 'Inverno/Casacos': null, 'Roupas Esportivas': null },
  'Lazer': { 'Cinema': null, 'Futebol': null, 'Jogo/Video-Game': null, 'Teatro': null, 'Show': null, 'SPA': null, 'Viagem': null, 'Academia': null, 'Outras atividades físicas': null },
  'Outros': null
};
const INCOME_CATEGORIES = { 'CLT': null, 'Contrato PJ': null, 'Investimentos': null, 'Outros': null };

export default function Controle() {
  const router = useRouter();
  const [transactionType, setTransactionType] = useState('outcome');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [category, setCategory] = useState('Comida');
  const [subCategory, setSubCategory] = useState('Restaurante');
  const [subSubCategory, setSubSubCategory] = useState('');

  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const storedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedData !== null) setTransactions(JSON.parse(storedData));
      } catch (error) {}
    }
    loadData();
  }, []);

  const handleTypeChange = (type) => {
    setTransactionType(type);
    handleCategoryChange(type === 'income' ? 'CLT' : 'Comida', type);
    setDescription('');
  };

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
      setSubCategory(''); setSubSubCategory('');
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const handleAddTransaction = async () => {
    if (!amount || amount <= 0) {
      Alert.alert("Aviso", "Por favor, insira um valor válido.");
      return;
    }

    let subDetails = [];
    if (subCategory) subDetails.push(subCategory);
    if (subSubCategory) subDetails.push(subSubCategory);
    let prefix = subDetails.length > 0 ? `[${subDetails.join(' > ')}] ` : '';
    let finalDescription = description ? `${prefix}- ${description}` : prefix.trim();

    const newTransaction = {
      id: Math.random().toString(),
      type: transactionType,
      category,
      description: finalDescription,
      amount,
      date: date.toLocaleDateString('pt-BR')
    };

    try {
      const updated = [newTransaction, ...transactions];
      setTransactions(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      if (transactionType === 'income') {
        setShowVideo(true);
        // GIF 2.5 segundos
        setTimeout(() => {
          setShowVideo(false);
        }, 2500);
      }

      setAmount(0);
      setDescription('');
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar.");
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
  const hasSubCategories = currentStructure[category] !== null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={{ position: 'absolute', width: '150%', height: '150%', opacity: 0.08 }}
          resizeMode="cover"
          blurRadius={15} 
        />

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

        <Text style={styles.labelPicker}>Categoria Principal:</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={category} onValueChange={(val) => handleCategoryChange(val)} style={styles.picker}>
            {Object.keys(currentStructure).map(cat => (
              <Picker.Item key={cat} label={cat} value={cat} color="#000" /> 
            ))}
          </Picker>
        </View>

        {hasSubCategories && (
          <View style={styles.pickerContainer}>
            <Picker selectedValue={subCategory} onValueChange={(val) => setSubCategory(val)} style={styles.picker}>
              {Object.keys(currentStructure[category]).map(sub => (
                <Picker.Item key={sub} label={sub} value={sub} color="#000" />
              ))}
            </Picker>
          </View>
        )}

        <CurrencyInput
          value={amount}
          onChangeValue={setAmount}
          prefix="R$ "
          delimiter="."
          separator=","
          precision={2}
          style={styles.input}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
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

        <TextInput 
          placeholder="Notas extras (Opcional)" 
          style={styles.input}
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleAddTransaction}>
          <Text style={styles.saveButtonText}>Adicionar Registro</Text>
        </TouchableOpacity>

        <View style={styles.divider} />
        <Text style={styles.labelPicker}>Arraste para a esquerda para apagar</Text>
        
        <View style={{ paddingBottom: 40 }}>
          {transactions.slice(0, 5).map(item => {
            const renderRightActions = () => (
              <View style={styles.deleteSwipeBox}>
                <Text style={styles.deleteSwipeText}>🗑️ Apagar</Text>
              </View>
            );

            return (
              <Swipeable 
                key={item.id}
                renderRightActions={renderRightActions}
                onSwipeableOpen={() => handleDeleteTransaction(item.id)}
              >
                <View style={styles.transactionItem}>
                  <View>
                    <Text style={styles.transactionCategory}>{item.category}</Text>
                    <Text style={styles.transactionDate}>{item.date}</Text>
                  </View>
                  <Text style={{ fontWeight: 'bold', color: item.type === 'income' ? '#2ecc71' : '#e74c3c' }}>
                    {item.type === 'income' ? '+' : '-'} R$ {item.amount.toFixed(2)}
                  </Text>
                </View>
              </Swipeable>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={showVideo} transparent={true}>
        <Animated.View 
          entering={FadeIn.duration(500)} 
          exiting={FadeOut.duration(500)} 
          style={styles.videoOverlay}
        >
          <Image
            source={require('../../assets/videos/moneydrop.gif')}
            style={styles.videoStyle}
            resizeMode="contain"
          />
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, backgroundColor: '#f0f2f5', paddingTop: 50 },
  backButton: { marginBottom: 15 },
  backButtonText: { color: '#3498db', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#e1e5eb', borderRadius: 8, marginBottom: 15, padding: 4 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 6 },
  tabActiveOutcome: { backgroundColor: '#e74c3c' },
  tabActiveIncome: { backgroundColor: '#2ecc71' },
  tabText: { fontWeight: 'bold', color: '#7f8c8d' },
  tabTextActive: { color: '#fff' },
  labelPicker: { fontSize: 13, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 5, marginLeft: 2 },
  
  // CORREÇÃO DO IOS AQUI:
  pickerContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ecf0f1', borderRadius: 8, marginBottom: 10, overflow: 'hidden' },
  picker: { height: Platform.OS === 'android' ? 50 : 150 },
  
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ecf0f1' },
  dateText: { fontSize: 16, color: '#2c3e50' },
  saveButton: { backgroundColor: '#3498db', padding: 15, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#bdc3c7', marginVertical: 20 },
  transactionItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderWidth: 1, borderColor: '#ecf0f1' },
  transactionCategory: { fontWeight: 'bold' },
  transactionDate: { fontSize: 10, color: '#bdc3c7' },
  deleteSwipeBox: { backgroundColor: '#e74c3c', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 20, borderRadius: 8, marginBottom: 10, flex: 1 },
  deleteSwipeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  videoOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  videoStyle: { width: width, height: height }
});