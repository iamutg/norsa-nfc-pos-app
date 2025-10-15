package com.posprinter.posprintermodule;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.pm.PackageManager;
import android.os.Handler;
import android.util.DisplayMetrics;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.dantsu.escposprinter.EscPosPrinter;
import com.dantsu.escposprinter.connection.DeviceConnection;
import com.dantsu.escposprinter.connection.bluetooth.BluetoothConnection;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.posprinter.R;

import java.util.Objects;

import io.invertase.firebase.crashlytics.ReactNativeFirebaseCrashlyticsNativeHelper;

public class PosPrinterModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

    private static final String TAG = "PosPrinterModule";
    private static final String PRINTER_MAC_ADDRESS = "18:10:77:00:10:46"; // 🔹 Change this to your printer MAC
    private static BluetoothConnection bluetoothConnection = null;
    private static EscPosPrinter escPosPrinter = null;
    private final Handler keepAliveHandler = new Handler();
    private final int KEEP_ALIVE_INTERVAL = 15000; // 15 seconds

    public PosPrinterModule(@Nullable ReactApplicationContext reactContext) {
        super(reactContext);
        if (reactContext != null) {
            reactContext.addLifecycleEventListener(this);
        }
        initConnection();
    }

    // ------------------- PRINT ------------------- //
    @ReactMethod
    public void print(String textToBePrinted, int printerDpi, float printerWidthMM,
                      int printerNbrCharactersPerLine, Promise promise) {
        try {
            if (escPosPrinter == null || bluetoothConnection == null || !bluetoothConnection.isConnected()) {
                Log.w(TAG, "Printer not connected, reconnecting...");
                reconnect();
            }

            showToast("Printing...");
            String finalText = "[C]<img>"
                    + com.dantsu.escposprinter.textparser.PrinterTextParserImg.bitmapToHexadecimalString(
                            escPosPrinter,
                            getCurrentActivity().getResources().getDrawableForDensity(R.drawable.logo,
                                    DisplayMetrics.DENSITY_MEDIUM))
                    + "</img>\n" + textToBePrinted;

            escPosPrinter.printFormattedText(finalText);
            promise.resolve(true);
        } catch (Exception e) {
            ReactNativeFirebaseCrashlyticsNativeHelper.recordNativeException(e);
            e.printStackTrace();
            promise.reject("Exception", "Something went wrong " + e.getMessage());
        }
    }

    // ------------------- CONNECTION ------------------- //
    private void initConnection() {
        new Thread(() -> {
            try {
                BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
                if (bluetoothAdapter == null) {
                    Log.e(TAG, "Bluetooth not supported");
                    return;
                }

                if (!bluetoothAdapter.isEnabled()) {
                    bluetoothAdapter.enable();
                    Thread.sleep(2000);
                }

                BluetoothDevice device = bluetoothAdapter.getRemoteDevice(PRINTER_MAC_ADDRESS);
                bluetoothConnection = new BluetoothConnection(device);
                bluetoothConnection.connect();

                escPosPrinter = new EscPosPrinter(bluetoothConnection, 203, 58f, 32);
                Log.i(TAG, "✅ Printer connected to: " + PRINTER_MAC_ADDRESS);

                startKeepAlive();
            } catch (Exception e) {
                Log.e(TAG, "Printer connection failed: " + e.getMessage());
            }
        }).start();
    }

    private void reconnect() {
        try {
            if (bluetoothConnection != null) {
                bluetoothConnection.disconnect();
            }
            initConnection();
        } catch (Exception e) {
            Log.e(TAG, "Reconnect failed: " + e.getMessage());
        }
    }

    private void startKeepAlive() {
        keepAliveHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                try {
                    if (escPosPrinter != null && bluetoothConnection != null && bluetoothConnection.isConnected()) {
                        escPosPrinter.printFormattedText(" ");
                        Log.d(TAG, "Sent keep-alive signal to printer.");
                    } else {
                        Log.w(TAG, "Printer connection lost, reconnecting...");
                        reconnect();
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Keep-alive failed: " + e.getMessage());
                    reconnect();
                }
                keepAliveHandler.postDelayed(this, KEEP_ALIVE_INTERVAL);
            }
        }, KEEP_ALIVE_INTERVAL);
    }

    // ------------------- APP LIFECYCLE ------------------- //
    @Override
    public void onHostResume() {
        Log.d(TAG, "App resumed — checking printer connection...");
        reconnect();
    }

    @Override
    public void onHostPause() {
        Log.d(TAG, "App paused — keeping connection alive...");
        // Optional: could pause keepAliveHandler if you want to save resources
    }

    @Override
    public void onHostDestroy() {
        Log.d(TAG, "App destroyed — cleaning up printer connection...");
        if (bluetoothConnection != null) {
            try {
                bluetoothConnection.disconnect();
            } catch (Exception ignored) {}
        }
    }

    // ------------------- UTIL ------------------- //
    private void showToast(String message) {
        if (getCurrentActivity() != null)
            Toast.makeText(getCurrentActivity(), message, Toast.LENGTH_SHORT).show();
    }

    @NonNull
    @Override
    public String getName() {
        return "PosPrinterModule";
    }
}
