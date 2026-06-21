const Redis = require('ioredis');
const { handleEvent } = require('./emailService');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CHANNEL = process.env.REDIS_CHANNEL || 'order:events';

let subscriber = null;

function start() {
  subscriber = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  subscriber.on('ready', () => {
    subscriber.subscribe(CHANNEL, (err, count) => {
      if (err) {
        console.error('[Subscriber] Failed to subscribe:', err.message);
        return;
      }
      console.log(`[Subscriber] Subscribed to channel "${CHANNEL}" (${count} channels)`);
    });
  });

  subscriber.on('message', async (channel, message) => {
    try {
      const event = JSON.parse(message);
      console.log(`[Subscriber] Received event: ${event.type} on ${channel}`);
      await handleEvent(event);
    } catch (err) {
      console.error('[Subscriber] Failed to process message:', err.message);
    }
  });

  subscriber.on('error', (err) => {
    if (err.message.includes('subscriber')) {
      return;
    }
    console.error('[Subscriber] Redis error:', err.message);
  });

  subscriber.on('end', () => {
    console.log('[Subscriber] Redis connection closed');
  });

  subscriber.connect().catch((err) => {
    console.error('[Subscriber] Initial connection failed:', err.message);
  });
}

function shutdown() {
  if (subscriber) {
    subscriber.unsubscribe();
    subscriber.quit();
    console.log('[Subscriber] Shutdown complete');
  }
}

module.exports = { start, shutdown };
