import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = '@minhas_financas:transacoes';

export default function Configuracoes() {
  const router = useRouter();
  
  // Estados Button de Liga/Desliga
  const [notifications, setNotifications] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Apagar todo o banco de dados local
  const handleClearData = () => {
    Alert.alert(
      "Atenção! 🚨",
      "Tem certeza que deseja apagar TODOS os seus registros financeiros? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, Apagar Tudo",
          style: "destructive", 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEY);
              Alert.alert("Sucesso", "Todo o histórico foi apagado.");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível apagar os dados.");
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 1. PLANO DE FUNDO DESFOCADO */}
      <Image 
        source={require('../../assets/images/logo.png')} 
        style={styles.backgroundImage}
        blurRadius={20} 
      />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>⬅ Voltar ao Menu</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Configurações</Text>

      {/* Preferências */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferências</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Lembretes Diários</Text>
          <Switch 
            value={notifications} 
            onValueChange={setNotifications} 
            trackColor={{ true: '#2ecc71', false: '#bdc3c7' }} 
          />
        </View>

        {/* Modo Escuro Atualização Futura */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Modo Escuro (Em breve)</Text>
          <Switch 
            value={isDarkMode} 
            onValueChange={setIsDarkMode} 
            disabled={true} 
          />
        </View>
      </View>

      {/* Gestão de Dados */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gestão de Dados</Text>

        <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
          <Text style={styles.dangerButtonText}>🗑️ Apagar Todo o Histórico</Text>
        </TouchableOpacity>
      </View>

      {/* Sobre */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre o App</Text>
        <View style={styles.aboutBox}>
          <Text style={styles.aboutTextBold}>Dondevem? Dondevai?</Text>
          <Text style={styles.aboutText}>Versão 0.1.0</Text>
          <Text style={styles.aboutText}>Proteção Local First (Seus dados não vão para a internet)</Text>
          <Text style={[styles.aboutText, { marginTop: 10, fontStyle: 'italic' }]}>
            Desenvolvido por GTanakaa
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f0f2f5',
    padding: 25,
    paddingTop: 50,
  },
  backgroundImage: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    opacity: 0.08,
    resizeMode: 'cover',
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
    color: '#2c3e50',
    marginBottom: 25,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7f8c8d',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  settingLabel: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e74c3c', 
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 16,
  },
  aboutBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    alignItems: 'center',
  },
  aboutTextBold: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  aboutText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 2,
  }
});