import { assertEquals } from "jsr:@std/assert@1";
import { isoUtc, lisbonMidnight, toConnectionRows, type AzuraListener } from "./connections.ts";

const listener = (overrides: Partial<AzuraListener>): AzuraListener => ({
  hash: "abc",
  ip: "46.102.23.22",
  user_agent: "okhttp/4.12.0",
  mount_name: "/radio.mp3 (192kbps MP3)",
  location: { country: "PT", city: "Lisbon" },
  device: { client: "OkHttp 4.12, Android", is_mobile: true, is_bot: false },
  ...overrides,
});

Deno.test("lisbonMidnight: verão (UTC+1) e inverno (UTC+0)", () => {
  assertEquals(isoUtc(lisbonMidnight("2026-09-14")), "2026-09-13T23:00:00Z");
  assertEquals(isoUtc(lisbonMidnight("2026-01-10")), "2026-01-10T00:00:00Z");
  // Dias de mudança de hora
  assertEquals(isoUtc(lisbonMidnight("2026-03-29")), "2026-03-29T00:00:00Z");
  assertEquals(isoUtc(lisbonMidnight("2026-10-25")), "2026-10-24T23:00:00Z");
});

Deno.test("toConnectionRows: ignora ligações cortadas no início da janela", () => {
  const start = 1_000_000;
  const rows = toConnectionRows(
    [
      listener({ hash: "clipped", connected_on: start, connected_until: start + 600 }),
      listener({ hash: "inside", connected_on: start + 60, connected_until: start + 1060 }),
    ],
    start,
    start + 3600,
  );
  assertEquals(rows.map((r) => r.listener_hash), ["inside"]);
  assertEquals(rows[0].connected_seconds, 1000);
});

Deno.test("toConnectionRows: corta o fim ao fim da janela (AzuraCast arredonda ao minuto)", () => {
  const start = 2_000_000;
  const end = start + 3600;
  const [row] = toConnectionRows(
    [listener({ connected_on: start + 100, connected_until: end + 59 })],
    start,
    end,
  );
  assertEquals(row.connected_seconds, 3500);
  assertEquals(row.connected_until, isoUtc(end));
});

Deno.test("toConnectionRows: mapeia campos e deduplica pela chave hash+início", () => {
  const start = 3_000_000;
  const rows = toConnectionRows(
    [
      listener({ connected_on: start + 10, connected_until: start + 70 }),
      listener({ connected_on: start + 10, connected_until: start + 310 }),
      listener({ hash: undefined, connected_on: start + 10, connected_until: start + 20 }),
    ],
    start,
    start + 3600,
  );
  assertEquals(rows.length, 1);
  assertEquals(rows[0], {
    listener_hash: "abc",
    connected_on: isoUtc(start + 10),
    connected_until: isoUtc(start + 310),
    connected_seconds: 300,
    ip_address: "46.102.23.22",
    user_agent: "okhttp/4.12.0",
    client: "OkHttp 4.12, Android",
    is_mobile: true,
    is_bot: false,
    country: "PT",
    city: "Lisbon",
    mount: "/radio.mp3 (192kbps MP3)",
  });
});

Deno.test("toConnectionRows: ligação ainda ativa sem connected_until termina no fim da janela", () => {
  const start = 4_000_000;
  const [row] = toConnectionRows([listener({ connected_on: start + 100, connected_until: 0 })], start, start + 500);
  assertEquals(row.connected_seconds, 400);
});
