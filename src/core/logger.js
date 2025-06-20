+'use strict';
const fs = require('fs');
const path = require('path');

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const current = LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] ?? 1;

// Ensure logs directory exists
const logsDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Daily rotating file name logs/cas-YYYYMMDD.log
function logFilePath() {
  const d = new Date();
  const stamp = d.toISOString().slice(0, 10).replace(/-/g, '');
  return path.join(logsDir, `cas-${stamp}.log`);
}

let stream = fs.createWriteStream(logFilePath(), { flags: 'a' });

function rotateIfNeeded() {
  const expected = logFilePath();
  if (stream.path !== expected) {
    stream.end();
    stream = fs.createWriteStream(expected, { flags: 'a' });
  }
}

function format(level, msg) {
  const time = new Date().toISOString();
  return `${time} [${level.toUpperCase()}] ${msg}`;
}

function write(level, msg) {
  rotateIfNeeded();
  const line = format(level, msg);
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](line);
  stream.write(line + '\n');
}

function debug(msg) {
  if (current <= LEVELS.debug) write('debug', msg);
}
function info(msg) {
  if (current <= LEVELS.info) write('info', msg);
}
function warn(msg) {
  if (current <= LEVELS.warn) write('warn', msg);
}
function error(msg) {
  write('error', msg);
}

module.exports = { debug, info, warn, error }; 