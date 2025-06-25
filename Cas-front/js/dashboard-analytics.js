// Global variables
let websocket = null;
let autoRefreshInterval = null;
let charts = {};
let currentLocationId = null;
let currentPeriod = 'month';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeWebSocket();
    loadLocations();
    refreshDashboard();
    
    // Set up event listeners
    document.getElementById('locationSelect').addEventListener('change', function() {
        currentLocationId = this.value || null;
        clearCache(); // Clear cache when location changes
        refreshDashboard();
    });
    
    document.getElementById('periodSelect').addEventListener('change', function() {
        currentPeriod = this.value;
        clearCache(); // Clear cache when period changes
        refreshDashboard();
    });
});

// WebSocket connection
function initializeWebSocket() {
    try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/status`;
        
        websocket = new WebSocket(wsUrl);
        
        websocket.onopen = function() {
            document.getElementById('wsStatus').textContent = 'Connected';
            document.getElementById('wsStatus').className = 'status-indicator status-connected';
            console.log('WebSocket connected');
        };
        
        websocket.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        websocket.onclose = function() {
            document.getElementById('wsStatus').textContent = 'Disconnected';
            document.getElementById('wsStatus').className = 'status-indicator status-disconnected';
            console.log('WebSocket disconnected');
            
            // Attempt to reconnect after 5 seconds
            setTimeout(initializeWebSocket, 5000);
        };
        
        websocket.onerror = function(error) {
            console.error('WebSocket error:', error);
        };
    } catch (error) {
        console.error('Error initializing WebSocket:', error);
    }
}

// Cache for loaded data to avoid redundant requests
let dataCache = {
    dashboard: null,
    orders: null,
    resources: null,
    equipment: null,
    employees: null,
    weather: null,
    alerts: null,
    lastUpdate: null
};

// Check if data is fresh (less than 2 minutes old)
function isDataFresh(cacheKey) {
    if (!dataCache[cacheKey] || !dataCache.lastUpdate) return false;
    const now = Date.now();
    const cacheAge = now - dataCache.lastUpdate;
    return cacheAge < 2 * 60 * 1000; // 2 minutes
}

// Update cache
function updateCache(key, data) {
    dataCache[key] = data;
    dataCache.lastUpdate = Date.now();
}

// Clear cache
function clearCache() {
    Object.keys(dataCache).forEach(key => {
        if (key !== 'lastUpdate') {
            dataCache[key] = null;
        }
    });
}

// Enhanced WebSocket message handler
function handleWebSocketMessage(data) {
    console.log('WebSocket message received:', data);
    
    // Handle real-time updates and invalidate relevant cache
    if (data.type === 'stats_update') {
        updateKPIs(data.data);
        // Invalidate dashboard cache
        dataCache.dashboard = null;
    } else if (data.type === 'alert') {
        addAlert(data.data);
        // Invalidate alerts cache
        dataCache.alerts = null;
    } else if (data.type === 'order_update') {
        // Invalidate orders cache and refresh if orders tab is active
        dataCache.orders = null;
        if (document.querySelector('.tab-content.active').id === 'orders') {
            loadOrdersData();
        }
    } else if (data.type === 'equipment_update') {
        // Invalidate equipment cache
        dataCache.equipment = null;
        if (document.querySelector('.tab-content.active').id === 'equipment') {
            loadEquipmentData();
        }
    } else if (data.type === 'inventory_update') {
        // Invalidate resources cache
        dataCache.resources = null;
        if (document.querySelector('.tab-content.active').id === 'resources') {
            loadResourcesData();
        }
    }
}

// Load locations for dropdown
async function loadLocations() {
    try {
        const response = await fetch('/api/locations');
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('locationSelect');
            select.innerHTML = '<option value="">All Locations</option>';
            
            result.data.forEach(location => {
                const option = document.createElement('option');
                option.value = location.id;
                option.textContent = location.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading locations:', error);
    }
}

// Main refresh function
async function refreshDashboard() {
    try {
        showLoading();
        
        // Load dashboard data
        const params = new URLSearchParams();
        if (currentLocationId) params.append('locationId', currentLocationId);
        if (currentPeriod) params.append('period', currentPeriod);
        
        const response = await fetch(`/api/stats/dashboard?${params}`);
        const result = await response.json();
        
        if (result.success) {
            updateDashboard(result.data);
        } else {
            showError('Failed to load dashboard data');
        }
        
        document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showError('Error refreshing dashboard');
    }
}

function updateDashboard(data) {
    updateKPIs(data);
    
    // Update active tab content
    const activeTab = document.querySelector('.tab-content.active').id;
    switch (activeTab) {
        case 'overview':
            loadOverviewData(data);
            break;
        case 'orders':
            loadOrdersData();
            break;
        case 'resources':
            loadResourcesData();
            break;
        case 'equipment':
            loadEquipmentData();
            break;
        case 'employees':
            loadEmployeesData();
            break;
        case 'weather':
            loadWeatherData();
            break;
    }
}

function updateKPIs(data) {
    if (data.summary && data.summary.length > 0) {
        const summary = data.summary[0];
        
        document.getElementById('ordersToday').textContent = summary.orders_today || '0';
        document.getElementById('revenueToday').textContent = '$' + (parseFloat(summary.revenue_today || 0)).toFixed(2);
        
        if (data.kpis && data.kpis.length > 0) {
            const kpi = data.kpis[0];
            document.getElementById('completionRate').textContent = (parseFloat(kpi.completion_rate || 0)).toFixed(1) + '%';
            document.getElementById('equipmentUptime').textContent = (parseFloat(kpi.equipment_uptime || 0)).toFixed(1) + '%';
        }
    }
}

// Tab management
function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    // Load tab-specific data
    switch (tabName) {
        case 'orders':
            loadOrdersData();
            break;
        case 'resources':
            loadResourcesData();
            break;
        case 'equipment':
            loadEquipmentData();
            break;
        case 'employees':
            loadEmployeesData();
            break;
        case 'weather':
            loadWeatherData();
            break;
    }
}

// Data loading functions
async function loadOverviewData(dashboardData) {
    try {
        // Revenue trends chart
        if (dashboardData.analytics && dashboardData.analytics.orders) {
            const orderData = dashboardData.analytics.orders.orders;
            createRevenueChart(orderData);
            createOrderStatusChart(dashboardData.analytics.orders.statusDistribution);
        }
        
        // Location performance chart
        if (dashboardData.summary) {
            createLocationChart(dashboardData.summary);
        }
        
        // Load alerts
        loadAlerts();
    } catch (error) {
        console.error('Error loading overview data:', error);
    }
}

async function loadOrdersData() {
    try {
        if (isDataFresh('orders')) {
            console.log('Using cached orders data');
            return;
        }

        const params = new URLSearchParams();
        if (currentLocationId) params.append('locationId', currentLocationId);
        params.append('period', currentPeriod);
        
        const response = await fetch(`/api/stats/orders?${params}`);
        const result = await response.json();
        
        if (result.success) {
            updateCache('orders', result.data);
            createOrderVolumeChart(result.data.orders);
            createAvgOrderValueChart(result.data.orders);
            createProcessingTimeChart(result.data.orders);
            createRecentOrdersTable(result.data.orders);
        }
    } catch (error) {
        console.error('Error loading orders data:', error);
    }
}

async function loadResourcesData() {
    try {
        if (isDataFresh('resources')) {
            console.log('Using cached resources data');
            return;
        }

        const params = new URLSearchParams();
        if (currentLocationId) params.append('locationId', currentLocationId);
        params.append('period', currentPeriod);
        
        const response = await fetch(`/api/stats/resources?${params}`);
        const result = await response.json();
        
        if (result.success) {
            updateCache('resources', result.data);
            createResourceConsumptionChart(result.data.consumption);
            createResourceEfficiencyChart(result.data.efficiency);
            createUsagePatternsChart(result.data.patterns);
            createOptimizationsList(result.data.optimizations);
        }
    } catch (error) {
        console.error('Error loading resources data:', error);
    }
}

async function loadEquipmentData() {
    try {
        if (isDataFresh('equipment')) {
            console.log('Using cached equipment data');
            return;
        }

        const params = new URLSearchParams();
        if (currentLocationId) params.append('locationId', currentLocationId);
        
        const response = await fetch(`/api/stats/equipment?${params}`);
        const result = await response.json();
        
        if (result.success) {
            updateCache('equipment', result.data);
            createEquipmentHealthChart(result.data.healthAnalysis);
            createMaintenanceChart(result.data.maintenanceTrends);
            createEquipmentEfficiencyChart(result.data.efficiency);
            createMaintenancePredictions(result.data.maintenancePredictions);
        }
    } catch (error) {
        console.error('Error loading equipment data:', error);
    }
}

async function loadEmployeesData() {
    try {
        if (isDataFresh('employees')) {
            console.log('Using cached employees data');
            return;
        }

        const params = new URLSearchParams();
        if (currentLocationId) params.append('locationId', currentLocationId);
        params.append('period', currentPeriod);
        
        const response = await fetch(`/api/stats/employees?${params}`);
        const result = await response.json();
        
        if (result.success) {
            updateCache('employees', result.data);
            createEmployeeProductivityChart(result.data.productivity);
            createPerformanceRankingChart(result.data.productivity);
            createProductivityTrendsChart(result.data.productivity);
            createEmployeeStatsTable(result.data.productivity);
        }
    } catch (error) {
        console.error('Error loading employees data:', error);
    }
}

async function loadWeatherData() {
    try {
        if (isDataFresh('weather')) {
            console.log('Using cached weather data');
            return;
        }

        const params = new URLSearchParams();
        if (currentLocationId) params.append('locationId', currentLocationId);
        params.append('period', currentPeriod);
        
        const response = await fetch(`/api/stats/weather?${params}`);
        const result = await response.json();
        
        if (result.success) {
            updateCache('weather', result.data);
            createWeatherImpactChart(result.data.weatherStats);
            createTemperatureChart(result.data.weatherStats);
            createWeatherConditionsChart(result.data.impactAnalysis);
            createWeatherStatsTable(result.data.weatherStats);
        }
    } catch (error) {
        console.error('Error loading weather data:', error);
    }
}

async function loadAlerts() {
    try {
        if (isDataFresh('alerts')) {
            console.log('Using cached alerts data');
            return;
        }

        const response = await fetch('/api/alerts/history?limit=10');
        const result = await response.json();
        
        if (result.success) {
            updateCache('alerts', result.data);
            const alertsList = document.getElementById('alertsList');
            alertsList.innerHTML = '';
            
            if (result.data.length === 0) {
                alertsList.innerHTML = '<p>No recent alerts</p>';
                return;
            }
            
            result.data.forEach(alert => {
                const alertItem = document.createElement('div');
                alertItem.className = `alert-item alert-${alert.severity.toLowerCase()}`;
                alertItem.innerHTML = `
                    <strong>${alert.type}</strong><br>
                    ${alert.message}<br>
                    <small>${new Date(alert.created_at).toLocaleString()}</small>
                `;
                alertsList.appendChild(alertItem);
            });
        }
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

// Auto refresh toggle
function toggleAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        event.target.textContent = '⏱️ Auto Refresh';
    } else {
        // Increased interval to 5 minutes to reduce server load
        autoRefreshInterval = setInterval(refreshDashboard, 5 * 60 * 1000); // 5 minutes instead of 30 seconds
        event.target.textContent = '⏹️ Stop Auto';
    }
}

// Utility functions
function showLoading() {
    // Add loading indicators where needed
}

function showError(message) {
    console.error(message);
    // Show error message to user
}

function addAlert(alertData) {
    const alertsList = document.getElementById('alertsList');
    const alertItem = document.createElement('div');
    alertItem.className = `alert-item alert-${alertData.severity.toLowerCase()}`;
    alertItem.innerHTML = `
        <strong>${alertData.type}</strong><br>
        ${alertData.message}<br>
        <small>Just now</small>
    `;
    alertsList.insertBefore(alertItem, alertsList.firstChild);
    
    // Remove old alerts if too many
    const alerts = alertsList.querySelectorAll('.alert-item');
    if (alerts.length > 10) {
        alertsList.removeChild(alerts[alerts.length - 1]);
    }
}

// Chart creation functions will be loaded from charts.js 