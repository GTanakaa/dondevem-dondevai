import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { styles } from './styles';

interface ButtonProps {
  title: string;
  onPress: () => void;
}

export function Button({ title, onPress, ...rest }: ButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} {...rest}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}