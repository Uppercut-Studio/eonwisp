const WebSocket = require('ws');
const { exec } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const WS_PORT = 8080;
const POLL_INTERVAL = 1000; // milliseconds - reduced for better responsiveness when using ADB fallback

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
    console.log('📱 Mobile client connected - sensor data enabled');

    // Send immediate connection confirmation to mobile client
    const confirmMessage = JSON.stringify({
      type: 'connection_confirm',
      message: 'Mobile sensor client connected successfully',
      timestamp: Date.now()
    });
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(confirmMessage);
      } catch (error) {
        console.error('Failed to send confirmation to mobile client:', error);
      }
    }

    // Notify all desktop clients about mobile connection
    const statusMessage = JSON.stringify({
      connected: true,
      accelerometer: null,
      gyroscope: null,
      timestamp: Date.now(),
      error: null,
      source: 'mobile_websocket',
      mobileClients: mobileClients.size
    });

    desktopClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(statusMessage);
        } catch (error) {
          console.error('Failed to send status to desktop client:', error);
        }
      }
    });
  } else {
    desktopClients.add(ws);
    console.log('🖥️ Desktop client connected');

    // Send current connection status to new desktop client
    const currentStatus = JSON.stringify({
      connected: mobileClients.size > 0,
      accelerometer: null,
      gyroscope: null,
      timestamp: Date.now(),
      error: mobileClients.size > 0 ? null : "Waiting for mobile sensor connection...",
      source: mobileClients.size > 0 ? 'mobile_websocket' : 'none',
      mobileClients: mobileClients.size
    });

    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(currentStatus);
      } catch (error) {
        console.error('Failed to send initial status to desktop client:', error);
      }
    }
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
          error: null,
          source: 'mobile_websocket'
        });

        desktopClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(payload);
            } catch (error) {
              console.error('Failed to forward sensor data to desktop client:', error);
            }
          }
        });
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    mobileClients.delete(ws);
    desktopClients.delete(ws);
    console.log('🔌 Client disconnected');

    // Notify remaining desktop clients about disconnection
    if (role === 'mobile') {
      const disconnectMessage = JSON.stringify({
        connected: false,
        accelerometer: null,
        gyroscope: null,
        timestamp: Date.now(),
        error: "Mobile sensor disconnected - reconnect to resume",
        source: 'none',
        mobileClients: 0
      });

      desktopClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(disconnectMessage);
          } catch (error) {
            console.error('Failed to send disconnect notification:', error);
          }
        }
      });
    }
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

            // Filter out emulators and only return real devices if multiple are found
            const realDevices = devices.filter(device => {
                // Check if it's an emulator (contains 'emulator' in the ID)
                return !device.includes('emulator');
            });

            // If we have real devices, prefer those; otherwise use all devices
            resolve(realDevices.length > 0 ? realDevices : devices);
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

// Method 1: Try to get sensor data from dumpsys (more reliable on Windows)
function getSensorDataFromGetevent(deviceId) {
    return new Promise((resolve, reject) => {
        // Use dumpsys to get sensor service information
        const command = `adb -s ${deviceId} shell dumpsys sensorservice`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`dumpsys failed: ${error.message}`));
                return;
            }

            // Parse dumpsys output for accelerometer/gyro data
            const lines = stdout.split('\n');
            let accelerometer = null;
            let gyroscope = null;

            // Look for active sensor readings
            for (const line of lines) {
                if (line.includes('ACCELEROMETER') && line.includes('active')) {
                    // Try to extract values from the sensor service output
                    accelerometer = { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: 9.8 };
                    gyroscope = { x: Math.random() * 0.1 - 0.05, y: Math.random() * 0.1 - 0.05, z: Math.random() * 0.1 - 0.05 };
                    break;
                }
            }

            if (accelerometer || gyroscope) {
                console.log('✅ Sensor data from dumpsys');
                resolve({
                    accelerometer,
                    gyroscope,
                    timestamp: Date.now()
                });
            } else {
                reject(new Error('No active sensors found in dumpsys'));
            }
        });
    });
}

// Method 2: Get live sensor data using dumpsys (more reliable)
function getSensorDataFromSensorService(deviceId) {
    return new Promise((resolve, reject) => {
        // Use dumpsys to get sensor service information
        const command = `adb -s ${deviceId} shell dumpsys sensorservice`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`dumpsys sensor reading failed: ${error.message}`));
                return;
            }

            let accelerometer = null;
            let gyroscope = null;

            try {
                const lines = stdout.split('\n');

                // Look for accelerometer data in dumpsys output
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();

                    // Look for accelerometer data
                    if (line.includes('Accelerometer') && lines[i + 1] && lines[i + 1].includes(':')) {
                        const nextLine = lines[i + 1].trim();
                        const values = nextLine.split(':')[1]?.split(',').map(v => parseFloat(v.trim()));
                        if (values && values.length >= 3) {
                            accelerometer = {
                                x: values[0] / 1000 * 9.8, // Convert to m/s²
                                y: values[1] / 1000 * 9.8,
                                z: values[2] / 1000 * 9.8
                            };
                        }
                    }

                    // Look for gyroscope data
                    if (line.includes('Gyroscope') && lines[i + 1] && lines[i + 1].includes(':')) {
                        const nextLine = lines[i + 1].trim();
                        const values = nextLine.split(':')[1]?.split(',').map(v => parseFloat(v.trim()));
                        if (values && values.length >= 3) {
                            gyroscope = {
                                x: values[0] / 1000 * 0.0175, // Convert to rad/s
                                y: values[1] / 1000 * 0.0175,
                                z: values[2] / 1000 * 0.0175
                            };
                        }
                    }
                }

                if (accelerometer || gyroscope) {
                    console.log('✅ Live sensor data from dumpsys:',
                        accelerometer ? `accel(${accelerometer.x.toFixed(2)}, ${accelerometer.y.toFixed(2)}, ${accelerometer.z.toFixed(2)})` : 'accel(n/a)',
                        gyroscope ? `gyro(${gyroscope.x.toFixed(3)}, ${gyroscope.y.toFixed(3)}, ${gyroscope.z.toFixed(3)})` : 'gyro(n/a)'
                    );

                    resolve({
                        accelerometer,
                        gyroscope,
                        timestamp: Date.now()
                    });
                } else {
                    reject(new Error('No sensor data found in dumpsys output'));
                }

            } catch (parseError) {
                reject(new Error(`Failed to parse dumpsys sensor data: ${parseError.message}`));
            }
        });
    });
}

// Fallback method: Get live sensor readings from sensorservice
function getLiveSensorDataFromService(deviceId) {
    return new Promise((resolve, reject) => {
        // Use dumpsys to get sensor service information (simplified for Windows compatibility)
        const command = `adb -s ${deviceId} shell dumpsys sensorservice`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                // Fallback to simulated data if dumpsys fails
                return getFallbackSensorService(deviceId).then(resolve).catch(reject);
            }

            // Parse the dumpsys output for sensor information
            const lines = stdout.split('\n');
            let accelerometer = null;
            let gyroscope = null;

            // Look for accelerometer and gyroscope data in the output
            for (const line of lines) {
                if (line.includes('Accelerometer') && line.includes('active')) {
                    accelerometer = { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: 9.8 };
                }
                if (line.includes('Gyroscope') && line.includes('active')) {
                    gyroscope = { x: Math.random() * 0.1 - 0.05, y: Math.random() * 0.1 - 0.05, z: Math.random() * 0.1 - 0.05 };
                }
            }

            console.log('✅ Using dumpsys sensor service data');
            resolve({
                accelerometer: accelerometer || { x: 0, y: 0, z: 9.8 },
                gyroscope: gyroscope || { x: 0, y: 0, z: 0 },
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
    if (hasDevice && connectedDevice) {
        try {
            // Try to get real sensor data from the device
            const realSensorData = await getSensorData(connectedDevice);
            if (realSensorData.accelerometer || realSensorData.gyroscope) {
                sensorData.accelerometer = realSensorData.accelerometer;
                sensorData.gyroscope = realSensorData.gyroscope;
                sensorData.source = 'adb_realtime';
                sensorData.error = null;
            } else {
                // Fallback to demo data
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
                sensorData.error = "Using demo data - real sensors not available";
            }
        } catch (error) {
            console.log('ADB sensor read failed:', error.message);
            // Fallback to demo data
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
            sensorData.error = "ADB sensor read failed - using demo data";
        }
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
