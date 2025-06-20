'use strict';

// RSS 2.0 Generator
class RSSGenerator {
  constructor(options = {}) {
    this.title = options.title || 'CaS - Cleaning Service Updates';
    this.description = options.description || 'Real-time updates from Cleaning as a Service';
    this.link = options.link || 'http://localhost:8000';
    this.language = options.language || 'ro-RO';
    this.managingEditor = options.managingEditor || 'admin@cas.local';
    this.webMaster = options.webMaster || 'webmaster@cas.local';
    this.generator = 'CaS RSS Generator v1.0';
  }

  // Escape XML special characters
  escapeXml(unsafe) {
    if (typeof unsafe !== 'string') {
      unsafe = String(unsafe);
    }
    
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Format date for RSS (RFC 822 format)
  formatDate(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    return date.toUTCString();
  }

  // Generate RSS feed for location updates
  generateLocationFeed(locationId, locationName, items = []) {
    const now = new Date();
    const channelTitle = `${this.title} - ${this.escapeXml(locationName)}`;
    const channelDescription = `Updates for location: ${this.escapeXml(locationName)}`;
    const channelLink = `${this.link}/location/${locationId}`;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
    xml += '  <channel>\n';
    xml += `    <title>${channelTitle}</title>\n`;
    xml += `    <description>${channelDescription}</description>\n`;
    xml += `    <link>${channelLink}</link>\n`;
    xml += `    <language>${this.language}</language>\n`;
    xml += `    <managingEditor>${this.managingEditor}</managingEditor>\n`;
    xml += `    <webMaster>${this.webMaster}</webMaster>\n`;
    xml += `    <generator>${this.generator}</generator>\n`;
    xml += `    <lastBuildDate>${this.formatDate(now)}</lastBuildDate>\n`;
    xml += `    <pubDate>${this.formatDate(now)}</pubDate>\n`;
    xml += `    <atom:link href="${channelLink}/rss" rel="self" type="application/rss+xml" />\n`;

    // Add items
    for (const item of items) {
      xml += this.generateItem(item);
    }

    xml += '  </channel>\n';
    xml += '</rss>';

    return xml;
  }

  // Generate RSS feed for general updates
  generateGeneralFeed(items = []) {
    const now = new Date();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
    xml += '  <channel>\n';
    xml += `    <title>${this.title}</title>\n`;
    xml += `    <description>${this.description}</description>\n`;
    xml += `    <link>${this.link}</link>\n`;
    xml += `    <language>${this.language}</language>\n`;
    xml += `    <managingEditor>${this.managingEditor}</managingEditor>\n`;
    xml += `    <webMaster>${this.webMaster}</webMaster>\n`;
    xml += `    <generator>${this.generator}</generator>\n`;
    xml += `    <lastBuildDate>${this.formatDate(now)}</lastBuildDate>\n`;
    xml += `    <pubDate>${this.formatDate(now)}</pubDate>\n`;
    xml += `    <atom:link href="${this.link}/rss" rel="self" type="application/rss+xml" />\n`;

    // Add items
    for (const item of items) {
      xml += this.generateItem(item);
    }

    xml += '  </channel>\n';
    xml += '</rss>';

    return xml;
  }

  // Generate individual RSS item
  generateItem(item) {
    const {
      title,
      description,
      link,
      pubDate,
      guid,
      category,
      author
    } = item;

    let xml = '    <item>\n';
    xml += `      <title>${this.escapeXml(title)}</title>\n`;
    xml += `      <description>${this.escapeXml(description)}</description>\n`;
    
    if (link) {
      xml += `      <link>${this.escapeXml(link)}</link>\n`;
    }
    
    if (pubDate) {
      xml += `      <pubDate>${this.formatDate(pubDate)}</pubDate>\n`;
    }
    
    if (guid) {
      xml += `      <guid isPermaLink="false">${this.escapeXml(guid)}</guid>\n`;
    }
    
    if (category) {
      xml += `      <category>${this.escapeXml(category)}</category>\n`;
    }
    
    if (author) {
      xml += `      <author>${this.escapeXml(author)}</author>\n`;
    }
    
    xml += '    </item>\n';

    return xml;
  }

  // Generate order status update item
  generateOrderStatusItem(order, oldStatus, newStatus, locationName) {
    return {
      title: `Order #${order.order_id} Status Updated`,
      description: `Order #${order.order_id} at ${locationName} changed from ${oldStatus} to ${newStatus}`,
      link: `${this.link}/orders/${order.order_id}`,
      pubDate: new Date(),
      guid: `order-${order.order_id}-status-${Date.now()}`,
      category: 'Order Status',
      author: this.managingEditor
    };
  }

  // Generate transport status update item
  generateTransportStatusItem(transport, oldStatus, newStatus, locationName) {
    return {
      title: `Transport #${transport.transport_id} Status Updated`,
      description: `Transport for order #${transport.order_id} at ${locationName} changed from ${oldStatus} to ${newStatus}`,
      link: `${this.link}/transports/${transport.transport_id}`,
      pubDate: new Date(),
      guid: `transport-${transport.transport_id}-status-${Date.now()}`,
      category: 'Transport Status',
      author: this.managingEditor
    };
  }

  // Generate inventory alert item
  generateInventoryAlertItem(alert, locationName) {
    const alertType = alert.quantity <= 0 ? 'Out of Stock' : 'Low Stock';
    
    return {
      title: `${alertType} Alert: ${alert.resource_name}`,
      description: `${alert.resource_name} at ${locationName} is ${alertType.toLowerCase()} (${alert.quantity} ${alert.unit} remaining)`,
      link: `${this.link}/inventory/location/${alert.location_id}`,
      pubDate: new Date(),
      guid: `inventory-alert-${alert.location_id}-${alert.resource_id}-${Date.now()}`,
      category: 'Inventory Alert',
      author: this.managingEditor
    };
  }

  // Generate new order item
  generateNewOrderItem(order, locationName, customerName) {
    return {
      title: `New Order #${order.order_id}`,
      description: `New order from ${customerName} at ${locationName} scheduled for ${new Date(order.scheduled_for).toLocaleDateString()}`,
      link: `${this.link}/orders/${order.order_id}`,
      pubDate: new Date(order.created_at),
      guid: `order-${order.order_id}-created`,
      category: 'New Order',
      author: this.managingEditor
    };
  }

  // Generate employee status item
  generateEmployeeStatusItem(employee, action, locationName = null) {
    const actionText = action === 'activated' ? 'activated' : 'deactivated';
    const locationText = locationName ? ` at ${locationName}` : '';
    
    return {
      title: `Employee ${actionText}`,
      description: `Employee ${employee.full_name} has been ${actionText}${locationText}`,
      link: `${this.link}/employees/${employee.employee_id}`,
      pubDate: new Date(),
      guid: `employee-${employee.employee_id}-${action}-${Date.now()}`,
      category: 'Employee Status',
      author: this.managingEditor
    };
  }

  // Generate system alert item
  generateSystemAlertItem(alert) {
    return {
      title: `System Alert: ${alert.type}`,
      description: alert.message,
      link: `${this.link}/alerts`,
      pubDate: new Date(),
      guid: `system-alert-${alert.type}-${Date.now()}`,
      category: 'System Alert',
      author: this.managingEditor
    };
  }
}

// Create default RSS generator instance
const rssGenerator = new RSSGenerator();

module.exports = {
  RSSGenerator,
  rssGenerator
}; 