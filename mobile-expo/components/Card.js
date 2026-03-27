import { View, Text, StyleSheet } from 'react-native';

export default function Card({ title, subtitle, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.16)',
    gap: 10,
  },
  title: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 18,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
  },
});
