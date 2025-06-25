const { query } = require('../core/psql');

class RssRepository {
  // Creează un RSS feed nou
  async create(rssData) {
    const {
      title,
      description,
      link,
      category,
      guid,
      content,
      is_published,
      published_at
    } = rssData;
    
    const insertSQL = `
      INSERT INTO rss_feeds (title, description, link, category, guid, content, 
                           is_published, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING rss_id, title, description, link, category, guid, content,
                is_published, published_at, created_at
    `;
    
    const result = await query(insertSQL, [
      title, description, link, category, guid, content,
      is_published !== undefined ? is_published : true,
      published_at || new Date()
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește toate RSS feeds
  async findAll(filters = {}) {
    const { category, is_published, limit = 50, offset = 0 } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (category) {
      whereClause += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (is_published !== undefined) {
      whereClause += ` AND is_published = $${paramIndex}`;
      params.push(is_published);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT rss_id, title, description, link, category, guid, content,
             is_published, published_at, created_at
      FROM rss_feeds
      ${whereClause}
      ORDER BY published_at DESC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    return await query(selectSQL, params);
  }

  // Găsește RSS feed prin ID
  async findById(rssId) {
    const selectSQL = `
      SELECT rss_id, title, description, link, category, guid, content,
             is_published, published_at, created_at
      FROM rss_feeds
      WHERE rss_id = $1
    `;
    
    const result = await query(selectSQL, [rssId]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește RSS feed prin GUID
  async findByGuid(guid) {
    const selectSQL = `
      SELECT rss_id, title, description, link, category, guid, content,
             is_published, published_at, created_at
      FROM rss_feeds
      WHERE guid = $1
    `;
    
    const result = await query(selectSQL, [guid]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Găsește RSS feeds publicate pentru o categorie
  async findPublishedByCategory(category) {
    const selectSQL = `
      SELECT rss_id, title, description, link, category, guid, content,
             is_published, published_at, created_at
      FROM rss_feeds
      WHERE category = $1 AND is_published = true
      ORDER BY published_at DESC
    `;
    
    return await query(selectSQL, [category]);
  }

  // Găsește RSS feeds recente (ultimele X)
  async findRecent(limit = 10) {
    const selectSQL = `
      SELECT rss_id, title, description, link, category, guid, content,
             is_published, published_at, created_at
      FROM rss_feeds
      WHERE is_published = true
      ORDER BY published_at DESC
      LIMIT $1
    `;
    
    return await query(selectSQL, [limit]);
  }

  // Actualizează RSS feed
  async update(rssId, rssData) {
    const {
      title,
      description,
      link,
      category,
      content,
      is_published
    } = rssData;
    
    const updateSQL = `
      UPDATE rss_feeds 
      SET title = COALESCE($2, title),
          description = COALESCE($3, description),
          link = COALESCE($4, link),
          category = COALESCE($5, category),
          content = COALESCE($6, content),
          is_published = COALESCE($7, is_published)
      WHERE rss_id = $1
      RETURNING rss_id, title, description, link, category, guid, content,
                is_published, published_at, created_at
    `;
    
    const result = await query(updateSQL, [
      rssId, title || null, description || null, link || null,
      category || null, content || null, 
      is_published !== undefined ? is_published : null
    ]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Publică/Depublică RSS feed
  async updatePublishStatus(rssId, isPublished) {
    const updateSQL = `
      UPDATE rss_feeds 
      SET is_published = $2,
          published_at = CASE WHEN $2 = true AND is_published = false 
                             THEN CURRENT_TIMESTAMP 
                             ELSE published_at 
                        END
      WHERE rss_id = $1
      RETURNING rss_id, is_published, published_at
    `;
    
    const result = await query(updateSQL, [rssId, isPublished]);
    return result && result.length > 0 ? result[0] : null;
  }

  // Șterge RSS feed
  async delete(rssId) {
    const deleteSQL = `
      DELETE FROM rss_feeds 
      WHERE rss_id = $1
      RETURNING rss_id
    `;
    
    const result = await query(deleteSQL, [rssId]);
    return result && result.length > 0;
  }

  // Verifică dacă RSS feed există
  async exists(rssId) {
    const selectSQL = `SELECT 1 FROM rss_feeds WHERE rss_id = $1`;
    const result = await query(selectSQL, [rssId]);
    return result && result.length > 0;
  }

  // Verifică dacă GUID există
  async guidExists(guid) {
    const selectSQL = `SELECT 1 FROM rss_feeds WHERE guid = $1`;
    const result = await query(selectSQL, [guid]);
    return result && result.length > 0;
  }

  // Obține toate categoriile disponibile
  async getCategories() {
    const selectSQL = `
      SELECT category, COUNT(*) as feed_count
      FROM rss_feeds
      WHERE is_published = true
      GROUP BY category
      ORDER BY category
    `;
    
    return await query(selectSQL);
  }

  // Obține statistici RSS feeds
  async getStats() {
    const statsSQL = `
      SELECT 
        COUNT(*) as total_feeds,
        COUNT(CASE WHEN is_published = true THEN 1 END) as published_feeds,
        COUNT(CASE WHEN is_published = false THEN 1 END) as draft_feeds,
        COUNT(DISTINCT category) as total_categories,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as feeds_last_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as feeds_last_month
      FROM rss_feeds
    `;
    
    const result = await query(statsSQL);
    return result && result.length > 0 ? result[0] : null;
  }

  // Obține statistici pe categorii
  async getStatsByCategory() {
    const statsSQL = `
      SELECT 
        category,
        COUNT(*) as total_feeds,
        COUNT(CASE WHEN is_published = true THEN 1 END) as published_feeds,
        MAX(published_at) as latest_published,
        MIN(published_at) as earliest_published
      FROM rss_feeds
      GROUP BY category
      ORDER BY category
    `;
    
    return await query(statsSQL);
  }

  // Caută în RSS feeds
  async search(searchTerm, filters = {}) {
    const { category, is_published = true, limit = 20 } = filters;
    
    let whereClause = `WHERE (title ILIKE $1 OR description ILIKE $1 OR content ILIKE $1)`;
    const params = [`%${searchTerm}%`];
    let paramIndex = 2;
    
    if (category) {
      whereClause += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (is_published !== undefined) {
      whereClause += ` AND is_published = $${paramIndex}`;
      params.push(is_published);
      paramIndex++;
    }
    
    const selectSQL = `
      SELECT rss_id, title, description, link, category, guid, content,
             is_published, published_at, created_at
      FROM rss_feeds
      ${whereClause}
      ORDER BY published_at DESC
      LIMIT $${paramIndex}
    `;
    
    params.push(limit);
    return await query(selectSQL, params);
  }

  // Generează XML pentru RSS feed
  async generateXML(category = null) {
    let whereClause = 'WHERE is_published = true';
    const params = [];
    
    if (category) {
      whereClause += ' AND category = $1';
      params.push(category);
    }
    
    const selectSQL = `
      SELECT title, description, link, category, guid, content, published_at
      FROM rss_feeds
      ${whereClause}
      ORDER BY published_at DESC
      LIMIT 50
    `;
    
    return await query(selectSQL, params);
  }

  // Curăță RSS feeds vechi (peste X zile)
  async cleanupOld(daysOld = 90) {
    const deleteSQL = `
      DELETE FROM rss_feeds 
      WHERE is_published = false 
        AND created_at < CURRENT_DATE - INTERVAL '${daysOld} days'
      RETURNING COUNT(*) as deleted_count
    `;
    
    const result = await query(deleteSQL);
    return result && result.length > 0 ? parseInt(result[0].deleted_count) : 0;
  }
}

module.exports = new RssRepository(); 