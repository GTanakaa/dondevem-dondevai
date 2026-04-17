import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      
      {/* PLANO DE FUNDO DESFOCADO */}
      <Image 
        source={require('../../assets/images/logo.png')} 
        style={styles.backgroundImage}
        blurRadius={15}
      />

      {/* LOGOTIPO PRINCIPAL */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo}
        />
      </View>

      {/* Menu de Botões */}
      <View style={styles.menuContainer}>
        
        <TouchableOpacity style={styles.button} onPress={() => router.push('/resumo')}>
          <Text style={styles.buttonText}>📈 Resumo geral</Text>
          <Text style={styles.buttonSubText}>Resumo dos gastos e ganhos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/controle')}>
          <Text style={styles.buttonText}>💸Controle-se</Text>
          <Text style={styles.buttonSubText}>Adicionar gastos e ganhos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/ranking')}>
          <Text style={styles.buttonText}>🏆 Ranking</Text>
          <Text style={styles.buttonSubText}>Seu top tier de gastos do mês</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/historico')}>
          <Text style={styles.buttonText}>📝 Histórico</Text>
          <Text style={styles.buttonSubText}>Lista completa de transações</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/configuracoes')}>
            <Text style={styles.buttonText}>⚙️ Configurações</Text>
            <Text style={styles.buttonSubText}>Ajustes e gestão de dados</Text>
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
    alignItems: 'center', 
  },
  
  // Fundo Desfocado
  backgroundImage: {
    position: 'absolute',
    width: '150%', 
    height: '150%',
    opacity: 0.1,
    resizeMode: 'cover',
  },

  // Logotipo Principal
  logoContainer: {
    marginBottom: 50,
    alignItems: 'center',
  },
  logo: {
    width: 320,  
    height: 180, 
    resizeMode: 'contain', 
  },

  menuContainer: { width: '100%' },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2, 
  },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  buttonSubText: { fontSize: 13, color: '#7f8c8d' }
});