const Base = require('./_base');

class RssRepository extends Base {
  constructor() { super('rss_feeds'); }
}

module.exports = new RssRepository(); 