import pino from 'pino';
import config from '@pklinks/config';

export function createLogger(serviceName) {
  const transport = config.isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

  return pino(
    {
      level: config.isDev ? 'debug' : 'info',
      base: { service: serviceName },
    },
    transport ? pino.transport(transport) : undefined
  );
}
