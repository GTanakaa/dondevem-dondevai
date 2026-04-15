// src/components/Button/index.tsx
import React from 'react';
import { Text, TouchableOpacity } from 'react-native'; // 1. Importações
import { styles } from './styles'; // 2. Importa os estilos

interface ButtonProps { // 3. Define as Props
  title: string;
  onPress: () => void;
}

export function Button({ title, onPress, ...rest }: ButtonProps) { // 4. Componente Button
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} {...rest}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}