import React, { useState, useEffect, ErrorInfo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Platform,
  PermissionsAndroid 
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Voice, Call } from '@twilio/voice-react-native-sdk';

const TWILIO_TOKEN_ENDPOINT = 'https://gettwiliotoken-4vzxjz4t2q-nw.a.run.app';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.message || 'Unknown error'}</Text>
          <Text style={styles.errorText}>{this.state.error?.stack}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState('Initializing...');
  const [voice, setVoice] = useState<Voice | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initVoice = async () => {
      try {
        setCallStatus('Requesting permissions...');
        
        // Request permissions on Android
        if (Platform.OS === 'android') {
          try {
            const granted = await PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
              PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
            ]);
            console.log('Permissions granted:', granted);
          } catch (permError) {
            console.error('Permission error:', permError);
            setError('Failed to get permissions');
            setCallStatus('Permission error');
            return;
          }
        }

        setCallStatus('Initializing Voice SDK...');
        const voiceInstance = new Voice();
        setVoice(voiceInstance);

        setCallStatus('Fetching token...');
        console.log('Fetching token from:', TWILIO_TOKEN_ENDPOINT);
        
        const response: any = await fetch(TWILIO_TOKEN_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identity: 'Gift Sibiya',
          }),
        });

        let fetchedData = await response.json();
        console.log('Token response status:', fetchedData);
        
        if (!response.token) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`Token fetch failed: ${response.status} - ${errorData.message || response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Token response data:', data);
        
        if (!data.token) {
          throw new Error('No token in response');
        }

        setCallStatus('Registering with Twilio...');
        await voiceInstance.register(data.token);
        setCallStatus('Ready');
        setError(null);
      } catch (initError: any) {
        console.error('Failed to initialize:', initError);
        const errorMessage = initError?.message || 'Unknown error';
        setError(errorMessage);
        setCallStatus(`Error: ${errorMessage}`);
        Alert.alert('Initialization Error', errorMessage);
      }
    };

    initVoice();

    return () => {
      // Cleanup handled by SDK
    };
  }, []);

  const makeCall = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    if (!voice) {
      Alert.alert('Error', 'Voice not initialized');
      return;
    }

    try {
      setCallStatus('Getting call token...');
      
      // Get a new token with the call parameters
      const identity = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const response = await fetch(TWILIO_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity: identity,
          To: phoneNumber,
        }),
      });

      console.log('Response:', response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Token fetch failed: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      if (!data.token) {
        throw new Error('No token in response');
      }

      setCallStatus('Calling...');
      const call = await voice.connect(data.token, {
        params: {
          To: phoneNumber
        }
      });

      setActiveCall(call);

      call.on(Call.Event.Connected, () => {
        setCallStatus('Connected');
      });

      call.on(Call.Event.Disconnected, () => {
        setCallStatus('Call ended');
        setActiveCall(null);
      });

      call.on(Call.Event.Reconnecting, () => {
        setCallStatus('Reconnecting...');
      });

    } catch (callError: any) {
      console.error('Call failed:', callError);
      setCallStatus('Call failed');
      Alert.alert('Error', callError?.message || 'Failed to make call');
    }
  };

  const endCall = () => {
    if (activeCall) {
      activeCall.disconnect();
      setActiveCall(null);
      setCallStatus('Call ended');
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaProvider>  
        <View style={styles.container}>
          <Text style={styles.title}>Twilio Voice Call</Text>
          
          <Text style={styles.status}>Status: {callStatus}</Text>
          
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Error: {error}</Text>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Enter phone number (+1234567890)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholderTextColor="#999"
            editable={!error && callStatus === 'Ready'}
          />

          {!activeCall ? (
            <TouchableOpacity 
              style={[styles.callButton, (error || callStatus !== 'Ready') && styles.buttonDisabled]} 
              onPress={makeCall}
              disabled={!!error || callStatus !== 'Ready'}
            >
              <Text style={styles.buttonText}>📞 Call</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.endButton} onPress={endCall}>
              <Text style={styles.buttonText}>❌ End Call</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  status: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  callButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  endButton: {
    backgroundColor: '#f44336',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 10,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
});

export default App;
