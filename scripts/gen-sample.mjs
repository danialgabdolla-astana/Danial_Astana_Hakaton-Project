// Generates a realistic 3-month checking-account statement for the demo persona
// "Sarah, 31, Austin TX, $72k salary, renting, wants a first home".
import { writeFileSync } from "node:fs";

let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const between = (a, b) => Math.round((a + rand() * (b - a)) * 100) / 100;

const rows = [];
const add = (y, m, d, desc, amt) =>
  rows.push([`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`, desc, amt.toFixed(2)]);

const months = [
  [2026, 8],
  [2026, 9],
  [2026, 10],
];

// Biweekly paychecks
for (const [y, m, d] of [
  [2026, 8, 7], [2026, 8, 21], [2026, 9, 4], [2026, 9, 18], [2026, 10, 2], [2026, 10, 16], [2026, 10, 30],
]) add(y, m, d, "ACME LOGISTICS PAYROLL DIRECT DEP", 2180);

months.forEach(([y, m], i) => {
  add(y, m, 1, "ZELLE PAYMENT TO OAK CREEK APARTMENTS", -1795);
  add(y, m, 3, "NETFLIX.COM", i < 2 ? -15.49 : -17.99);
  add(y, m, 4, "SPOTIFY USA", -11.99);
  add(y, m, 5, "APPLE MUSIC APPLE.COM/BILL", -10.99);
  add(y, m, 6, "HULU 877-8244858 CA", -9.99);
  add(y, m, 8, "MAX.COM", -16.99);
  add(y, m, 9, "DISNEY PLUS", -13.99);
  add(y, m, 10, "PELOTON MEMBERSHIP", -24.0);
  add(y, m, 11, "PLANET FITNESS #0412", -24.99);
  add(y, m, 12, "ADOBE CREATIVE CLOUD", -59.99);
  add(y, m, 13, "AUDIBLE ADBL MEMBERSHIP", -14.95);
  add(y, m, 14, "OPENAI CHATGPT SUBSCR", -20.0);
  add(y, m, 15, "DOORDASH DASHPASS", -9.99);
  add(y, m, 16, "AMAZON PRIME MEMBERSHIP", -14.99);
  add(y, m, 17, "APPLE ICLOUD STORAGE", -2.99);
  if (i >= 1) add(y, m, 18, "DUOLINGO SUPER", -12.99); // free trial that converted
  add(y, m, 19, "KLARNA* NORDSTROM", -47.5);
  add(y, m, 7, "AFTERPAY ULTA BEAUTY", -32.25);
  add(y, m, 21, "AFTERPAY ULTA BEAUTY", -32.25);
  add(y, m, 22, "AFFIRM PAYMENT", -89.0);
  add(y, m, 20, "NAVIENT STUDENT LOAN PMT", -310.0);
  add(y, m, 23, "GEICO AUTO INSURANCE", -186.0);
  add(y, m, 24, "COMCAST XFINITY INTERNET", -85.0);
  add(y, m, 25, "VERIZON WIRELESS", -92.0);
  add(y, m, 26, "AUSTIN ENERGY UTILITY", -between(105, 148));

  for (let k = 0; k < 5; k++) add(y, m, 2 + k * 6, "HEB #0412 AUSTIN TX", -between(48, 132));
  add(y, m, 15, "TRADER JOE'S #551", -between(35, 70));
  for (let k = 0; k < 11; k++) add(y, m, 1 + Math.floor(k * 2.7), `DOORDASH ORDER #${48000 + i * 100 + k}`, -between(24, 46));
  for (let k = 0; k < 9; k++) add(y, m, 2 + k * 3, "STARBUCKS STORE #10234", -between(5.75, 8.45));
  for (let k = 0; k < 3; k++) add(y, m, 5 + k * 9, "CHIPOTLE ONLINE", -between(12, 16));
  for (let k = 0; k < 6; k++) add(y, m, 3 + k * 4, "UBER TRIP", -between(11, 27));
  for (let k = 0; k < 3; k++) add(y, m, 6 + k * 9, "SHELL OIL 57442", -between(38, 52));
  for (let k = 0; k < 4; k++) add(y, m, 4 + k * 7, "AMAZON MKTPL ORDER", -between(14, 82));
  for (let k = 0; k < 2; k++) add(y, m, 9 + k * 12, "TARGET T-2291", -between(25, 90));
  add(y, m, 27, "CVS PHARMACY", -between(12, 40));
});
add(2026, 9, 13, "SOUTHWEST AIRLINES", -238.4);
add(2026, 10, 11, "TICKETMASTER", -142.0);
add(2026, 8, 29, "VENMO FROM JESS M", 60);

rows.sort((a, b) => a[0].localeCompare(b[0]));
const csv = ["Date,Description,Amount", ...rows.map((r) => `${r[0]},"${r[1]}",${r[2]}`)].join("\n");
writeFileSync(new URL("../public/sample-statement.csv", import.meta.url), csv + "\n");
console.log(`wrote ${rows.length} rows`);
