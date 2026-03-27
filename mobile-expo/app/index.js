import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import Card from '../components/Card';
import { mobileApi } from '../lib/api';
import { parseIneQr } from '../lib/ine';
import { hasNativeOcr, scanIneFrontWithNativeOcr } from '../lib/nativeOcr';

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const TOKEN_KEY = 'budgetpro.session';

const emptyIdentity = {
  fullName: '',
  firstName: '',
  paternalLastName: '',
  maternalLastName: '',
  curp: '',
  claveElector: '',
  cic: '',
  ocr: '',
  address: '',
  section: '',
  phone: '',
  email: '',
};

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [session, setSession] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [form, setForm] = useState(emptyIdentity);
  const [authStatus, setAuthStatus] = useState('');
  const [qrRaw, setQrRaw] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [assistSummary, setAssistSummary] = useState(null);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [ocrAutoStatus, setOcrAutoStatus] = useState('');
  const [month] = useState(new Date().toISOString().slice(0, 7));
  const [dashboard, setDashboard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [question, setQuestion] = useState('¿En qué puedo recortar gasto sin afectar lo esencial?');
  const [answer, setAnswer] = useState('');
  const [movement, setMovement] = useState({ type: 'expense', categoryId: '', amount: '', description: '' });
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('');

  const currentDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (session?.token) {
      loadData();
    }
  }, [session?.token]);

  async function restoreSession() {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return;
    const biometric = await LocalAuthentication.hasHardwareAsync();
    if (biometric) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu identidad para entrar',
        cancelLabel: 'Cancelar',
      });
      if (!result.success) return;
    }
    try {
      const me = await mobileApi.getMe(token);
      setSession({ token, user: me.user });
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  }

  async function loadData() {
    try {
      setStatus('Cargando datos...');
      const [dashboardData, transactionData, categoryData, aiData] = await Promise.all([
        mobileApi.getDashboard(month),
        mobileApi.getTransactions(month),
        mobileApi.getCategories(),
        mobileApi.getAiInsights(month),
      ]);
      setDashboard(dashboardData);
      setTransactions(transactionData);
      setCategories(categoryData.filter((item) => item.type === movement.type));
      setInsights(aiData);
      setStatus('');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function openScanner() {
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) {
        Alert.alert('Permiso requerido', 'Necesito acceso a la cámara para leer el QR de la INE.');
        return;
      }
    }
    setShowScanner(true);
  }

  async function onQrScanned({ data }) {
    const parsed = parseIneQr(data);
    setQrRaw(data);
    setForm((prev) => ({ ...prev, ...parsed }));
    setShowScanner(false);
    setAuthStatus('QR leído. Ahora puedes pegar el texto OCR del frente para completar más datos.');
    try {
      const assisted = await mobileApi.assistIdentity({ qrRaw: data, ocrText, manual: form });
      setForm((prev) => ({ ...prev, ...assisted.merged }));
      setAssistSummary(assisted);
    } catch {}
  }

  async function analyzeIdentityInputs() {
    try {
      const assisted = await mobileApi.assistIdentity({ qrRaw, ocrText, manual: form });
      setForm((prev) => ({ ...prev, ...assisted.merged }));
      setAssistSummary(assisted);
      const review = await mobileApi.reviewIdentity(assisted.merged);
      setReviewSummary(review);
      setAuthStatus(`Datos combinados. Confianza estimada: ${assisted.merged.confidence}. Puntaje: ${review.score}/100`);
    } catch (error) {
      setAuthStatus(error.message);
    }
  }


async function scanFrontAutomatically() {
  try {
    setOcrAutoStatus('Iniciando OCR automático...');
    const result = await scanIneFrontWithNativeOcr();
    if (!result.available) {
      setOcrAutoStatus(result.message);
      return;
    }
    if (result.text) setOcrText(result.text);
    const mergedManual = { ...form, ...(result.fields || {}) };
    const assisted = await mobileApi.assistIdentity({ qrRaw, ocrText: result.text || '', manual: mergedManual });
    const review = await mobileApi.reviewIdentity(assisted.merged);
    setForm((prev) => ({ ...prev, ...assisted.merged, ...(result.fields || {}) }));
    setAssistSummary(assisted);
    setReviewSummary(review);
    setOcrAutoStatus(`OCR automático listo. Puntaje de revisión: ${review.score}/100`);
  } catch (error) {
    setOcrAutoStatus(error.message);
  }
}

  async function submitIdentity() {
    try {
      if (!form.fullName || !form.curp || !form.claveElector) {
        throw new Error('Escanea el QR o captura nombre, CURP y clave de elector.');
      }
      const result = await mobileApi.registerOrLogin(form);
      await SecureStore.setItemAsync(TOKEN_KEY, result.token);
      setSession({ token: result.token, user: result.user });
      setAuthStatus('Acceso concedido.');
    } catch (error) {
      setAuthStatus(error.message);
    }
  }

  async function logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setSession(null);
    setForm(emptyIdentity);
    setDashboard(null);
    setTransactions([]);
    setInsights(null);
    setStatus('');
  }

  async function submitTransaction() {
    try {
      await mobileApi.createTransaction({
        type: movement.type,
        categoryId: Number(movement.categoryId),
        amount: Number(movement.amount),
        description: movement.description,
        date: currentDate,
        recurring: 'none',
        notes: `Creado desde móvil por ${session?.user?.fullName || 'usuario'}`,
      });
      setMovement({ type: 'expense', categoryId: '', amount: '', description: '' });
      await loadData();
      setStatus('Movimiento guardado.');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function askCoach() {
    try {
      const result = await mobileApi.askAiCoach({ month, question });
      setAnswer(result.answer);
    } catch (error) {
      setAnswer(error.message);
    }
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <Image source={require('../assets/hero-budget.png')} style={styles.hero} />
          <Text style={styles.eyebrow}>Android + iPhone</Text>
          <Text style={styles.title}>Acceso con QR + OCR asistido</Text>
          <Text style={styles.subtitle}>El QR sirve como apoyo inicial y el OCR del frente ayuda a completar y validar campos antes de que el usuario confirme.</Text>

          <Card title="Ingreso práctico" subtitle="QR + OCR asistido + confirmación humana">
            <TouchableOpacity style={styles.button} onPress={openScanner}>
              <Text style={styles.buttonText}>Escanear QR de INE</Text>
            </TouchableOpacity>
            {showScanner ? (
              <View style={styles.scannerWrap}>
                <CameraView
                  style={styles.scanner}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={onQrScanned}
                />
              </View>
            ) : null}

            <Text style={styles.smallMuted}>Paso 2: OCR del frente. En Android v5 puedes usar OCR automático en development build o APK interna. En iPhone y Expo Go queda el flujo asistido por texto.</Text>
            {Platform.OS === 'android' ? (
              <TouchableOpacity style={styles.buttonGhost} onPress={scanFrontAutomatically}>
                <Text style={styles.buttonGhostText}>{hasNativeOcr() ? 'Escanear frente con OCR automático' : 'OCR automático no disponible en esta build'}</Text>
              </TouchableOpacity>
            ) : null}
            {ocrAutoStatus ? <Text style={styles.smallMuted}>{ocrAutoStatus}</Text> : null}
            <TextInput style={[styles.input, styles.multiline]} multiline numberOfLines={5} textAlignVertical="top" placeholder="Pega aquí el texto OCR del frente del INE" placeholderTextColor="#64748b" value={ocrText} onChangeText={setOcrText} />
            <TouchableOpacity style={styles.buttonSecondary} onPress={analyzeIdentityInputs}>
              <Text style={styles.buttonText}>Combinar QR + OCR</Text>
            </TouchableOpacity>
            {assistSummary?.merged?.reviewFlags?.length ? <Text style={styles.warning}>Revisión sugerida: {assistSummary.merged.reviewFlags.join(' · ')}</Text> : null}
            {reviewSummary ? <Text style={styles.status}>Validación local: {reviewSummary.recommendation}</Text> : null}
            <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#64748b" value={form.fullName} onChangeText={(fullName) => setForm((prev) => ({ ...prev, fullName }))} />
            <TextInput style={styles.input} placeholder="CURP" placeholderTextColor="#64748b" autoCapitalize="characters" value={form.curp} onChangeText={(curp) => setForm((prev) => ({ ...prev, curp: curp.toUpperCase() }))} />
            <TextInput style={styles.input} placeholder="Clave de elector" placeholderTextColor="#64748b" autoCapitalize="characters" value={form.claveElector} onChangeText={(claveElector) => setForm((prev) => ({ ...prev, claveElector: claveElector.toUpperCase() }))} />
            <TextInput style={styles.input} placeholder="Domicilio" placeholderTextColor="#64748b" value={form.address} onChangeText={(address) => setForm((prev) => ({ ...prev, address }))} />
            <TextInput style={styles.input} placeholder="Sección" placeholderTextColor="#64748b" value={form.section} onChangeText={(section) => setForm((prev) => ({ ...prev, section }))} />
            <TextInput style={styles.input} placeholder="Teléfono" placeholderTextColor="#64748b" keyboardType="phone-pad" value={form.phone} onChangeText={(phone) => setForm((prev) => ({ ...prev, phone }))} />
            <TextInput style={styles.input} placeholder="Correo" placeholderTextColor="#64748b" autoCapitalize="none" value={form.email} onChangeText={(email) => setForm((prev) => ({ ...prev, email }))} />
            {authStatus ? <Text style={styles.status}>{authStatus}</Text> : null}
            <TouchableOpacity style={styles.buttonSecondary} onPress={submitIdentity}>
              <Text style={styles.buttonText}>Confirmar e ingresar</Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('../assets/hero-budget.png')} style={styles.hero} />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Sesión activa</Text>
            <Text style={styles.title}>Hola, {session.user.fullName.split(' ')[0]}</Text>
            <Text style={styles.subtitle}>Tu identidad quedó prellenada con QR y guardada de forma local.</Text>
          </View>
          <TouchableOpacity style={styles.logout} onPress={logout}><Text style={styles.logoutText}>Salir</Text></TouchableOpacity>
        </View>

        {status ? <Text style={styles.status}>{status}</Text> : null}

        <View style={styles.statsRow}>
          <Card style={styles.statCard} title="Ingresos"><Text style={styles.statValue}>{money.format(dashboard?.incomeTotal || 0)}</Text></Card>
          <Card style={styles.statCard} title="Gastos"><Text style={styles.statValue}>{money.format(dashboard?.expenseTotal || 0)}</Text></Card>
        </View>

        <Card title="Balance del mes" subtitle={`Periodo ${month}`}>
          <Text style={styles.bigBalance}>{money.format(dashboard?.balance || 0)}</Text>
          <Text style={styles.smallMuted}>Tasa de ahorro: {dashboard?.savingsRate || 0}%</Text>
        </Card>

        <Card title="Movimiento rápido">
          <View style={styles.segmentRow}>
            {['expense', 'income'].map((type) => (
              <TouchableOpacity key={type} style={[styles.segment, movement.type === type && styles.segmentActive]} onPress={() => {
                setMovement((prev) => ({ ...prev, type, categoryId: '' }));
                setCategories((dashboard?.byCategory || []).filter((item) => item.type === type));
              }}>
                <Text style={styles.segmentText}>{type === 'expense' ? 'Gasto' : 'Ingreso'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Descripción" placeholderTextColor="#64748b" value={movement.description} onChangeText={(description) => setMovement((prev) => ({ ...prev, description }))} />
          <TextInput style={styles.input} placeholder="Monto" placeholderTextColor="#64748b" keyboardType="decimal-pad" value={movement.amount} onChangeText={(amount) => setMovement((prev) => ({ ...prev, amount }))} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryWrap}>
            {(dashboard?.byCategory || []).filter((item) => item.type === movement.type).map((item) => {
              const category = categories.find((c) => c.name === item.name);
              if (!category) return null;
              return (
                <TouchableOpacity key={category.id} style={[styles.categoryChip, String(movement.categoryId) === String(category.id) && styles.categoryChipActive]} onPress={() => setMovement((prev) => ({ ...prev, categoryId: String(category.id) }))}>
                  <Text style={styles.categoryChipText}>{category.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={submitTransaction}><Text style={styles.buttonText}>Guardar</Text></TouchableOpacity>
        </Card>

        <Card title="IA financiera">
          <Text style={styles.smallMuted}>{insights?.summary || 'Sin insights disponibles.'}</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Escribe tu pregunta" placeholderTextColor="#64748b" value={question} onChangeText={setQuestion} multiline />
          <TouchableOpacity style={styles.button} onPress={askCoach}><Text style={styles.buttonText}>Preguntar a la IA</Text></TouchableOpacity>
          {answer ? <Text style={styles.answer}>{answer}</Text> : null}
        </Card>

        <Card title="Últimos movimientos">
          {(transactions || []).slice(0, 8).map((item) => (
            <View key={item.id} style={styles.txRow}>
              <View>
                <Text style={styles.txTitle}>{item.description}</Text>
                <Text style={styles.smallMuted}>{item.category_name} • {item.date}</Text>
              </View>
              <Text style={[styles.txAmount, item.type === 'expense' ? styles.expense : styles.income]}>{item.type === 'expense' ? '-' : '+'}{money.format(item.amount)}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020617' },
  container: { padding: 18, gap: 16 },
  headerRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  hero: { width: '100%', height: 180, borderRadius: 24, marginBottom: 8 },
  eyebrow: { color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 12 },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#94a3b8', fontSize: 15, lineHeight: 22 },
  status: { color: '#facc15', fontSize: 13, lineHeight: 19 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1 },
  statValue: { color: '#f8fafc', fontWeight: '700', fontSize: 20 },
  bigBalance: { color: '#bfdbfe', fontWeight: '800', fontSize: 34 },
  smallMuted: { color: '#94a3b8', fontSize: 13, lineHeight: 20 },
  scannerWrap: { overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  scanner: { width: '100%', height: 260 },
  input: { backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', color: '#f8fafc', paddingHorizontal: 14, paddingVertical: 12 },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  button: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  buttonSecondary: { backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  buttonGhost: { backgroundColor: '#0f172a', paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  buttonGhostText: { color: '#bfdbfe', fontWeight: '700' },
  buttonText: { color: '#fff', fontWeight: '700' },
  logout: { backgroundColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  logoutText: { color: '#e2e8f0', fontWeight: '700' },
  segmentRow: { flexDirection: 'row', gap: 10 },
  segment: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: '#1e293b', alignItems: 'center' },
  segmentActive: { backgroundColor: '#2563eb' },
  segmentText: { color: '#f8fafc', fontWeight: '600' },
  categoryWrap: { gap: 10, paddingVertical: 4 },
  categoryChip: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#172554', borderRadius: 999 },
  categoryChipActive: { backgroundColor: '#4f46e5' },
  categoryChipText: { color: '#e2e8f0', fontWeight: '600' },
  answer: { color: '#e2e8f0', lineHeight: 22 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  txTitle: { color: '#f8fafc', fontWeight: '600' },
  txAmount: { fontWeight: '800' },
  expense: { color: '#fda4af' },
  income: { color: '#86efac' },
});
