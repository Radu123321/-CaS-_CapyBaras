# 🔔 CaS Notification System API Endpoints

## Overview
Complete browser notification and exception detection system for the Cleaning as a Service (CaS) platform.

## 📋 Table of Contents
- [Subscription Management](#subscription-management)
- [Manual Notifications](#manual-notifications)
- [Exception Detection](#exception-detection)
- [Configuration & Monitoring](#configuration--monitoring)
- [Utility Endpoints](#utility-endpoints)

---

## 🔗 Subscription Management

### Subscribe to Notifications
**POST** `/api/notifications/subscribe`

Subscribe a client to receive browser notifications.

**Request Body:**
```json
{
  "clientId": "unique-client-id",
  "preferences": {
    "types": ["ALL"], // or specific types like ["EQUIPMENT_FAILURE", "STAFF_UNAVAILABLE"]
    "locations": [], // empty for all locations, or [1, 2, 3] for specific locations
    "priorities": ["HIGH", "CRITICAL"], // notification priorities to receive
    "channels": ["websocket", "browser"] // channels to receive notifications on
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientId": "unique-client-id",
    "subscribed": true,
    "preferences": { /* preferences object */ }
  }
}
```

### Unsubscribe from Notifications
**POST** `/api/notifications/unsubscribe`

**Request Body:**
```json
{
  "clientId": "unique-client-id"
}
```

### Update Notification Preferences
**PUT** `/api/notifications/preferences`

**Request Body:**
```json
{
  "clientId": "unique-client-id",
  "preferences": {
    "types": ["EQUIPMENT_FAILURE", "CRITICAL_INVENTORY"],
    "priorities": ["CRITICAL"],
    "channels": ["browser", "email"]
  }
}
```

---

## 📨 Manual Notifications

### Send Test Notification
**POST** `/api/notifications/test`

Send a test notification to verify the system is working.

**Request Body:**
```json
{
  "type": "TEST_NOTIFICATION",
  "message": "This is a test notification",
  "priority": "MEDIUM",
  "locationId": 1
}
```

### Send Custom Notification
**POST** `/api/notifications/send`

Send a custom notification with specific parameters.

**Request Body:**
```json
{
  "type": "CUSTOM_ALERT",
  "message": "Custom alert message",
  "priority": "HIGH",
  "data": {
    "customField": "customValue",
    "timestamp": "2024-01-01T12:00:00Z"
  },
  "locationId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "notif_1234567890_abcdef123",
    "type": "CUSTOM_ALERT",
    "message": "Custom alert message",
    "priority": "HIGH",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "status": "SUCCESS",
    "results": {
      "email": { "success": true, "timestamp": "..." },
      "websocket": { "success": true, "timestamp": "..." },
      "browser": { "success": true, "subscriberCount": 5 }
    }
  }
}
```

---

## 🚨 Exception Detection

### Detect Staff Issues
**POST** `/api/exceptions/detect/staff`

Detect staff unavailability and critical shortages.

**Query Parameters:**
- `locationId` (optional): Filter by specific location

**Response:**
```json
{
  "success": true,
  "data": {
    "issues": [
      {
        "type": "CRITICAL_STAFF_SHORTAGE",
        "locationId": 1,
        "locationName": "Downtown Location",
        "availabilityRate": "25.0",
        "activeEmployees": 1,
        "totalEmployees": 4,
        "severity": "CRITICAL"
      }
    ],
    "count": 1,
    "detectedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Detect Power Issues
**POST** `/api/exceptions/detect/power`

Detect potential power outages based on equipment status.

### Detect Equipment Issues
**POST** `/api/exceptions/detect/equipment`

Detect equipment failures and maintenance needs.

**Response:**
```json
{
  "success": true,
  "data": {
    "issues": [
      {
        "type": "EQUIPMENT_FAILURE",
        "equipmentId": 5,
        "equipmentName": "Industrial Vacuum #2",
        "equipmentType": "VACUUM",
        "locationId": 1,
        "locationName": "Downtown Location",
        "status": "OUT_OF_SERVICE",
        "daysSinceUpdate": 3,
        "recentMaintenance": 0,
        "severity": "HIGH"
      }
    ],
    "count": 1,
    "detectedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Detect Transport Issues
**POST** `/api/exceptions/detect/transport`

Detect transport delays and critical issues.

### Run Full Exception Detection
**POST** `/api/exceptions/detect/all`

Run comprehensive exception detection across all systems.

**Response:**
```json
{
  "success": true,
  "data": {
    "staffIssues": [ /* array of staff issues */ ],
    "powerIssues": [ /* array of power issues */ ],
    "equipmentIssues": [ /* array of equipment issues */ ],
    "transportIssues": [ /* array of transport issues */ ],
    "errors": [],
    "summary": {
      "totalIssues": 5,
      "staffIssues": 1,
      "powerIssues": 0,
      "equipmentIssues": 3,
      "transportIssues": 1,
      "errors": 0
    },
    "detectedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## 📊 Configuration & Monitoring

### Get Notification Statistics
**GET** `/api/notifications/stats`

Get system statistics and performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "subscribers": 15,
    "queueSize": 0,
    "config": {
      "enabled": true,
      "channels": {
        "email": true,
        "websocket": true,
        "browser": true,
        "rss": true
      },
      "retryAttempts": 3,
      "retryDelay": 5000
    },
    "stats": {
      "totalSent": 142,
      "totalFailed": 3
    }
  }
}
```

### Get Active Subscribers
**GET** `/api/notifications/subscribers`

List all active notification subscribers.

**Response:**
```json
{
  "success": true,
  "data": {
    "subscribers": [
      {
        "id": "client-123",
        "addedAt": "2024-01-01T10:00:00.000Z",
        "preferences": {
          "types": ["ALL"],
          "locations": [],
          "priorities": ["HIGH", "CRITICAL"],
          "channels": ["websocket", "browser"]
        },
        "stats": {
          "sent": 25,
          "failed": 1,
          "lastNotification": "2024-01-01T11:30:00.000Z"
        }
      }
    ],
    "count": 15
  }
}
```

### Get Notification Configuration
**GET** `/api/notifications/config`

Get current system configuration.

### Update Notification Configuration
**PUT** `/api/notifications/config`

Update system-wide notification configuration.

**Request Body:**
```json
{
  "config": {
    "enabled": true,
    "channels": {
      "email": true,
      "websocket": true,
      "browser": true,
      "rss": false
    },
    "retryAttempts": 5,
    "retryDelay": 3000
  }
}
```

---

## 🔧 Utility Endpoints

### Get Notification Types
**GET** `/api/notifications/types`

Get all available notification types with descriptions.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "EQUIPMENT_FAILURE",
      "description": "Equipment failures and malfunctions",
      "priority": "HIGH",
      "icon": "🔧"
    },
    {
      "type": "STAFF_UNAVAILABLE",
      "description": "Staff unavailability and shortages",
      "priority": "HIGH",
      "icon": "👥"
    },
    {
      "type": "POWER_OUTAGE",
      "description": "Power outages and electrical issues",
      "priority": "CRITICAL",
      "icon": "⚡"
    }
  ]
}
```

### Get Priority Levels
**GET** `/api/notifications/priorities`

Get all available priority levels with configurations.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "level": "CRITICAL",
      "description": "Immediate attention required",
      "channels": ["email", "websocket", "browser"],
      "color": "#e74c3c"
    },
    {
      "level": "HIGH",
      "description": "High priority issues",
      "channels": ["email", "websocket", "browser"],
      "color": "#f39c12"
    }
  ]
}
```

### Get Available Channels
**GET** `/api/notifications/channels`

Get all available notification channels with status.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "email",
      "description": "Email notifications via SMTP",
      "enabled": true,
      "suitable": ["CRITICAL", "HIGH"]
    },
    {
      "name": "websocket",
      "description": "Real-time WebSocket notifications",
      "enabled": true,
      "suitable": ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    },
    {
      "name": "browser",
      "description": "Browser push notifications",
      "enabled": true,
      "suitable": ["CRITICAL", "HIGH", "MEDIUM"]
    }
  ]
}
```

---

## 🔄 WebSocket Integration

The notification system integrates with the existing WebSocket implementation to send real-time notifications.

### WebSocket Message Types

**Notification Message:**
```json
{
  "type": "notification",
  "notification": {
    "id": "notif_1234567890_abcdef123",
    "type": "EQUIPMENT_FAILURE",
    "message": "Equipment failure detected at Downtown Location",
    "priority": "HIGH",
    "data": { /* additional data */ },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Browser Notification Message:**
```json
{
  "type": "browser_notification",
  "notification": {
    "id": "notif_1234567890_abcdef123",
    "title": "🔧 Equipment Alert",
    "body": "Equipment failure detected at Downtown Location",
    "icon": "/icons/alert-high.png",
    "badge": "/favicon.ico",
    "tag": "EQUIPMENT_FAILURE",
    "data": { /* additional data */ },
    "requireInteraction": false,
    "silent": false
  }
}
```

---

## 🚀 Frontend Integration Example

```javascript
// Subscribe to notifications
async function subscribeToNotifications(clientId) {
  const response = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: clientId,
      preferences: {
        types: ['ALL'],
        priorities: ['HIGH', 'CRITICAL'],
        channels: ['websocket', 'browser']
      }
    })
  });
  
  return await response.json();
}

// Handle WebSocket notifications
websocket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'browser_notification') {
    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification(message.notification.title, {
        body: message.notification.body,
        icon: message.notification.icon,
        tag: message.notification.tag,
        data: message.notification.data
      });
    }
  }
});

// Run exception detection
async function detectAllExceptions() {
  const response = await fetch('/api/exceptions/detect/all', {
    method: 'POST'
  });
  
  return await response.json();
}
```

---

## 🔧 Automated Jobs

The system includes automated background jobs:

- **Exception Detection Job**: Runs every 30 minutes to detect issues
- **Daily Stats Job**: Generates daily statistics at midnight
- **Equipment Status Check**: Monitors equipment every 6 hours
- **Weather Updates**: Updates weather data every 3 hours

All jobs are integrated into the scheduler and will automatically trigger notifications when issues are detected.

---

## 📝 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing parameters)
- `404`: Not Found (subscriber not found)
- `500`: Internal Server Error

---

## 🎯 Key Features

✅ **Multi-channel Notifications**: Email, WebSocket, Browser Push, RSS
✅ **Advanced Exception Detection**: Staff, Power, Equipment, Transport
✅ **Subscriber Management**: Preferences, filtering, statistics
✅ **Real-time Updates**: WebSocket integration
✅ **Automated Monitoring**: Background jobs every 30 minutes
✅ **Comprehensive APIs**: 17 endpoints covering all functionality
✅ **Critical Issue Escalation**: Priority-based routing
✅ **System Health Monitoring**: Stats, subscribers, configuration

The notification system is now complete and ready for frontend integration! 🚀 