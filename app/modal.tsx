import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Typography } from '@/components/ui/typography';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <Typography variant="title">This is a modal</Typography>
      <Link href="/" dismissTo style={styles.link}>
        <Typography variant="link">Go to home screen</Typography>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
