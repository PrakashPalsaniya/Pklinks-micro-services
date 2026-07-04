import amqplib from 'amqplib';
import config from '@pklinks/config';

const EXCHANGE_NAME = 'url_shortener';
const EXCHANGE_TYPE = 'topic';
const DLX_NAME      = 'url_shortener.dlx';

let connection = null;
let channel    = null;
let isShuttingDown = false;

let reconnectDelay = 1000;
const MAX_DELAY    = 30000;

/** @type {Array<{ queueName: string, pattern: string, handler: Function, options: object }>} */
const subscriptions = [];

function normalizeSubscribeOptions(opts) {
  if (typeof opts === 'number') {
    return { prefetch: opts };
  }
  return opts || {};
}

async function setupDeadLetter(queueName, routingKey) {
  await channel.assertExchange(DLX_NAME, 'direct', { durable: true });

  const dlqName = `${queueName}.dlq`;
  await channel.assertQueue(dlqName, { durable: true });
  await channel.bindQueue(dlqName, DLX_NAME, routingKey);

  console.log(`[rabbitmq] DLQ ready: queue="${dlqName}" dlx="${DLX_NAME}" key="${routingKey}"`);
}

async function bindConsumer({ queueName, pattern, handler, options }) {
  const { prefetch = 1, deadLetter = false, maxRetries = 3 } = options;

  if (deadLetter) {
    await setupDeadLetter(queueName, pattern);
  }

  const queueOptions = { durable: true };

  if (deadLetter) {
    queueOptions.arguments = {
      'x-dead-letter-exchange':    DLX_NAME,
      'x-dead-letter-routing-key': pattern,
    };
  }

  const q = await channel.assertQueue(queueName, queueOptions);
  await channel.bindQueue(q.queue, EXCHANGE_NAME, pattern);
  await channel.prefetch(prefetch);

  console.log(
    `[rabbitmq] Subscribed: queue="${queueName}" pattern="${pattern}" prefetch=${prefetch}` +
    (deadLetter ? ` dlq="${queueName}.dlq" maxRetries=${maxRetries}` : '')
  );

  channel.consume(q.queue, async (msg) => {
    if (!msg) return;

    let payload;
    try {
      payload = JSON.parse(msg.content.toString());
    } catch (err) {
      console.error('[rabbitmq] Failed to parse message — sending to DLQ:', err.message);
      channel.nack(msg, false, false);
      return;
    }

    const headers    = msg.properties.headers || {};
    const retryCount = headers['x-retry-count'] || 0;

    try {
      await handler(payload, msg.fields.routingKey);
      channel.ack(msg);
    } catch (err) {
      console.error('[rabbitmq] Handler error:', err.message);

      if (deadLetter && retryCount < maxRetries) {
        channel.publish(EXCHANGE_NAME, msg.fields.routingKey, msg.content, {
          persistent: true,
          headers:    { ...headers, 'x-retry-count': retryCount + 1 },
        });
        channel.ack(msg);
        return;
      }

      if (deadLetter) {
        console.error(
          `[rabbitmq] Max retries (${maxRetries}) exceeded — dead-lettering message on "${queueName}"`
        );
        channel.nack(msg, false, false);
        return;
      }

      channel.nack(msg, false, true);
    }
  });
}

async function resubscribeAll() {
  if (!channel || subscriptions.length === 0) return;

  console.log(`[rabbitmq] Re-subscribing ${subscriptions.length} consumer(s)...`);

  for (const sub of subscriptions) {
    await bindConsumer(sub);
  }
}

export async function connect() {
  while (true) {
    try {
      connection = await amqplib.connect(config.rabbitmqUrl);
      channel    = await connection.createChannel();

      await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

      reconnectDelay = 1000;
      console.log('[rabbitmq] Connected to RabbitMQ');

      connection.on('close', () => {
        if (isShuttingDown) return;
        console.warn('[rabbitmq] Connection closed, reconnecting...');
        connection = null;
        channel    = null;
        scheduleReconnect();
      });

      connection.on('error', (err) => {
        console.error('[rabbitmq] Connection error:', err.message);
      });

      await resubscribeAll();
      return;
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

export async function subscribe(queueName, pattern, handler, opts = {}) {
  const options = normalizeSubscribeOptions(opts);

  const entry = { queueName, pattern, handler, options };
  const exists  = subscriptions.some(
    (s) => s.queueName === queueName && s.pattern === pattern
  );

  if (!exists) {
    subscriptions.push(entry);
  }

  if (channel) {
    await bindConsumer(entry);
  }
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
