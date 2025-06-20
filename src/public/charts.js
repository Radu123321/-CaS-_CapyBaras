// Chart.js utilities and configuration
const chartColors = {
    primary: '#3498db',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    purple: '#6f42c1',
    pink: '#e83e8c',
    teal: '#20c997',
    orange: '#fd7e14',
    yellow: '#ffc107',
    green: '#28a745',
    blue: '#007bff',
    indigo: '#6610f2',
    cyan: '#17a2b8'
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
        },
        tooltip: {
            mode: 'index',
            intersect: false,
        }
    },
    scales: {
        x: {
            display: true,
            grid: {
                display: false
            }
        },
        y: {
            display: true,
            beginAtZero: true,
            grid: {
                color: 'rgba(0,0,0,0.1)'
            }
        }
    },
    interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
    }
};

// Chart management
function destroyChart(chartId) {
    if (charts[chartId]) {
        charts[chartId].destroy();
        delete charts[chartId];
    }
}

function createChart(canvasId, config) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error(`Canvas element ${canvasId} not found`);
        return null;
    }
    charts[canvasId] = new Chart(ctx, config);
    return charts[canvasId];
}

// ===== OVERVIEW CHARTS =====

function createRevenueChart(orderData) {
    const labels = orderData.map(item => new Date(item.period).toLocaleDateString());
    const revenues = orderData.map(item => parseFloat(item.total_revenue || 0));
    
    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue ($)',
                data: revenues,
                borderColor: chartColors.primary,
                backgroundColor: chartColors.primary + '20',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Revenue Trends'
                }
            }
        }
    };
    
    createChart('revenueChart', config);
}

function createOrderStatusChart(statusData) {
    const labels = statusData.map(item => item.status);
    const counts = statusData.map(item => parseInt(item.count));
    const colors = [
        chartColors.success,
        chartColors.warning,
        chartColors.info,
        chartColors.danger,
        chartColors.purple
    ];
    
    const config = {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: 'Order Status Distribution'
                }
            }
        }
    };
    
    createChart('orderStatusChart', config);
}

function createLocationChart(summaryData) {
    const labels = summaryData.map(item => item.location_name);
    const revenues = summaryData.map(item => parseFloat(item.revenue_this_month || 0));
    const orders = summaryData.map(item => parseInt(item.orders_this_month || 0));
    
    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue ($)',
                    data: revenues,
                    backgroundColor: chartColors.primary + '80',
                    borderColor: chartColors.primary,
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Orders',
                    data: orders,
                    backgroundColor: chartColors.success + '80',
                    borderColor: chartColors.success,
                    borderWidth: 1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Location Performance'
                }
            },
            scales: {
                x: {
                    display: true
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Orders'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    };
    
    createChart('locationChart', config);
}

// ===== ORDER CHARTS =====

function createOrderVolumeChart(orderData) {
    const labels = orderData.map(item => new Date(item.period).toLocaleDateString());
    const volumes = orderData.map(item => parseInt(item.order_count));
    
    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Order Count',
                data: volumes,
                backgroundColor: chartColors.info + '80',
                borderColor: chartColors.info,
                borderWidth: 1
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Order Volume Trends'
                }
            }
        }
    };
    
    createChart('orderVolumeChart', config);
}

function createAvgOrderValueChart(orderData) {
    const labels = orderData.map(item => new Date(item.period).toLocaleDateString());
    const avgValues = orderData.map(item => parseFloat(item.avg_order_value || 0));
    
    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Order Value ($)',
                data: avgValues,
                borderColor: chartColors.success,
                backgroundColor: chartColors.success + '20',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Average Order Value'
                }
            }
        }
    };
    
    createChart('avgOrderValueChart', config);
}

function createProcessingTimeChart(orderData) {
    // Simulate processing time data
    const labels = orderData.map(item => new Date(item.period).toLocaleDateString());
    const processingTimes = orderData.map(() => Math.floor(Math.random() * 5) + 1);
    
    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Processing Time (hours)',
                data: processingTimes,
                borderColor: chartColors.warning,
                backgroundColor: chartColors.warning + '20',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Average Processing Time'
                }
            }
        }
    };
    
    createChart('processingTimeChart', config);
}

function createRecentOrdersTable(orderData) {
    const tableContainer = document.getElementById('recentOrdersTable');
    
    if (!orderData || orderData.length === 0) {
        tableContainer.innerHTML = '<p>No recent orders found</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const header = `
        <thead>
            <tr>
                <th>Period</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>Avg Value</th>
            </tr>
        </thead>
    `;
    
    const rows = orderData.slice(0, 10).map(item => `
        <tr>
            <td>${new Date(item.period).toLocaleDateString()}</td>
            <td>${item.order_count}</td>
            <td>$${parseFloat(item.total_revenue || 0).toFixed(2)}</td>
            <td>$${parseFloat(item.avg_order_value || 0).toFixed(2)}</td>
        </tr>
    `).join('');
    
    table.innerHTML = header + '<tbody>' + rows + '</tbody>';
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
}

// ===== RESOURCE CHARTS =====

function createResourceConsumptionChart(consumptionData) {
    const labels = consumptionData.map(item => item.resource_name);
    const consumption = consumptionData.map(item => parseFloat(item.total_consumed || 0));
    
    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Consumed',
                data: consumption,
                backgroundColor: chartColors.purple + '80',
                borderColor: chartColors.purple,
                borderWidth: 1
            }]
        },
        options: {
            ...chartOptions,
            indexAxis: 'y',
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Resource Consumption'
                }
            }
        }
    };
    
    createChart('resourceConsumptionChart', config);
}

function createResourceEfficiencyChart(efficiencyData) {
    const labels = efficiencyData.map(item => item.resource_name);
    const efficiency = efficiencyData.map(item => parseFloat(item.efficiency_percentage || 0));
    
    const config = {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Efficiency %',
                data: efficiency,
                borderColor: chartColors.teal,
                backgroundColor: chartColors.teal + '30',
                pointBackgroundColor: chartColors.teal,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: chartColors.teal
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Resource Efficiency'
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    };
    
    createChart('resourceEfficiencyChart', config);
}

function createUsagePatternsChart(patternsData) {
    // Create a simple visualization of usage patterns
    const labels = ['High Usage', 'Low Efficiency', 'Frequent Use'];
    const counts = [
        patternsData.highUsage?.length || 0,
        patternsData.lowEfficiency?.length || 0,
        patternsData.frequentUse?.length || 0
    ];
    
    const config = {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: [
                    chartColors.danger + '80',
                    chartColors.warning + '80',
                    chartColors.info + '80'
                ],
                borderColor: [
                    chartColors.danger,
                    chartColors.warning,
                    chartColors.info
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Usage Patterns'
                }
            }
        }
    };
    
    createChart('usagePatternsChart', config);
}

function createOptimizationsList(optimizations) {
    const container = document.getElementById('optimizationsList');
    
    if (!optimizations || optimizations.length === 0) {
        container.innerHTML = '<p>No optimization recommendations available</p>';
        return;
    }
    
    const list = optimizations.map(opt => `
        <div class="alert-item alert-${opt.priority.toLowerCase()}">
            <strong>${opt.resource}</strong> - ${opt.type}<br>
            ${opt.recommendation}
            ${opt.current ? `<br><small>Current: ${opt.current}%</small>` : ''}
        </div>
    `).join('');
    
    container.innerHTML = list;
}

// ===== EQUIPMENT CHARTS =====

function createEquipmentHealthChart(healthData) {
    const labels = ['Healthy', 'Warning', 'Critical', 'Aging'];
    const counts = [
        healthData.healthy?.length || 0,
        healthData.warning?.length || 0,
        healthData.critical?.length || 0,
        healthData.aging?.length || 0
    ];
    
    const config = {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: [
                    chartColors.success + '80',
                    chartColors.warning + '80',
                    chartColors.danger + '80',
                    chartColors.dark + '80'
                ],
                borderColor: [
                    chartColors.success,
                    chartColors.warning,
                    chartColors.danger,
                    chartColors.dark
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Equipment Health Status'
                }
            }
        }
    };
    
    createChart('equipmentHealthChart', config);
}

function createMaintenanceChart(maintenanceData) {
    const labels = maintenanceData.map(item => new Date(item.period).toLocaleDateString());
    const scheduled = maintenanceData.map(item => parseInt(item.scheduled_count || 0));
    const emergency = maintenanceData.map(item => parseInt(item.emergency_count || 0));
    
    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Scheduled',
                    data: scheduled,
                    backgroundColor: chartColors.success + '80',
                    borderColor: chartColors.success,
                    borderWidth: 1
                },
                {
                    label: 'Emergency',
                    data: emergency,
                    backgroundColor: chartColors.danger + '80',
                    borderColor: chartColors.danger,
                    borderWidth: 1
                }
            ]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Maintenance Trends'
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    };
    
    createChart('maintenanceChart', config);
}

function createEquipmentEfficiencyChart(efficiencyData) {
    const labels = efficiencyData.map(item => item.equipment_name);
    const efficiency = efficiencyData.map(item => parseInt(item.efficiency_score || 0));
    
    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Efficiency Score',
                data: efficiency,
                backgroundColor: efficiency.map(score => 
                    score >= 80 ? chartColors.success + '80' :
                    score >= 50 ? chartColors.warning + '80' :
                    chartColors.danger + '80'
                ),
                borderColor: efficiency.map(score => 
                    score >= 80 ? chartColors.success :
                    score >= 50 ? chartColors.warning :
                    chartColors.danger
                ),
                borderWidth: 1
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Equipment Efficiency Scores'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    };
    
    createChart('equipmentEfficiencyChart', config);
}

function createMaintenancePredictions(predictions) {
    const container = document.getElementById('maintenancePredictions');
    
    if (!predictions || predictions.length === 0) {
        container.innerHTML = '<p>No maintenance predictions available</p>';
        return;
    }
    
    const list = predictions.map(pred => `
        <div class="alert-item alert-${pred.priority.toLowerCase()}">
            <strong>${pred.equipment}</strong> at ${pred.location}<br>
            Maintenance due in ${pred.daysUntilMaintenance} days<br>
            <small>Estimated date: ${new Date(pred.estimatedDate).toLocaleDateString()}</small>
        </div>
    `).join('');
    
    container.innerHTML = list;
}

// ===== EMPLOYEE CHARTS =====

function createEmployeeProductivityChart(productivityData) {
    const labels = productivityData.map(item => item.employee_name);
    const revenues = productivityData.map(item => parseFloat(item.revenue_generated || 0));
    const completionRates = productivityData.map(item => parseFloat(item.completion_rate || 0));
    
    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue Generated ($)',
                    data: revenues,
                    backgroundColor: chartColors.primary + '80',
                    borderColor: chartColors.primary,
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Completion Rate (%)',
                    data: completionRates,
                    backgroundColor: chartColors.success + '80',
                    borderColor: chartColors.success,
                    borderWidth: 1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Employee Productivity'
                }
            },
            scales: {
                x: {
                    display: true
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Completion Rate (%)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    max: 100
                }
            }
        }
    };
    
    createChart('employeeProductivityChart', config);
}

function createPerformanceRankingChart(productivityData) {
    const sortedData = productivityData
        .sort((a, b) => parseFloat(b.revenue_generated || 0) - parseFloat(a.revenue_generated || 0))
        .slice(0, 10);
    
    const labels = sortedData.map(item => item.employee_name);
    const revenues = sortedData.map(item => parseFloat(item.revenue_generated || 0));
    
    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue Generated ($)',
                data: revenues,
                backgroundColor: chartColors.orange + '80',
                borderColor: chartColors.orange,
                borderWidth: 1
            }]
        },
        options: {
            ...chartOptions,
            indexAxis: 'y',
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Top 10 Performers'
                }
            }
        }
    };
    
    createChart('performanceRankingChart', config);
}

function createProductivityTrendsChart(productivityData) {
    // Simulate trend data over time
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const avgProductivity = labels.map(() => {
        const totalCompletion = productivityData.reduce((sum, emp) => sum + parseFloat(emp.completion_rate || 0), 0);
        return totalCompletion / productivityData.length + (Math.random() - 0.5) * 10;
    });
    
    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Productivity (%)',
                data: avgProductivity,
                borderColor: chartColors.purple,
                backgroundColor: chartColors.purple + '20',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Productivity Trends'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    };
    
    createChart('productivityTrendsChart', config);
}

function createEmployeeStatsTable(productivityData) {
    const tableContainer = document.getElementById('employeeStatsTable');
    
    if (!productivityData || productivityData.length === 0) {
        tableContainer.innerHTML = '<p>No employee data found</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const header = `
        <thead>
            <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>Completion Rate</th>
            </tr>
        </thead>
    `;
    
    const rows = productivityData.map(item => `
        <tr>
            <td>${item.employee_name}</td>
            <td>${item.employee_type}</td>
            <td>${item.orders_handled || 0}</td>
            <td>$${parseFloat(item.revenue_generated || 0).toFixed(2)}</td>
            <td>${parseFloat(item.completion_rate || 0).toFixed(1)}%</td>
        </tr>
    `).join('');
    
    table.innerHTML = header + '<tbody>' + rows + '</tbody>';
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
}

// ===== WEATHER CHARTS =====

function createWeatherImpactChart(weatherData) {
    const conditionGroups = weatherData.reduce((acc, item) => {
        if (!acc[item.condition]) {
            acc[item.condition] = { orders: 0, revenue: 0, count: 0 };
        }
        acc[item.condition].orders += parseInt(item.order_count || 0);
        acc[item.condition].revenue += parseFloat(item.total_revenue || 0);
        acc[item.condition].count += 1;
        return acc;
    }, {});
    
    const labels = Object.keys(conditionGroups);
    const avgOrders = labels.map(condition => 
        conditionGroups[condition].count > 0 ? 
        conditionGroups[condition].orders / conditionGroups[condition].count : 0
    );
    
    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Orders per Day',
                data: avgOrders,
                backgroundColor: chartColors.cyan + '80',
                borderColor: chartColors.cyan,
                borderWidth: 1
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Weather Impact on Orders'
                }
            }
        }
    };
    
    createChart('weatherImpactChart', config);
}

function createTemperatureChart(weatherData) {
    const tempGroups = {};
    weatherData.forEach(item => {
        const temp = Math.round(parseFloat(item.temperature || 0) / 10) * 10; // Group by 10-degree ranges
        if (!tempGroups[temp]) {
            tempGroups[temp] = { orders: 0, count: 0 };
        }
        tempGroups[temp].orders += parseInt(item.order_count || 0);
        tempGroups[temp].count += 1;
    });
    
    const labels = Object.keys(tempGroups).sort((a, b) => a - b).map(temp => `${temp}°F`);
    const avgOrders = labels.map(label => {
        const temp = parseInt(label);
        return tempGroups[temp].count > 0 ? tempGroups[temp].orders / tempGroups[temp].count : 0;
    });
    
    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Orders',
                data: avgOrders,
                borderColor: chartColors.orange,
                backgroundColor: chartColors.orange + '20',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Temperature vs Performance'
                }
            }
        }
    };
    
    createChart('temperatureChart', config);
}

function createWeatherConditionsChart(impactData) {
    if (!impactData.impactByCondition) {
        return;
    }
    
    const labels = impactData.impactByCondition.map(item => item.condition);
    const impactScores = impactData.impactByCondition.map(item => item.impactScore);
    
    const config = {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Impact Score',
                data: impactScores,
                borderColor: chartColors.blue,
                backgroundColor: chartColors.blue + '30',
                pointBackgroundColor: chartColors.blue,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: chartColors.blue
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Weather Conditions Impact'
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    };
    
    createChart('weatherConditionsChart', config);
}

function createWeatherStatsTable(weatherData) {
    const tableContainer = document.getElementById('weatherStatsTable');
    
    if (!weatherData || weatherData.length === 0) {
        tableContainer.innerHTML = '<p>No weather data found</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const header = `
        <thead>
            <tr>
                <th>Condition</th>
                <th>Temperature</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>Completion Rate</th>
            </tr>
        </thead>
    `;
    
    const rows = weatherData.slice(0, 10).map(item => {
        const completionRate = parseInt(item.order_count || 0) > 0 ? 
            (parseInt(item.completed_orders || 0) / parseInt(item.order_count)) * 100 : 0;
        
        return `
            <tr>
                <td>${item.condition}</td>
                <td>${parseFloat(item.temperature || 0).toFixed(1)}°F</td>
                <td>${item.order_count || 0}</td>
                <td>$${parseFloat(item.total_revenue || 0).toFixed(2)}</td>
                <td>${completionRate.toFixed(1)}%</td>
            </tr>
        `;
    }).join('');
    
    table.innerHTML = header + '<tbody>' + rows + '</tbody>';
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
} 