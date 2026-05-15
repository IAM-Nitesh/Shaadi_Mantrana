package com.shaadimantrana.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.auth.FirebaseAuth;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Disable app verification for testing if in debug mode
        // This allows test phone numbers to work without sending real SMS
        if (BuildConfig.DEBUG) {
            FirebaseAuth.getInstance().getFirebaseAuthSettings().setAppVerificationDisabledForTesting(true);
        }
    }
}
