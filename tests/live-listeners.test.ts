// node --test: live counts in the Rádio tab without bots
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isBotListener, humanLiveCounts, isUmamiStats } from '../src/lib/liveListeners.ts';

const l = (ip: string, ua: string, is_bot = false) => ({ ip, user_agent: ua, device: { is_bot } });

test('bot rule matches the SQL classify_listener_source', () => {
  for (const ua of ['curl/8.5.0', 'Wget/1.21', 'python-requests/2.31', 'Googlebot/2.1', 'UptimeRobot/2.0', 'Arquivo-web-crawler', 'heritrix/3']) {
    assert.ok(isBotListener(l('1.1.1.1', ua)), ua);
  }
  for (const ua of ['OlhaQueDuas/2.4.1 (Android)', 'Mozilla/5.0 (X11; Linux x86_64)', 'okhttp/4.12', 'AppleCoreMedia/1.0', 'ExoPlayer/13.3']) {
    assert.ok(!isBotListener(l('1.1.1.1', ua)), ua);
  }
  assert.ok(isBotListener(l('1.1.1.1', 'Mozilla/5.0', true)));
});

test('qa case: AzuraCast says 2 with the curl, Rádio shows 1', () => {
  const list = [l('46.225.17.9', 'curl/8.5.0'), l('176.223.1.2', 'OlhaQueDuas/2.4.1 (Android)')];
  assert.deepEqual(humanLiveCounts({ total: 2, unique: 2, current: 2 }, list), { total: 1, unique: 1, current: 1, bots: 1 });
});

test('family: any mix of humans/bots, shared IPs, no list', () => {
  for (let humans = 0; humans <= 3; humans++) {
    for (let bots = 0; bots <= 2; bots++) {
      for (const sharedIp of [false, true]) {
        const list = [
          ...Array.from({ length: humans }, (_, i) => l(`10.0.0.${i}`, 'OlhaQueDuas/2.4.1 (Android)')),
          ...Array.from({ length: bots }, (_, i) => l(sharedIp && humans > 0 ? '10.0.0.0' : `9.9.9.${i}`, 'curl/8.5.0')),
        ];
        const ips = new Set(list.map((x) => x.ip)).size;
        const r = humanLiveCounts({ total: list.length, unique: ips, current: ips }, list);
        const humanIps = new Set(list.filter((x) => !isBotListener(x)).map((x) => x.ip)).size;
        assert.equal(r.total, humans);
        assert.equal(r.unique, humanIps, JSON.stringify({ humans, bots, sharedIp }));
        assert.equal(r.current, humanIps);
        assert.equal(r.bots, bots);
      }
    }
  }
  // No detailed list: fall back to the bot count of the last snapshot, never below 0
  assert.deepEqual(humanLiveCounts({ total: 2, unique: 2, current: 2 }, null, 1), { total: 1, unique: 1, current: 1, bots: 1 });
  assert.deepEqual(humanLiveCounts({ total: 0, unique: 0, current: 0 }, null, 1), { total: 0, unique: 0, current: 0, bots: 1 });
  assert.deepEqual(humanLiveCounts({ total: 3, unique: 3, current: 3 }, null, null), { total: 3, unique: 3, current: 3, bots: 0 });
});

test('isUmamiStats rejects empty or odd bodies', () => {
  assert.equal(isUmamiStats({}), false);
  assert.equal(isUmamiStats(null), false);
  assert.equal(isUmamiStats([]), false);
  assert.equal(isUmamiStats({ pageviews: 0, visitors: 0 }), true);
  assert.equal(isUmamiStats({ pageviews: { value: 3 }, visitors: { value: 1 } }), true);
});
