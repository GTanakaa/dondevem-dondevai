import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

const STORAGE_KEY = '@minhas_financas:transacoes';

// COMPONENTE DO CONTADOR ANIMADO
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function AnimatedNumber({ finalValue }) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(finalValue, { 
      duration: 1500,
      easing: Easing.out(Easing.exp)
    });
  }, [finalValue]);

  const animatedProps = useAnimatedProps(() => {
    const formatted = 'R$ ' + animatedValue.value.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return {
      text: formatted,
    };
  });

  return (
    <AnimatedTextInput
      defaultValue="R$ 0,00"
      editable={false}
      animatedProps={animatedProps}
      style={styles.totalValue} 
    />
  );
}

export default function Resumo() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalGastos, setTotalGastos] = useState(0);
  const [totalGanhos, setTotalGanhos] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadResumeData();
    }, [])
  );

  const loadResumeData = async () => {
    setLoading(true);
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData !== null) {
        const transactions = JSON.parse(storedData);
        
        let gastos = 0;
        let ganhos = 0;

        transactions.forEach(t => {
          if (t.type === 'outcome') gastos += t.amount;
          if (t.type === 'income') ganhos += t.amount;
        });

        setTotalGastos(gastos);
        setTotalGanhos(ganhos);
      }
    } catch (error) {
      console.error("Erro ao carregar resumo", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBR = (value) => {
    return 'R$ ' + value.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  const saldo = totalGanhos - totalGastos;

  return (
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

      <Text style={styles.title}>Resumo Geral</Text>

      {/* CARTAO PRINCIPAL COM CONTADOR DINAMICO */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Gasto no Mês</Text>
        <AnimatedNumber finalValue={totalGastos} />
      </View>

      {/* INFORMAÇÕES EXTRAS */}
      <View style={styles.infoRow}>
        <View style={[styles.infoCard, { borderLeftColor: '#2ecc71', borderLeftWidth: 4 }]}>
          <Text style={styles.infoLabel}>Entradas</Text>
          <Text style={[styles.infoValue, { color: '#2ecc71' }]}>{formatBR(totalGanhos)}</Text>
        </View>

        <View style={[styles.infoCard, { borderLeftColor: saldo >= 0 ? '#3498db' : '#e74c3c', borderLeftWidth: 4 }]}>
          <Text style={styles.infoLabel}>Saldo Atual</Text>
          <Text style={[styles.infoValue, { color: saldo >= 0 ? '#3498db' : '#e74c3c' }]}>
            {formatBR(saldo)}
          </Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 20, paddingTop: 50 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  backButton: { marginBottom: 15 },
  backButtonText: { color: '#3498db', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginBottom: 25, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 25, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, color: '#7f8c8d', fontWeight: 'bold', textTransform: 'uppercase' },
  
  // Estilo do componente dinamico
  totalValue: { fontSize: 38, fontWeight: 'bold', color: '#e74c3c', marginTop: 10, textAlign: 'center' },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  infoCard: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 10, marginHorizontal: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  infoLabel: { fontSize: 12, color: '#95a5a6', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 5 },
  infoValue: { fontSize: 16, fontWeight: 'bold' }
});