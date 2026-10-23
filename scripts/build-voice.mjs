#!/usr/bin/env node
// Offline public asset compilation, never an online service. Official vendor only.
// Index keys: SHA-256(exact UTF-8 chunk), distinct from voice.js versioned IDB keys.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODEL = 'Qwen/Qwen3-TTS-12Hz-0.6B-Base';
const COMMIT = '022e286b98fbec7e1e916cb940cdf532cd9f488e';
const BASE = 'http://127.0.0.1:8000';
const REF_TEXT = '안녕하세요. 좋은 아침이에요. 잘 잤어요?';
const DAY_TEXT = 'AI로 만든 팬 인사예요. 반가워요. 좋아하는 노래 한 곡 들으며 잠깐 쉬어 가세요. 오늘도 편안한 하루 보내세요.';
const GUIDE_TEXT = '공개 안내예요. 버튼을 누르면 화면의 안내를 확인할 수 있어요.';
// Pinned qwen_tts/cli/demo.py:442 returns this exact status, not "success".
// https://github.com/QwenLM/Qwen3-TTS/blob/022e286b98fbec7e1e916cb940cdf532cd9f488e/qwen_tts/cli/demo.py#L442
const SUCCESS_STATUS = 'Finished. (生成完成)';
function successfulResult(data) { return Array.isArray(data) && data.length >= 2 && !!data[0] && data[1] === SUCCESS_STATUS; }
const MAX_WAV = 12 * 1024 * 1024, MAX_MP3 = 2 * 1024 * 1024;
const sha = text => createHash('sha256').update(text, 'utf8').digest('hex');
function check(ok, code) { if (!ok) throw new Error(code); }
// Exactly voice.js cutText: codepoints, boundary >=40, 160/chunk, 12/3000 caps.
function cutText(text) {
  let points = Array.from(text), partial = points.length > 3000;
  points = points.slice(0, 3000); const chunks = [];
  while (points.length && chunks.length < 12) {
    let end = Math.min(160, points.length);
    if (end < points.length) {
      let boundary = 0;
      for (let i = 0; i < end; i++) if (/[.!?。！？\s]/u.test(points[i])) boundary = i + 1;
      if (boundary >= 40) end = boundary;
    }
    const part = points.splice(0, end).join('').trim(); if (part) chunks.push(part);
  }
  return { chunks, partial: partial || points.length > 0 };
}
function wavInfo(b) {
  check(Buffer.isBuffer(b) && b.length >= 44 && b.length <= MAX_WAV, 'wav_size');
  check(b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WAVE', 'wav_header');
  const limit = b.readUInt32LE(4) + 8; check(limit === b.length, 'wav_riff_size');
  let fmt, data;
  for (let p = 12; p + 8 <= limit;) {
    const id = b.toString('ascii', p, p + 4), n = b.readUInt32LE(p + 4), start = p + 8;
    check(start + n <= limit, 'wav_chunk_bounds');
    if (id === 'fmt ') {
      check(n >= 16, 'wav_fmt');
      fmt = { format: b.readUInt16LE(start), channels: b.readUInt16LE(start + 2), sampleRate: b.readUInt32LE(start + 4), byteRate: b.readUInt32LE(start + 8), blockAlign: b.readUInt16LE(start + 12), bits: b.readUInt16LE(start + 14) };
    }
    if (id === 'data') { check(!data, 'wav_duplicate_data'); data = b.subarray(start, start + n); }
    p = start + n + (n & 1);
  }
  check(fmt && data?.length, 'wav_chunks_missing');
  const { format, channels, sampleRate, byteRate, blockAlign, bits } = fmt;
  check((format === 1 && [16, 24, 32].includes(bits)) || (format === 3 && bits === 32), 'wav_encoding');
  check(channels >= 1 && channels <= 2 && sampleRate >= 8000 && sampleRate <= 96000, 'wav_format');
  check(blockAlign === channels * bits / 8 && byteRate === sampleRate * blockAlign && data.length % blockAlign === 0, 'wav_alignment');
  const duration = data.length / byteRate; check(duration >= 0.4 && duration <= 120, 'wav_duration');
  let peak = 0, sum = 0, nonzero = 0; const step = bits / 8, count = data.length / step;
  for (let i = 0; i < data.length; i += step) {
    const v = format === 3 ? data.readFloatLE(i) : bits === 16 ? data.readInt16LE(i) / 32768 : bits === 24 ? data.readIntLE(i, 3) / 8388608 : data.readInt32LE(i) / 2147483648;
    check(Number.isFinite(v) && Math.abs(v) <= 1.01, 'wav_sample');
    peak = Math.max(peak, Math.abs(v)); sum += v * v; if (Math.abs(v) > 0.0001) nonzero++;
  }
  const rms = Math.sqrt(sum / count);
  check(peak > 0.0001 && rms > 0.00001 && nonzero / count > 0.0001, 'wav_silent');
  return { format, channels, sampleRate, bits, durationSeconds: +duration.toFixed(3), rms: +rms.toFixed(6), peak: +peak.toFixed(6), bytes: b.length };
}
function localFile(file) {
  check(file && typeof file === 'object', 'result_file_missing');
  const value = file.url || (typeof file.path === 'string' ? BASE + '/gradio_api/file=' + file.path : '');
  // Validate raw path before URL normalization can hide traversal.
  check(typeof value === 'string' && !/\.\.|%2e|%2f|%5c|\\/i.test(value), 'result_path');
  let u; try { u = new URL(value, BASE); } catch { throw new Error('result_url'); }
  check(u.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(u.hostname) && u.port === '8000' && !u.username && !u.password && !u.search && !u.hash, 'result_origin');
  check(/^\/(?:gradio_api\/)?file=\/tmp\/gradio\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.wav$/i.test(u.pathname), 'result_path');
  return u.href;
}
async function download(url, ms) {
  const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(Math.max(1, ms)) });
  check(res.ok && res.body, 'download_http');
  const size = Number(res.headers.get('content-length')); check(!size || size <= MAX_WAV, 'download_size');
  const chunks = []; let total = 0;
  for await (const chunk of res.body) { total += chunk.length; check(total <= MAX_WAV, 'download_size'); chunks.push(Buffer.from(chunk)); }
  return Buffer.concat(chunks);
}
async function atomic(file, bytes) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file + '.tmp', bytes); await fs.rename(file + '.tmp', file);
}
function bounded(promise, ms, code) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(code)), Math.max(1, ms)); })]).finally(() => clearTimeout(timer));
}
function terminate(child, signal = 'SIGTERM') {
  if (!child?.pid) return;
  try { if (process.platform !== 'win32') process.kill(-child.pid, signal); else child.kill(signal); } catch {}
}
async function command(bin, args, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', bytes = 0, done = false;
    const timer = setTimeout(() => { terminate(child, 'SIGKILL'); finish(new Error('tool_timeout')); }, Math.max(1, timeout));
    function finish(error) { if (done) return; done = true; clearTimeout(timer); error ? reject(error) : resolve(out); }
    child.stdout.on('data', b => { bytes += b.length; if (bytes <= 65536) out += b.toString(); else { terminate(child, 'SIGKILL'); finish(new Error('tool_output_limit')); } });
    child.stderr.on('data', () => {}); // No arbitrary runtime logs or URLs/tokens.
    child.on('error', () => finish(new Error('tool_launch')));
    child.on('close', code => finish(code === 0 ? null : new Error('tool_exit')));
  });
}

const CATALOG_BYTES = 512 * 1024, CATALOG_ENTRIES = 250, INDEX_BYTES = 32 * 1024 * 1024;
function generationSource(reference) {
  return { backend: 'official-qwen-tts-demo', device: 'cpu', dtype: 'float32', referenceSha256: createHash('sha256').update(reference).digest('hex'), referenceText: REF_TEXT, language: 'Korean', xVectorOnly: false, maxNewTokens: 1024, mp3: 'libmp3lame-64k-mono-24000' };
}
function sameSource(a, b) {
  return !!a && typeof a === 'object' && Object.keys(a).length === Object.keys(b).length && Object.keys(b).every(k => a[k] === b[k]);
}
function compatibleIndex(value, source) {
  return !!value && value.version === 1 && value.hashAlgorithm === 'SHA-256' && value.model === MODEL && value.vendorCommit === COMMIT && /^[a-f0-9]{64}$/.test(source.referenceSha256) && value.referenceSha256 === source.referenceSha256 && sameSource(value.source, source) && !!value.clips && typeof value.clips === 'object' && !Array.isArray(value.clips) && Object.keys(value.clips).length <= 8192 && Array.isArray(value.entries);
}
function validClipRow(hash, row) {
  return /^[a-f0-9]{64}$/.test(hash) && !!row && typeof row.text === 'string' && Array.from(row.text).length <= 160 && row.text.trim() === row.text && row.text.length > 0 && sha(row.text) === hash && row.src === './voice-clips/' + hash + '.mp3' && row.codec === 'mp3' && row.sampleRate === 24000 && row.channels === 1 && Number.isInteger(row.bytes) && row.bytes >= 512 && row.bytes <= MAX_MP3 && Number.isFinite(row.durationSeconds) && row.durationSeconds >= .4 && row.durationSeconds <= 121;
}
function validCatalog(catalog, bytes) {
  check(bytes <= CATALOG_BYTES, 'catalog_size');
  check(catalog && catalog.version === 1 && Array.isArray(catalog.entries) && catalog.entries.length <= CATALOG_ENTRIES, 'catalog_schema');
  const ids = new Set(['day']);
  for (const e of catalog.entries) {
    check(e && /^[a-zA-Z0-9_-]{1,64}$/.test(e.id) && !ids.has(e.id) && typeof e.text === 'string' && e.text.length <= 12000 && e.text.trim().length > 0 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(e.text), 'catalog_entry'); ids.add(e.id);
  }
  return catalog;
}
// Diagnostic allowlist: never publish arbitrary stderr, environment, paths, code or values.
// Redact first, then emit only known exception classes and short fixed reason labels.
function sanitizeError(line) {
  const clean = String(line).replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/(?:https?|ftp):\/\/\S+/gi, '[url]').replace(/(?:bearer|cookie|authorization|token|secret|password|api[_-]?key|hf_[A-Za-z0-9]+|gh[pousr]_[A-Za-z0-9]+)[^\r\n]*/gi, '[credential-redacted]');
  const classes = clean.match(/\b(?:RuntimeError|ValueError|TypeError|ImportError|ModuleNotFoundError|OSError|MemoryError|FileNotFoundError|PermissionError|AssertionError|AttributeError|ConnectionError|TimeoutError|HTTPError|OutOfMemoryError)\b/g) || [];
  const reasons = [/out of memory|cannot allocate memory/i, /no module named/i, /no space left/i, /connection refused/i, /address already in use/i, /unsupported|not supported/i, /not found|no such file/i, /permission denied/i, /timed? out|timeout/i, /invalid|unexpected/i, /flash.?att/i, /torch|torchaudio/i];
  const labels = ['memory exhaustion', 'missing module', 'disk full', 'connection refused', 'port in use', 'unsupported operation', 'missing resource', 'permission denied', 'timeout', 'invalid argument or data', 'flash attention dependency', 'torch dependency'];
  const found = reasons.flatMap((re, i) => re.test(clean) ? [labels[i]] : []);
  if (!classes.length && !found.length) return null;
  return [...new Set([...classes, ...found])].join(': ').slice(0, 240);
}
function errorTail() {
  let pending = ''; const tail = [];
  const line = s => { const safe = sanitizeError(s); if (safe && tail.at(-1) !== safe) { tail.push(safe); if (tail.length > 12) tail.shift(); } };
  return { tail, push(bytes) { pending += bytes.toString('utf8'); let n; while ((n = pending.indexOf('\n')) >= 0) { line(pending.slice(0, n)); pending = pending.slice(n + 1); } if (pending.length > 4096) { line(pending); pending = ''; } }, flush() { line(pending); pending = ''; } };
}
async function probeMp3(file, timeout = 10000) {
  const stat = await fs.lstat(file); check(stat.isFile() && !stat.isSymbolicLink() && stat.size >= 512 && stat.size <= MAX_MP3, 'mp3_size');
  const probe = JSON.parse(await command('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_name,sample_rate,channels:format=duration,size', '-of', 'json', file], timeout));
  const duration = Number(probe.format?.duration), stream = probe.streams?.[0];
  check(stream?.codec_name === 'mp3' && Number(stream.sample_rate) === 24000 && stream.channels === 1 && Number(probe.format?.size) === stat.size && duration >= .4 && duration <= 121, 'mp3_validation');
  return { bytes: stat.size, durationSeconds: +duration.toFixed(3) };
}
async function loadPrior(source, clips, report, left) {
  let prior;
  try {
    const stat = await fs.lstat(path.join(ROOT, 'voice-index.json')); check(stat.isFile() && !stat.isSymbolicLink() && stat.size <= INDEX_BYTES, 'prior_index_size');
    prior = JSON.parse(await fs.readFile(path.join(ROOT, 'voice-index.json'), 'utf8'));
    check(compatibleIndex(prior, source), 'prior_index_incompatible');
    const dir = await fs.lstat(path.join(ROOT, 'voice-clips')); check(dir.isDirectory() && !dir.isSymbolicLink(), 'prior_clip_directory');
  } catch (e) { if (e.code !== 'ENOENT') report.errors.push('prior_index_rejected'); return []; }
  report.priorRejected = 0;
  for (const [hash, row] of Object.entries(prior.clips)) {
    if (left() < 15000) { report.errors.push('prior_validation_budget'); break; }
    try {
      check(validClipRow(hash, row), 'prior_clip_schema');
      const file = path.join(ROOT, 'voice-clips', hash + '.mp3');
      const info = await probeMp3(file, Math.min(left(), 10000));
      check(info.bytes === row.bytes && Math.abs(info.durationSeconds - row.durationSeconds) <= .01, 'prior_clip_metadata');
      clips[hash] = { text: row.text, src: row.src, ...info, codec: 'mp3', sampleRate: 24000, channels: 1 };
    } catch { report.priorRejected++; }
  }
  // Only retain prior entry metadata whose exact chunks agree with the current splitter.
  return prior.entries.filter(e => e && /^[a-zA-Z0-9_-]{1,64}$/.test(e.id) && typeof e.text === 'string' && e.text.length <= 12000 && Array.isArray(e.chunks) && JSON.stringify(e.chunks) === JSON.stringify(cutText(e.text).chunks.map(sha))).map(e => ({ id: e.id, text: e.text, chunks: e.chunks, partial: cutText(e.text).partial }));
}

async function plan() {
  const entries = [{ id: 'day', text: DAY_TEXT }]; let catalog, hasCatalog = false;
  try {
    const f = await fs.lstat(path.join(ROOT, 'voice-catalog.json')); check(f.isFile() && !f.isSymbolicLink() && f.size <= CATALOG_BYTES, 'catalog_size');
    catalog = validCatalog(JSON.parse(await fs.readFile(path.join(ROOT, 'voice-catalog.json'), 'utf8')), f.size); hasCatalog = true;
  } catch (e) { if (e.code !== 'ENOENT') throw new Error('catalog_invalid'); }
  if (hasCatalog) for (const e of catalog.entries) entries.push({ id: e.id, text: e.text.trim() });
  else entries.push({ id: 'guide', text: GUIDE_TEXT });
  return entries.map(e => { const split = cutText(e.text); return { ...e, partial: split.partial, texts: split.chunks, chunks: split.chunks.map(sha) }; });
}
async function selfTest() {
  const make = silent => {
    const b = Buffer.alloc(44 + 16000); b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24); b.writeUInt32LE(16000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(16000, 40);
    if (!silent) for (let i = 0; i < 8000; i++) b.writeInt16LE(Math.round(5000 * Math.sin(i * .2)), 44 + i * 2);
    return b;
  };
  assert.equal(wavInfo(make(false)).durationSeconds, 1);
  assert.throws(() => wavInfo(make(true)), /wav_silent/);
  assert.throws(() => wavInfo(Buffer.from('not wav')), /wav_size/);
  const broken = make(false); broken.writeUInt32LE(0xffffffff, 40); assert.throws(() => wavInfo(broken), /wav_chunk_bounds/);
  const invalid = make(false); invalid.writeUInt32LE(1, 24); assert.throws(() => wavInfo(invalid), /wav_format/);
  assert.equal(cutText('😀'.repeat(161)).chunks[0].length, 320);
  assert.equal(cutText('a'.repeat(50) + ' ' + 'b'.repeat(120)).chunks[0], 'a'.repeat(50));
  assert.equal(cutText('x'.repeat(3100)).chunks.length, 12); assert.equal(cutText('x'.repeat(3100)).partial, true);
  assert.equal(sha('hello'), '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  assert.equal(localFile({ path: '/tmp/gradio/abc/audio.wav' }), BASE + '/gradio_api/file=/tmp/gradio/abc/audio.wav');
  for (const url of ['https://example.com/gradio_api/file=/tmp/gradio/a.wav', 'http://127.0.0.1:8001/gradio_api/file=/tmp/gradio/a.wav', BASE + '/gradio_api/file=/tmp/gradio/../secret.wav', BASE + '/gradio_api/file=/tmp/gradio/a.wav?token=x', BASE + '/gradio_api/file=/etc/passwd', BASE + '/gradio_api/file=/tmp/gradio/%2e%2e/a.wav']) assert.throws(() => localFile({ url }));

  const source = { backend: 'official-qwen-tts-demo', device: 'cpu', referenceSha256: 'a'.repeat(64) };
  const prior = { version: 1, hashAlgorithm: 'SHA-256', model: MODEL, vendorCommit: COMMIT, referenceSha256: source.referenceSha256, source, clips: {}, entries: [] };
  assert.equal(compatibleIndex(prior, source), true);
  for (const changed of [{ version: 2 }, { model: 'other' }, { vendorCommit: 'other' }, { referenceSha256: 'b'.repeat(64) }, { hashAlgorithm: 'other' }, { source: { backend: 'hosted-api', device: 'cpu' } }, { clips: [] }, { entries: null }]) assert.equal(compatibleIndex({ ...prior, ...changed }, source), false);
  const h = sha('hello'), row = { text: 'hello', src: './voice-clips/' + h + '.mp3', bytes: 1000, durationSeconds: 1, codec: 'mp3', sampleRate: 24000, channels: 1 };
  assert.equal(validClipRow(h, row), true);
  for (const changed of [{ text: 'different' }, { src: '../escape.mp3' }, { src: 'https://remote/audio.mp3' }, { bytes: MAX_MP3 + 1 }, { durationSeconds: 0 }, { channels: 2 }, { codec: 'wav' }]) assert.equal(validClipRow(h, { ...row, ...changed }), false);
  const catalog = { version: 1, entries: Array.from({ length: 250 }, (_, i) => ({ id: 'public_' + i, text: '공개 안내예요.' })) };
  assert.equal(validCatalog(catalog, CATALOG_BYTES), catalog);
  assert.throws(() => validCatalog(catalog, CATALOG_BYTES + 1), /catalog_size/);
  assert.throws(() => validCatalog({ ...catalog, entries: [...catalog.entries, { id: 'extra', text: '안내' }] }, 100), /catalog_schema/);
  assert.throws(() => validCatalog({ version: 1, entries: [{ id: 'x', text: 'a' }, { id: 'x', text: 'b' }] }, 100), /catalog_entry/);
  assert.throws(() => validCatalog(null, 100), /catalog_schema/);
  const safe = sanitizeError('RuntimeError: out of memory https://host/path?token=private Bearer super-secret Cookie: session=value');
  assert.equal(safe, 'RuntimeError: memory exhaustion');
  assert.equal(sanitizeError('TOKEN=super-secret'), null);
  const logs = errorTail();
  for (let i = 0; i < 30; i++) logs.push(Buffer.from(i % 2 ? 'ValueError: invalid argument\n' : 'RuntimeError: out of memory\n'));
  assert.equal(logs.tail.length, 12);

  assert.equal(successfulResult([{ path: '/tmp/gradio/x/a.wav' }, 'Finished. (生成完成)']), true);
  assert.equal(successfulResult([null, 'Finished. (生成完成)']), false);
  assert.equal(successfulResult([{}, 'Success']), false);
  assert.equal(successfulResult([{}, 'RuntimeError: failed']), false);
  console.log(JSON.stringify({ selfTest: true, success: true, checks: 46 }));
}
async function main() {
  const start = Date.now(), budget = Math.min(1080, Math.max(60, Number(process.env.VOICE_BUDGET_SECONDS) || 1080)) * 1000;
  const end = start + budget - 20000; // checkpoint/cleanup reserve
  const report = { version: 1, success: false, state: 'starting', model: MODEL, vendorCommit: COMMIT, device: 'cpu', dtype: 'float32', budgetSeconds: budget / 1000, produced: 0, reused: 0, retained: 0, plannedChunks: 0, firstClip: null, errors: [], listeningQuality: 'not assessed' };
  const clips = Object.create(null); let entries = [], server, client, temp, indexWritten = false, source, priorEntries = [];
  const stdoutLog = errorTail(), stderrLog = errorTail(); let logBytes = 0;
  const left = () => Math.max(1, end - Date.now());
  async function checkpoint() {
    if (!Object.keys(clips).length) return;
    const sorted = Object.fromEntries(Object.keys(clips).sort().map(k => [k, clips[k]]));
    await atomic(path.join(ROOT, 'voice-index.json'), JSON.stringify({ version: 1, hashAlgorithm: 'SHA-256', model: MODEL, vendorCommit: COMMIT, referenceSha256: source.referenceSha256, source, clips: sorted, entries: [...priorEntries.filter(old => !entries.some(current => current.id === old.id)), ...entries].map(({ id, text, chunks, partial }) => ({ id, text, chunks, partial, complete: chunks.every(k => !!clips[k]) })) }, null, 2) + '\n');
    indexWritten = true;
  }
  const hardStop = setTimeout(() => { report.errors.push('job_budget_expired'); terminate(server, 'SIGKILL'); }, budget - 10000);
  try {
    entries = await plan(); const unique = new Map();
    for (const entry of entries) entry.texts.forEach((text, i) => unique.set(entry.chunks[i], text));
    report.plannedChunks = unique.size;
    const refPath = path.join(ROOT, 'voice-reference.wav'); const stat = await fs.lstat(refPath); check(stat.isFile() && !stat.isSymbolicLink() && stat.size <= MAX_WAV, 'reference_size');
    const reference = await fs.readFile(refPath); wavInfo(reference);
    source = generationSource(reference); report.referenceSha256 = source.referenceSha256;
    await command('ffmpeg', ['-version']); await command('ffprobe', ['-version']);
    await fs.mkdir(path.join(ROOT, 'voice-clips'), { recursive: true });
    const clipDir = await fs.lstat(path.join(ROOT, 'voice-clips')); check(clipDir.isDirectory() && !clipDir.isSymbolicLink(), 'clip_directory');
    priorEntries = await loadPrior(source, clips, report, left);
    report.retained = Object.keys(clips).length;
    report.reused = [...unique.keys()].filter(hash => !!clips[hash]).length;
    await checkpoint();
    if (report.reused === report.plannedChunks) return;
    check(left() > 15000, 'job_budget_reached');
    const resolveClient = createRequire(path.join(process.env.VOICE_CLIENT_DIR || ROOT, 'package.json'));
    const { Client, handle_file } = await import(pathToFileURL(resolveClient.resolve('@gradio/client')).href);
    temp = await fs.mkdtemp(path.join(os.tmpdir(), 'hero-voice-build-'));
    server = spawn('qwen-tts-demo', [MODEL, '--device', 'cpu', '--dtype', 'float32', '--no-flash-attn', '--ip', '127.0.0.1', '--port', '8000', '--concurrency', '1', '--max-new-tokens', '1024'], { detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, GRADIO_ANALYTICS_ENABLED: 'False', HF_HUB_DISABLE_TELEMETRY: '1', OMP_NUM_THREADS: '2', MKL_NUM_THREADS: '2' } });
    let serverFailed = false;
    server.on('error', () => { serverFailed = true; }); server.on('exit', (code, signal) => { serverFailed = true; report.vendorExit = { code, signal }; });
    const drain = (log, b) => { logBytes = Math.min(1048576, logBytes + b.length); log.push(b); };
    server.stdout.on('data', b => drain(stdoutLog, b)); server.stderr.on('data', b => drain(stderrLog, b));
    const startupEnd = Math.min(end - 60000, start + 12 * 60000); let ready = false;
    while (Date.now() < startupEnd && !serverFailed) {
      try { const r = await fetch(BASE + '/config', { redirect: 'error', signal: AbortSignal.timeout(2000) }); if (r.ok) { ready = true; break; } } catch {}
      await new Promise(r => setTimeout(r, 2000));
    }
    report.startupSeconds = +((Date.now() - start) / 1000).toFixed(2); check(ready, serverFailed ? 'vendor_startup_exit' : 'vendor_startup_timeout');
    client = await bounded(Client.connect(BASE), Math.min(left(), 20000), 'client_connect_timeout');
    const api = await bounded(client.view_api(), Math.min(left(), 10000), 'api_timeout');
    check(api?.named_endpoints?.['/run_voice_clone'], 'vendor_api_mismatch');
    report.apiVerified = '/run_voice_clone'; report.vendorSuccessStatus = SUCCESS_STATUS;
    for (const [hash, text] of unique) {
      if (clips[hash]) continue;
      if (Date.now() >= end - 5000) { report.errors.push('job_budget_reached'); break; }
      const before = Date.now();
      try {
        const result = await bounded(client.predict('/run_voice_clone', [handle_file(new Blob([reference], { type: 'audio/wav' })), REF_TEXT, false, text, 'Korean']), left(), 'generation_budget');
        const data = result?.data;
        if (!successfulResult(data)) {
          const note = sanitizeError(data?.[1] || ''); if (note) stderrLog.push(Buffer.from(note + '\n'));
        }
        check(successfulResult(data), 'vendor_generation_unsuccessful');
        const wav = await download(localFile(data[0]), Math.min(left(), 30000)); const info = wavInfo(wav);
        const wavPath = path.join(temp, hash + '.wav'), mp3Path = path.join(temp, hash + '.mp3');
        await fs.writeFile(wavPath, wav);
        await command('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', wavPath, '-map_metadata', '-1', '-vn', '-ac', '1', '-ar', '24000', '-codec:a', 'libmp3lame', '-b:a', '64k', mp3Path], Math.min(left(), 25000));
        const probe = JSON.parse(await command('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_name,sample_rate,channels:format=duration,size', '-of', 'json', mp3Path], Math.min(left(), 10000)));
        const mp3 = await fs.readFile(mp3Path), duration = Number(probe.format?.duration), stream = probe.streams?.[0];
        check(mp3.length >= 512 && mp3.length <= MAX_MP3 && stream?.codec_name === 'mp3' && Number(stream.sample_rate) === 24000 && stream.channels === 1 && duration >= .4 && duration <= 121 && Math.abs(duration - info.durationSeconds) < .5, 'mp3_validation');
        await atomic(path.join(ROOT, 'voice-clips', hash + '.mp3'), mp3);
        if (text === DAY_TEXT) await atomic(path.join(ROOT, 'voice-day.wav'), wav);
        clips[hash] = { text, src: './voice-clips/' + hash + '.mp3', bytes: mp3.length, durationSeconds: +duration.toFixed(3), codec: 'mp3', sampleRate: 24000, channels: 1 };
        report.produced++; await checkpoint();
        if (!report.firstClip) report.firstClip = { hash, id: text === DAY_TEXT ? 'day' : 'catalog', synthesisAndEncodeSeconds: +((Date.now() - before) / 1000).toFixed(2), elapsedSeconds: +((Date.now() - start) / 1000).toFixed(2), wav: info, mp3: clips[hash] };
        await fs.rm(wavPath, { force: true }); await fs.rm(mp3Path, { force: true });
      } catch (e) {
        const code = /^[a-z_]{3,60}$/.test(e.message || '') ? e.message : 'generation_or_validation_error';
        report.errors.push({ hash, code }); if (Date.now() >= end || code === 'generation_budget') break;
      }
    }
    report.vendorLogBytesCapped = logBytes;
  } catch (e) { report.errors.push(/^[a-z_]{3,60}$/.test(e.message || '') ? e.message : 'build_setup_error'); }
  finally {
    clearTimeout(hardStop); terminate(server); await new Promise(r => setTimeout(r, server ? 1000 : 0)); terminate(server, 'SIGKILL');
    try { await bounded(Promise.resolve(client?.close?.()), 1000, 'client_close'); } catch {}
    if (temp) await fs.rm(temp, { recursive: true, force: true }).catch(() => {});
    stdoutLog.flush(); stderrLog.flush();
    report.vendorErrorTail = [...stdoutLog.tail, ...stderrLog.tail].slice(-12);
    report.vendorLogBytesCapped = logBytes;
    report.available = [...new Set(entries.flatMap(e => e.chunks))].filter(hash => !!clips[hash]).length;
    report.retained = Object.keys(clips).length;
    if (!report.firstClip && report.reused) {
      const first = entries.flatMap(e => e.chunks).find(hash => !!clips[hash]);
      report.firstClip = { hash: first, reused: true, mp3: clips[first], timing: 'not measured on this run' };
    }
    report.success = report.available > 0 && indexWritten; report.elapsedSeconds = +((Date.now() - start) / 1000).toFixed(2);
    report.state = !report.success ? 'failed' : report.available === report.plannedChunks && !entries.some(e => e.partial) ? 'complete' : 'partial';
    const json = JSON.stringify(report, null, 2);
    if (process.env.VOICE_REPORT_PATH) await fs.writeFile(process.env.VOICE_REPORT_PATH, json + '\n');
    if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, '## FREE CPU voice asset proof\n\nOfficial vendor CLI, local-only Gradio inference. No listening-quality claim.\n\n~~~json\n' + json + '\n~~~\n');
    console.log(json); process.exitCode = report.success ? 0 : 1;
  }
}
if (process.argv.includes('--self-test')) await selfTest(); else { await main(); process.exit(process.exitCode || 0); }
