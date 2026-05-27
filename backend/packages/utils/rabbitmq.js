import amqplib from 'amqplib';
import config from '@pklinks/config';

const EXCHANGE_NAME = 'url_shortener';
const EXCHANGE_TYPE = 'topic';

let connection = null;
let channel    = null;
let isShuttingDown = false;

let reconnectDelay = 1000;
const MAX_DELAY    = 30000;

export async function connect() {
  while (true) {
    try {
      connection = await amqplib.connect(config.rabbitmqUrl);
      channel    = await connection.createChannel();

      await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

      reconnectDelay = 1000;
      console.log('[rabbitmq] Connected to RabbitMQ');

      connection.on('close', () => {
        if (isShuttingDown) return; // Don't reconnect during shutdown
        console.warn('[rabbitmq] Connection closed, reconnecting...');
        connection = null;
        channel    = null;
        scheduleReconnect();
      });

      connection.on('error', (err) => {
        console.error('[rabbitmq] Connection error:', err.message);
      });

      return; // Success!
    } catch (err) {
      console.error(`[rabbitmq] Failed to connect: ${err.message}. Retrying in ${reconnectDelay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, reconnectDelay));
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_DELAY);
    }
  }
}


function scheduleReconnect() {
  setTimeout(async () => {
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_DELAY);
    await connect();
  }, reconnectDelay);
}

export function publish(routingKey, payload) {
  try {
    if (!channel) {
      console.warn('[rabbitmq] publish skipped — no channel yet');
      return;
    }

    const message = Buffer.from(JSON.stringify(payload));

    channel.publish(EXCHANGE_NAME, routingKey, message, {
      persistent: true,
    });
  } catch (err) {
    console.error('[rabbitmq] publish error:', err.message);
  }
}

export async function subscribe(queueName, pattern, handler, prefetch = 1) {
  if (!channel) {
    throw new Error('[rabbitmq] Cannot subscribe — not connected. Call connect() first.');
  }

  const q = await channel.assertQueue(queueName, { durable: true });

  await channel.bindQueue(q.queue, EXCHANGE_NAME, pattern);

  await channel.prefetch(prefetch);

  console.log(`[rabbitmq] Subscribed: queue="${queueName}" pattern="${pattern}" prefetch=${prefetch}`);

  channel.consume(q.queue, async (msg) => {
    if (!msg) return;

    let payload;
    try {
      payload = JSON.parse(msg.content.toString());
    } catch (err) {
      console.error('[rabbitmq] Failed to parse message:', err.message);
      channel.nack(msg, false, false);
      return;
    }

    try {
      await handler(payload, msg.fields.routingKey);
      channel.ack(msg);
    } catch (err) {
      console.error('[rabbitmq] Handler error:', err.message);
      channel.nack(msg, false, true);
    }
  });
}

export async function disconnect() {
  isShuttingDown = true;
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    console.log('[rabbitmq] Connection closed gracefully');
  } catch (err) {
    console.error('[rabbitmq] Error closing connection:', err.message);
  }
}

