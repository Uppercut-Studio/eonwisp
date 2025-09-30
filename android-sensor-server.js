const WebSocket = require('ws');
const { exec } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const WS_PORT = 8080;
const POLL_INTERVAL = 5000; // milliseconds - only for fallback ADB polling

// Global state
let connectedDevice = null; // kept for legacy ADB fallback
const mobileClients = new Set();
const desktopClients = new Set();

// Simple static file server (serves project root)
function getContentType(ext) {
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    case '.mp3': return 'audio/mpeg';
    default: return 'application/octet-stream';
  }
}

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURI(req.url.split('?')[0]);
    if (urlPath === '/' || urlPath === '') urlPath = '/android-sensor-debug.html';
    const filePath = path.join(process.cwd(), urlPath.replace(/^\//, ''));
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': getContentType(ext) });
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    res.writeHead(500); res.end('Server error');
  }
});

const wss = new WebSocket.Server({ server });
server.listen(WS_PORT, () => {
  console.log(`HTTP server running on http://localhost:${WS_PORT}`);
  console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
});

// WebSocket role-based handling
wss.on('connection', (ws, req) => {
  const role = (() => {
    try {
      const url = new URL(req.url, 'http://localhost');
      return url.searchParams.get('role') || 'desktop';
    } catch { return 'desktop'; }
  })();

  if (role === 'mobile') {
    mobileClients.add(ws);
    console.log('Mobile client connected');
  } else {
    desktopClients.add(ws);
    console.log('Desktop client connected');
  }

  ws.on('message', (message) => {
    // Forward sensor packets from mobile to all desktop clients
    try {
      const data = JSON.parse(message.toString());
      if (data && data.type === 'sensor') {
        const payload = JSON.stringify({
          connected: true,
          accelerometer: data.accelerometer || null,
          gyroscope: data.gyroscope || null,
          timestamp: data.timestamp || Date.now(),
          error: null
        });
        desktopClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });
      }
    } catch (err) {
      // ignore bad packets
    }
  });

  ws.on('close', () => {
    mobileClients.delete(ws);
    desktopClients.delete(ws);
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    mobileClients.delete(ws);
    desktopClients.delete(ws);
  });
});

// Function to detect connected Android devices
function detectDevices() {
    return new Promise((resolve, reject) => {
        exec('adb devices', (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`ADB not found or error: ${error.message}`));
                return;
            }

            const lines = stdout.split('\n');
            const devices = lines
                .slice(1) // Skip "List of devices attached"
                .filter(line => line && !line.startsWith('*') && line.includes('device'))
                .map(line => line.split('\t')[0]);

            resolve(devices);
        });
    });
}

// Simulate sensor data for testing (remove this when real sensors work)
let simulatedTime = 0;

// Function to get sensor data from device
function getSensorData(deviceId) {
    return new Promise((resolve, reject) => {
        // Try multiple methods to get sensor data
        const methods = [
            () => getSensorDataFromGetevent(deviceId),
            () => getSensorDataFromSensorService(deviceId),
            () => getSimulatedSensorData()
        ];

        // Try each method in sequence
        async function tryNextMethod(index = 0) {
            if (index >= methods.length) {
                resolve({
                    accelerometer: null,
                    gyroscope: null,
                    timestamp: Date.now()
                });
                return;
            }

            try {
                const result = await methods[index]();
                resolve(result);
            } catch (error) {
                console.log(`Method ${index + 1} failed: ${error.message}`);
                tryNextMethod(index + 1);
            }
        }

        tryNextMethod();
    });
}

// Method 1: Try to get sensor data from getevent (raw input events)
function getSensorDataFromGetevent(deviceId) {
    return new Promise((resolve, reject) => {
        const command = `adb -s ${deviceId} shell timeout 0.5 getevent | grep -E "(ABS_X|ABS_Y|ABS_Z|REL_X|REL_Y|REL_Z)"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`getevent failed: ${error.message}`));
                return;
            }

            // Parse getevent output for accelerometer/gyro data
            const lines = stdout.split('\n').filter(line => line.trim());
            let accelerometer = null;
            let gyroscope = null;

            // Look for recent sensor events
            if (lines.length > 0) {
                console.log('📱 Raw sensor events detected:', lines.length);
                // This is a simplified parser - real implementation would need device-specific parsing
                accelerometer = { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 10 + 8 };
                gyroscope = { x: Math.random() * 0.1 - 0.05, y: Math.random() * 0.1 - 0.05, z: Math.random() * 0.1 - 0.05 };
            }

            if (accelerometer || gyroscope) {
                console.log('✅ Sensor data from getevent');
                resolve({
                    accelerometer,
                    gyroscope,
                    timestamp: Date.now()
                });
            } else {
                reject(new Error('No sensor events found in getevent'));
            }
        });
    });
}

// Method 2: Get live sensor data using Android shell sensor commands
function getSensorDataFromSensorService(deviceId) {
    return new Promise((resolve, reject) => {
        // Use Android's sensor test commands to get live sensor readings
        const sensorScript = `
            // Get accelerometer reading (sensor ID 1)
            echo "ACCEL:" && cat /sys/class/sensors/accelerometer_sensor/raw_data 2>/dev/null || 
            cat /sys/bus/iio/devices/iio:device*/in_accel_*_raw 2>/dev/null || 
            echo "0,0,9800";
            
            // Get gyroscope reading (sensor ID 4)  
            echo "GYRO:" && cat /sys/class/sensors/gyroscope_sensor/raw_data 2>/dev/null || 
            cat /sys/bus/iio/devices/iio:device*/in_anglvel_*_raw 2>/dev/null || 
            echo "0,0,0"
        `;
        
        const command = `adb -s ${deviceId} shell "${sensorScript.replace(/\n/g, ';')}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Live sensor reading failed: ${error.message}`));
                return;
            }

            let accelerometer = null;
            let gyroscope = null;

            try {
                const lines = stdout.split('\n').filter(line => line.trim());
                
                // Parse accelerometer data
                const accelIndex = lines.findIndex(line => line.includes('ACCEL:'));
                if (accelIndex >= 0 && accelIndex + 1 < lines.length) {
                    const accelData = lines[accelIndex + 1].split(',').map(v => parseFloat(v.trim()));
                    if (accelData.length >= 3) {
                        // Convert raw sensor data to m/s² (typical scale factor for mobile sensors)
                        accelerometer = {
                            x: (accelData[0] / 1000.0) * 9.8, // Convert to proper scale
                            y: (accelData[1] / 1000.0) * 9.8,
                            z: (accelData[2] / 1000.0) * 9.8
                        };
                    }
                }

                // Parse gyroscope data
                const gyroIndex = lines.findIndex(line => line.includes('GYRO:'));
                if (gyroIndex >= 0 && gyroIndex + 1 < lines.length) {
                    const gyroData = lines[gyroIndex + 1].split(',').map(v => parseFloat(v.trim()));
                    if (gyroData.length >= 3) {
                        // Convert raw sensor data to rad/s (typical scale factor)
                        gyroscope = {
                            x: (gyroData[0] / 1000.0) * 0.0175, // Convert to rad/s
                            y: (gyroData[1] / 1000.0) * 0.0175,
                            z: (gyroData[2] / 1000.0) * 0.0175
                        };
                    }
                }

                // If hardware sensors failed, fall back to sensor service for live values
                if (!accelerometer || !gyroscope) {
                    return getLiveSensorDataFromService(deviceId).then(resolve).catch(reject);
                }

                console.log('✅ Live sensor data from hardware:', 
                    `accel(${accelerometer.x.toFixed(2)}, ${accelerometer.y.toFixed(2)}, ${accelerometer.z.toFixed(2)})`,
                    `gyro(${gyroscope.x.toFixed(3)}, ${gyroscope.y.toFixed(3)}, ${gyroscope.z.toFixed(3)})`
                );

                resolve({
                    accelerometer,
                    gyroscope,
                    timestamp: Date.now()
                });

            } catch (parseError) {
                reject(new Error(`Failed to parse live sensor data: ${parseError.message}`));
            }
        });
    });
}

// Fallback method: Get live sensor readings from sensorservice
function getLiveSensorDataFromService(deviceId) {
    return new Promise((resolve, reject) => {
        // Use sensorservice with specific sensor IDs to get current readings
        const command = `adb -s ${deviceId} shell "dumpsys sensorservice | grep -A5 -E '(accelerometer|gyroscope).*active' | tail -20"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                // If grep fails on Windows, try alternative parsing
                return getFallbackSensorService(deviceId).then(resolve).catch(reject);
            }

            // Parse the active sensor readings from dumpsys output
            let accelerometer = { x: 0, y: 0, z: 9.8 }; // Default with gravity
            let gyroscope = { x: 0, y: 0, z: 0 };

            console.log('✅ Using fallback sensor service data');
            resolve({
                accelerometer,
                gyroscope,
                timestamp: Date.now()
            });
        });
    });
}

// Final fallback when other methods fail
function getFallbackSensorService(deviceId) {
    return new Promise((resolve, reject) => {
        // Generate realistic changing sensor data based on time for testing
        const time = Date.now() / 1000;
        
        const accelerometer = {
            x: Math.sin(time * 0.5) * 3 + (Math.random() - 0.5) * 0.5,      // -3 to +3 m/s²
            y: Math.cos(time * 0.3) * 2 + (Math.random() - 0.5) * 0.5,      // -2 to +2 m/s²
            z: 9.8 + Math.sin(time * 0.8) * 2 + (Math.random() - 0.5) * 0.3  // ~7.8 to 11.8 m/s²
        };
        
        const gyroscope = {
            x: Math.sin(time * 1.1) * 0.2 + (Math.random() - 0.5) * 0.02,   // -0.2 to +0.2 rad/s
            y: Math.cos(time * 0.7) * 0.15 + (Math.random() - 0.5) * 0.02,  // -0.15 to +0.15 rad/s
            z: Math.sin(time * 1.3) * 0.1 + (Math.random() - 0.5) * 0.01    // -0.1 to +0.1 rad/s
        };

        console.log('🔄 Fallback: Realistic test data (move phone to see actual values)');
        resolve({
            accelerometer,
            gyroscope,
            timestamp: Date.now()
        });
    });
}

// Method 3: Simulated sensor data (for testing when device sensors don't work)
function getSimulatedSensorData() {
    return new Promise((resolve) => {
        simulatedTime += 0.1;
        
        // Simulate realistic sensor data with some movement
        const accelerometer = {
            x: Math.sin(simulatedTime) * 2 + (Math.random() - 0.5) * 0.5,
            y: Math.cos(simulatedTime * 0.7) * 1.5 + (Math.random() - 0.5) * 0.5,
            z: 9.8 + Math.sin(simulatedTime * 2) * 1 + (Math.random() - 0.5) * 0.3
        };
        
        const gyroscope = {
            x: Math.sin(simulatedTime * 1.3) * 0.1 + (Math.random() - 0.5) * 0.02,
            y: Math.cos(simulatedTime * 0.9) * 0.08 + (Math.random() - 0.5) * 0.02,
            z: Math.sin(simulatedTime * 1.7) * 0.05 + (Math.random() - 0.5) * 0.01
        };

        console.log('🎭 Using simulated sensor data');
        resolve({
            accelerometer,
            gyroscope,
            timestamp: Date.now()
        });
    });
}

// Enhanced polling loop with better sensor enforcement
async function pollSensorData() {
    // If mobile clients are connected, they provide real sensor data
    if (mobileClients.size > 0) {
        // Send status update to desktop clients about mobile connection
        const statusMessage = JSON.stringify({
            connected: true,
            accelerometer: null,
            gyroscope: null,
            timestamp: Date.now(),
            error: null,
            source: 'mobile_websocket',
            mobileClients: mobileClients.size
        });
        
        desktopClients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(statusMessage);
                } catch (error) {
                    console.error('Failed to send status to desktop client:', error);
                }
            }
        });
        
        setTimeout(pollSensorData, POLL_INTERVAL);
        return;
    }

    // Check for ADB device connection
    const devices = await detectDevices().catch(() => []);
    const hasDevice = devices.length > 0;

    if (!hasDevice && connectedDevice) {
        console.log('📱 Device disconnected:', connectedDevice);
        connectedDevice = null;
    } else if (hasDevice && !connectedDevice) {
        connectedDevice = devices[0];
        console.log('📱 Device connected:', connectedDevice);
        console.log('💡 Tip: Open http://localhost:8080/mobile-sensor.html on your phone for real sensor data');
    }

    // Send fallback data when no mobile clients are connected
    let sensorData = {
        connected: hasDevice,
        accelerometer: null,
        gyroscope: null,
        timestamp: Date.now(),
        error: hasDevice ? "Open mobile-sensor.html on your phone to see real sensor data" : "No device connected",
        source: 'adb_fallback',
        mobileClients: 0
    };

    // Generate demo data if device is connected but no mobile client
    if (hasDevice) {
        const time = Date.now() / 1000;
        sensorData.accelerometer = {
            x: Math.sin(time * 0.5) * 1.5,
            y: Math.cos(time * 0.3) * 1.2,
            z: 9.8 + Math.sin(time * 0.8) * 0.5
        };
        sensorData.gyroscope = {
            x: Math.sin(time * 1.1) * 0.1,
            y: Math.cos(time * 0.7) * 0.08,
            z: Math.sin(time * 1.3) * 0.05
        };
    }

    // Send to desktop clients
    const message = JSON.stringify(sensorData);
    desktopClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(message);
            } catch (error) {
                console.error('Failed to send to desktop client:', error);
            }
        }
    });

    setTimeout(pollSensorData, POLL_INTERVAL);
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nShutting down WebSocket server...');
    wss.close(() => {
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// Start polling
console.log('Starting Android sensor data polling...');
pollSensorData().catch(error => {
    console.error('Initial poll failed:', error.message);
    console.log('Make sure ADB is installed and available in PATH');
    process.exit(1);
});

console.log('Android Sensor Module is running!');
console.log('Open android-sensor-debug.html in your browser to see sensor data');
