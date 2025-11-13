import React, { useState, useEffect } from 'react';
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
import { Voice } from '@twilio/voice-react-native-sdk';

const TWILIO_SID = process.env.EXPO_PUBLIC_TWILIO_SID;
const TWILIO_TOKEN_ENDPOINT = process.env.EXPO_PUBLIC_TWILIO_TOKEN_ENDPOINT;

function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState('Ready');
  const [voice, setVoice] = useState<Voice | null>(null);
  const [activeCall, setActiveCall] = useState<any>(null);

  useEffect(() => {
    const initVoice = async () => {
      // Request permissions on Android
      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        ]);
      }

      const voiceInstance = new Voice();
      setVoice(voiceInstance);

      // Register device with Twilio
      try {
        const response = await fetch(TWILIO_TOKEN_ENDPOINT!);
        const data = await response.json();
        await voiceInstance.register(data.token);
        setCallStatus('Registered');
      } catch (error) {
        console.error('Failed to register:', error);
        setCallStatus('Registration failed');
      }
    };

    initVoice();

    return () => {
      voice?.unregister();
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
      setCallStatus('Calling...');
      const call = await voice.connect({
        params: {
          To: phoneNumber
        }
      });

      setActiveCall(call);

      call.on('connected', () => {
        setCallStatus('Connected');
      });

      call.on('disconnected', () => {
        setCallStatus('Call ended');
        setActiveCall(null);
      });

      call.on('reconnecting', () => {
        setCallStatus('Reconnecting...');
      });

    } catch (error) {
      console.error('Call failed:', error);
      setCallStatus('Call failed');
      Alert.alert('Error', 'Failed to make call');
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
    <SafeAreaProvider>  
      <View style={styles.container}>
        <Text style={styles.title}>Twilio Voice Call</Text>
        
        <Text style={styles.status}>Status: {callStatus}</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter phone number (+1234567890)"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />

        {!activeCall ? (
          <TouchableOpacity style={styles.callButton} onPress={makeCall}>
            <Text style={styles.buttonText}>📞 Call</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.endButton} onPress={endCall}>
            <Text style={styles.buttonText}>❌ End Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaProvider>
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
});

export default App;
