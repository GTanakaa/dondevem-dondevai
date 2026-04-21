import { useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MENU_ITEMS = [
  {
    rota: '/resumo',
    icone: '📈',
    titulo: 'Resumo Geral',
    subtitulo: 'Resumo dos gastos e ganhos',
    cor: '#3498db',
  },
  {
    rota: '/controle',
    icone: '💸',
    titulo: 'Controle-se',
    subtitulo: 'Adicionar gastos e ganhos',
    cor: '#e74c3c',
  },
  {
    rota: '/ranking',
    icone: '🏆',
    titulo: 'Ranking',
    subtitulo: 'Seu top tier de gastos do mês',
    cor: '#f39c12',
  },
  {
    rota: '/historico',
    icone: '📝',
    titulo: 'Histórico',
    subtitulo: 'Lista completa de transações',
    cor: '#8e44ad',
  },
  {
    rota: '/exportacao',
    icone: '📊',
    titulo: 'Exportar para Planilha',
    subtitulo: 'Gerar arquivo Excel com seus dados',
    cor: '#27ae60',
    destaque: true,   // borda verde para diferenciar
  },
  {
    rota: '/configuracoes',
    icone: '⚙️',
    titulo: 'Configurações',
    subtitulo: 'Ajustes e gestão de dados',
    cor: '#7f8c8d',
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Fundo desfocado */}
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.backgroundImage}
        blurRadius={15}
      />

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
      </View>

      {/* Menu */}
      <ScrollView
        style={styles.menuScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuContainer}
      >
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.rota}
            style={[
              styles.button,
              item.destaque && { borderColor: item.cor, borderWidth: 1.5 },
            ]}
            onPress={() => router.push(item.rota)}
            activeOpacity={0.75}
          >
            {/* Barra colorida lateral */}
            <View style={[styles.colorBar, { backgroundColor: item.cor }]} />

            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>
                {item.icone} {item.titulo}
              </Text>
              <Text style={styles.buttonSubText}>{item.subtitulo}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
  },

  backgroundImage: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    opacity: 0.1,
    resizeMode: 'cover',
  },

  logoContainer: {
    marginTop: 60,
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    width: 280,
    height: 160,
    resizeMode: 'contain',
  },

  menuScroll: { width: '100%' },
  menuContainer: { paddingHorizontal: 24, paddingBottom: 10 },

  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  colorBar: {
    width: 4,
    alignSelf: 'stretch',
  },

  buttonContent: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 3,
  },
  buttonSubText: {
    fontSize: 13,
    color: '#7f8c8d',
  },
});