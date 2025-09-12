# Firebase Setup Instructions

## Step 1: Replace google-services.json
1. Download the real google-services.json from Firebase Console
2. Replace: android/app/google-services.json

## Step 2: Enable Firebase Storage
1. In Firebase Console → Storage
2. Click "Get started"
3. Choose "Start in test mode" 
4. Select location (us-central1 recommended)

## Step 3: Set Storage Rules
Go to Storage → Rules and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /recordings/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## Step 4: Build and Run
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Troubleshooting
- If build fails, run: npx react-native clean
- Check package name matches: com.recorder
- Ensure google-services.json is in android/app/ folder