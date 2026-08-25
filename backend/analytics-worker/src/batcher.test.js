import { jest } from '@jest/globals';

jest.unstable_mockModule('./models/click.model.js', () => ({
  default: { insertMany: jest.fn() },
}));

jest.unstable_mockModule('./models/analytics.model.js', () => ({
  default: { bulkWrite: jest.fn().mockResolvedValue({}) },
}));

jest.unstable_mockModule('./models/link.model.js', () => ({
  default: { bulkWrite: jest.fn().mockResolvedValue({}) },
}));

const { enqueue, flush } = await import('./batcher.js');
const Click = (await import('./models/click.model.js')).default;
const Url = (await import('./models/link.model.js')).default;

const item = (n) => ({
  click: { eventId: `e${n}`, code: `c${n}` },
  code: `c${n}`,
  analyticsKey: { id: `c${n}|day`, code: `c${n}`, date: new Date('2026-01-01'), inc: { totalClicks: 1 } },
});

const bulkError = (writeErrors) =>
  Object.assign(new Error('bulk write failed'), { code: 11000, writeErrors });

describe('batcher flush', () => {
  it('acks and counts every click when all inserts succeed', async () => {
    Click.insertMany.mockResolvedValueOnce([]);

    const promises = [enqueue(item(1)), enqueue(item(2))];
    await flush();
    await expect(Promise.all(promises)).resolves.toBeDefined();

    const urlOps = Url.bulkWrite.mock.calls[0][0];
    expect(urlOps).toHaveLength(2);
  });

  it('acks duplicates but leaves them out of the aggregates', async () => {
    Click.insertMany.mockRejectedValueOnce(bulkError([{ index: 0, code: 11000 }]));

    const promises = [enqueue(item(1)), enqueue(item(2))];
    await flush();
    await expect(Promise.all(promises)).resolves.toBeDefined();

    const urlOps = Url.bulkWrite.mock.calls[0][0];
    expect(urlOps).toHaveLength(1);
    expect(urlOps[0].updateOne.filter.code).toBe('c2');
  });

  it('rejects the batch when a write fails for a reason other than a duplicate', async () => {
    Click.insertMany.mockRejectedValueOnce(
      bulkError([{ index: 0, code: 11000 }, { index: 1, code: 121 }])
    );

    const promises = [enqueue(item(1)), enqueue(item(2))];
    const settled = Promise.allSettled(promises);
    await flush();

    const results = await settled;
    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(Url.bulkWrite).not.toHaveBeenCalled();
  });

  it('rejects the batch on a non-bulk error so RabbitMQ redelivers', async () => {
    Click.insertMany.mockRejectedValueOnce(new Error('connection lost'));

    const promises = [enqueue(item(1))];
    const settled = Promise.allSettled(promises);
    await flush();

    const results = await settled;
    expect(results[0].status).toBe('rejected');
    expect(Url.bulkWrite).not.toHaveBeenCalled();
  });
});
