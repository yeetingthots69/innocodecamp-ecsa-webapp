Steps to run:
1. Install all packages using:
   ```bash
   npm i
   ```
2. Connect HC-05 Bluetooth module to your computer and ensure it is discoverable.
- If you are using a HC-05 module, you may need to pair it with your computer first.
- Make sure the HC-05 is set to communicate at 9600 baud rate.
- Locate the COM port assigned to the HC-05 module in your system settings, then modify the `bluetooth-server.ts` file:
  ```ts
   const port = new SerialPort({
       path: 'COM1', // Replace 'COM1' with HC-05's COM port
       baudRate: 9600
   });
   ```
3. Install Android Debugging Bridge (ADB) to enable communication with the Android device:
   - Download and install ADB from the [Android developer website](https://developer.android.com/studio/command-line/adb).
   - Ensure your Android device is connected via USB and USB debugging is enabled.
   - Verify ADB connection by running:
     ```bash
     adb devices
     ```
     `bluetooth-server.ts` will use ADB to forward the port for communication with the Android device.
4. Run bluetooth server to start receiving data:
    ```bash
    node bluetoooth-server.ts
    ```
    This runs the bluetooth server on port 3001.
5. On a different console, run webapp server:
   ```bash
   npm run dev
   ```
   This runs the webapp server on port 3000.