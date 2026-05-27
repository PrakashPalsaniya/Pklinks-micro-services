import { publish } from '@pklinks/utils/rabbitmq';

export function publishClickEvent({ code, originalUrl, ip, userAgent, referer }) {
  publish('click.event', {
    code,
    originalUrl,
    ip,
    userAgent: userAgent || '',
    referer:   referer   || '',
    timestamp: new Date().toISOString(),
  });
}
