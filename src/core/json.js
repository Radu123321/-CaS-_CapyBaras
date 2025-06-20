// Simple helpers for parsing JSON request bodies safely without external libs

const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1 MB

function parseRequest(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      // Empty body accepted
      return resolve({});
    }
    let total = 0;
    const chunks = [];
    req.on('data', chunk => {
      total += chunk.length;
      if (total > MAX_BODY_SIZE) {
        reject(new Error('Body too large'));
        req.pause();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        const data = raw ? JSON.parse(raw) : {};
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

module.exports = { parseRequest }; 