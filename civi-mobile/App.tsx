import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const appUrl = process.env.EXPO_PUBLIC_CIVICGO_URL;

export default function App() {
  if (!appUrl) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.emptyState} edges={['top', 'right', 'bottom', 'left']}>
          <StatusBar style="dark" />
          <Text style={styles.title}>CiviTm mobile</Text>
          <Text style={styles.message}>
            Seteaza EXPO_PUBLIC_CIVICGO_URL catre aplicatia web CivicGo, apoi porneste din nou Expo.
          </Text>
          <Text style={styles.example}>EXPO_PUBLIC_CIVICGO_URL=http://192.168.1.20:5173</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <WebView
          source={{ uri: appUrl }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          startInLoadingState
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          originWhitelist={['http://*', 'https://*']}
          contentInsetAdjustmentBehavior="never"
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color="#15803d" />
            </View>
          )}
          renderError={() => (
            <View style={styles.emptyState}>
              <Text style={styles.title}>CiviTm nu s-a incarcat</Text>
              <Text style={styles.message}>Verifica URL-ul, conexiunea si daca web app-ul ruleaza.</Text>
            </View>
          )}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fee7',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#f7fee7',
  },
  title: {
    color: '#14532d',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: '#365314',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  example: {
    color: '#166534',
    fontSize: 13,
    textAlign: 'center',
  },
});
