import { randomUUID } from 'crypto';
import { publish } from '@pklinks/utils/rabbitmq';

export function publishClickEvent({ code, originalUrl, ip, userAgent, referer }) {
  publish('click.event', {
    eventId: randomUUID(), // Lets the worker dedupe redelivered messages
    code,
    originalUrl,
    ip,
    userAgent: userAgent || '',
    referer:   referer   || '',
    timestamp: new Date().toISOString(),
  });
}
