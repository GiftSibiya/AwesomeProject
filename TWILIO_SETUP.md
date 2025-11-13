# Twilio Voice Call App - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. iOS Setup (if running on iOS)
```bash
cd ios
pod install
cd ..
```

### 3. Run the App
```bash
# For Android
npm run android

# For iOS
npm run ios
```

## How to Use

1. The app will automatically register with Twilio when it starts
2. Enter a phone number in international format (e.g., +12345678900)
3. Press the "📞 Call" button to make a call
4. Press "❌ End Call" to hang up

## Environment Variables

The app uses the following environment variables from `.env`:
- `EXPO_PUBLIC_TWILIO_SID` - Your Twilio Account SID
- `EXPO_PUBLIC_TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
- `EXPO_PUBLIC_TWILIO_TOKEN_ENDPOINT` - Your Cloud Function endpoint for getting access tokens

## Important Notes

- Make sure your Twilio token endpoint returns a valid access token
- The app requests microphone and phone state permissions on Android
- Phone numbers must be in E.164 format (+country code + number)
- Ensure your Twilio account has credits and proper voice configuration

## Troubleshooting

- If registration fails, check your token endpoint is working
- If calls fail, verify your Twilio account has voice capabilities
- Check that all permissions are granted in device settings

