const fs = require('fs');
const path = require('path');

// Simple SQLite-like in-memory database for development
class SimpleSQLite {
  constructor() {
    this.tables = {
      users: [],
      locations: [],
      services: [],
      customers: [],
      employees: [],
      orders: [],
      transports: [],
      resources: [],
      inventory: [],
      equipment: [],
      weather_snapshots: [],
      alerts: []
    };
    this.nextId = {
      users: 1,
      locations: 1,
      services: 1,
      customers: 1,
      employees: 1,
      orders: 1,
      transports: 1,
      resources: 1,
      equipment: 1,
      weather_snapshots: 1,
      alerts: 1
    };
    
    this.loadSampleData();
  }

  loadSampleData() {
    // Sample users
    this.tables.users = [
      {
        user_id: 1,
        email: 'admin@cas.ro',
        password_hash: 'hashed_password_123',
        full_name: 'Administrator CaS',
        default_role: 'ADMIN',
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        user_id: 2,
        email: 'employee@cas.ro',
        password_hash: 'hashed_password_456',
        full_name: 'Angajat CaS',
        default_role: 'EMPLOYEE',
        created_at: new Date().toISOString(),
        is_active: true
      }
    ];

    // Sample locations
    this.tables.locations = [
      {
        location_id: 1,
        name: 'Spălătorie Centrul Vechi',
        address: 'Strada Lipscani 15, București',
        latitude: 44.4323,
        longitude: 26.1063,
        timezone: 'Europe/Bucharest',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        location_id: 2,
        name: 'Spălătorie Nord',
        address: 'Bulevardul Aviatorilor 42, București',
        latitude: 44.4991,
        longitude: 26.0889,
        timezone: 'Europe/Bucharest',
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];

    // Sample services
    this.tables.services = [
      {
        service_id: 1,
        service_type: 'CARPET',
        description: 'Curățare profesională covoare',
        base_price: 150.00,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        service_id: 2,
        service_type: 'CAR_WASH',
        description: 'Spălare auto completă',
        base_price: 80.00,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        service_id: 3,
        service_type: 'GARMENT',
        description: 'Curățare îmbrăcăminte',
        base_price: 25.00,
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];

    // Sample equipment
    this.tables.equipment = [
      {
        equipment_id: 1,
        location_id: 1,
        name: 'Mașină de spălat industrială',
        status: 'OPERATIVE',
        created_at: new Date().toISOString()
      },
      {
        equipment_id: 2,
        location_id: 1,
        name: 'Aspirator profesional',
        status: 'UNDER_MAINTENANCE',
        created_at: new Date().toISOString()
      },
      {
        equipment_id: 3,
        location_id: 2,
        name: 'Sistem de presiune',
        status: 'OPERATIVE',
        created_at: new Date().toISOString()
      }
    ];

    this.nextId.users = 3;
    this.nextId.locations = 3;
    this.nextId.services = 4;
    this.nextId.equipment = 4;
  }

  async query(sql, params = []) {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1));
    
    try {
      // Simple query parsing for common operations
      const sqlLower = sql.toLowerCase().trim();
      
      if (sqlLower.startsWith('select')) {
        return this.handleSelect(sql, params);
      } else if (sqlLower.startsWith('insert')) {
        return this.handleInsert(sql, params);
      } else if (sqlLower.startsWith('update')) {
        return this.handleUpdate(sql, params);
      } else if (sqlLower.startsWith('delete')) {
        return this.handleDelete(sql, params);
      }
      
      return [];
    } catch (error) {
      console.error('SQLite query error:', error.message);
      throw error;
    }
  }

  handleSelect(sql, params) {
    // Basic SELECT handling for common queries
    if (sql.includes('FROM users') && sql.includes('WHERE') && sql.includes('email =')) {
      const email = params[0];
      return this.tables.users.filter(user => user.email === email);
    }
    
    if (sql.includes('FROM users WHERE user_id =')) {
      const userId = params[0];
      return this.tables.users.filter(user => user.user_id == userId);
    }
    
    if (sql.includes('FROM locations')) {
      return this.tables.locations.filter(loc => loc.is_active);
    }
    
    if (sql.includes('FROM services')) {
      return this.tables.services.filter(service => service.is_active);
    }
    
    if (sql.includes('FROM equipment')) {
      return this.tables.equipment.map(eq => ({
        ...eq,
        location_name: this.tables.locations.find(l => l.location_id === eq.location_id)?.name || 'Unknown'
      }));
    }
    
    // Default empty result
    return [];
  }

  handleInsert(sql, params) {
    if (sql.includes('INTO users')) {
      const newUser = {
        user_id: this.nextId.users++,
        email: params[0],
        password_hash: params[1],
        full_name: params[2],
        default_role: params[3] || 'CUSTOMER',
        created_at: new Date().toISOString(),
        is_active: true
      };
      this.tables.users.push(newUser);
      return [newUser];
    }
    
    if (sql.includes('INTO locations')) {
      const newLocation = {
        location_id: this.nextId.locations++,
        name: params[0],
        address: params[1],
        latitude: params[2] || null,
        longitude: params[3] || null,
        timezone: 'Europe/Bucharest',
        is_active: true,
        created_at: new Date().toISOString()
      };
      this.tables.locations.push(newLocation);
      return [newLocation];
    }
    
    if (sql.includes('INTO services')) {
      const newService = {
        service_id: this.nextId.services++,
        service_type: params[0],
        description: params[1],
        base_price: params[2],
        is_active: true,
        created_at: new Date().toISOString()
      };
      this.tables.services.push(newService);
      return [newService];
    }
    
    return [];
  }

  handleUpdate(sql, params) {
    // Basic UPDATE handling
    return [];
  }

  handleDelete(sql, params) {
    // Basic DELETE handling (soft delete for locations)
    return [];
  }
}

// Create singleton instance
const db = new SimpleSQLite();

// Export query function that matches PostgreSQL interface
async function query(sql, params = []) {
  return await db.query(sql, params);
}

module.exports = { query }; 