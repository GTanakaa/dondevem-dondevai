import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      
      {/* Título */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleGreen}>Dondevem?</Text>
        <Text style={styles.titleRed}>Dondevai?</Text>
      </View>

      {/* Menu de Buttons */}
      <View style={styles.menuContainer}>
        
        <TouchableOpacity 
          style={styles.button} 
           onPress={() => router.push('/resumo')}
        >
          <Text style={styles.buttonText}>Resumo geral</Text>
          <Text style={styles.buttonSubText}>Gráficos de pizza com porcentagens</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/controle')}
        >
          <Text style={styles.buttonText}>Controle-se</Text>
          <Text style={styles.buttonSubText}>Adicionar gastos e ganhos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/ranking')}
        >
          <Text style={styles.buttonText}>Ranking</Text>
          <Text style={styles.buttonSubText}>Seu top tier de gastos do mês</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/historico')}
        >
          <Text style={styles.buttonText}>Histórico</Text>
          <Text style={styles.buttonSubText}>Lista completa de transações</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 30,
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  titleGreen: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2ecc71', 
    fontStyle: 'italic',
  },
  titleRed: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e74c3c', 
    fontStyle: 'italic',
    marginLeft: 40, 
  },
  menuContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e1e5eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2, 
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  buttonSubText: {
    fontSize: 13,
    color: '#7f8c8d',
  }
});