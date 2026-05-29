import express from 'express';
import mqtt from 'mqtt';
import { v4 as uuid } from 'uuid';

const app = express();
const PORT = parseInt(process.env.EDGE_GATEWAY_PORT || '4000');

// MQTT Configuration
const MQTT_BROKER = process.env.MQTT_BROKER_HOST || 'localhost';
const MQTT_PORT = parseInt(process.env.MQTT_BROKER_PORT || '1883');
const MQTT_PROTOCOL = process.env.MQTT_BROKER_PROTOCOL || 'mqtt';

// Edge gateway ID
const GATEWAY_ID = process.env.EDGE_GATEWAY_ID || `edge-gateway-${uuid().slice(0, 8)}`;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MQTT Client
let mqttClient: mqtt.MqttClient | null = null;

// Connect to MQTT Broker
function connectMQTT(): void {
  const brokerUrl = `${MQTT_PROTOCOL}://${MQTT_BROKER}:${MQTT_PORT}`;
  console.log(`🔌 Connecting to MQTT broker: ${brokerUrl}`);

  mqttClient = mqtt.connect(brokerUrl, {
    clientId: GATEWAY_ID,
    clean: true,
    reconnectPeriod: 1000,
  });

  mqttClient.on('connect', () => {
    console.log(`✅ Connected to MQTT broker (Gateway ID: ${GATEWAY_ID})`);
    mqttClient?.subscribe('fleet/+/commands/+', (err) => {
      if (err) {
        console.error('Failed to subscribe to commands:', err);
      } else {
        console.log('📡 Subscribed to fleet commands');
      }
    });
  });

  mqttClient.on('message', (topic: string, message: Buffer) => {
    console.log(`📨 Message received on ${topic}: ${message.toString()}`);
  });

  mqttClient.on('error', (err: Error) => {
    console.error('MQTT connection error:', err);
  });

  mqttClient.on('offline', () => {
    console.warn('⚠️ MQTT client is offline');
  });

  mqttClient.on('reconnect', () => {
    console.log('🔄 Attempting to reconnect to MQTT broker...');
  });
}

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    gatewayId: GATEWAY_ID,
    timestamp: new Date().toISOString(),
    mqttConnected: mqttClient?.connected || false,
  });
});

app.get('/info', (req, res) => {
  res.json({
    name: 'Cummins OS Edge Gateway',
    version: '0.1.0',
    gatewayId: GATEWAY_ID,
    environment: process.env.NODE_ENV || 'development',
    mqtt: {
      broker: `${MQTT_PROTOCOL}://${MQTT_BROKER}:${MQTT_PORT}`,
      connected: mqttClient?.connected || false,
    },
    uptime: process.uptime(),
  });
});

app.post('/telemetry', (req, res) => {
  const { vehicleId, data } = req.body;

  if (!vehicleId || !data) {
    return res.status(400).json({ error: 'Missing vehicleId or data' });
  }

  const topic = `fleet/${vehicleId}/telemetry`;
  if (mqttClient?.connected) {
    mqttClient.publish(topic, JSON.stringify(data), (err) => {
      if (err) {
        console.error('Failed to publish telemetry:', err);
        return res.status(500).json({ error: 'Failed to publish telemetry' });
      }
      res.json({ message: 'Telemetry published', topic });
    });
  } else {
    return res.status(503).json({ error: 'MQTT broker not connected' });
  }
});

app.post('/command', (req, res) => {
  const { vehicleId, commandType, payload } = req.body;

  if (!vehicleId || !commandType) {
    return res.status(400).json({ error: 'Missing vehicleId or commandType' });
  }

  const topic = `fleet/${vehicleId}/commands/${commandType}`;
  if (mqttClient?.connected) {
    mqttClient.publish(topic, JSON.stringify(payload || {}), (err) => {
      if (err) {
        console.error('Failed to publish command:', err);
        return res.status(500).json({ error: 'Failed to publish command' });
      }
      res.json({ message: 'Command sent', topic });
    });
  } else {
    return res.status(503).json({ error: 'MQTT broker not connected' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Edge Gateway running on port ${PORT}`);
  connectMQTT();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (mqttClient) {
    mqttClient.end();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (mqttClient) {
    mqttClient.end();
  }
  process.exit(0);
});

export default app;
