// =============================================
// Charts Handler using Chart.js
// =============================================

const Charts = {
    instances: {},

    colors: {
        primary: '#4f46e5',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        gray: '#6b7280',

        priority: {
            Critical: '#ef4444',
            High: '#f97316',
            Medium: '#eab308',
            Low: '#22c55e'
        },

        status: {
            Open: '#3b82f6',
            InProgress: '#f59e0b',
            Fixed: '#10b981',
            Verified: '#8b5cf6',
            Closed: '#6b7280',
            Reopened: '#ef4444'
        }
    },

    // Destroy existing chart
    destroy: (chartId) => {
        if (Charts.instances[chartId]) {
            Charts.instances[chartId].destroy();
            delete Charts.instances[chartId];
        }
    },

    // Create Trend Chart (Line)
    createTrendChart: (canvasId, data) => {
        Charts.destroy(canvasId);

        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.warn(`Canvas ${canvasId} not found`);
            return;
        }

        Charts.instances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || data.map(d => d.date),
                datasets: [
                    {
                        label: 'Opened',
                        data: data.opened || data.map(d => d.opened),
                        borderColor: Charts.colors.danger,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Closed',
                        data: data.closed || data.map(d => d.closed),
                        borderColor: Charts.colors.success,
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    },

    // Create Priority Doughnut Chart
    createPriorityChart: (canvasId, data) => {
        Charts.destroy(canvasId);

        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.warn(`Canvas ${canvasId} not found`);
            return;
        }

        Charts.instances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Critical', 'High', 'Medium', 'Low'],
                datasets: [{
                    data: [
                        data.Critical || 0,
                        data.High || 0,
                        data.Medium || 0,
                        data.Low || 0
                    ],
                    backgroundColor: [
                        Charts.colors.priority.Critical,
                        Charts.colors.priority.High,
                        Charts.colors.priority.Medium,
                        Charts.colors.priority.Low
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                cutout: '60%'
            }
        });
    },

    // Create Status Bar Chart
    createStatusChart: (canvasId, data) => {
        Charts.destroy(canvasId);

        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.warn(`Canvas ${canvasId} not found`);
            return;
        }

        const labels = Object.keys(data);
        const values = Object.values(data);
        const colors = labels.map(label => Charts.colors.status[label] || Charts.colors.gray);

        Charts.instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Bugs',
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    },

    // Create Project Chart
    createProjectChart: (canvasId, data) => {
        Charts.destroy(canvasId);

        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.warn(`Canvas ${canvasId} not found`);
            return;
        }

        Charts.instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(p => p.name),
                datasets: [{
                    label: 'Bugs',
                    data: data.map(p => p.count),
                    backgroundColor: Charts.colors.primary,
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    },

    // Create Developer Workload Chart
    createDeveloperChart: (canvasId, data) => {
        Charts.destroy(canvasId);

        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            console.warn(`Canvas ${canvasId} not found`);
            return;
        }

        Charts.instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.name),
                datasets: [
                    {
                        label: 'Open',
                        data: data.map(d => d.openBugs || 0),
                        backgroundColor: Charts.colors.warning,
                        borderRadius: 4
                    },
                    {
                        label: 'Closed',
                        data: data.map(d => d.closedBugs || 0),
                        backgroundColor: Charts.colors.success,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
};

console.log('📊 Charts module loaded');