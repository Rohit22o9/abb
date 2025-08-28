// Global variables
let riskMap;
let simulationMap;
let deploymentMap;
let isSimulationRunning = false;
let simulationTime = 0;
let simulationInterval;
let fireSpreadLayers = [];
let deploymentLayers = [];

// ML API endpoints
const ML_API_BASE = window.location.origin.replace(':5000', ':5001');
let mlPredictions = {};
let realTimeUpdates = false;
let currentOptimization = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeMaps();
    initializeCharts();
    initializeSimulation();

    // Initialize ML components
    initializeMLIntegration();

    // Initialize resource optimization
    initializeResourceOptimization();

    // Initialize environmental impact features
    initializeEnvironmentalImpact();

    // Initialize evacuation routes
    setTimeout(() => {
        initializeEvacuationRoutes();
    }, 2000);

    // Initialize monitoring stats
    updateMonitoringStats();

    // Initialize fire theme effects
    initializeForestFireTheme();
    initializeFireInteractions();

    startDataUpdates();
});

// Fire theme initialization
function initializeForestFireTheme() {
    // Add fire effect overlay with animated particles
    const fireOverlay = document.createElement('div');
    fireOverlay.id = 'fire-overlay';
    fireOverlay.style.position = 'fixed';
    fireOverlay.style.top = '0';
    fireOverlay.style.left = '0';
    fireOverlay.style.width = '100%';
    fireOverlay.style.height = '100%';
    fireOverlay.style.pointerEvents = 'none';
    fireOverlay.style.zIndex = '1';
    fireOverlay.style.background = `
        radial-gradient(ellipse 400px 200px at 10% 90%, rgba(255, 69, 0, 0.1) 0%, transparent 60%),
        radial-gradient(ellipse 300px 150px at 90% 85%, rgba(255, 140, 0, 0.08) 0%, transparent 70%),
        radial-gradient(ellipse 200px 100px at 60% 80%, rgba(255, 69, 0, 0.06) 0%, transparent 80%)
    `;
    fireOverlay.style.opacity = '0.4';
    fireOverlay.style.animation = 'fireGlow 6s ease-in-out infinite alternate';

    document.body.appendChild(fireOverlay);

    // Create floating embers
    createFloatingEmbers();

    // Simulate dynamic fire intensity
    setInterval(() => {
        const intensity = Math.random() * 0.2 + 0.3; // Vary between 30% and 50% opacity
        fireOverlay.style.opacity = intensity;
    }, 4000);
}

function createFloatingEmbers() {
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance to create ember
            const ember = document.createElement('div');
            ember.style.position = 'fixed';
            ember.style.width = '3px';
            ember.style.height = '3px';
            ember.style.background = Math.random() > 0.5 ? '#FF4500' : '#FF8C00';
            ember.style.borderRadius = '50%';
            ember.style.left = Math.random() * window.innerWidth + 'px';
            ember.style.top = window.innerHeight + 'px';
            ember.style.pointerEvents = 'none';
            ember.style.zIndex = '2';
            ember.style.boxShadow = `0 0 6px ${ember.style.background}`;
            ember.style.opacity = '0.8';
            ember.style.animation = 'emberFloat 8s linear forwards';

            document.body.appendChild(ember);

            setTimeout(() => {
                if (document.body.contains(ember)) {
                    document.body.removeChild(ember);
                }
            }, 8000);
        }
    }, 2000);
}

// Fire cursor trail effect
let fireParticles = [];

function initializeFireInteractions() {
    // Initialize fire cursor trail
    document.addEventListener('mousemove', function(e) {
        if (Math.random() < 0.1) { // Only create particles occasionally for performance
            createFireParticle(e.clientX, e.clientY);
        }
    });

    // Initialize fire click effects
    initializeFireClickRipples();
}

function createFireParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'fire-cursor-trail';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.width = '8px';
    particle.style.height = '8px';
    particle.style.background = `radial-gradient(circle, ${Math.random() > 0.5 ? '#FF4500' : '#FF8C00'}, transparent)`;

    document.body.appendChild(particle);

    setTimeout(() => {
        if (document.body.contains(particle)) {
            document.body.removeChild(particle);
        }
    }, 1000);
}

// Fire click ripples
function initializeFireClickRipples() {
    document.addEventListener('click', function(e) {
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = e.clientX + 'px';
        ripple.style.top = e.clientY + 'px';
        ripple.style.width = '0px';
        ripple.style.height = '0px';
        ripple.style.background = 'radial-gradient(circle, rgba(255, 69, 0, 0.6), transparent)';
        ripple.style.borderRadius = '50%';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '9998';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.animation = 'fireClickRipple 0.8s ease-out forwards';

        document.body.appendChild(ripple);

        setTimeout(() => {
            if (document.body.contains(ripple)) {
                document.body.removeChild(ripple);
            }
        }, 800);
    });
}

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    // Smooth scroll navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });

                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Update active nav on scroll
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('.section');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos <= bottom) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// Initialize maps
function initializeMaps() {
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet library not loaded');
        return;
    }

    try {
        // Fire Risk Map
        const riskMapElement = document.getElementById('risk-map');
        if (riskMapElement) {
            riskMap = L.map('risk-map').setView([30.0668, 79.0193], 8);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(riskMap);

            // Add risk zones for Uttarakhand districts
            addRiskZones();
        }

        // Simulation Map
        const simulationMapElement = document.getElementById('simulation-map');
        if (simulationMapElement) {
            simulationMap = L.map('simulation-map').setView([30.0668, 79.0193], 8);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(simulationMap);

            // Add click listener for fire simulation
            simulationMap.on('click', function(e) {
                startFireSimulation(e.latlng);
            });

            // Add forest areas
            addForestAreas();
        }

        // Deployment Map for Resource Optimization
        const deploymentMapElement = document.getElementById('deployment-map');
        if (deploymentMapElement) {
            deploymentMap = L.map('deployment-map').setView([30.0668, 79.0193], 7);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(deploymentMap);

            // Add district boundaries
            addDistrictBoundaries();
        }

        // Initialize search functionality for maps
        initializeMapSearch();

        console.log('Maps initialized successfully');
    } catch (error) {
        console.error('Error initializing maps:', error);
    }
}

// Add risk zones to the map
function addRiskZones() {
    if (!riskMap) return;

    const riskZones = [
        {
            name: 'Nainital District',
            coords: [[29.2, 79.3], [29.6, 79.3], [29.6, 79.8], [29.2, 79.8]],
            risk: 'very-high',
            color: '#ff4444'
        },
        {
            name: 'Almora District',
            coords: [[29.5, 79.5], [29.9, 79.5], [29.9, 80.0], [29.5, 80.0]],
            risk: 'high',
            color: '#ffa726'
        },
        {
            name: 'Dehradun District',
            coords: [[30.1, 77.8], [30.5, 77.8], [30.5, 78.3], [30.1, 78.3]],
            risk: 'moderate',
            color: '#66bb6a'
        }
    ];

    riskZones.forEach(zone => {
        const polygon = L.polygon(zone.coords, {
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.4
        }).addTo(riskMap);

        polygon.bindPopup(`
            <div>
                <h4>${zone.name}</h4>
                <p>Risk Level: ${zone.risk.replace('-', ' ').toUpperCase()}</p>
            </div>
        `);
    });
}

// Add forest areas to simulation map
function addForestAreas() {
    if (!simulationMap) return;

    const forestAreas = [
        {
            name: 'Jim Corbett National Park',
            coords: [[29.4, 78.7], [29.7, 78.7], [29.7, 79.1], [29.4, 79.1]],
            color: '#2d5a2d'
        },
        {
            name: 'Valley of Flowers',
            coords: [[30.7, 79.5], [30.8, 79.5], [30.8, 79.7], [30.7, 79.7]],
            color: '#2d5a2d'
        }
    ];

    forestAreas.forEach(forest => {
        const polygon = L.polygon(forest.coords, {
            color: forest.color,
            fillColor: forest.color,
            fillOpacity: 0.6
        }).addTo(simulationMap);

        polygon.bindPopup(`<h4>${forest.name}</h4>`);
    });
}

// Initialize charts
function initializeCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library not loaded');
        return;
    }

    try {
        // Performance Chart (Original)
        const performanceCtx = document.getElementById('performanceChart');
        if (performanceCtx) {
            new Chart(performanceCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Accurate Predictions', 'False Positives'],
                    datasets: [{
                        data: [97, 3],
                        backgroundColor: ['#66bb6a', '#ff6b35'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ffffff'
                            }
                        }
                    }
                }
            });
        }

        // Initialize other charts
        initializeTimelineChart();
        initializeFireSpreadChart();
        initializeGaugeCharts();
        initializeAlertStatsChart();

        console.log('Charts initialized successfully');
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

function initializeTimelineChart() {
    const riskTimelineCtx = document.getElementById('riskTimelineChart');
    if (!riskTimelineCtx) return;

    const riskTimelineChart = new Chart(riskTimelineCtx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM', '3AM'],
            datasets: [
                {
                    label: 'Dehradun',
                    data: [25, 35, 55, 75, 85, 65, 45, 30],
                    borderColor: '#66bb6a',
                    backgroundColor: 'rgba(102, 187, 106, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Nainital',
                    data: [45, 55, 70, 85, 90, 80, 60, 50],
                    borderColor: '#ff4444',
                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Haridwar',
                    data: [30, 40, 60, 70, 75, 55, 40, 35],
                    borderColor: '#ffa726',
                    backgroundColor: 'rgba(255, 167, 38, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Rishikesh',
                    data: [20, 30, 45, 65, 70, 50, 35, 25],
                    borderColor: '#42a5f5',
                    backgroundColor: 'rgba(66, 165, 245, 0.1)',
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        color: '#ffffff',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });

    // Store chart reference
    if (!window.chartInstances) {
        window.chartInstances = {};
    }
    window.chartInstances.riskTimeline = riskTimelineChart;
}

function initializeFireSpreadChart() {
    const fireSpreadCtx = document.getElementById('fireSpreadChart');
    if (!fireSpreadCtx) return;

    const fireSpreadChart = new Chart(fireSpreadCtx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['0h', '1h', '2h', '3h', '4h', '5h', '6h'],
            datasets: [{
                label: 'Area Burned (hectares)',
                data: [0, 12, 35, 78, 145, 225, 320],
                borderColor: '#ff6b35',
                backgroundColor: 'rgba(255, 107, 53, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return 'Burned: ' + context.parsed.y + ' hectares';
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#ffffff',
                        callback: function(value) {
                            return value + ' ha';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });

    if (!window.chartInstances) {
        window.chartInstances = {};
    }
    window.chartInstances.fireSpread = fireSpreadChart;
}

function initializeGaugeCharts() {
    // Accuracy Gauge
    const accuracyCtx = document.getElementById('accuracyGauge');
    if (accuracyCtx) {
        new Chart(accuracyCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [97, 3],
                    backgroundColor: ['#66bb6a', 'rgba(255, 255, 255, 0.1)'],
                    borderWidth: 0,
                    cutout: '75%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
    }

    // Uptime Gauge
    const uptimeCtx = document.getElementById('uptimeGauge');
    if (uptimeCtx) {
        new Chart(uptimeCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [99.8, 0.2],
                    backgroundColor: ['#66bb6a', 'rgba(255, 255, 255, 0.1)'],
                    borderWidth: 0,
                    cutout: '75%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
    }

    // Speed Gauge
    const speedCtx = document.getElementById('speedGauge');
    if (speedCtx) {
        new Chart(speedCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [85, 15],
                    backgroundColor: ['#ffa726', 'rgba(255, 255, 255, 0.1)'],
                    borderWidth: 0,
                    cutout: '75%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
    }
}

function initializeAlertStatsChart() {
    const alertStatsCtx = document.getElementById('alertStatsChart');
    if (!alertStatsCtx) return;

    new Chart(alertStatsCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Fire Risk Warnings', 'Active Fire Detected', 'Evacuation Alerts', 'All Clear/Safe Zones'],
            datasets: [{
                data: [35, 25, 20, 20],
                backgroundColor: ['#ffa726', '#ff4444', '#ff6b35', '#66bb6a'],
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff',
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + percentage + '%';
                        }
                    }
                }
            }
        }
    });
}

// Initialize simulation controls
function initializeSimulation() {
    const playBtn = document.getElementById('play-simulation');
    const pauseBtn = document.getElementById('pause-simulation');
    const resetBtn = document.getElementById('reset-simulation');
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (!isSimulationRunning) {
                startSimulation();
            }
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', pauseSimulation);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetSimulation);
    }

    if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', (e) => {
            const speed = e.target.value;
            speedValue.textContent = `${speed}x`;
            updateSimulationSpeed(speed);
        });
    }

    // Toggle prediction button
    const toggleBtn = document.getElementById('toggle-prediction');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', togglePrediction);
    }

    // Initialize simulation monitoring chart
    initializeSimulationMonitoringChart();
}

// Fire simulation functions
async function startFireSimulation(latlng) {
    if (!simulationMap) return;

    // Try ML-powered simulation first
    const mlSimulation = await simulateFireWithML(latlng);

    // Add animated fire origin marker with enhanced visuals
    const fireMarker = L.marker([latlng.lat, latlng.lng], {
        icon: L.divIcon({
            className: 'fire-marker origin-fire',
            html: `
                <div class="fire-icon-container">
                    <i class="fas fa-fire fire-flame"></i>
                    <div class="fire-glow"></div>
                    <div class="fire-sparks"></div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        })
    }).addTo(simulationMap);

    fireSpreadLayers.push(fireMarker);

    // Store ML simulation data if available
    if (mlSimulation) {
        window.currentMLSimulation = mlSimulation;
        showToast('AI-powered simulation active', 'success');
    }

    // Add initial burn circle
    const initialBurn = L.circle([latlng.lat, latlng.lng], {
        color: '#ff6b35',
        fillColor: '#ff4444',
        fillOpacity: 0.7,
        radius: 200,
        className: 'fire-burn-area'
    }).addTo(simulationMap);

    fireSpreadLayers.push(initialBurn);
}

function startSimulation() {
    isSimulationRunning = true;
    const speedSlider = document.getElementById('speed-slider');
    const speed = speedSlider ? parseInt(speedSlider.value) : 1;

    // Limit minimum interval to prevent overwhelming the browser
    const minInterval = 500; // Minimum 500ms between updates
    const interval = Math.max(minInterval, 2000 / speed);

    simulationInterval = setInterval(() => {
        simulationTime += 1;
        updateSimulationTime();

        // Update monitoring stats
        updateMonitoringStats();

        // Use requestAnimationFrame for smoother performance
        requestAnimationFrame(() => {
            simulateFireSpread();
        });
    }, interval);

    // Initial update
    updateMonitoringStats();
}

function pauseSimulation() {
    isSimulationRunning = false;
    if (simulationInterval) {
        clearInterval(simulationInterval);
    }
}

function resetSimulation() {
    pauseSimulation();
    simulationTime = 0;
    updateSimulationTime();

    // Reset monitoring stats
    updateMonitoringStats();

    // Clear fire spread layers
    if (simulationMap) {
        fireSpreadLayers.forEach(layer => {
            try {
                simulationMap.removeLayer(layer);
            } catch (e) {
                // Ignore errors for layers already removed
            }
        });
    }
    fireSpreadLayers = [];
}

function updateSimulationSpeed(speed) {
    if (isSimulationRunning) {
        pauseSimulation();
        startSimulation();
    }
}

function simulateFireSpread() {
    // Optimized fire spread simulation
    if (fireSpreadLayers.length > 0 && simulationMap) {
        // Limit processing to prevent overwhelming the browser
        if (fireSpreadLayers.length > 100) {
            const excessLayers = fireSpreadLayers.splice(0, 20);
            excessLayers.forEach(layer => {
                try {
                    simulationMap.removeLayer(layer);
                } catch (e) {
                    // Ignore errors for layers already removed
                }
            });
        }

        // Get environmental parameters
        const windSpeed = getElementValue('wind-speed', 15);
        const windDirection = getElementText('wind-direction', 'NE');
        const temperature = getElementValue('temperature', 32);
        const humidity = getElementValue('humidity', 45);

        // Convert wind direction to angle
        const windAngles = {
            'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
            'S': 180, 'SW': 225, 'W': 270, 'NW': 315
        };
        const windAngle = (windAngles[windDirection] || 0) * Math.PI / 180;

        // Limit the number of fire sources processed per cycle
        const fireSources = fireSpreadLayers.filter(layer => 
            layer instanceof L.Marker && 
            layer.options.icon && 
            layer.options.icon.options.className && 
            layer.options.icon.options.className.includes('fire-marker')
        ).slice(-10);

        let newSpreadCount = 0;
        const maxNewSpreads = 3;

        fireSources.forEach((fireSource) => {
            if (newSpreadCount >= maxNewSpreads) return;

            if (Math.random() < 0.4) {
                const sourceLatlng = fireSource.getLatLng();

                // Simplified spread calculation
                const baseSpread = 0.005;
                const windFactor = windSpeed / 20;
                const tempFactor = temperature / 35;
                const humidityFactor = (100 - humidity) / 120;

                const spreadDistance = baseSpread * windFactor * tempFactor * humidityFactor;

                // Calculate new position
                const spreadAngle = windAngle + (Math.random() - 0.5) * Math.PI / 3;
                const newLat = sourceLatlng.lat + Math.cos(spreadAngle) * spreadDistance;
                const newLng = sourceLatlng.lng + Math.sin(spreadAngle) * spreadDistance;

                // Create simplified fire marker
                const spreadMarker = L.marker([newLat, newLng], {
                    icon: L.divIcon({
                        className: 'fire-marker spread-fire',
                        html: '<i class="fas fa-fire fire-flame"></i>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                }).addTo(simulationMap);

                // Create smaller burn area
                const burnRadius = 100 + Math.random() * 50;
                const burnArea = L.circle([newLat, newLng], {
                    color: '#ff4444',
                    fillColor: '#cc0000',
                    fillOpacity: 0.3,
                    radius: burnRadius,
                    weight: 1
                }).addTo(simulationMap);

                fireSpreadLayers.push(spreadMarker);
                fireSpreadLayers.push(burnArea);
                newSpreadCount++;
            }
        });
    }
}

function updateSimulationTime() {
    const timeElement = document.getElementById('simulation-time');
    if (timeElement) {
        const hours = Math.floor(simulationTime / 60);
        const minutes = simulationTime % 60;
        timeElement.textContent = 
            hours > 0 ? `${hours}h ${minutes}m` : `${minutes} minutes`;
    }
}

// Helper functions
function getElementValue(id, defaultValue) {
    const element = document.getElementById(id);
    if (element) {
        const value = parseInt(element.textContent);
        return isNaN(value) ? defaultValue : value;
    }
    return defaultValue;
}

function getElementText(id, defaultValue) {
    const element = document.getElementById(id);
    return element ? element.textContent : defaultValue;
}

// Toggle prediction functionality
function togglePrediction() {
    const btn = document.getElementById('toggle-prediction');
    if (!btn) return;

    const isNextDay = btn.textContent.includes('Current');

    if (isNextDay) {
        btn.innerHTML = '<i class="fas fa-clock"></i> Show Next Day Prediction';
        showCurrentDayPrediction();
    } else {
        btn.innerHTML = '<i class="fas fa-calendar"></i> Show Current Day';
        showNextDayPrediction();
    }
}

function showCurrentDayPrediction() {
    updateRiskZones([
        { name: 'Nainital District', risk: 'very-high', percentage: 85 },
        { name: 'Almora District', risk: 'high', percentage: 68 },
        { name: 'Dehradun District', risk: 'moderate', percentage: 42 }
    ]);

    updateMapRiskColors('current');

    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = '2 minutes ago';
    }
}

function showNextDayPrediction() {
    updateRiskZones([
        { name: 'Nainital District', risk: 'very-high', percentage: 92 },
        { name: 'Almora District', risk: 'very-high', percentage: 78 },
        { name: 'Dehradun District', risk: 'high', percentage: 65 }
    ]);

    updateMapRiskColors('predicted');

    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = 'Predicted for tomorrow';
    }
}

function updateRiskZones(zones) {
    const riskContainer = document.querySelector('.risk-zones');
    if (!riskContainer) return;

    riskContainer.innerHTML = '';

    zones.forEach(zone => {
        const riskClass = zone.risk === 'very-high' ? 'high-risk' : 
                         zone.risk === 'high' ? 'moderate-risk' : 'low-risk';

        const riskItem = document.createElement('div');
        riskItem.className = `risk-item ${riskClass}`;
        riskItem.innerHTML = `
            <div class="risk-color"></div>
            <div class="risk-info">
                <span class="risk-level">${zone.risk.replace('-', ' ').toUpperCase()} Risk</span>
                <span class="risk-area">${zone.name}</span>
            </div>
            <div class="risk-percentage">${zone.percentage}%</div>
        `;
        riskContainer.appendChild(riskItem);
    });
}

function updateMapRiskColors(type) {
    if (!riskMap) return;

    // Clear existing polygons
    riskMap.eachLayer(layer => {
        if (layer instanceof L.Polygon) {
            riskMap.removeLayer(layer);
        }
    });

    // Define zones based on prediction type
    const zones = type === 'current' ? [
        {
            name: 'Nainital District',
            coords: [[29.2, 79.3], [29.6, 79.3], [29.6, 79.8], [29.2, 79.8]],
            risk: 'very-high',
            color: '#ff4444'
        },
        {
            name: 'Almora District',
            coords: [[29.5, 79.5], [29.9, 79.5], [29.9, 80.0], [29.5, 80.0]],
            risk: 'high',
            color: '#ffa726'
        },
        {
            name: 'Dehradun District',
            coords: [[30.1, 77.8], [30.5, 77.8], [30.5, 78.3], [30.1, 78.3]],
            risk: 'moderate',
            color: '#66bb6a'
        }
    ] : [
        {
            name: 'Nainital District',
            coords: [[29.2, 79.3], [29.6, 79.3], [29.6, 79.8], [29.2, 79.8]],
            risk: 'very-high',
            color: '#cc0000'
        },
        {
            name: 'Almora District',
            coords: [[29.5, 79.5], [29.9, 79.5], [29.9, 80.0], [29.5, 80.0]],
            risk: 'very-high',
            color: '#ff4444'
        },
        {
            name: 'Dehradun District',
            coords: [[30.1, 77.8], [30.5, 77.8], [30.5, 78.3], [30.1, 78.3]],
            risk: 'high',
            color: '#ffa726'
        }
    ];

    // Add updated zones to map
    zones.forEach(zone => {
        const polygon = L.polygon(zone.coords, {
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: type === 'predicted' ? 0.6 : 0.4,
            weight: type === 'predicted' ? 3 : 2
        }).addTo(riskMap);

        const riskLevel = zone.risk.replace('-', ' ').toUpperCase();
        const prefix = type === 'predicted' ? 'Predicted: ' : '';

        polygon.bindPopup(`
            <div>
                <h4>${zone.name}</h4>
                <p>${prefix}Risk Level: ${riskLevel}</p>
            </div>
        `);
    });
}

// Enhanced Search Functionality
function initializeMapSearch() {
    const searchInput = document.querySelector('.search-input');

    const searchMap = (query, map) => {
        const locations = {
            'nainital': { lat: 29.3806, lng: 79.4422 },
            'almora': { lat: 29.6500, lng: 79.6667 },
            'dehradun': { lat: 30.3165, lng: 78.0322 },
            'haridwar': { lat: 29.9457, lng: 78.1642 },
            'rishikesh': { lat: 30.0869, lng: 78.2676 },
            'uttarakhand': { lat: 30.0668, lng: 79.0193 },
            'jim corbett': { lat: 29.5308, lng: 78.9514 },
            'corbett': { lat: 29.5308, lng: 78.9514 },
            'valley of flowers': { lat: 30.7268, lng: 79.6045 },
            'chamoli': { lat: 30.4000, lng: 79.3200 },
            'pithoragarh': { lat: 29.5833, lng: 80.2167 },
            'tehri': { lat: 30.3900, lng: 78.4800 },
            'pauri': { lat: 30.1500, lng: 78.7800 },
            'rudraprayag': { lat: 30.2800, lng: 78.9800 },
            'bageshwar': { lat: 29.8400, lng: 79.7700 },
            'champawat': { lat: 29.3400, lng: 80.0900 },
            'uttarkashi': { lat: 30.7300, lng: 78.4500 },
            'udham singh nagar': { lat: 28.9750, lng: 79.4000 }
        };

        const lowerCaseQuery = query.toLowerCase();
        if (locations[lowerCaseQuery]) {
            const { lat, lng } = locations[lowerCaseQuery];
            map.setView([lat, lng], 12);
            L.marker([lat, lng]).addTo(map).bindPopup(query.charAt(0).toUpperCase() + query.slice(1)).openPopup();
            showToast(`Navigated to ${query}`, 'success');
            return true;
        } else {
            showToast(`Location "${query}" not found.`, 'error');
            return false;
        }
    };

    const performSearch = (query) => {
        if (query && riskMap && simulationMap) {
            const riskSuccess = searchMap(query, riskMap);
            const simulationSuccess = searchMap(query, simulationMap);

            if (riskSuccess || simulationSuccess) {
                setTimeout(() => {
                    const fireRiskSection = document.getElementById('fire-risk');
                    if (fireRiskSection) {
                        fireRiskSection.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                        });

                        const mapContainers = document.querySelectorAll('.map-container');
                        mapContainers.forEach(container => {
                            container.style.boxShadow = '0 0 30px rgba(255, 107, 53, 0.8)';
                            container.style.transform = 'scale(1.01)';
                            container.style.transition = 'all 0.5s ease';
                        });

                        setTimeout(() => {
                            mapContainers.forEach(container => {
                                container.style.boxShadow = '';
                                container.style.transform = '';
                            });
                        }, 2000);
                    }
                }, 500);
            }

            if (searchInput) {
                searchInput.value = '';
            }
        }
    };

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                performSearch(query);
            }
        });
    }
}

// Start real-time data updates
function startDataUpdates() {
    setInterval(updateEnvironmentalData, 30000);
    setInterval(updateAlerts, 60000);
    setInterval(updateTimeStamps, 60000);
    setInterval(updateChartData, 45000);
    setInterval(updateFireSpreadChart, 10000);
    setInterval(updateActivityFeed, 45000);
    setInterval(updateEnvironmentalConditions, 35000);
}

function updateEnvironmentalData() {
    const windSpeed = Math.floor(Math.random() * 20) + 5;
    const temperature = Math.floor(Math.random() * 15) + 25;
    const humidity = Math.floor(Math.random() * 40) + 30;

    updateElementText('wind-speed', `${windSpeed} km/h`);
    updateElementText('temperature', `${temperature}°C`);
    updateElementText('humidity', `${humidity}%`);

    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    updateElementText('wind-direction', randomDirection);
}

function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

function updateAlerts() {
    const alertTimes = document.querySelectorAll('.alert-time');
    alertTimes.forEach((timeEl, index) => {
        const baseTime = (index + 1) * 15;
        timeEl.textContent = `${baseTime} minutes ago`;
    });
}

function updateTimeStamps() {
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = 'Just now';
        setTimeout(() => {
            lastUpdateElement.textContent = '1 minute ago';
        }, 5000);
    }
}

function updateChartData() {
    if (window.chartInstances && window.chartInstances.riskTimeline) {
        const chart = window.chartInstances.riskTimeline;
        chart.data.datasets.forEach((dataset) => {
            dataset.data = dataset.data.map(value => {
                const variation = (Math.random() - 0.5) * 10;
                return Math.max(0, Math.min(100, value + variation));
            });
        });
        chart.update('none');
    }

    updateGaugeValues();
    updateAlertStatistics();
}

function updateFireSpreadChart() {
    if (isSimulationRunning && window.chartInstances && window.chartInstances.fireSpread) {
        const chart = window.chartInstances.fireSpread;
        const lastValue = chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1];

        const timeLabel = simulationTime + 'h';
        const newArea = lastValue + Math.random() * 50 + 20;

        if (chart.data.labels.length > 10) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }

        chart.data.labels.push(timeLabel);
        chart.data.datasets[0].data.push(Math.round(newArea));

        chart.update('none');
    }
}

function updateGaugeValues() {
    const newAccuracy = Math.max(95, Math.min(99, 97 + (Math.random() - 0.5) * 2));
    updateElementText('accuracyValue', newAccuracy.toFixed(1) + '%');

    const newUptime = Math.max(99.5, Math.min(100, 99.8 + (Math.random() - 0.5) * 0.3));
    updateElementText('uptimeValue', newUptime.toFixed(1) + '%');

    const newSpeed = Math.max(70, Math.min(95, 85 + (Math.random() - 0.5) * 10));
    updateElementText('speedValue', Math.round(newSpeed) + '%');
}

function updateAlertStatistics() {
    const totalAlerts = Math.floor(Math.random() * 20) + 130;
    const activeFires = Math.floor(Math.random() * 5) + 5;
    const responseTime = Math.floor(Math.random() * 8) + 8;

    updateElementText('totalAlerts', totalAlerts);
    updateElementText('activeFires', activeFires);
    updateElementText('responseTime', responseTime + ' min');
}

function updateActivityFeed() {
    const activities = [
        {
            icon: 'fas fa-satellite-dish',
            title: 'Satellite Data Updated',
            description: 'New MODIS imagery processed for Nainital region',
            time: '2 minutes ago'
        },
        {
            icon: 'fas fa-exclamation-triangle',
            title: 'Risk Level Updated',
            description: 'Almora District elevated to High Risk status',
            time: '8 minutes ago'
        },
        {
            icon: 'fas fa-cloud-sun',
            title: 'Weather Data Sync',
            description: 'ERA5 meteorological data synchronized',
            time: '15 minutes ago'
        }
    ];

    const activityFeed = document.querySelector('.activity-feed');
    if (activityFeed && Math.random() < 0.1) {
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        const newActivityHtml = `
            <div class="activity-item new">
                <div class="activity-icon">
                    <i class="${randomActivity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${randomActivity.title}</div>
                    <div class="activity-description">${randomActivity.description}</div>
                    <div class="activity-time">Just now</div>
                </div>
            </div>
        `;

        activityFeed.insertAdjacentHTML('afterbegin', newActivityHtml);

        const activityItems = activityFeed.querySelectorAll('.activity-item');
        if (activityItems.length > 5) {
            activityItems[activityItems.length - 1].remove();
        }

        activityItems.forEach((item, index) => {
            if (index > 0) {
                item.classList.remove('new');
            }
        });
    }
}

function updateEnvironmentalConditions() {
    const temperatureEl = document.querySelector('.condition-card.temperature .condition-value');
    const humidityEl = document.querySelector('.condition-card.humidity .condition-value');
    const windEl = document.querySelector('.condition-card.wind .condition-value');

    if (temperatureEl) {
        const newTemp = Math.floor(Math.random() * 8) + 28;
        temperatureEl.textContent = newTemp + '°C';
    }

    if (humidityEl) {
        const newHumidity = Math.floor(Math.random() * 30) + 35;
        humidityEl.textContent = newHumidity + '%';
    }

    if (windEl) {
        const newWind = Math.floor(Math.random() * 15) + 8;
        windEl.textContent = newWind + ' km/h';
    }

    if (Math.random() < 0.3) {
        updateMLPredictions();
    }
}

// ML Integration Functions
function initializeMLIntegration() {
    startMLRealTimeUpdates();
    loadMLModelInfo();
    setInterval(updateMLPredictions, 60000);
    showToast('AI/ML models initialized successfully', 'success');
}

async function startMLRealTimeUpdates() {
    try {
        const response = await fetch(`${ML_API_BASE}/api/ml/start-realtime`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            realTimeUpdates = true;
            showToast('Real-time AI predictions activated', 'success');
        }
    } catch (error) {
        console.warn('ML API not available, using fallback predictions');
        showToast('Using local AI predictions', 'warning');
    }
}

async function updateMLPredictions() {
    try {
        const envData = getCurrentEnvironmentalData();
        const response = await fetch(`${ML_API_BASE}/api/ml/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(envData)
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                mlPredictions = result.predictions;
                updateDashboardWithMLPredictions(result.predictions);
            }
        }
    } catch (error) {
        const envData = getCurrentEnvironmentalData();
        mlPredictions = generateFallbackPredictions(envData);
        updateDashboardWithMLPredictions(mlPredictions);
    }
}

function getCurrentEnvironmentalData() {
    const temperature = getElementValue('temperature', 32);
    const humidity = getElementValue('humidity', 45);
    const windSpeed = getElementValue('wind-speed', 15);
    const windDirection = getElementText('wind-direction', 'NE');

    return {
        temperature,
        humidity,
        wind_speed: windSpeed,
        wind_direction: windDirection,
        ndvi: 0.6 + (Math.random() - 0.5) * 0.2,
        elevation: 1500 + Math.random() * 500,
        slope: 10 + Math.random() * 20,
        vegetation_density: 'moderate'
    };
}

function updateDashboardWithMLPredictions(predictions) {
    if (predictions.ensemble_risk_score) {
        const accuracyEl = document.getElementById('accuracyValue');
        if (accuracyEl && predictions.confidence_interval) {
            const confidence = (predictions.confidence_interval.confidence_level * 100).toFixed(1);
            accuracyEl.textContent = confidence + '%';
        }
    }
}

function generateFallbackPredictions(envData) {
    const tempFactor = Math.min(envData.temperature / 40, 1);
    const humidityFactor = Math.max(0, (100 - envData.humidity) / 100);
    const windFactor = Math.min(envData.wind_speed / 30, 1);

    const baseRisk = (tempFactor * 0.4 + humidityFactor * 0.4 + windFactor * 0.2);
    const ensemble_risk = Math.min(baseRisk + Math.random() * 0.1, 1);

    return {
        ensemble_risk_score: ensemble_risk,
        ml_prediction: {
            overall_risk: ensemble_risk,
            confidence: 0.85,
            risk_category: ensemble_risk > 0.7 ? 'high' : ensemble_risk > 0.4 ? 'moderate' : 'low'
        },
        confidence_interval: {
            confidence_level: 0.85,
            lower_bound: Math.max(0, ensemble_risk - 0.1),
            upper_bound: Math.min(1, ensemble_risk + 0.1)
        }
    };
}

async function simulateFireWithML(latlng) {
    try {
        const envData = getCurrentEnvironmentalData();
        const response = await fetch(`${ML_API_BASE}/api/ml/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lat: latlng.lat,
                lng: latlng.lng,
                duration: 6,
                ...envData
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                showToast('AI-powered fire simulation completed', 'success');
                return result.simulation;
            }
        }
    } catch (error) {
        console.warn('ML simulation failed, using fallback');
        showToast('Using simplified fire simulation', 'warning');
    }

    return null;
}

async function loadMLModelInfo() {
    try {
        const response = await fetch(`${ML_API_BASE}/api/ml/model-info`);
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const accuracyEl = document.getElementById('accuracyValue');
                if (accuracyEl && result.models.convlstm_unet.accuracy) {
                    accuracyEl.textContent = result.models.convlstm_unet.accuracy;
                }
                window.mlModelInfo = result.models;
            }
        }
    } catch (error) {
        console.warn('ML model info unavailable');
    }
}

// Initialize simulation monitoring chart
function initializeSimulationMonitoringChart() {
    const ctx = document.getElementById('simulationMonitoringChart');
    if (!ctx) return;

    const simulationMonitoringChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['0m'],
            datasets: [
                {
                    label: 'Area Burned (ha)',
                    data: [0],
                    borderColor: '#ff6b35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Fire Perimeter (km)',
                    data: [0],
                    borderColor: '#ffa726',
                    backgroundColor: 'rgba(255, 167, 38, 0.1)',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ffffff',
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: {
                        color: '#ffffff',
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                        display: true,
                        text: 'Area (ha)',
                        color: '#ff6b35',
                        font: {
                            size: 10
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: {
                        color: '#ffffff',
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    title: {
                        display: true,
                        text: 'Perimeter (km)',
                        color: '#ffa726',
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });

    if (!window.chartInstances) {
        window.chartInstances = {};
    }
    window.chartInstances.simulationMonitoring = simulationMonitoringChart;
}

// Update monitoring stats
function updateMonitoringStats() {
    if (isSimulationRunning) {
        const timeInHours = simulationTime / 60;
        const baseArea = Math.pow(timeInHours, 1.5) * 25;
        const burnedArea = baseArea + (Math.random() * 20 - 10);
        const firePerimeter = Math.sqrt(burnedArea * 4 * Math.PI);
        const spreadRate = timeInHours > 0 ? burnedArea / timeInHours : 0;
        const activeCount = Math.min(Math.floor(burnedArea / 50) + 1, 15);

        updateElementText('totalBurnedArea', Math.max(0, burnedArea).toFixed(0) + ' ha');
        updateElementText('firePerimeter', Math.max(0, firePerimeter).toFixed(1) + ' km');
        updateElementText('spreadRate', Math.max(0, spreadRate).toFixed(1) + ' ha/hr');
        updateElementText('activeFireSources', activeCount);

        updateSimulationMonitoringChart(burnedArea, firePerimeter);
    } else {
        updateElementText('totalBurnedArea', '0 ha');
        updateElementText('firePerimeter', '0 km');
        updateElementText('spreadRate', '0 ha/hr');
        updateElementText('activeFireSources', '0');

        if (window.chartInstances && window.chartInstances.simulationMonitoring) {
            const chart = window.chartInstances.simulationMonitoring;
            chart.data.labels = ['0m'];
            chart.data.datasets[0].data = [0];
            chart.data.datasets[1].data = [0];
            chart.update('none');
        }
    }
}

function updateSimulationMonitoringChart(burnedArea, firePerimeter) {
    if (window.chartInstances && window.chartInstances.simulationMonitoring) {
        const chart = window.chartInstances.simulationMonitoring;

        const timeLabel = simulationTime > 60 ? 
            Math.floor(simulationTime / 60) + 'h' + (simulationTime % 60 > 0 ? (simulationTime % 60) + 'm' : '') :
            simulationTime + 'm';

        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
            chart.data.datasets[1].data.shift();
        }

        chart.data.labels.push(timeLabel);
        chart.data.datasets[0].data.push(Math.max(0, burnedArea));
        chart.data.datasets[1].data.push(Math.max(0, firePerimeter));

        chart.update('none');
    }
}

// Toast Notifications
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// Modal Functions
function openModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Close modal on overlay click
const modalOverlay = document.getElementById('modal-overlay');
if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// FireVision 3D/AR Visualization System
class FireVision3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.terrain = null;
        this.fireParticles = [];
        this.fireSpreadData = [];
        this.animationId = null;
        this.isARMode = false;
        this.currentMode = '3d';
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.controls = null;
        this.fireTime = 0;
        this.isPlaying = false;
        this.explanationLabels = [];
        this.whyViewActive = false;
        
        // Enhanced realistic fire properties
        this.windVector = new THREE.Vector3(1, 0, 0);
        this.windStrength = 0.5;
        this.fireIntensity = 1.0;
        this.smokeSystems = [];
        this.emberSystems = [];
        this.burnedAreas = [];
        this.temperatureField = [];
        this.fireSourcesActive = [];
        this.terrainMoisture = [];
        this.vegetationDensity = [];
        this.fuelLoad = [];
        
        // Realistic physics constants
        this.GRAVITY = -9.81;
        this.BUOYANCY = 12.0;
        this.THERMAL_RISE = 8.0;
        this.CONVECTION_STRENGTH = 5.0;
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.createTerrain();
        this.createLighting();
        this.setupControls();
        this.setupEventListeners();
        this.animate();
        
        console.log('FireVision 3D system initialized');
    }
    
    setupScene() {
        const canvas = document.getElementById('firevision-canvas');
        if (!canvas) return;
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a1a0a);
        this.scene.fog = new THREE.Fog(0x0a1a0a, 50, 200);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75, 
            canvas.clientWidth / canvas.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 30, 50);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }
    
    createTerrain() {
        // Create heightmap-based terrain with enhanced realism
        const width = 120;
        const height = 120;
        const geometry = new THREE.PlaneGeometry(100, 100, width - 1, height - 1);
        
        // Generate realistic heightmap with fractal noise
        const vertices = geometry.attributes.position.array;
        const uvs = geometry.attributes.uv.array;
        
        // Initialize terrain data arrays
        this.terrainMoisture = [];
        this.vegetationDensity = [];
        this.fuelLoad = [];
        
        for (let i = 0, j = 0, k = 0; i < vertices.length; i++, j += 3, k += 2) {
            const x = vertices[j];
            const z = vertices[j + 2];
            const u = uvs[k];
            const v = uvs[k + 1];
            
            // Generate realistic height with multiple octaves of noise
            const height = this.generateRealisticHeight(x, z);
            vertices[j + 1] = height;
            
            // Calculate terrain properties based on position and height
            const moisture = this.calculateMoisture(x, z, height);
            const vegDensity = this.calculateVegetationDensity(x, z, height, moisture);
            const fuel = this.calculateFuelLoad(vegDensity, moisture);
            
            this.terrainMoisture.push(moisture);
            this.vegetationDensity.push(vegDensity);
            this.fuelLoad.push(fuel);
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        // Create enhanced terrain material with realistic textures
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            wireframe: false,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Generate realistic colors based on vegetation, moisture, and elevation
        const colors = [];
        const color = new THREE.Color();
        
        for (let i = 0; i < vertices.length; i += 3) {
            const height = vertices[i + 1];
            const moisture = this.terrainMoisture[i / 3];
            const vegDensity = this.vegetationDensity[i / 3];
            
            // Realistic color mixing based on environmental factors
            if (height > 8) {
                // Snow/rock at high elevation
                color.setHSL(0, 0, 0.8 + Math.random() * 0.15);
            } else if (moisture < 0.3) {
                // Dry/arid areas
                color.setHSL(0.1, 0.6, 0.4 + Math.random() * 0.2);
            } else if (vegDensity > 0.7) {
                // Dense forest
                color.setHSL(0.25 + Math.random() * 0.1, 0.8, 0.2 + moisture * 0.3);
            } else if (vegDensity > 0.4) {
                // Mixed vegetation
                color.setHSL(0.2 + Math.random() * 0.15, 0.7, 0.3 + moisture * 0.2);
            } else {
                // Grassland/sparse vegetation
                color.setHSL(0.15 + Math.random() * 0.1, 0.5, 0.5 + moisture * 0.2);
            }
            
            colors.push(color.r, color.g, color.b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.terrain.castShadow = true;
        this.scene.add(this.terrain);
        
        this.createInfrastructure();
        this.createVegetation();
    }
    
    generateRealisticHeight(x, z) {
        // Multi-octave Perlin-like noise for realistic terrain
        const scale1 = 0.02;
        const scale2 = 0.008;
        const scale3 = 0.004;
        const scale4 = 0.001;
        
        const amp1 = 2.0;
        const amp2 = 4.0;
        const amp3 = 2.0;
        const amp4 = 8.0;
        
        const height1 = Math.sin(x * scale1) * Math.cos(z * scale1) * amp1;
        const height2 = Math.sin(x * scale2 + 1.7) * Math.cos(z * scale2 + 2.3) * amp2;
        const height3 = Math.sin(x * scale3 + 3.1) * Math.cos(z * scale3 + 4.7) * amp3;
        const height4 = Math.sin(x * scale4 + 5.9) * Math.cos(z * scale4 + 6.1) * amp4;
        
        // Add ridges and valleys
        const ridgeNoise = Math.abs(Math.sin(x * 0.01) * Math.cos(z * 0.01)) * 3;
        
        return Math.max(0, height1 + height2 + height3 + height4 + ridgeNoise);
    }
    
    calculateMoisture(x, z, height) {
        // Moisture based on distance from water, elevation, and slope
        const waterDistance = Math.min(
            Math.sqrt(x * x + (z - 20) * (z - 20)), // River
            Math.sqrt((x - 30) * (x - 30) + (z + 15) * (z + 15)) // Lake
        );
        
        const elevationFactor = Math.max(0, 1 - height / 12);
        const distanceFactor = Math.max(0.1, 1 - waterDistance / 40);
        const randomVariation = 0.8 + Math.random() * 0.4;
        
        return Math.min(1, elevationFactor * distanceFactor * randomVariation);
    }
    
    calculateVegetationDensity(x, z, height, moisture) {
        // Vegetation density based on moisture, elevation, and slope
        const elevationFactor = height < 2 ? 1 : height < 6 ? 0.8 : 0.3;
        const moistureFactor = moisture * 1.2;
        const clusterNoise = (Math.sin(x * 0.05) + Math.cos(z * 0.05)) * 0.3 + 0.7;
        
        return Math.min(1, Math.max(0, elevationFactor * moistureFactor * clusterNoise));
    }
    
    calculateFuelLoad(vegDensity, moisture) {
        // Fuel load based on vegetation density and dryness
        const dryness = 1 - moisture;
        const baseFuel = vegDensity * 0.8;
        const drynessFactor = 0.5 + dryness * 0.5;
        
        return Math.min(1, baseFuel * drynessFactor);
    }
    
    createVegetation() {
        // Add 3D vegetation for enhanced realism
        const treeGeometry = new THREE.ConeGeometry(0.5, 2, 6);
        const treeMatDark = new THREE.MeshStandardMaterial({ color: 0x1a4a1a });
        const treeMatLight = new THREE.MeshStandardMaterial({ color: 0x2a5a2a });
        
        const bushGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        const bushMaterial = new THREE.MeshStandardMaterial({ color: 0x3a6a3a });
        
        // Place vegetation based on density map
        for (let i = 0; i < 300; i++) {
            const x = (Math.random() - 0.5) * 90;
            const z = (Math.random() - 0.5) * 90;
            const height = this.getTerrainHeight(x, z);
            
            // Get vegetation density at this position
            const index = Math.floor((x + 50) * 1.2) + Math.floor((z + 50) * 1.2) * 120;
            const vegDensity = this.vegetationDensity[index] || 0;
            
            if (Math.random() < vegDensity) {
                if (Math.random() < 0.7) {
                    // Tree
                    const tree = new THREE.Mesh(treeGeometry, Math.random() > 0.5 ? treeMatDark : treeMatLight);
                    const scale = 0.8 + Math.random() * 0.6;
                    tree.scale.setScalar(scale);
                    tree.position.set(x, height + scale, z);
                    tree.castShadow = true;
                    this.scene.add(tree);
                } else {
                    // Bush
                    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
                    const scale = 0.6 + Math.random() * 0.8;
                    bush.scale.setScalar(scale);
                    bush.position.set(x, height + scale * 0.3, z);
                    bush.castShadow = true;
                    this.scene.add(bush);
                }
            }
        }
    }
    
    generateHeight(x, z) {
        // Generate realistic mountain terrain using Perlin-like noise
        const scale1 = 0.05;
        const scale2 = 0.02;
        const scale3 = 0.01;
        
        const height1 = Math.sin(x * scale1) * Math.cos(z * scale1) * 3;
        const height2 = Math.sin(x * scale2) * Math.cos(z * scale2) * 8;
        const height3 = Math.sin(x * scale3) * Math.cos(z * scale3) * 2;
        
        return Math.max(0, height1 + height2 + height3);
    }
    
    createInfrastructure() {
        // Add villages/infrastructure markers
        const villages = [
            { x: -20, z: -15, name: 'Mountain Village' },
            { x: 25, z: 10, name: 'Forest Camp' },
            { x: -10, z: 30, name: 'Research Station' }
        ];
        
        villages.forEach(village => {
            const height = this.getTerrainHeight(village.x, village.z);
            
            // Create simple house structure
            const houseGeometry = new THREE.BoxGeometry(2, 2, 2);
            const houseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const house = new THREE.Mesh(houseGeometry, houseMaterial);
            house.position.set(village.x, height + 1, village.z);
            house.castShadow = true;
            this.scene.add(house);
            
            // Add roof
            const roofGeometry = new THREE.ConeGeometry(1.5, 1, 4);
            const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(village.x, height + 2.5, village.z);
            roof.rotation.y = Math.PI / 4;
            this.scene.add(roof);
        });
        
        // Add evacuation routes (green paths)
        this.createEvacuationRoutes();
    }
    
    createEvacuationRoutes() {
        const routeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 60, 8);
        const routeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x10B981,
            transparent: true,
            opacity: 0.7,
            emissive: 0x10B981,
            emissiveIntensity: 0.2
        });
        
        const route1 = new THREE.Mesh(routeGeometry, routeMaterial);
        route1.position.set(-30, 1, 0);
        route1.rotation.z = Math.PI / 2;
        this.scene.add(route1);
        
        const route2 = new THREE.Mesh(routeGeometry, routeMaterial);
        route2.position.set(0, 1, -30);
        this.scene.add(route2);
    }
    
    getTerrainHeight(x, z) {
        // Calculate terrain height at given position
        return this.generateHeight(x, z);
    }
    
    createLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 25);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);
        
        // Fire light (initially off)
        this.fireLight = new THREE.PointLight(0xff4500, 0, 100);
        this.fireLight.position.set(0, 10, 0);
        this.scene.add(this.fireLight);
    }
    
    setupControls() {
        // Simple orbit controls simulation
        this.controls = {
            enabled: true,
            rotateSpeed: 0.005,
            zoomSpeed: 0.1,
            panSpeed: 0.1,
            isRotating: false,
            isPanning: false,
            lastMouse: { x: 0, y: 0 }
        };
    }
    
    setupEventListeners() {
        const canvas = document.getElementById('firevision-canvas');
        
        // Mouse events for 3D interaction
        canvas.addEventListener('mousedown', (event) => this.onMouseDown(event));
        canvas.addEventListener('mousemove', (event) => this.onMouseMove(event));
        canvas.addEventListener('mouseup', (event) => this.onMouseUp(event));
        canvas.addEventListener('wheel', (event) => this.onMouseWheel(event));
        canvas.addEventListener('click', (event) => this.onMouseClick(event));
        
        // Mode switching
        document.querySelectorAll('.viz-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });
        
        // 3D Controls
        document.getElementById('play-3d-simulation')?.addEventListener('click', () => this.startFireSimulation());
        document.getElementById('pause-3d-simulation')?.addEventListener('click', () => this.pauseFireSimulation());
        document.getElementById('fast-forward-3d')?.addEventListener('click', () => this.fastForwardSimulation());
        document.getElementById('rotate-terrain')?.addEventListener('click', () => this.autoRotate());
        document.getElementById('zoom-fit')?.addEventListener('click', () => this.fitView());
        document.getElementById('toggle-wireframe')?.addEventListener('click', () => this.toggleWireframe());
        
        // Parameter controls
        this.setupParameterControls();
        
        // Why View toggle
        document.getElementById('toggle-why-view')?.addEventListener('click', () => this.toggleWhyView());
        
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupParameterControls() {
        // Fire intensity control
        const fireIntensitySlider = document.getElementById('fire-intensity-3d');
        if (fireIntensitySlider) {
            fireIntensitySlider.addEventListener('input', (e) => {
                document.getElementById('fire-intensity-value-3d').textContent = e.target.value + '%';
                this.updateFireIntensity(e.target.value / 100);
            });
        }
        
        // Simulation speed control
        const simSpeedSlider = document.getElementById('sim-speed-3d');
        if (simSpeedSlider) {
            simSpeedSlider.addEventListener('input', (e) => {
                document.getElementById('sim-speed-value-3d').textContent = e.target.value + 'x';
                this.updateSimulationSpeed(parseFloat(e.target.value));
            });
        }
        
        // Time slider control
        const timeSlider = document.getElementById('time-slider-3d');
        if (timeSlider) {
            timeSlider.addEventListener('input', (e) => {
                document.getElementById('time-value-3d').textContent = e.target.value + 'h';
                this.setFireTime(parseInt(e.target.value));
            });
        }
    }
    
    onMouseDown(event) {
        this.controls.isRotating = true;
        this.controls.lastMouse.x = event.clientX;
        this.controls.lastMouse.y = event.clientY;
    }
    
    onMouseMove(event) {
        if (!this.controls.isRotating) return;
        
        const deltaX = event.clientX - this.controls.lastMouse.x;
        const deltaY = event.clientY - this.controls.lastMouse.y;
        
        // Rotate camera around the terrain
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(this.camera.position);
        
        spherical.theta -= deltaX * this.controls.rotateSpeed;
        spherical.phi += deltaY * this.controls.rotateSpeed;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        this.camera.position.setFromSpherical(spherical);
        this.camera.lookAt(0, 0, 0);
        
        this.controls.lastMouse.x = event.clientX;
        this.controls.lastMouse.y = event.clientY;
    }
    
    onMouseUp(event) {
        this.controls.isRotating = false;
    }
    
    onMouseWheel(event) {
        const scale = event.deltaY > 0 ? 1.1 : 0.9;
        this.camera.position.multiplyScalar(scale);
        
        // Clamp zoom distance
        const distance = this.camera.position.length();
        if (distance < 20) {
            this.camera.position.normalize().multiplyScalar(20);
        } else if (distance > 150) {
            this.camera.position.normalize().multiplyScalar(150);
        }
    }
    
    onMouseClick(event) {
        // Raycast to detect terrain clicks
        const rect = event.target.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.terrain);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.showFireInfoPopup(point);
        }
    }
    
    showFireInfoPopup(point) {
        const popup = document.getElementById('fire-info-popup');
        if (!popup) return;
        
        // Update popup with simulated data based on location
        const windSpeed = 12 + Math.random() * 8;
        const dryness = 50 + Math.random() * 40;
        const slope = Math.abs(point.y) * 3;
        const temperature = 28 + Math.random() * 8;
        
        document.getElementById('popup-wind').textContent = windSpeed.toFixed(1) + ' km/h';
        document.getElementById('popup-dryness').textContent = dryness.toFixed(0) + '%';
        document.getElementById('popup-slope').textContent = slope.toFixed(1) + '°';
        document.getElementById('popup-temperature').textContent = temperature.toFixed(1) + '°C';
        
        popup.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            popup.style.display = 'none';
        }, 5000);
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        
        // Update UI
        document.querySelectorAll('.viz-mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        if (mode === 'ar') {
            this.initARMode();
        } else {
            this.init3DMode();
        }
        
        // Update status indicator
        const statusText = document.getElementById('viz-status-text');
        const modeIndicator = document.getElementById('current-mode-indicator');
        
        if (mode === 'ar') {
            statusText.textContent = 'AR Mode Ready';
            modeIndicator.textContent = 'AR Mode';
            this.showARInstructions();
        } else {
            statusText.textContent = '3D Terrain Ready';
            modeIndicator.textContent = '3D Mode';
            this.hideARInstructions();
        }
    }
    
    initARMode() {
        // Check for WebXR support
        if ('xr' in navigator) {
            navigator.xr.isSessionSupported('immersive-ar').then(supported => {
                if (supported) {
                    this.isARMode = true;
                    console.log('AR mode supported');
                } else {
                    this.showARNotSupported();
                }
            });
        } else {
            this.showARNotSupported();
        }
    }
    
    init3DMode() {
        this.isARMode = false;
        this.hideARInstructions();
    }
    
    showARInstructions() {
        const instructions = document.getElementById('ar-instructions');
        if (instructions) {
            instructions.style.display = 'flex';
        }
    }
    
    hideARInstructions() {
        const instructions = document.getElementById('ar-instructions');
        if (instructions) {
            instructions.style.display = 'none';
        }
    }
    
    showARNotSupported() {
        showToast('AR mode not supported on this device. Please use a compatible mobile browser.', 'warning', 5000);
    }
    
    startFireSimulation() {
        this.isPlaying = true;
        this.fireTime = 0;
        
        // Create initial fire source at terrain center
        this.createFireSource(0, 0);
        
        // Update UI
        document.getElementById('play-3d-simulation').disabled = true;
        document.getElementById('pause-3d-simulation').disabled = false;
        
        showToast('3D Fire simulation started', 'success');
    }
    
    pauseFireSimulation() {
        this.isPlaying = false;
        
        // Update UI
        document.getElementById('play-3d-simulation').disabled = false;
        document.getElementById('pause-3d-simulation').disabled = true;
    }
    
    fastForwardSimulation() {
        if (this.isPlaying) {
            this.fireTime += 5; // Fast forward 5 hours
            this.updateFireSpread();
            showToast('Fast-forwarded fire simulation', 'info');
        }
    }
    
    createFireSource(x, z) {
        const height = this.getTerrainHeight(x, z);
        
        // Create realistic fire system with multiple components
        const fireSource = {
            position: new THREE.Vector3(x, height, z),
            intensity: 1.0,
            temperature: 800, // Celsius
            radius: 2.0,
            age: 0,
            fuelConsumed: 0,
            burnRate: 0.1
        };
        
        this.fireSourcesActive.push(fireSource);
        
        // Create layered fire effect
        this.createFireFlames(fireSource);
        this.createFireSmoke(fireSource);
        this.createFireEmbers(fireSource);
        this.createFireGlow(fireSource);
        
        // Add dynamic fire light with realistic properties
        const fireLight = new THREE.PointLight(0xff4500, 3, 30);
        fireLight.position.copy(fireSource.position);
        fireLight.position.y += 5;
        fireLight.castShadow = true;
        fireLight.shadow.mapSize.width = 1024;
        fireLight.shadow.mapSize.height = 1024;
        this.scene.add(fireLight);
        
        fireSource.light = fireLight;
    }
    
    createFireFlames(fireSource) {
        // Create realistic flame particle system
        const flameGeometry = new THREE.BufferGeometry();
        const flameCount = 800;
        const positions = new Float32Array(flameCount * 3);
        const velocities = new Float32Array(flameCount * 3);
        const ages = new Float32Array(flameCount);
        const colors = new Float32Array(flameCount * 3);
        const sizes = new Float32Array(flameCount);
        
        for (let i = 0; i < flameCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * fireSource.radius;
            
            positions[i * 3] = fireSource.position.x + Math.cos(angle) * radius;
            positions[i * 3 + 1] = fireSource.position.y + Math.random() * 2;
            positions[i * 3 + 2] = fireSource.position.z + Math.sin(angle) * radius;
            
            // Realistic flame velocities with buoyancy and wind
            velocities[i * 3] = this.windVector.x * this.windStrength + (Math.random() - 0.5) * 2;
            velocities[i * 3 + 1] = this.THERMAL_RISE + Math.random() * 5;
            velocities[i * 3 + 2] = this.windVector.z * this.windStrength + (Math.random() - 0.5) * 2;
            
            ages[i] = Math.random() * 2;
            
            // Realistic flame colors based on temperature
            const temp = 500 + Math.random() * 600; // 500-1100°C
            const color = this.temperatureToColor(temp);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            sizes[i] = 1 + Math.random() * 3;
        }
        
        flameGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        flameGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        flameGeometry.setAttribute('age', new THREE.BufferAttribute(ages, 1));
        flameGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        flameGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const flameMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                attribute float age;
                attribute float size;
                attribute vec3 velocity;
                varying vec3 vColor;
                varying float vAge;
                
                void main() {
                    vColor = color;
                    vAge = age;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z) * (2.0 - age);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAge;
                
                void main() {
                    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
                    alpha *= (2.0 - vAge) * 0.5;
                    
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });
        
        const flames = new THREE.Points(flameGeometry, flameMaterial);
        flames.userData = { type: 'flames', fireSource: fireSource };
        this.scene.add(flames);
        this.fireParticles.push(flames);
    }
    
    createFireSmoke(fireSource) {
        // Create realistic smoke system
        const smokeGeometry = new THREE.BufferGeometry();
        const smokeCount = 400;
        const positions = new Float32Array(smokeCount * 3);
        const velocities = new Float32Array(smokeCount * 3);
        const ages = new Float32Array(smokeCount);
        const sizes = new Float32Array(smokeCount);
        
        for (let i = 0; i < smokeCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * (fireSource.radius + 2);
            
            positions[i * 3] = fireSource.position.x + Math.cos(angle) * radius;
            positions[i * 3 + 1] = fireSource.position.y + 3 + Math.random() * 5;
            positions[i * 3 + 2] = fireSource.position.z + Math.sin(angle) * radius;
            
            // Smoke follows wind and thermal currents
            velocities[i * 3] = this.windVector.x * this.windStrength * 2 + (Math.random() - 0.5);
            velocities[i * 3 + 1] = this.THERMAL_RISE * 0.3 + Math.random() * 2;
            velocities[i * 3 + 2] = this.windVector.z * this.windStrength * 2 + (Math.random() - 0.5);
            
            ages[i] = Math.random() * 5;
            sizes[i] = 2 + Math.random() * 6;
        }
        
        smokeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        smokeGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        smokeGeometry.setAttribute('age', new THREE.BufferAttribute(ages, 1));
        smokeGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const smokeMaterial = new THREE.PointsMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.6,
            size: 8,
            blending: THREE.NormalBlending
        });
        
        const smoke = new THREE.Points(smokeGeometry, smokeMaterial);
        smoke.userData = { type: 'smoke', fireSource: fireSource };
        this.scene.add(smoke);
        this.smokeSystems.push(smoke);
    }
    
    createFireEmbers(fireSource) {
        // Create realistic ember system
        const emberGeometry = new THREE.BufferGeometry();
        const emberCount = 150;
        const positions = new Float32Array(emberCount * 3);
        const velocities = new Float32Array(emberCount * 3);
        const ages = new Float32Array(emberCount);
        const sizes = new Float32Array(emberCount);
        
        for (let i = 0; i < emberCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * fireSource.radius;
            
            positions[i * 3] = fireSource.position.x + Math.cos(angle) * radius;
            positions[i * 3 + 1] = fireSource.position.y + Math.random() * 3;
            positions[i * 3 + 2] = fireSource.position.z + Math.sin(angle) * radius;
            
            // Embers affected by wind and gravity
            const emberSpeed = 5 + Math.random() * 10;
            velocities[i * 3] = this.windVector.x * emberSpeed + (Math.random() - 0.5) * 3;
            velocities[i * 3 + 1] = this.THERMAL_RISE * 0.5 + Math.random() * 8;
            velocities[i * 3 + 2] = this.windVector.z * emberSpeed + (Math.random() - 0.5) * 3;
            
            ages[i] = Math.random() * 3;
            sizes[i] = 0.3 + Math.random() * 0.7;
        }
        
        emberGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        emberGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        emberGeometry.setAttribute('age', new THREE.BufferAttribute(ages, 1));
        emberGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const emberMaterial = new THREE.PointsMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.9,
            size: 2,
            blending: THREE.AdditiveBlending
        });
        
        const embers = new THREE.Points(emberGeometry, emberMaterial);
        embers.userData = { type: 'embers', fireSource: fireSource };
        this.scene.add(embers);
        this.emberSystems.push(embers);
    }
    
    createFireGlow(fireSource) {
        // Create ground glow effect
        const glowGeometry = new THREE.CircleGeometry(fireSource.radius * 2, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(fireSource.position);
        glow.position.y += 0.1;
        glow.rotation.x = -Math.PI / 2;
        glow.userData = { type: 'glow', fireSource: fireSource };
        this.scene.add(glow);
    }
    
    temperatureToColor(temp) {
        // Convert temperature to realistic fire color
        const color = new THREE.Color();
        
        if (temp < 600) {
            // Deep red
            color.setHSL(0, 1, 0.3);
        } else if (temp < 800) {
            // Red-orange
            color.setHSL(0.05, 1, 0.5);
        } else if (temp < 1000) {
            // Orange
            color.setHSL(0.08, 1, 0.6);
        } else if (temp < 1200) {
            // Yellow-orange
            color.setHSL(0.12, 1, 0.7);
        } else {
            // Yellow-white
            color.setHSL(0.15, 0.8, 0.8);
        }
        
        return color;
    }
    
    updateFireSpread() {
        if (!this.isPlaying) return;
        
        const deltaTime = this.clock.getDelta();
        
        // Process each active fire source
        this.fireSourcesActive.forEach((fireSource, index) => {
            fireSource.age += deltaTime;
            
            // Calculate realistic fire spread based on environmental factors
            const spreadRate = this.calculateFireSpreadRate(fireSource);
            const spreadDirection = this.calculateSpreadDirection(fireSource);
            
            // Attempt to spread fire to adjacent areas
            if (Math.random() < spreadRate * deltaTime) {
                this.attemptFireSpread(fireSource, spreadDirection);
            }
            
            // Update fire intensity based on fuel consumption
            this.updateFireIntensity(fireSource, deltaTime);
            
            // Update temperature field around fire
            this.updateTemperatureField(fireSource);
        });
        
        // Update burned areas visualization
        this.updateBurnedAreas();
        
        // Calculate and display statistics
        this.updateFireStatistics();
        
        // Update wind patterns (realistic wind variation)
        this.updateWindPatterns(deltaTime);
    }
    
    calculateFireSpreadRate(fireSource) {
        const pos = fireSource.position;
        const index = this.getTerrainIndex(pos.x, pos.z);
        
        if (index < 0 || index >= this.fuelLoad.length) return 0;
        
        // Environmental factors affecting spread rate
        const fuelFactor = this.fuelLoad[index] || 0;
        const moistureFactor = Math.max(0.1, 1 - (this.terrainMoisture[index] || 0));
        const windFactor = 1 + this.windStrength * 2;
        const slopeFactor = this.calculateSlopeFactor(pos.x, pos.z);
        const temperatureFactor = Math.min(2, fireSource.temperature / 500);
        
        // Realistic spread rate calculation
        const baseRate = 0.1; // Base spread attempts per second
        const spreadRate = baseRate * fuelFactor * moistureFactor * windFactor * slopeFactor * temperatureFactor;
        
        return Math.min(1, spreadRate);
    }
    
    calculateSpreadDirection(fireSource) {
        // Fire spreads primarily with wind and uphill
        const windInfluence = this.windVector.clone().multiplyScalar(this.windStrength * 3);
        const slopeInfluence = this.calculateSlopeVector(fireSource.position.x, fireSource.position.z);
        const randomInfluence = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            0,
            (Math.random() - 0.5) * 2
        );
        
        const direction = windInfluence.add(slopeInfluence).add(randomInfluence);
        return direction.normalize();
    }
    
    attemptFireSpread(sourcefire, direction) {
        // Calculate new fire position
        const spreadDistance = 3 + Math.random() * 5; // 3-8 meters
        const newPos = sourcefire.position.clone().add(
            direction.clone().multiplyScalar(spreadDistance)
        );
        
        // Check if position is valid and has fuel
        const index = this.getTerrainIndex(newPos.x, newPos.z);
        if (index < 0 || index >= this.fuelLoad.length) return;
        
        const fuelAvailable = this.fuelLoad[index] || 0;
        const moisture = this.terrainMoisture[index] || 0;
        
        // Fire spread probability based on conditions
        const spreadProbability = fuelAvailable * (1 - moisture * 0.8);
        
        if (Math.random() < spreadProbability) {
            // Check if fire already exists nearby
            const nearbyFire = this.fireSourcesActive.find(fire => 
                fire.position.distanceTo(newPos) < 4
            );
            
            if (!nearbyFire) {
                // Create new fire source
                this.createFireSource(newPos.x, newPos.z);
                
                // Consume fuel at this location
                this.fuelLoad[index] = Math.max(0, this.fuelLoad[index] - 0.3);
            }
        }
    }
    
    updateFireIntensity(fireSource, deltaTime) {
        const index = this.getTerrainIndex(fireSource.position.x, fireSource.position.z);
        if (index < 0 || index >= this.fuelLoad.length) return;
        
        // Consume fuel
        const consumption = fireSource.burnRate * deltaTime;
        const availableFuel = this.fuelLoad[index] || 0;
        
        if (availableFuel > 0) {
            this.fuelLoad[index] = Math.max(0, availableFuel - consumption);
            fireSource.fuelConsumed += consumption;
            
            // Update fire properties based on fuel consumption
            fireSource.intensity = Math.min(2, availableFuel * 2);
            fireSource.temperature = 300 + fireSource.intensity * 400;
            
            // Update light intensity
            if (fireSource.light) {
                fireSource.light.intensity = 2 + fireSource.intensity;
                fireSource.light.color.copy(this.temperatureToColor(fireSource.temperature));
            }
        } else {
            // Fire dies out when fuel is exhausted
            fireSource.intensity *= 0.95; // Gradual decay
            if (fireSource.intensity < 0.1) {
                this.extinguishFire(fireSource);
            }
        }
    }
    
    updateTemperatureField(fireSource) {
        // Update temperature field for realistic fire behavior
        const influenceRadius = fireSource.radius * 3;
        const maxTemp = fireSource.temperature;
        
        // Simple temperature field simulation
        // In a full implementation, this would use a proper heat diffusion model
        for (let dx = -influenceRadius; dx <= influenceRadius; dx += 2) {
            for (let dz = -influenceRadius; dz <= influenceRadius; dz += 2) {
                const distance = Math.sqrt(dx * dx + dz * dz);
                if (distance <= influenceRadius) {
                    const tempIncrease = maxTemp * Math.exp(-distance / influenceRadius);
                    // Update temperature at this location
                    // This could affect fire spread and smoke behavior
                }
            }
        }
    }
    
    calculateSlopeFactor(x, z) {
        // Calculate slope influence on fire spread
        const h1 = this.getTerrainHeight(x, z);
        const h2 = this.getTerrainHeight(x + 1, z);
        const h3 = this.getTerrainHeight(x, z + 1);
        
        const slopeX = h2 - h1;
        const slopeZ = h3 - h1;
        const slope = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);
        
        // Fire spreads faster uphill
        return 1 + slope * 2;
    }
    
    calculateSlopeVector(x, z) {
        // Calculate slope direction for fire spread
        const h1 = this.getTerrainHeight(x, z);
        const h2 = this.getTerrainHeight(x + 1, z);
        const h3 = this.getTerrainHeight(x, z + 1);
        
        const slopeX = h2 - h1;
        const slopeZ = h3 - h1;
        
        return new THREE.Vector3(slopeX, 0, slopeZ).normalize();
    }
    
    updateWindPatterns(deltaTime) {
        // Simulate realistic wind variation
        this.windStrength += (Math.random() - 0.5) * 0.1 * deltaTime;
        this.windStrength = Math.max(0.1, Math.min(2.0, this.windStrength));
        
        // Wind direction variation
        const windAngle = Math.atan2(this.windVector.z, this.windVector.x);
        const newAngle = windAngle + (Math.random() - 0.5) * 0.2 * deltaTime;
        
        this.windVector.x = Math.cos(newAngle);
        this.windVector.z = Math.sin(newAngle);
    }
    
    getTerrainIndex(x, z) {
        // Convert world coordinates to terrain array index
        const gridX = Math.floor((x + 50) * 1.2);
        const gridZ = Math.floor((z + 50) * 1.2);
        
        if (gridX < 0 || gridX >= 120 || gridZ < 0 || gridZ >= 120) return -1;
        
        return gridZ * 120 + gridX;
    }
    
    updateBurnedAreas() {
        // Update visual representation of burned areas
        if (!this.terrain) return;
        
        const colors = this.terrain.geometry.attributes.color.array;
        const vertices = this.terrain.geometry.attributes.position.array;
        
        // Update colors based on fuel consumption
        for (let i = 0; i < vertices.length; i += 3) {
            const index = i / 3;
            const fuelRemaining = this.fuelLoad[index] || 0;
            const originalFuel = this.calculateFuelLoad(
                this.vegetationDensity[index] || 0,
                this.terrainMoisture[index] || 0
            );
            
            if (originalFuel > 0) {
                const burnRatio = 1 - (fuelRemaining / originalFuel);
                
                if (burnRatio > 0.1) {
                    // Area has been burned
                    const burnIntensity = Math.min(1, burnRatio);
                    colors[i] = burnIntensity < 0.8 ? 0.2 : 0.1; // Red component
                    colors[i + 1] = burnIntensity < 0.8 ? 0.1 : 0.05; // Green component
                    colors[i + 2] = burnIntensity < 0.8 ? 0.1 : 0.05; // Blue component
                }
            }
        }
        
        this.terrain.geometry.attributes.color.needsUpdate = true;
    }
    
    updateFireStatistics() {
        // Calculate realistic fire statistics
        let totalBurnedArea = 0;
        let activeFireCount = this.fireSourcesActive.length;
        let perimeterLength = 0;
        
        // Calculate burned area based on fuel consumption
        this.fuelLoad.forEach((fuel, index) => {
            const originalFuel = this.calculateFuelLoad(
                this.vegetationDensity[index] || 0,
                this.terrainMoisture[index] || 0
            );
            
            if (originalFuel > 0 && fuel < originalFuel * 0.9) {
                totalBurnedArea += 0.01; // Each grid cell represents 0.01 hectares
            }
        });
        
        // Estimate fire perimeter
        perimeterLength = Math.sqrt(totalBurnedArea * Math.PI) * 2 * Math.PI;
        
        // Calculate spread rate
        const spreadRate = totalBurnedArea / Math.max(1, this.fireTime);
        
        // Update UI
        document.getElementById('predicted-burn-area').textContent = totalBurnedArea.toFixed(1) + ' ha';
        document.getElementById('villages-at-risk').textContent = this.calculateVillagesAtRisk(Math.sqrt(totalBurnedArea));
        document.getElementById('infrastructure-threatened').textContent = 
            totalBurnedArea > 50 ? 'Roads, Buildings, Infrastructure' : 
            totalBurnedArea > 10 ? 'Local Roads' : 'None';
    }
    
    extinguishFire(fireSource) {
        // Remove fire source and associated effects
        const index = this.fireSourcesActive.indexOf(fireSource);
        if (index > -1) {
            this.fireSourcesActive.splice(index, 1);
        }
        
        // Remove light
        if (fireSource.light) {
            this.scene.remove(fireSource.light);
        }
        
        // Mark area as burned
        this.burnedAreas.push({
            position: fireSource.position.clone(),
            radius: fireSource.radius,
            burnTime: fireSource.age
        });
    }
    
    updateTerrainColors(radius) {
        if (!this.terrain) return;
        
        const geometry = this.terrain.geometry;
        const colors = geometry.attributes.color.array;
        const positions = geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            const distance = Math.sqrt(x * x + z * z);
            
            if (distance < radius) {
                // Burned area - black/gray
                colors[i] = 0.1;
                colors[i + 1] = 0.1;
                colors[i + 2] = 0.1;
            } else if (distance < radius + 5) {
                // Future burn area - red/orange
                colors[i] = 1.0;
                colors[i + 1] = 0.3;
                colors[i + 2] = 0.1;
            }
        }
        
        geometry.attributes.color.needsUpdate = true;
    }
    
    calculateVillagesAtRisk(radius) {
        // Simulate village risk calculation
        const villages = [
            { x: -20, z: -15 },
            { x: 25, z: 10 },
            { x: -10, z: 30 }
        ];
        
        let atRisk = 0;
        villages.forEach(village => {
            const distance = Math.sqrt(village.x * village.x + village.z * village.z);
            if (distance < radius + 10) { // 10 unit safety buffer
                atRisk++;
            }
        });
        
        return atRisk;
    }
    
    toggleWhyView() {
        this.whyViewActive = !this.whyViewActive;
        const button = document.getElementById('toggle-why-view');
        
        if (this.whyViewActive) {
            button.classList.add('active');
            button.innerHTML = '<i class="fas fa-lightbulb"></i> Hide Why View';
            this.showExplanationLabels();
            showToast('Why View activated - showing factor influences', 'info');
        } else {
            button.classList.remove('active');
            button.innerHTML = '<i class="fas fa-lightbulb"></i> Show Why View';
            this.hideExplanationLabels();
        }
    }
    
    showExplanationLabels() {
        // Create floating labels for different factors
        const factors = [
            { text: '🔥 Wind', position: new THREE.Vector3(-20, 15, -10), color: 0x60A5FA },
            { text: '🌱 Dryness', position: new THREE.Vector3(15, 12, 20), color: 0x22C55E },
            { text: '⛰️ Slope', position: new THREE.Vector3(0, 20, 0), color: 0x92400E }
        ];
        
        factors.forEach(factor => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;
            
            context.fillStyle = `#${factor.color.toString(16).padStart(6, '0')}`;
            context.font = 'Bold 24px Arial';
            context.textAlign = 'center';
            context.fillText(factor.text, 128, 40);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            sprite.position.copy(factor.position);
            sprite.scale.set(10, 2.5, 1);
            
            this.scene.add(sprite);
            this.explanationLabels.push(sprite);
        });
    }
    
    hideExplanationLabels() {
        this.explanationLabels.forEach(label => {
            this.scene.remove(label);
        });
        this.explanationLabels = [];
    }
    
    autoRotate() {
        // Auto-rotate the camera around the terrain
        const duration = 5000; // 5 seconds
        const startTime = Date.now();
        const startPosition = this.camera.position.clone();
        
        const rotate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const angle = progress * Math.PI * 2;
            const radius = startPosition.length();
            
            this.camera.position.set(
                Math.cos(angle) * radius,
                startPosition.y,
                Math.sin(angle) * radius
            );
            this.camera.lookAt(0, 0, 0);
            
            if (progress < 1) {
                requestAnimationFrame(rotate);
            }
        };
        
        rotate();
    }
    
    fitView() {
        // Reset camera to default position
        this.camera.position.set(0, 30, 50);
        this.camera.lookAt(0, 0, 0);
        showToast('View reset to default position', 'info');
    }
    
    toggleWireframe() {
        if (this.terrain) {
            this.terrain.material.wireframe = !this.terrain.material.wireframe;
            showToast(`Wireframe ${this.terrain.material.wireframe ? 'enabled' : 'disabled'}`, 'info');
        }
    }
    
    setFireTime(hours) {
        this.fireTime = hours;
        this.updateFireSpread();
    }
    
    updateFireIntensity(intensity) {
        // Update fire particle intensity
        this.fireParticles.forEach(particles => {
            particles.material.opacity = 0.3 + intensity * 0.7;
        });
        
        if (this.fireLight) {
            this.fireLight.intensity = intensity * 3;
        }
    }
    
    updateSimulationSpeed(speed) {
        // Simulation speed affects how fast time progresses
        this.simulationSpeed = speed;
    }
    
    onWindowResize() {
        const canvas = document.getElementById('firevision-canvas');
        if (!canvas || !this.camera || !this.renderer) return;
        
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // Update fire particles
        this.updateFireParticles(deltaTime);
        
        // Update fire time if playing
        if (this.isPlaying) {
            this.fireTime += deltaTime * (this.simulationSpeed || 1) * 0.5; // 0.5 hours per second at 1x speed
            
            // Update time slider
            const timeSlider = document.getElementById('time-slider-3d');
            if (timeSlider) {
                timeSlider.value = Math.min(this.fireTime, 24);
                document.getElementById('time-value-3d').textContent = Math.floor(this.fireTime) + 'h';
            }
            
            this.updateFireSpread();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateFireParticles(deltaTime) {
        // Update flame particles with realistic physics
        this.fireParticles.forEach(particles => {
            const userData = particles.userData;
            if (!userData || !userData.fireSource) return;
            
            const geometry = particles.geometry;
            const positions = geometry.attributes.position.array;
            const velocities = geometry.attributes.velocity ? geometry.attributes.velocity.array : null;
            const ages = geometry.attributes.age ? geometry.attributes.age.array : null;
            const colors = geometry.attributes.color ? geometry.attributes.color.array : null;
            
            const fireSource = userData.fireSource;
            const particleCount = positions.length / 3;
            
            for (let i = 0; i < particleCount; i++) {
                const idx = i * 3;
                
                if (velocities && ages) {
                    // Age the particle
                    ages[i] += deltaTime;
                    
                    // Reset particles that are too old
                    if (ages[i] > (userData.type === 'flames' ? 2 : userData.type === 'smoke' ? 8 : 5)) {
                        this.resetParticle(i, positions, velocities, ages, colors, fireSource, userData.type);
                        continue;
                    }
                    
                    // Apply physics
                    if (userData.type === 'flames') {
                        this.updateFlameParticle(i, positions, velocities, ages, colors, fireSource, deltaTime);
                    } else if (userData.type === 'smoke') {
                        this.updateSmokeParticle(i, positions, velocities, ages, fireSource, deltaTime);
                    } else if (userData.type === 'embers') {
                        this.updateEmberParticle(i, positions, velocities, ages, colors, fireSource, deltaTime);
                    }
                } else {
                    // Fallback for simple particles
                    positions[idx + 1] += deltaTime * 10;
                    if (positions[idx + 1] > 50) {
                        positions[idx + 1] = fireSource.position.y;
                    }
                }
            }
            
            geometry.attributes.position.needsUpdate = true;
            if (velocities) geometry.attributes.velocity.needsUpdate = true;
            if (ages) geometry.attributes.age.needsUpdate = true;
            if (colors) geometry.attributes.color.needsUpdate = true;
        });
        
        // Update smoke systems
        this.smokeSystems.forEach(smoke => this.updateSmokeSystem(smoke, deltaTime));
        
        // Update ember systems
        this.emberSystems.forEach(embers => this.updateEmberSystem(embers, deltaTime));
    }
    
    updateFlameParticle(index, positions, velocities, ages, colors, fireSource, deltaTime) {
        const idx = index * 3;
        const age = ages[index];
        
        // Apply buoyancy (thermal updraft)
        const buoyancy = this.BUOYANCY * (2.0 - age) * fireSource.intensity;
        velocities[idx + 1] += buoyancy * deltaTime;
        
        // Apply wind influence
        velocities[idx] += this.windVector.x * this.windStrength * deltaTime * 2;
        velocities[idx + 2] += this.windVector.z * this.windStrength * deltaTime * 2;
        
        // Apply turbulence
        const turbulence = 3.0;
        velocities[idx] += (Math.random() - 0.5) * turbulence * deltaTime;
        velocities[idx + 1] += (Math.random() - 0.5) * turbulence * deltaTime * 0.5;
        velocities[idx + 2] += (Math.random() - 0.5) * turbulence * deltaTime;
        
        // Apply drag
        const drag = 0.98;
        velocities[idx] *= drag;
        velocities[idx + 1] *= drag;
        velocities[idx + 2] *= drag;
        
        // Update position
        positions[idx] += velocities[idx] * deltaTime;
        positions[idx + 1] += velocities[idx + 1] * deltaTime;
        positions[idx + 2] += velocities[idx + 2] * deltaTime;
        
        // Update color based on age and temperature
        if (colors) {
            const ageFactor = 1.0 - (age / 2.0);
            const temp = fireSource.temperature * ageFactor;
            const color = this.temperatureToColor(temp);
            
            colors[idx] = color.r;
            colors[idx + 1] = color.g;
            colors[idx + 2] = color.b;
        }
    }
    
    updateSmokeParticle(index, positions, velocities, ages, fireSource, deltaTime) {
        const idx = index * 3;
        const age = ages[index];
        
        // Smoke rises more slowly and is more affected by wind
        const thermalLift = this.THERMAL_RISE * 0.3 * (8.0 - age) / 8.0;
        velocities[idx + 1] += thermalLift * deltaTime;
        
        // Strong wind influence on smoke
        velocities[idx] += this.windVector.x * this.windStrength * deltaTime * 3;
        velocities[idx + 2] += this.windVector.z * this.windStrength * deltaTime * 3;
        
        // Smoke turbulence and expansion
        const expansion = age * 0.5;
        velocities[idx] += (Math.random() - 0.5) * expansion * deltaTime;
        velocities[idx + 2] += (Math.random() - 0.5) * expansion * deltaTime;
        
        // Air resistance
        const drag = 0.95;
        velocities[idx] *= drag;
        velocities[idx + 1] *= drag;
        velocities[idx + 2] *= drag;
        
        // Update position
        positions[idx] += velocities[idx] * deltaTime;
        positions[idx + 1] += velocities[idx + 1] * deltaTime;
        positions[idx + 2] += velocities[idx + 2] * deltaTime;
    }
    
    updateEmberParticle(index, positions, velocities, ages, colors, fireSource, deltaTime) {
        const idx = index * 3;
        const age = ages[index];
        
        // Embers affected by gravity and wind
        velocities[idx + 1] += this.GRAVITY * deltaTime;
        
        // Wind carries embers
        velocities[idx] += this.windVector.x * this.windStrength * deltaTime * 4;
        velocities[idx + 2] += this.windVector.z * this.windStrength * deltaTime * 4;
        
        // Air resistance
        const drag = 0.99;
        velocities[idx] *= drag;
        velocities[idx + 1] *= drag;
        velocities[idx + 2] *= drag;
        
        // Update position
        positions[idx] += velocities[idx] * deltaTime;
        positions[idx + 1] += velocities[idx + 1] * deltaTime;
        positions[idx + 2] += velocities[idx + 2] * deltaTime;
        
        // Ember color fades with age
        if (colors) {
            const intensity = Math.max(0, 1.0 - age / 5.0);
            const emberColor = this.temperatureToColor(600 * intensity);
            
            colors[idx] = emberColor.r;
            colors[idx + 1] = emberColor.g;
            colors[idx + 2] = emberColor.b;
        }
        
        // Check for ember landing and potential new fire ignition
        if (positions[idx + 1] <= this.getTerrainHeight(positions[idx], positions[idx + 2]) + 1) {
            const emberPos = new THREE.Vector3(positions[idx], 0, positions[idx + 2]);
            const nearbyFire = this.fireSourcesActive.find(fire => 
                fire.position.distanceTo(emberPos) < 8
            );
            
            if (!nearbyFire && Math.random() < 0.05) {
                // Potential spot fire ignition
                const terrainIndex = this.getTerrainIndex(positions[idx], positions[idx + 2]);
                if (terrainIndex >= 0 && this.fuelLoad[terrainIndex] > 0.3) {
                    this.createFireSource(positions[idx], positions[idx + 2]);
                }
            }
            
            // Reset ember
            this.resetParticle(index, positions, velocities, ages, colors, fireSource, 'embers');
        }
    }
    
    resetParticle(index, positions, velocities, ages, colors, fireSource, type) {
        const idx = index * 3;
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * fireSource.radius;
        
        // Reset position near fire source
        positions[idx] = fireSource.position.x + Math.cos(angle) * radius;
        positions[idx + 1] = fireSource.position.y + Math.random() * 2;
        positions[idx + 2] = fireSource.position.z + Math.sin(angle) * radius;
        
        // Reset age
        ages[index] = Math.random() * 0.5;
        
        // Reset velocity based on particle type
        if (type === 'flames') {
            velocities[idx] = this.windVector.x * this.windStrength + (Math.random() - 0.5) * 2;
            velocities[idx + 1] = this.THERMAL_RISE + Math.random() * 5;
            velocities[idx + 2] = this.windVector.z * this.windStrength + (Math.random() - 0.5) * 2;
        } else if (type === 'smoke') {
            velocities[idx] = this.windVector.x * this.windStrength * 2 + (Math.random() - 0.5);
            velocities[idx + 1] = this.THERMAL_RISE * 0.3 + Math.random() * 2;
            velocities[idx + 2] = this.windVector.z * this.windStrength * 2 + (Math.random() - 0.5);
        } else if (type === 'embers') {
            const emberSpeed = 5 + Math.random() * 10;
            velocities[idx] = this.windVector.x * emberSpeed + (Math.random() - 0.5) * 3;
            velocities[idx + 1] = this.THERMAL_RISE * 0.5 + Math.random() * 8;
            velocities[idx + 2] = this.windVector.z * emberSpeed + (Math.random() - 0.5) * 3;
        }
        
        // Reset color
        if (colors && type === 'flames') {
            const temp = 500 + Math.random() * 600;
            const color = this.temperatureToColor(temp);
            colors[idx] = color.r;
            colors[idx + 1] = color.g;
            colors[idx + 2] = color.b;
        }
    }
    
    updateSmokeSystem(smoke, deltaTime) {
        // Additional smoke system updates
        if (smoke.material.opacity > 0.1) {
            smoke.material.opacity *= 0.995; // Gradual fade
        }
    }
    
    updateEmberSystem(embers, deltaTime) {
        // Additional ember system updates
        if (embers.material.opacity > 0.1) {
            embers.material.opacity *= 0.998; // Gradual fade
        }
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.scene) {
            this.scene.clear();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// FireVision API Integration
class FireVisionAPI {
    constructor() {
        this.baseURL = window.location.origin.replace(':5000', ':5001');
    }
    
    async simulate3D(lat, lng, duration = 6) {
        try {
            const envData = getCurrentEnvironmentalData();
            const response = await fetch(`${this.baseURL}/api/ml/simulate3D`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat, lng, duration,
                    ...envData
                })
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('FireVision API not available, using simulated data');
            return this.generateSimulatedData(lat, lng, duration);
        }
    }
    
    async getImpactData(burnedArea) {
        try {
            const response = await fetch(`${this.baseURL}/api/ml/impact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ burned_area_hectares: burnedArea })
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Impact API not available');
            return this.generateSimulatedImpact(burnedArea);
        }
    }
    
    async getExplanation3D(fireData) {
        try {
            const response = await fetch(`${this.baseURL}/api/ml/explain3D`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fireData)
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Explanation API not available');
            return this.generateSimulatedExplanation();
        }
    }
    
    generateSimulatedData(lat, lng, duration) {
        return {
            success: true,
            fire_progression: Array.from({length: duration}, (_, i) => ({
                hour: i,
                burned_area_hectares: Math.pow(i + 1, 1.5) * 2,
                fire_perimeter_km: Math.sqrt((i + 1) * 10),
                spread_rate: (i + 1) * 0.8,
                coordinates: { lat: lat + (Math.random() - 0.5) * 0.01, lng: lng + (Math.random() - 0.5) * 0.01 }
            }))
        };
    }
    
    generateSimulatedImpact(burnedArea) {
        return {
            success: true,
            villages_affected: Math.floor(burnedArea / 50),
            infrastructure_impact: burnedArea > 100 ? 'High' : 'Moderate',
            evacuation_routes: [
                { path: 'Route A', status: 'Clear', length_km: 15 },
                { path: 'Route B', status: 'Blocked', length_km: 12 }
            ]
        };
    }
    
    generateSimulatedExplanation() {
        return {
            success: true,
            factor_weights: {
                wind: Math.random() * 0.4 + 0.3,
                dryness: Math.random() * 0.3 + 0.4,
                slope: Math.random() * 0.2 + 0.2,
                temperature: Math.random() * 0.3 + 0.2
            }
        };
    }
}

// Global FireVision instances
let fireVision3D = null;
let fireVisionAPI = null;

// FireVision utility functions
function closeFireInfoPopup() {
    const popup = document.getElementById('fire-info-popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

function startARSession() {
    if (fireVision3D && fireVision3D.isARMode) {
        showToast('Starting AR session...', 'processing', 2000);
        
        // Simulate AR session start
        setTimeout(() => {
            showToast('AR session active! Point camera at surface and tap to place fire model', 'success', 5000);
            document.getElementById('ar-instructions').style.display = 'none';
        }, 2000);
    }
}

function captureScreenshot() {
    if (fireVision3D && fireVision3D.renderer) {
        const canvas = fireVision3D.renderer.domElement;
        const link = document.createElement('a');
        link.download = `firevision-screenshot-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        showToast('Screenshot captured successfully!', 'success');
    }
}

function recordSession() {
    showToast('Recording feature coming soon!', 'info');
}

function shareVisualization() {
    if (navigator.share) {
        navigator.share({
            title: 'FireVision 3D Visualization',
            text: 'Check out this 3D fire simulation from NeuroNix',
            url: window.location.href
        });
    } else {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
        showToast('Visualization URL copied to clipboard!', 'success');
    }
}

// Initialize FireVision when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize FireVision 3D after a delay to ensure Three.js is loaded
    setTimeout(() => {
        if (typeof THREE !== 'undefined') {
            fireVision3D = new FireVision3D();
            fireVisionAPI = new FireVisionAPI();
            console.log('FireVision 3D/AR system ready');
        } else {
            console.warn('Three.js not loaded, FireVision 3D disabled');
        }
    }, 1000);
});

// Safe Evacuation Route Mapping Functions
let evacuationMap;
let currentRoutes = [];
let safeZoneMarkers = [];
let fireRiskOverlay = null;
let userLocation = null;
let isWhatIfModeActive = false;

function initializeEvacuationRoutes() {
    // Initialize evacuation map
    const evacuationMapElement = document.getElementById('evacuation-map');
    if (evacuationMapElement) {
        evacuationMap = L.map('evacuation-map').setView([30.0668, 79.0193], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(evacuationMap);

        // Add initial fire risk overlay
        addFireRiskOverlay();
        
        // Add safe zones
        addSafeZones();

        // Setup event listeners
        setupEvacuationEventListeners();

        showToast('Evacuation route system initialized', 'success');
    }
}

function addFireRiskOverlay() {
    if (!evacuationMap) return;

    // Create fire risk zones (simulated data)
    const riskZones = [
        {
            coords: [[29.8, 79.2], [30.2, 79.2], [30.2, 79.8], [29.8, 79.8]],
            risk: 'extreme',
            color: '#DC2626',
            opacity: 0.6
        },
        {
            coords: [[29.5, 79.5], [29.8, 79.5], [29.8, 80.0], [29.5, 80.0]],
            risk: 'high',
            color: '#F59E0B',
            opacity: 0.5
        },
        {
            coords: [[30.2, 78.0], [30.5, 78.0], [30.5, 78.5], [30.2, 78.5]],
            risk: 'moderate',
            color: '#EAB308',
            opacity: 0.4
        }
    ];

    riskZones.forEach(zone => {
        const polygon = L.polygon(zone.coords, {
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: zone.opacity,
            weight: 2,
            className: `fire-risk-${zone.risk}`
        }).addTo(evacuationMap);

        polygon.bindPopup(`
            <div class="risk-popup">
                <h4>Fire Risk: ${zone.risk.toUpperCase()}</h4>
                <p>Avoid this area during evacuation</p>
            </div>
        `);
    });
}

function addSafeZones() {
    if (!evacuationMap) return;

    const safeZones = [
        {
            name: 'District Hospital',
            coords: [30.1, 79.4],
            type: 'hospital',
            capacity: 500,
            status: 'available',
            icon: 'fas fa-hospital'
        },
        {
            name: 'Community Center',
            coords: [30.0, 79.3],
            type: 'shelter',
            capacity: 200,
            status: 'available',
            icon: 'fas fa-home'
        },
        {
            name: 'Government School',
            coords: [29.9, 79.2],
            type: 'school',
            capacity: 300,
            status: 'full',
            icon: 'fas fa-school'
        },
        {
            name: 'Sports Complex',
            coords: [30.2, 79.5],
            type: 'shelter',
            capacity: 400,
            status: 'available',
            icon: 'fas fa-building'
        }
    ];

    safeZones.forEach(zone => {
        const iconColor = zone.status === 'available' ? '#10B981' : '#F59E0B';
        
        const marker = L.marker(zone.coords, {
            icon: L.divIcon({
                className: 'safe-zone-marker',
                html: `
                    <div class="safe-zone-icon ${zone.type}" style="background: ${iconColor};">
                        <i class="${zone.icon}"></i>
                    </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            })
        }).addTo(evacuationMap);

        marker.bindPopup(`
            <div class="safe-zone-popup">
                <h4>${zone.name}</h4>
                <p><strong>Type:</strong> ${zone.type.charAt(0).toUpperCase() + zone.type.slice(1)}</p>
                <p><strong>Capacity:</strong> ${zone.capacity} people</p>
                <p><strong>Status:</strong> ${zone.status}</p>
                ${zone.status === 'available' ? 
                    '<button onclick="navigateToSafeZone(\'' + zone.name + '\')" class="navigate-btn">Navigate Here</button>' :
                    '<span class="full-indicator">Currently Full</span>'
                }
            </div>
        `);

        safeZoneMarkers.push(marker);
    });
}

function setupEvacuationEventListeners() {
    // Find My Route button
    const findRouteBtn = document.getElementById('find-my-route');
    if (findRouteBtn) {
        findRouteBtn.addEventListener('click', findMyRoute);
    }

    // What-If Mode button
    const whatIfBtn = document.getElementById('what-if-mode');
    if (whatIfBtn) {
        whatIfBtn.addEventListener('click', openWhatIfModal);
    }

    // Download Plan button
    const downloadBtn = document.getElementById('download-plan');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadEvacuationPlan);
    }

    // Alternative Routes button
    const altRoutesBtn = document.getElementById('alternative-routes');
    if (altRoutesBtn) {
        altRoutesBtn.addEventListener('click', showAlternativeRoutes);
    }

    // Start Navigation button
    const startNavBtn = document.getElementById('start-navigation');
    if (startNavBtn) {
        startNavBtn.addEventListener('click', startNavigation);
    }

    // AI Chat functionality
    const sendBtn = document.getElementById('send-message');
    const chatInput = document.getElementById('ai-chat-input');
    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', sendAIMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendAIMessage();
            }
        });
    }

    // Overlay toggles
    const overlayToggles = ['show-fire-overlay', 'show-safe-zones', 'show-alternative-routes'];
    overlayToggles.forEach(id => {
        const toggle = document.getElementById(id);
        if (toggle) {
            toggle.addEventListener('change', updateMapOverlays);
        }
    });

    // Map click for setting custom location
    if (evacuationMap) {
        evacuationMap.on('click', function(e) {
            setUserLocation(e.latlng);
        });
    }
}

function findMyRoute() {
    showToast('Finding safest evacuation route...', 'processing', 3000);
    
    // Simulate getting user location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userCoords = [position.coords.latitude, position.coords.longitude];
                calculateEvacuationRoute(userCoords);
            },
            () => {
                // Fallback to center of map if geolocation fails
                const center = evacuationMap.getCenter();
                calculateEvacuationRoute([center.lat, center.lng]);
            }
        );
    } else {
        const center = evacuationMap.getCenter();
        calculateEvacuationRoute([center.lat, center.lng]);
    }
}

function calculateEvacuationRoute(startCoords) {
    if (!evacuationMap) return;

    // Clear existing routes
    clearCurrentRoutes();

    // Find nearest safe zone
    const nearestSafeZone = findNearestSafeZone(startCoords);
    
    if (nearestSafeZone) {
        // Create route visualization
        const route = createRouteVisualization(startCoords, nearestSafeZone);
        currentRoutes.push(route);

        // Update sidebar information
        updateRouteInformation(nearestSafeZone, route);
        
        // Set map view to show route
        const routeBounds = L.latLngBounds([startCoords, nearestSafeZone.coords]);
        evacuationMap.fitBounds(routeBounds, { padding: [50, 50] });

        showToast('Safe evacuation route calculated', 'success');
        
        // Simulate route monitoring
        startRouteMonitoring();
    }
}

function findNearestSafeZone(userCoords) {
    const safeZones = [
        { name: 'District Hospital', coords: [30.1, 79.4], distance: 2.1, eta: 7, type: 'hospital' },
        { name: 'Community Center', coords: [30.0, 79.3], distance: 2.3, eta: 8, type: 'shelter' },
        { name: 'Sports Complex', coords: [30.2, 79.5], distance: 3.1, eta: 12, type: 'shelter' }
    ];

    // Calculate distances and return nearest available zone
    return safeZones.reduce((nearest, zone) => {
        if (!nearest || zone.distance < nearest.distance) {
            return zone;
        }
        return nearest;
    });
}

function createRouteVisualization(start, destination) {
    if (!evacuationMap) return null;

    // Create intermediate points for more realistic route
    const waypoints = generateRouteWaypoints(start, destination.coords);
    
    // Create animated route line
    const routeLine = L.polyline(waypoints, {
        color: '#10B981',
        weight: 6,
        opacity: 0.8,
        className: 'evacuation-route-line'
    }).addTo(evacuationMap);

    // Add pulsing effect to route
    setTimeout(() => {
        routeLine.setStyle({
            className: 'evacuation-route-line pulsing'
        });
    }, 100);

    // Add start marker
    const startMarker = L.marker(start, {
        icon: L.divIcon({
            className: 'route-marker start-marker',
            html: '<i class="fas fa-map-marker-alt"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        })
    }).addTo(evacuationMap);

    // Add destination marker
    const destMarker = L.marker(destination.coords, {
        icon: L.divIcon({
            className: 'route-marker dest-marker',
            html: '<i class="fas fa-flag-checkered"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        })
    }).addTo(evacuationMap);

    return {
        line: routeLine,
        startMarker: startMarker,
        destMarker: destMarker,
        waypoints: waypoints,
        destination: destination
    };
}

function generateRouteWaypoints(start, end) {
    // Generate realistic waypoints between start and end
    const waypoints = [start];
    
    // Add intermediate points
    const latDiff = end[0] - start[0];
    const lngDiff = end[1] - start[1];
    
    for (let i = 1; i < 4; i++) {
        const progress = i / 4;
        const waypoint = [
            start[0] + latDiff * progress + (Math.random() - 0.5) * 0.01,
            start[1] + lngDiff * progress + (Math.random() - 0.5) * 0.01
        ];
        waypoints.push(waypoint);
    }
    
    waypoints.push(end);
    return waypoints;
}

function updateRouteInformation(safeZone, route) {
    // Update ETA and distance
    updateElementText('safe-zone-distance', safeZone.distance + ' km');
    updateElementText('evacuation-eta', safeZone.eta + ' mins');

    // Update route safety status
    const safetyBadge = document.getElementById('route-safety');
    if (safetyBadge) {
        safetyBadge.className = 'route-safety-badge safe';
        safetyBadge.innerHTML = '<i class="fas fa-check"></i> Safe';
    }

    // Update route steps (simulated)
    updateRouteSteps(safeZone);
}

function updateRouteSteps(destination) {
    const routeSteps = [
        { instruction: 'Head north on Main Road', distance: '0.8 km' },
        { instruction: 'Turn right onto Highway 109', distance: '1.2 km' },
        { instruction: `Arrive at ${destination.name}`, distance: '0.3 km' }
    ];

    // This would update the route steps in the sidebar
    console.log('Route steps updated:', routeSteps);
}

function clearCurrentRoutes() {
    if (!evacuationMap) return;

    currentRoutes.forEach(route => {
        if (route.line) evacuationMap.removeLayer(route.line);
        if (route.startMarker) evacuationMap.removeLayer(route.startMarker);
        if (route.destMarker) evacuationMap.removeLayer(route.destMarker);
    });

    currentRoutes = [];
}

function startRouteMonitoring() {
    // Simulate route monitoring with periodic updates
    const monitoringInterval = setInterval(() => {
        if (Math.random() < 0.1) { // 10% chance of route update
            const alerts = [
                'Route conditions optimal - continue on current path',
                'Minor traffic detected - ETA updated',
                'Weather conditions favorable for evacuation'
            ];
            
            const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
            showRouteAlert(randomAlert, 'info');
        }
    }, 15000);

    // Stop monitoring after 5 minutes
    setTimeout(() => {
        clearInterval(monitoringInterval);
    }, 300000);
}

function showRouteAlert(message, type = 'info') {
    const alertBanner = document.getElementById('route-alert-banner');
    const alertMessage = document.getElementById('alert-message');
    
    if (alertBanner && alertMessage) {
        alertMessage.textContent = message;
        alertBanner.style.display = 'flex';
        alertBanner.className = `alert-banner ${type}`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertBanner.style.display = 'none';
        }, 5000);
    }
}

function closeAlertBanner() {
    const alertBanner = document.getElementById('route-alert-banner');
    if (alertBanner) {
        alertBanner.style.display = 'none';
    }
}

function setUserLocation(latlng) {
    userLocation = latlng;
    
    // Add user location marker
    if (evacuationMap) {
        // Remove existing user marker
        evacuationMap.eachLayer(layer => {
            if (layer.options && layer.options.className === 'user-location-marker') {
                evacuationMap.removeLayer(layer);
            }
        });

        // Add new user marker
        L.marker([latlng.lat, latlng.lng], {
            icon: L.divIcon({
                className: 'user-location-marker',
                html: '<i class="fas fa-user-circle"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(evacuationMap);

        showToast('Location set - calculating evacuation route', 'processing');
        calculateEvacuationRoute([latlng.lat, latlng.lng]);
    }
}

function showAlternativeRoutes() {
    showToast('Calculating alternative routes...', 'processing', 2000);
    
    setTimeout(() => {
        // Simulate showing alternative routes
        showToast('3 alternative routes found', 'success');
        
        // Update route safety to show options
        const safetyBadge = document.getElementById('route-safety');
        if (safetyBadge) {
            safetyBadge.className = 'route-safety-badge warning';
            safetyBadge.innerHTML = '<i class="fas fa-route"></i> 3 Options';
        }
    }, 2000);
}

function startNavigation() {
    showToast('Navigation started - follow the highlighted route', 'success');
    
    // Update status
    const statusElement = document.getElementById('evacuation-status');
    if (statusElement) {
        statusElement.textContent = 'Navigating';
    }
    
    // Simulate navigation updates
    let step = 0;
    const navigationUpdates = setInterval(() => {
        step++;
        if (step > 3) {
            clearInterval(navigationUpdates);
            showToast('You have arrived at your destination safely!', 'success');
            return;
        }
        
        showToast(`Navigation: Step ${step} of 3 completed`, 'info');
    }, 5000);
}

function navigateToSafeZone(zoneName) {
    showToast(`Navigating to ${zoneName}...`, 'processing');
    
    // This would trigger route calculation to specific safe zone
    setTimeout(() => {
        showToast(`Route to ${zoneName} calculated`, 'success');
    }, 1500);
}

function updateMapOverlays() {
    const showFireOverlay = document.getElementById('show-fire-overlay')?.checked;
    const showSafeZones = document.getElementById('show-safe-zones')?.checked;
    const showAltRoutes = document.getElementById('show-alternative-routes')?.checked;

    // Update overlay visibility based on toggles
    if (evacuationMap) {
        evacuationMap.eachLayer(layer => {
            if (layer.options && layer.options.className) {
                if (layer.options.className.includes('fire-risk') && !showFireOverlay) {
                    layer.setStyle({ fillOpacity: 0, opacity: 0 });
                } else if (layer.options.className.includes('fire-risk') && showFireOverlay) {
                    layer.setStyle({ fillOpacity: 0.5, opacity: 1 });
                }
            }
        });

        safeZoneMarkers.forEach(marker => {
            if (showSafeZones) {
                marker.addTo(evacuationMap);
            } else {
                evacuationMap.removeLayer(marker);
            }
        });
    }
}

function openWhatIfModal() {
    const modal = document.getElementById('what-if-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        isWhatIfModeActive = true;
    }
}

function closeWhatIfModal() {
    const modal = document.getElementById('what-if-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        isWhatIfModeActive = false;
    }
}

function resetSimulation() {
    // Reset all simulation parameters to defaults
    document.getElementById('fire-intensity-slider').value = 50;
    document.getElementById('wind-speed-slider').value = 15;
    document.getElementById('wind-direction-select').value = 'NE';
    
    // Reset blocked roads
    const roadCheckboxes = ['block-highway-109', 'block-main-road', 'block-forest-road'];
    roadCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) checkbox.checked = false;
    });

    // Update display values
    document.getElementById('fire-intensity-value').textContent = '50%';
    document.getElementById('wind-speed-value').textContent = '15 km/h';

    showToast('Simulation parameters reset', 'success');
}

function runSimulation() {
    const fireIntensity = document.getElementById('fire-intensity-slider').value;
    const windSpeed = document.getElementById('wind-speed-slider').value;
    const windDirection = document.getElementById('wind-direction-select').value;
    
    showToast('Running fire simulation with new parameters...', 'processing', 3000);
    
    setTimeout(() => {
        // Simulate updated evacuation routes based on new parameters
        showToast('Simulation complete - evacuation routes updated', 'success');
        closeWhatIfModal();
        
        // Update route safety based on simulation results
        const safetyBadge = document.getElementById('route-safety');
        if (safetyBadge && fireIntensity > 70) {
            safetyBadge.className = 'route-safety-badge danger';
            safetyBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Rerouting';
            showRouteAlert('Primary route blocked - calculating alternative path', 'warning');
        }
    }, 3000);
}

function downloadEvacuationPlan() {
    showToast('Generating evacuation plan PDF...', 'processing', 2000);
    
    setTimeout(() => {
        // Simulate PDF generation
        const link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,Emergency Evacuation Plan\n\nGenerated: ' + new Date().toLocaleString() + '\n\nRoute: Main Road → Highway 109 → Community Center\nDistance: 2.3 km\nEstimated Time: 8 minutes\n\nSafe Zone: Community Center\nCapacity: 200 people\nStatus: Available\n\nEmergency Contacts:\nFire Department: 101\nPolice: 100\nAmbulance: 108';
        link.download = 'evacuation-plan-' + new Date().toISOString().split('T')[0] + '.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Evacuation plan downloaded successfully!', 'success');
    }, 2000);
}

function sendAIMessage() {
    const input = document.getElementById('ai-chat-input');
    const messagesContainer = document.getElementById('ai-chat-messages');
    
    if (!input || !messagesContainer || !input.value.trim()) return;

    const userMessage = input.value.trim();
    input.value = '';

    // Add user message
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'user-message';
    userMessageDiv.innerHTML = `
        <div class="message-content user-message-content">
            <p>${userMessage}</p>
            <span class="message-time">Just now</span>
        </div>
        <div class="message-avatar user-avatar">
            <i class="fas fa-user"></i>
        </div>
    `;
    messagesContainer.appendChild(userMessageDiv);

    // Simulate AI response
    setTimeout(() => {
        const responses = [
            "I can help you find the safest evacuation route. Based on current fire conditions, I recommend heading to the Community Center via Highway 109.",
            "The current fire intensity is moderate. Your safest option is to evacuate immediately using the highlighted route on the map.",
            "I've updated your evacuation route to avoid the fire-affected area. The new route will take approximately 8 minutes.",
            "All safe zones are currently accessible. The District Hospital has the highest capacity if you need medical assistance.",
            "Weather conditions are favorable for evacuation. Wind speed is moderate and visibility is good."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.className = 'ai-message';
        aiMessageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>${randomResponse}</p>
                <span class="message-time">Just now</span>
            </div>
        `;
        messagesContainer.appendChild(aiMessageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 1500);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Tutorial System Functions
let currentTutorialStep = 1;
const maxTutorialSteps = 4;

function setupTutorial() {
    const showTutorialBtn = document.getElementById('show-tutorial');
    if (showTutorialBtn) {
        showTutorialBtn.addEventListener('click', showTutorial);
    }
}

function showTutorial() {
    const modal = document.getElementById('tutorial-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        currentTutorialStep = 1;
        updateTutorialStep();
        updateTutorialButtons();
    }
}

function closeTutorial() {
    const modal = document.getElementById('tutorial-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        // Mark tutorial as seen
        localStorage.setItem('trainingTutorialSeen', 'true');
    }
}

function nextTutorialStep() {
    if (currentTutorialStep < maxTutorialSteps) {
        currentTutorialStep++;
        updateTutorialStep();
        updateTutorialButtons();
    } else {
        closeTutorial();
    }
}

function prevTutorialStep() {
    if (currentTutorialStep > 1) {
        currentTutorialStep--;
        updateTutorialStep();
        updateTutorialButtons();
    }
}

function updateTutorialStep() {
    // Hide all steps
    const steps = document.querySelectorAll('.tutorial-step');
    steps.forEach(step => step.classList.remove('active'));
    
    // Show current step
    const currentStep = document.querySelector(`.tutorial-step[data-step="${currentTutorialStep}"]`);
    if (currentStep) {
        currentStep.classList.add('active');
    }
    
    // Update dots
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        if (index + 1 === currentTutorialStep) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function updateTutorialButtons() {
    const prevBtn = document.getElementById('prev-tutorial');
    const nextBtn = document.getElementById('next-tutorial');
    
    if (prevBtn) {
        prevBtn.disabled = currentTutorialStep === 1;
    }
    
    if (nextBtn) {
        if (currentTutorialStep === maxTutorialSteps) {
            nextBtn.innerHTML = '<i class="fas fa-check"></i> Start Playing!';
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
        }
    }
}

// Initialize evacuation routes when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add to existing initialization
    if (typeof initializeEvacuationRoutes === 'function') {
        setTimeout(initializeEvacuationRoutes, 1000);
    }
});

// Scroll to section function
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        showToast(`Navigating to ${sectionId.replace('-', ' ')} section`, 'processing', 1500);
    }
}

// Download report function
function downloadReport() {
    showToast('Generating daily risk report...', 'processing', 2000);

    setTimeout(() => {
        showToast('Daily risk report downloaded successfully!', 'success');

        const link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,NeuroNix Daily Fire Risk Report\n\nGenerated: ' + new Date().toLocaleString() + '\n\nOverall Risk Level: High\nTotal Monitored Area: 53,483 km²\nActive Sensors: 247\nPrediction Accuracy: 97.2%';
        link.download = 'neuronix-daily-report-' + new Date().toISOString().split('T')[0] + '.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, 2000);
}

// Community & Volunteer Engagement Module Functions
let currentTrainingMode = 'training';
let selectedTool = 'fireline';
let trainingScore = 2450;
let trainingTimer = 300; // 5 minutes
let trainingInterval = null;
let isTrainingActive = false;
let currentQuizQuestion = 1;
let totalQuizQuestions = 10;
let quizScore = 0;

// Quiz questions data
const quizQuestions = [
    {
        question: "What is the most effective way to create a firebreak?",
        options: [
            "Cut vegetation in a straight line",
            "Remove all combustible material in a wide strip",
            "Spray water on the ground",
            "Build a wall of rocks"
        ],
        correct: 1,
        explanation: "Removing all combustible materials creates the most effective barrier to fire spread."
    },
    {
        question: "In which direction should you evacuate during a wildfire?",
        options: [
            "Against the wind direction",
            "With the wind direction", 
            "Perpendicular to the wind direction",
            "It doesn't matter"
        ],
        correct: 2,
        explanation: "Moving perpendicular to wind direction helps avoid the fire's path while not fighting against evacuation speed."
    },
    {
        question: "What is the 'fire triangle' concept?",
        options: [
            "Heat, Fuel, and Oxygen",
            "Wind, Temperature, and Humidity",
            "Forest, Grass, and Buildings",
            "Red, Orange, and Yellow flames"
        ],
        correct: 0,
        explanation: "Fire needs heat, fuel, and oxygen to exist. Remove any one element and the fire goes out."
    },
    {
        question: "How much defensible space should you maintain around structures?",
        options: [
            "10 feet",
            "30 feet",
            "100 feet or more",
            "No space needed"
        ],
        correct: 2,
        explanation: "At least 100 feet of defensible space is recommended, with the first 30 feet being most critical."
    },
    {
        question: "What time of day are wildfires typically most dangerous?",
        options: [
            "Early morning",
            "Midday to late afternoon",
            "Evening",
            "Midnight"
        ],
        correct: 1,
        explanation: "Afternoon hours have the hottest temperatures, lowest humidity, and strongest winds."
    },
    {
        question: "Which weather condition increases fire danger the most?",
        options: [
            "High humidity",
            "Low wind speeds",
            "Low humidity with strong winds",
            "Cold temperatures"
        ],
        correct: 2,
        explanation: "Low humidity dries out vegetation while strong winds rapidly spread fires."
    },
    {
        question: "What should you do if caught in a wildfire while driving?",
        options: [
            "Drive through the flames quickly",
            "Stop, park in an open area, stay in car",
            "Get out and run",
            "Turn around immediately"
        ],
        correct: 1,
        explanation: "Cars provide protection from radiant heat. Park away from vegetation, close vents, and stay low."
    },
    {
        question: "How do backfires help in firefighting?",
        options: [
            "They create more smoke",
            "They burn fuel ahead of the main fire",
            "They cool the air temperature",
            "They create water vapor"
        ],
        correct: 1,
        explanation: "Backfires consume fuel in the path of the main fire, creating a firebreak."
    },
    {
        question: "What is the best way to prepare your property for wildfire season?",
        options: [
            "Water the lawn more frequently",
            "Create defensible space and use fire-resistant plants",
            "Install more outdoor lighting",
            "Build higher fences"
        ],
        correct: 1,
        explanation: "Defensible space and fire-resistant landscaping are key to property protection."
    },
    {
        question: "When should you evacuate during a wildfire threat?",
        options: [
            "Only when you see flames",
            "When authorities issue evacuation orders",
            "After gathering all belongings",
            "When the fire is within 1 mile"
        ],
        correct: 1,
        explanation: "Always follow official evacuation orders immediately. Don't wait to see flames."
    }
];

// Initialize Community Engagement Module
function initializeCommunityEngagement() {
    setupModeSelection();
    setupTrainingArena();
    setupQuizMode();
    setupLeaderboard();
    setupTutorial();
    
    // Start timer updates
    setInterval(updateDisplayTimers, 1000);
    
    // Show tutorial for first-time users
    if (!localStorage.getItem('trainingTutorialSeen')) {
        setTimeout(() => {
            showTutorial();
        }, 1000);
    }
    
    showToast('Community engagement module loaded successfully!', 'success');
}

// Mode Selection Functions
function setupModeSelection() {
    const modeCards = document.querySelectorAll('.mode-card');
    
    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.dataset.mode;
            switchEngagementMode(mode);
            
            // Update active card
            modeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });
}

function switchEngagementMode(mode) {
    currentTrainingMode = mode;
    
    // Hide all modules
    const modules = document.querySelectorAll('.engagement-module');
    modules.forEach(module => {
        module.classList.remove('active');
    });
    
    // Show selected module
    const selectedModule = document.getElementById(`${mode}-mode`);
    if (selectedModule) {
        selectedModule.classList.add('active');
        
        // Initialize mode-specific features
        if (mode === 'training') {
            resetTrainingArena();
        } else if (mode === 'quiz') {
            startQuiz();
        } else if (mode === 'leaderboard') {
            updateLeaderboard();
        }
    }
    
    showToast(`Switched to ${mode} mode`, 'info', 2000);
}

// Training Arena Functions
function setupTrainingArena() {
    const toolBtns = document.querySelectorAll('.tool-btn');
    const canvas = document.getElementById('training-canvas');
    const startBtn = document.getElementById('start-training');
    const pauseBtn = document.getElementById('pause-training');
    const resetBtn = document.getElementById('reset-training');
    
    // Tool selection
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toolBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTool = btn.dataset.tool;
            
            // Update cursor style based on selected tool
            canvas.style.cursor = getToolCursor(selectedTool);
            
            showToast(`Selected ${selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)} tool`, 'success', 1500);
        });
    });
    
    // Canvas interactions
    if (canvas) {
        canvas.addEventListener('click', handleCanvasClick);
        canvas.addEventListener('mouseover', () => {
            canvas.style.cursor = getToolCursor(selectedTool);
        });
    }
    
    // Control buttons
    if (startBtn) startBtn.addEventListener('click', startTrainingSimulation);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseTrainingSimulation);
    if (resetBtn) resetBtn.addEventListener('click', resetTrainingArena);
    
    // Scenario selection
    const scenarioItems = document.querySelectorAll('.scenario-item');
    scenarioItems.forEach(item => {
        if (!item.classList.contains('locked')) {
            item.addEventListener('click', () => {
                scenarioItems.forEach(s => s.classList.remove('active'));
                item.classList.add('active');
                loadScenario(item);
            });
        } else {
            item.addEventListener('click', () => {
                showToast('Complete previous scenarios to unlock!', 'warning', 2000);
            });
        }
    });
    
    // Initialize canvas cursor
    if (canvas) {
        canvas.style.cursor = getToolCursor(selectedTool);
    }
}

function getToolCursor(tool) {
    switch (tool) {
        case 'fireline': return 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path d=\'M2 12L22 2v20L2 12z\' fill=\'%23FF4500\'/></svg>") 12 12, crosshair';
        case 'water': return 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path d=\'M12 2l7 7-7 7-7-7 7-7z\' fill=\'%233B82F6\'/></svg>") 12 12, crosshair';
        case 'buffer': return 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><circle cx=\'12\' cy=\'12\' r=\'10\' fill=\'none\' stroke=\'%2310B981\' stroke-width=\'2\'/></svg>") 12 12, crosshair';
        case 'evacuation': return 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path d=\'M2 12h20m-10-8l8 8-8 8\' fill=\'none\' stroke=\'%236366F1\' stroke-width=\'2\'/></svg>") 12 12, crosshair';
        default: return 'crosshair';
    }
}

function handleCanvasClick(event) {
    if (!isTrainingActive) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    placeTrainingAction(x, y, selectedTool);
}

function placeTrainingAction(x, y, tool) {
    const canvas = document.getElementById('training-canvas');
    const overlays = document.getElementById('action-overlays');
    
    const toolCosts = {
        'fireline': 10,
        'water': 15,
        'buffer': 20,
        'evacuation': 5
    };
    
    const cost = toolCosts[tool] || 10;
    
    if (trainingScore >= cost) {
        trainingScore -= cost;
        updateTrainingScore();
        
        const actionElement = createActionElement(x, y, tool);
        overlays.appendChild(actionElement);
        
        // Simulate fire response
        simulateFireResponse(x, y, tool);
        
        // Add score for effective placement
        const effectiveness = calculatePlacementEffectiveness(x, y, tool);
        const earnedPoints = Math.floor(effectiveness * cost * 1.5);
        trainingScore += earnedPoints;
        
        showToast(`${tool} placed! Earned ${earnedPoints} points`, 'success', 2000);
    } else {
        showToast('Not enough points!', 'error', 2000);
    }
}

function createActionElement(x, y, tool) {
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = `${x}%`;
    element.style.top = `${y}%`;
    element.style.transform = 'translate(-50%, -50%)';
    element.style.zIndex = '20';
    
    switch (tool) {
        case 'fireline':
            element.className = 'fireline-overlay';
            element.style.width = '100px';
            element.style.height = '4px';
            break;
        case 'water':
            element.className = 'water-overlay';
            break;
        case 'buffer':
            element.className = 'buffer-overlay';
            element.style.width = '80px';
            element.style.height = '60px';
            break;
        case 'evacuation':
            element.innerHTML = '<i class="fas fa-route" style="color: #3B82F6; font-size: 1.5rem;"></i>';
            break;
    }
    
    return element;
}

function simulateFireResponse(x, y, tool) {
    // Simple fire response simulation
    const fireSource = document.querySelector('.fire-source');
    if (!fireSource) return;
    
    const fireRect = fireSource.getBoundingClientRect();
    const canvas = document.getElementById('training-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    const fireX = ((fireRect.left - canvasRect.left + fireRect.width / 2) / canvasRect.width) * 100;
    const fireY = ((fireRect.top - canvasRect.top + fireRect.height / 2) / canvasRect.height) * 100;
    
    const distance = Math.sqrt(Math.pow(x - fireX, 2) + Math.pow(y - fireY, 2));
    
    if (distance < 20) { // Close enough to affect fire
        const fireAnimation = fireSource.querySelector('.fire-animation');
        if (fireAnimation) {
            // Temporarily slow down fire animation
            fireAnimation.style.animationDuration = '4s';
            setTimeout(() => {
                fireAnimation.style.animationDuration = '2s';
            }, 3000);
        }
    }
}

function calculatePlacementEffectiveness(x, y, tool) {
    // Calculate how effective the tool placement is
    // This is a simplified version - in a real game, this would be much more complex
    
    const fireSource = document.querySelector('.fire-source');
    const village = document.querySelector('.village-marker');
    
    if (!fireSource || !village) return 0.5;
    
    // Get positions
    const fireX = 15; // From CSS
    const fireY = 20;
    const villageX = 80;
    const villageY = 60;
    
    // Calculate if placement is between fire and village
    const isInPath = isPointBetween(x, y, fireX, fireY, villageX, villageY);
    
    let effectiveness = 0.3; // Base effectiveness
    
    if (isInPath) {
        effectiveness += 0.4; // Bonus for good positioning
    }
    
    // Tool-specific bonuses
    switch (tool) {
        case 'fireline':
            if (isInPath) effectiveness += 0.3;
            break;
        case 'water':
            effectiveness += 0.2; // Water is always somewhat effective
            break;
        case 'buffer':
            if (Math.abs(x - villageX) < 20 && Math.abs(y - villageY) < 20) {
                effectiveness += 0.4; // Great for protecting structures
            }
            break;
    }
    
    return Math.min(effectiveness, 1.0);
}

function isPointBetween(px, py, ax, ay, bx, by) {
    const distAB = Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
    const distAP = Math.sqrt(Math.pow(px - ax, 2) + Math.pow(py - ay, 2));
    const distPB = Math.sqrt(Math.pow(bx - px, 2) + Math.pow(by - py, 2));
    
    return Math.abs(distAP + distPB - distAB) < 5; // Tolerance for "between"
}

function startTrainingSimulation() {
    if (isTrainingActive) {
        showToast('Simulation already running!', 'warning', 2000);
        return;
    }
    
    isTrainingActive = true;
    trainingTimer = 300; // Reset to 5 minutes
    
    // Start the fire animation
    const fireAnimation = document.querySelector('.fire-animation');
    if (fireAnimation) {
        fireAnimation.style.animationDuration = '1.5s';
        fireAnimation.classList.add('fire-active');
    }
    
    trainingInterval = setInterval(() => {
        trainingTimer--;
        updateTrainingTimer();
        
        // Update fire spread simulation
        simulateFireProgression();
        
        if (trainingTimer <= 0) {
            endTrainingSimulation();
        }
    }, 1000);
    
    showToast('🔥 Fire emergency started! Protect the village!', 'success', 3000);
    
    // Enable tools
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => btn.disabled = false);
    
    // Update button states
    const startBtn = document.getElementById('start-training');
    const pauseBtn = document.getElementById('pause-training');
    if (startBtn) startBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = false;
}

function simulateFireProgression() {
    if (!isTrainingActive) return;
    
    const fireSource = document.querySelector('.fire-source');
    const village = document.querySelector('.village-marker');
    
    if (fireSource && village) {
        // Simple fire progression - increase size over time
        const currentSize = parseInt(fireSource.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || 1);
        const newSize = Math.min(currentSize + 0.005, 2); // Max 2x size
        
        fireSource.style.transform = `scale(${newSize})`;
        
        // Check if fire reached village
        if (newSize > 1.5 && !document.querySelector('.village-protected')) {
            // Fire is getting close to village
            if (Math.random() < 0.1) { // 10% chance per second when close
                showToast('⚠️ Fire is approaching the village!', 'warning', 2000);
            }
        }
    }
}

function pauseTrainingSimulation() {
    isTrainingActive = false;
    if (trainingInterval) {
        clearInterval(trainingInterval);
        trainingInterval = null;
    }
    showToast('Training simulation paused', 'info');
}

function resetTrainingArena() {
    isTrainingActive = false;
    if (trainingInterval) {
        clearInterval(trainingInterval);
        trainingInterval = null;
    }
    
    trainingTimer = 300;
    trainingScore = 2450;
    
    // Clear all action overlays
    const overlays = document.getElementById('action-overlays');
    if (overlays) {
        overlays.innerHTML = '';
    }
    
    // Reset fire animation
    const fireAnimation = document.querySelector('.fire-animation');
    if (fireAnimation) {
        fireAnimation.style.animationDuration = '2s';
    }
    
    updateTrainingTimer();
    updateTrainingScore();
    
    showToast('Training arena reset', 'info');
}

function endTrainingSimulation() {
    isTrainingActive = false;
    if (trainingInterval) {
        clearInterval(trainingInterval);
        trainingInterval = null;
    }
    
    // Calculate final score and performance
    const performance = calculateTrainingPerformance();
    showTrainingResults(performance);
    
    showToast('Training simulation completed!', 'success');
}

function calculateTrainingPerformance() {
    // Simple performance calculation
    const timeUsed = 300 - trainingTimer;
    const timeScore = Math.max(0, 300 - timeUsed) / 300;
    const effectivenessScore = Math.min(trainingScore / 2450, 1.5); // Can exceed original score
    
    const finalScore = Math.floor((timeScore + effectivenessScore) * 1000);
    
    return {
        finalScore,
        timeUsed,
        effectiveness: effectivenessScore,
        rating: finalScore > 1500 ? 'Excellent' : finalScore > 1000 ? 'Good' : finalScore > 500 ? 'Fair' : 'Needs Improvement'
    };
}

function showTrainingResults(performance) {
    // This would show a modal with results - simplified version
    const message = `Training Complete!\nScore: ${performance.finalScore}\nRating: ${performance.rating}\nTime Used: ${Math.floor(performance.timeUsed / 60)}:${(performance.timeUsed % 60).toString().padStart(2, '0')}`;
    
    setTimeout(() => {
        showToast(message, 'success', 5000);
    }, 500);
    
    // Update progress
    updatePlayerProgress();
}

function updateTrainingTimer() {
    const timerElement = document.getElementById('training-timer');
    if (timerElement) {
        const minutes = Math.floor(trainingTimer / 60);
        const seconds = trainingTimer % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function updateTrainingScore() {
    const scoreElement = document.getElementById('current-score');
    if (scoreElement) {
        scoreElement.textContent = trainingScore.toLocaleString();
    }
}

function loadScenario(scenarioElement) {
    const scenarioName = scenarioElement.querySelector('.scenario-name').textContent;
    const difficulty = scenarioElement.querySelector('.scenario-difficulty').textContent;
    
    // Update scenario title
    const scenarioTitle = document.getElementById('current-scenario');
    if (scenarioTitle) {
        scenarioTitle.textContent = scenarioName;
    }
    
    // Reset arena for new scenario
    resetTrainingArena();
    
    // Adjust difficulty (simplified)
    switch (difficulty.toLowerCase()) {
        case 'easy':
            trainingTimer = 300; // 5 minutes
            break;
        case 'medium':
            trainingTimer = 240; // 4 minutes
            break;
        case 'hard':
            trainingTimer = 180; // 3 minutes
            break;
    }
    
    updateTrainingTimer();
    showToast(`Loaded scenario: ${scenarioName}`, 'info');
}

// Quiz Mode Functions
function setupQuizMode() {
    const nextBtn = document.getElementById('next-question');
    const prevBtn = document.getElementById('prev-question');
    
    if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
    if (prevBtn) prevBtn.addEventListener('click', previousQuestion);
    
    // Quiz option selection
    setupQuizOptions();
}

function setupQuizOptions() {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(option => {
        option.addEventListener('click', () => {
            selectQuizOption(option);
        });
    });
}

function selectQuizOption(selectedOption) {
    // Remove previous selections
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(option => {
        option.classList.remove('selected', 'correct', 'incorrect');
    });
    
    // Mark selected option
    selectedOption.classList.add('selected');
    
    // Enable next button
    const nextBtn = document.getElementById('next-question');
    if (nextBtn) nextBtn.disabled = false;
}

function startQuiz() {
    currentQuizQuestion = 1;
    quizScore = 0;
    loadQuizQuestion(currentQuizQuestion);
    updateQuizProgress();
}

function loadQuizQuestion(questionNumber) {
    const questionIndex = questionNumber - 1;
    const questionData = quizQuestions[questionIndex];
    
    if (!questionData) return;
    
    // Update question text
    const questionElement = document.getElementById('quiz-question');
    if (questionElement) {
        questionElement.textContent = questionData.question;
    }
    
    // Update options
    const options = document.querySelectorAll('.quiz-option');
    options.forEach((option, index) => {
        const optionText = option.querySelector('.option-text');
        if (optionText && questionData.options[index]) {
            optionText.textContent = questionData.options[index];
        }
        
        // Reset option styling
        option.classList.remove('selected', 'correct', 'incorrect');
        option.dataset.answer = String.fromCharCode(97 + index); // a, b, c, d
    });
    
    updateQuizProgress();
}

function nextQuestion() {
    // Check answer before moving to next question
    const selectedOption = document.querySelector('.quiz-option.selected');
    if (selectedOption) {
        checkQuizAnswer(selectedOption);
    }
    
    if (currentQuizQuestion < totalQuizQuestions) {
        currentQuizQuestion++;
        setTimeout(() => {
            loadQuizQuestion(currentQuizQuestion);
            
            // Disable next button until option is selected
            const nextBtn = document.getElementById('next-question');
            if (nextBtn) nextBtn.disabled = true;
        }, 1500); // Delay to show correct answer
    } else {
        finishQuiz();
    }
}

function previousQuestion() {
    if (currentQuizQuestion > 1) {
        currentQuizQuestion--;
        loadQuizQuestion(currentQuizQuestion);
    }
}

function checkQuizAnswer(selectedOption) {
    const questionIndex = currentQuizQuestion - 1;
    const questionData = quizQuestions[questionIndex];
    const selectedIndex = Array.from(document.querySelectorAll('.quiz-option')).indexOf(selectedOption);
    
    // Show correct answer
    const options = document.querySelectorAll('.quiz-option');
    options.forEach((option, index) => {
        if (index === questionData.correct) {
            option.classList.add('correct');
        } else if (option === selectedOption && index !== questionData.correct) {
            option.classList.add('incorrect');
        }
    });
    
    // Update score
    if (selectedIndex === questionData.correct) {
        quizScore++;
        showToast('Correct! +10 points', 'success', 1500);
    } else {
        showToast(`Incorrect. ${questionData.explanation}`, 'error', 3000);
    }
}

function updateQuizProgress() {
    const currentElement = document.getElementById('current-question');
    const totalElement = document.getElementById('total-questions');
    const progressBar = document.querySelector('.quiz-container .progress-fill');
    
    if (currentElement) currentElement.textContent = currentQuizQuestion;
    if (totalElement) totalElement.textContent = totalQuizQuestions;
    
    if (progressBar) {
        const progress = (currentQuizQuestion / totalQuizQuestions) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    // Update button states
    const prevBtn = document.getElementById('prev-question');
    const nextBtn = document.getElementById('next-question');
    
    if (prevBtn) prevBtn.disabled = currentQuizQuestion === 1;
    if (nextBtn) nextBtn.disabled = true; // Enabled when option is selected
}

function finishQuiz() {
    const percentage = Math.round((quizScore / totalQuizQuestions) * 100);
    const message = `Quiz completed!\nScore: ${quizScore}/${totalQuizQuestions} (${percentage}%)\n\nGreat job learning fire safety!`;
    
    showToast(message, 'success', 5000);
    
    // Update player progress
    updatePlayerProgress();
    
    // Reset quiz after delay
    setTimeout(() => {
        startQuiz();
    }, 3000);
}

// Leaderboard Functions
function setupLeaderboard() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tab = btn.dataset.tab;
            updateLeaderboard(tab);
        });
    });
}

function updateLeaderboard(period = 'weekly') {
    // This would fetch real leaderboard data in a production app
    // For now, we'll just show a toast message
    showToast(`Updated ${period} leaderboard`, 'info', 2000);
    
    // Simulate data update with slight animation
    const leaderboardItems = document.querySelectorAll('.leaderboard-item');
    leaderboardItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.transform = 'translateY(-5px)';
            setTimeout(() => {
                item.style.transform = 'translateY(0)';
            }, 200);
        }, index * 100);
    });
}

// Progress and Achievement Functions
function updatePlayerProgress() {
    // Simulate XP gain
    const xpGain = Math.floor(Math.random() * 50) + 25;
    
    // Update XP display
    const xpFill = document.querySelector('.xp-fill');
    if (xpFill) {
        const currentWidth = parseInt(xpFill.style.width) || 65;
        const newWidth = Math.min(currentWidth + (xpGain / 10), 100);
        xpFill.style.width = `${newWidth}%`;
        
        if (newWidth >= 100) {
            levelUp();
        }
    }
    
    // Update score
    trainingScore += xpGain;
    updateTrainingScore();
    
    // Random badge unlock
    if (Math.random() < 0.3) {
        unlockRandomBadge();
    }
}

function levelUp() {
    const levelElement = document.getElementById('player-level');
    if (levelElement) {
        const currentLevel = parseInt(levelElement.textContent) || 3;
        levelElement.textContent = currentLevel + 1;
    }
    
    // Reset XP bar
    const xpFill = document.querySelector('.xp-fill');
    if (xpFill) {
        xpFill.style.width = '15%';
    }
    
    showToast('🎉 Level Up! You are now a Fire Specialist!', 'success', 4000);
}

function unlockRandomBadge() {
    const lockedBadges = document.querySelectorAll('.badge-item:not(.earned)');
    if (lockedBadges.length > 0) {
        const randomBadge = lockedBadges[Math.floor(Math.random() * lockedBadges.length)];
        randomBadge.classList.add('earned');
        
        const badgeName = randomBadge.querySelector('.badge-name').textContent;
        showToast(`🏆 Badge Unlocked: ${badgeName}!`, 'success', 3000);
        
        // Update badge count
        const badgeCountElement = document.getElementById('badge-count');
        if (badgeCountElement) {
            const currentCount = parseInt(badgeCountElement.textContent) || 7;
            badgeCountElement.textContent = currentCount + 1;
        }
    }
}

// Utility Functions
function updateDisplayTimers() {
    // Update any time-based displays
    if (isTrainingActive && trainingTimer > 0) {
        // Timer is already updated in the training loop
    }
}

// Initialize Community Engagement when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Add to existing initialization
    setTimeout(() => {
        initializeCommunityEngagement();
    }, 1000);
});

// Resource Optimization Functions
function initializeResourceOptimization() {
    const optimizeBtn = document.getElementById('optimize-deployment');
    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', runResourceOptimization);
    }
}

async function runResourceOptimization() {
    const optimizeBtn = document.getElementById('optimize-deployment');
    if (optimizeBtn) {
        optimizeBtn.disabled = true;
        optimizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizing...';
    }

    try {
        // Get current resource counts
        const firefighters = parseInt(document.getElementById('firefighters-count').value) || 0;
        const waterTanks = parseInt(document.getElementById('water-tanks-count').value) || 0;
        const drones = parseInt(document.getElementById('drones-count').value) || 0;
        const helicopters = parseInt(document.getElementById('helicopters-count').value) || 0;

        // Get current environmental data
        const envData = getCurrentEnvironmentalData();

        const requestData = {
            ...envData,
            firefighters,
            water_tanks: waterTanks,
            drones,
            helicopters
        };

        showToast('Running AI optimization algorithm...', 'processing', 3000);

        // Call ML API for optimization
        const response = await fetch(`${ML_API_BASE}/api/ml/optimize-resources`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                currentOptimization = result.optimization;
                displayOptimizationResults(result.optimization);
                updateDeploymentMap(result.optimization.deployment_plan);
                showToast('Resource optimization completed successfully!', 'success');
            }
        } else {
            throw new Error('API request failed');
        }
    } catch (error) {
        console.warn('ML API unavailable, using fallback optimization');
        const fallbackOptimization = generateFallbackOptimization();
        currentOptimization = fallbackOptimization;
        displayOptimizationResults(fallbackOptimization);
        updateDeploymentMap(fallbackOptimization.deployment_plan);
        showToast('Optimization completed with local algorithm', 'warning');
    }

    if (optimizeBtn) {
        optimizeBtn.disabled = false;
        optimizeBtn.innerHTML = '<i class="fas fa-magic"></i> Optimize Deployment';
    }
}

function displayOptimizationResults(optimization) {
    // Update optimization score
    const scoreElement = document.getElementById('optimization-score');
    if (scoreElement) {
        scoreElement.textContent = optimization.optimization_score + '/100';
    }

    // Update coverage metrics
    updateElementText('overall-coverage', optimization.coverage_metrics.overall_coverage_percentage.toFixed(1) + '%');
    updateElementText('avg-response-time', optimization.response_times.overall.average_minutes.toFixed(1) + ' min');
    updateElementText('districts-covered', optimization.coverage_metrics.total_districts_covered + '/13');

    // Calculate high risk coverage
    const highRiskCoverage = calculateHighRiskCoverage(optimization.deployment_plan);
    updateElementText('high-risk-coverage', highRiskCoverage + '%');

    // Update resource breakdown
    updateResourceBreakdown(optimization.deployment_plan);

    // Update recommendations
    updateRecommendations(optimization.recommendations);
}

function calculateHighRiskCoverage(deploymentPlan) {
    const highRiskDistricts = ['Nainital', 'Almora', 'Chamoli'];
    let covered = 0;

    Object.values(deploymentPlan).forEach(deployments => {
        deployments.forEach(deployment => {
            if (highRiskDistricts.includes(deployment.district)) {
                covered++;
            }
        });
    });

    return Math.min(100, Math.round((covered / highRiskDistricts.length) * 100));
}

function updateResourceBreakdown(deploymentPlan) {
    const container = document.getElementById('resource-breakdown');
    if (!container) return;

    container.innerHTML = '';

    const resourceIcons = {
        firefighters: 'fas fa-users',
        water_tanks: 'fas fa-tint',
        drones: 'fas fa-helicopter',
        helicopters: 'fas fa-plane'
    };

    Object.entries(deploymentPlan).forEach(([resourceType, deployments]) => {
        if (deployments.length > 0) {
            const totalUnits = deployments.reduce((sum, d) => sum + d.units, 0);
            const districtsCount = deployments.length;

            const item = document.createElement('div');
            item.className = 'resource-breakdown-item';
            item.innerHTML = `
                <div class="breakdown-resource">
                    <i class="${resourceIcons[resourceType]}"></i>
                    ${resourceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div class="breakdown-count">${totalUnits} units in ${districtsCount} districts</div>
            `;
            container.appendChild(item);
        }
    });
}

function updateRecommendations(recommendations) {
    const container = document.getElementById('recommendations-list');
    if (!container) return;

    container.innerHTML = '';

    recommendations.forEach(rec => {
        const item = document.createElement('div');
        item.className = 'recommendation-item';
        item.innerHTML = `
            <i class="fas fa-lightbulb"></i>
            <span>${rec}</span>
        `;
        container.appendChild(item);
    });
}

function updateDeploymentMap(deploymentPlan) {
    if (!deploymentMap) return;

    // Clear existing deployment layers
    deploymentLayers.forEach(layer => {
        try {
            deploymentMap.removeLayer(layer);
        } catch (e) {
            // Ignore errors for layers already removed
        }
    });
    deploymentLayers = [];

    const resourceColors = {
        firefighters: '#FF4500',
        water_tanks: '#3B82F6',
        drones: '#10B981',
        helicopters: '#8B5CF6'
    };

    const resourceIcons = {
        firefighters: 'fas fa-users',
        water_tanks: 'fas fa-tint',
        drones: 'fas fa-helicopter',
        helicopters: 'fas fa-plane'
    };

    Object.entries(deploymentPlan).forEach(([resourceType, deployments]) => {
        deployments.forEach(deployment => {
            const marker = L.marker(deployment.coordinates, {
                icon: L.divIcon({
                    className: 'deployment-marker',
                    html: `
                        <div class="deployment-icon" style="background-color: ${resourceColors[resourceType]};">
                            <i class="${resourceIcons[resourceType]}"></i>
                            <span class="unit-count">${deployment.units}</span>
                        </div>
                    `,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                })
            }).addTo(deploymentMap);

            // Add coverage circle
            const coverageCircle = L.circle(deployment.coordinates, {
                color: resourceColors[resourceType],
                fillColor: resourceColors[resourceType],
                fillOpacity: 0.1,
                radius: deployment.coverage_radius * 1000, // Convert km to meters
                weight: 1
            }).addTo(deploymentMap);

            marker.bindPopup(`
                <div>
                    <h4>${deployment.district}</h4>
                    <p><strong>Resource:</strong> ${resourceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    <p><strong>Units:</strong> ${deployment.units}</p>
                    <p><strong>Risk Score:</strong> ${(deployment.risk_score * 100).toFixed(1)}%</p>
                    <p><strong>Coverage:</strong> ${deployment.coverage_radius} km radius</p>
                </div>
            `);

            deploymentLayers.push(marker);
            deploymentLayers.push(coverageCircle);
        });
    });
}

function addDistrictBoundaries() {
    if (!deploymentMap) return;

    const districts = [
        {
            name: 'Nainital',
            coords: [[29.2, 79.3], [29.6, 79.3], [29.6, 79.8], [29.2, 79.8]],
            risk: 'very-high'
        },
        {
            name: 'Almora',
            coords: [[29.5, 79.5], [29.9, 79.5], [29.9, 80.0], [29.5, 80.0]],
            risk: 'high'
        },
        {
            name: 'Dehradun',
            coords: [[30.1, 77.8], [30.5, 77.8], [30.5, 78.3], [30.1, 78.3]],
            risk: 'moderate'
        }
    ];

    districts.forEach(district => {
        const riskColors = {
            'very-high': '#FF4444',
            'high': '#FFA726',
            'moderate': '#66BB6A',
            'low': '#42A5F5'
        };

        const polygon = L.polygon(district.coords, {
            color: riskColors[district.risk],
            fillColor: riskColors[district.risk],
            fillOpacity: 0.2,
            weight: 2
        }).addTo(deploymentMap);

        polygon.bindTooltip(district.name, { permanent: false, direction: 'center' });
    });
}

function generateFallbackOptimization() {
    // Fallback optimization when ML API is unavailable
    return {
        deployment_plan: {
            firefighters: [
                { district: 'Nainital', coordinates: [29.3806, 79.4422], units: 3, risk_score: 0.85, coverage_radius: 5 },
                { district: 'Almora', coordinates: [29.6500, 79.6667], units: 2, risk_score: 0.68, coverage_radius: 5 }
            ],
            water_tanks: [
                { district: 'Nainital', coordinates: [29.3806, 79.4422], units: 2, risk_score: 0.85, coverage_radius: 3 },
                { district: 'Dehradun', coordinates: [30.3165, 78.0322], units: 1, risk_score: 0.42, coverage_radius: 3 }
            ],
            drones: [
                { district: 'Nainital', coordinates: [29.3806, 79.4422], units: 1, risk_score: 0.85, coverage_radius: 15 },
                { district: 'Almora', coordinates: [29.6500, 79.6667], units: 1, risk_score: 0.68, coverage_radius: 15 },
                { district: 'Chamoli', coordinates: [30.4000, 79.3200], units: 1, risk_score: 0.72, coverage_radius: 15 }
            ],
            helicopters: [
                { district: 'Nainital', coordinates: [29.3806, 79.4422], units: 1, risk_score: 0.85, coverage_radius: 50 }
            ]
        },
        coverage_metrics: {
            overall_coverage_percentage: 78.5,
            total_districts_covered: 10,
            coverage_by_resource: {}
        },
        response_times: {
            overall: {
                average_minutes: 12.3,
                efficiency_score: 87.7
            }
        },
        optimization_score: 82.1,
        recommendations: [
            "Deploy additional helicopters for rapid response in high-risk areas",
            "Increase drone surveillance for better real-time monitoring",
            "Consider mobile water tank units for flexible deployment",
            "Maintain current deployment strategy for optimal coverage"
        ]
    };
}

// Environmental Impact Functions
function initializeEnvironmentalImpact() {
    // Initialize visualization controls
    const vizButtons = document.querySelectorAll('.viz-btn');
    vizButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const vizType = e.target.getAttribute('data-viz');
            switchVisualization(vizType);
        });
    });

    // Initialize analysis buttons
    const carbonAnalysisBtn = document.getElementById('run-carbon-analysis');
    const impactAnalysisBtn = document.getElementById('run-impact-analysis');
    const exportBtn = document.getElementById('export-analysis');

    if (carbonAnalysisBtn) {
        carbonAnalysisBtn.addEventListener('click', runCarbonAnalysis);
    }
    
    if (impactAnalysisBtn) {
        impactAnalysisBtn.addEventListener('click', runEnvironmentalImpactAnalysis);
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAnalysisReport);
    }

    // Initialize charts
    initializeEnvironmentalCharts();
    
    showToast('Environmental impact analysis ready', 'success');
}

function initializeEnvironmentalCharts() {
    // Carbon Emissions Chart
    const carbonCtx = document.getElementById('carbonEmissionsChart');
    if (carbonCtx) {
        window.carbonEmissionsChart = new Chart(carbonCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['0h', '1h', '2h', '3h', '4h', '5h', '6h'],
                datasets: [{
                    label: 'CO₂ Emissions (tonnes/hour)',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: getChartOptions('CO₂ Emissions Over Time', 'tonnes/hour')
        });
    }

    // Recovery Progress Chart
    const recoveryCtx = document.getElementById('recoveryProgressChart');
    if (recoveryCtx) {
        window.recoveryProgressChart = new Chart(recoveryCtx.getContext('2d'), {
            type: 'radar',
            data: {
                labels: ['Vegetation', 'Soil Health', 'Wildlife', 'Water Cycle', 'Carbon Storage'],
                datasets: [{
                    label: 'Recovery Progress (%)',
                    data: [0, 0, 0, 0, 0],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    pointBackgroundColor: '#10B981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#ffffff' } }
                },
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#ffffff' },
                        ticks: { color: '#ffffff', backdropColor: 'transparent' },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    // Economic Impact Chart
    const economicCtx = document.getElementById('economicImpactChart');
    if (economicCtx) {
        window.economicImpactChart = new Chart(economicCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Direct Timber Loss', 'Ecosystem Services', 'Recreation/Tourism', 'Restoration Cost'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'],
                    borderWidth: 2,
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#ffffff', padding: 15 }
                    }
                }
            }
        });
    }

    // Carbon Loss Chart
    const carbonLossCtx = document.getElementById('carbonLossChart');
    if (carbonLossCtx) {
        window.carbonLossChart = new Chart(carbonLossCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Year 1-5', 'Year 6-10', 'Year 11-20', 'Year 21-30', 'Year 31+'],
                datasets: [{
                    label: 'Lost Sequestration (tonnes CO₂)',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    borderColor: '#EF4444',
                    borderWidth: 1
                }]
            },
            options: getChartOptions('Carbon Sequestration Loss Over Time', 'tonnes CO₂')
        });
    }
}

function getChartOptions(title, yAxisLabel) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: title,
                color: '#ffffff',
                font: { size: 14 }
            },
            legend: { labels: { color: '#ffffff' } }
        },
        scales: {
            x: {
                ticks: { color: '#ffffff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            y: {
                ticks: { color: '#ffffff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                title: {
                    display: true,
                    text: yAxisLabel,
                    color: '#ffffff'
                }
            }
        }
    };
}

function switchVisualization(vizType) {
    // Update button states
    document.querySelectorAll('.viz-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-viz="${vizType}"]`).classList.add('active');

    // Switch visualization panels
    document.querySelectorAll('.viz-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${vizType}-viz`).classList.add('active');
}

async function runCarbonAnalysis() {
    const analysisBtn = document.getElementById('run-carbon-analysis');
    const originalText = analysisBtn.innerHTML;
    analysisBtn.disabled = true;
    analysisBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';

    try {
        const area = parseFloat(document.getElementById('analysis-area').value) || 100;
        const vegetationType = document.getElementById('vegetation-type').value;
        const severity = document.getElementById('fire-severity').value;

        const response = await fetch(`${ML_API_BASE}/api/ml/carbon-emissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                burned_area_hectares: area,
                vegetation_type: vegetationType,
                fire_intensity: severity + '_intensity'
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                updateCarbonEmissionsDisplay(result.emissions);
                showToast('Carbon emissions analysis completed', 'success');
            }
        } else {
            throw new Error('API request failed');
        }
    } catch (error) {
        console.warn('Using fallback carbon calculation');
        const fallbackEmissions = generateFallbackCarbonData();
        updateCarbonEmissionsDisplay(fallbackEmissions);
        showToast('Carbon analysis completed with local data', 'warning');
    }

    analysisBtn.disabled = false;
    analysisBtn.innerHTML = originalText;
}

async function runEnvironmentalImpactAnalysis() {
    const analysisBtn = document.getElementById('run-impact-analysis');
    const originalText = analysisBtn.innerHTML;
    analysisBtn.disabled = true;
    analysisBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';

    try {
        const area = parseFloat(document.getElementById('analysis-area').value) || 100;
        const vegetationType = document.getElementById('vegetation-type').value;
        const severity = document.getElementById('fire-severity').value;

        const response = await fetch(`${ML_API_BASE}/api/ml/environmental-impact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                burned_area_hectares: area,
                vegetation_type: vegetationType,
                fire_severity: severity
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                updateEnvironmentalImpactDisplay(result.impact);
                showToast('Environmental impact analysis completed', 'success');
            }
        } else {
            throw new Error('API request failed');
        }
    } catch (error) {
        console.warn('Using fallback environmental impact calculation');
        const fallbackImpact = generateFallbackEnvironmentalData();
        updateEnvironmentalImpactDisplay(fallbackImpact);
        showToast('Impact analysis completed with local data', 'warning');
    }

    analysisBtn.disabled = false;
    analysisBtn.innerHTML = originalText;
}

function updateCarbonEmissionsDisplay(emissions) {
    // Update summary metrics
    updateElementText('total-co2-emissions', emissions.total_co2_emissions_tonnes.toFixed(2));
    updateElementText('car-equivalent', Math.round(emissions.equivalent_metrics.car_driving_km).toLocaleString());
    updateElementText('tree-equivalent', Math.round(emissions.equivalent_metrics.trees_annual_absorption));
    updateElementText('household-equivalent', emissions.equivalent_metrics.households_annual_emissions.toFixed(1));

    // Update emissions chart with simulation data
    if (window.carbonEmissionsChart && isSimulationRunning) {
        const hours = Math.min(simulationTime / 10, 6); // Scale simulation time to hours
        const hourlyRate = emissions.total_co2_emissions_tonnes / Math.max(hours, 1);
        
        const newData = Array.from({length: 7}, (_, i) => 
            i <= hours ? hourlyRate * (i + 1) * 0.8 : 0
        );
        
        window.carbonEmissionsChart.data.datasets[0].data = newData;
        window.carbonEmissionsChart.update('none');
    }
}

function updateEnvironmentalImpactDisplay(impact) {
    // Update severity score
    updateElementText('severity-score', impact.overall_severity_score.toFixed(1));

    // Update impact categories
    updateElementText('biodiversity-impact', `${impact.biodiversity_impact.estimated_species_loss_percent.toFixed(1)}% loss`);
    updateElementText('soil-impact', impact.soil_impact.soil_erosion_risk_level);
    updateElementText('water-impact', impact.water_cycle_impact.flood_risk_increase);
    updateElementText('economic-impact', `$${(impact.economic_impact_usd.total_economic_impact_usd / 1000000).toFixed(2)}M`);

    // Update recovery timeline
    if (impact.recovery_timeline_years) {
        updateElementText('early-recovery-duration', `${impact.recovery_timeline_years.vegetation_regrowth} years`);
        updateElementText('restoration-duration', `${impact.recovery_timeline_years.wildlife_habitat} years`);
        updateElementText('full-recovery-duration', `${impact.recovery_timeline_years.full_canopy_recovery} years`);
    }

    // Update key statistics
    updateElementText('carbon-sequestration-loss', `${impact.carbon_sequestration_loss.total_sequestration_loss_tonnes_co2.toFixed(0)} tonnes`);
    updateElementText('total-economic-impact', `$${(impact.economic_impact_usd.total_economic_impact_usd / 1000000).toFixed(2)} million`);
    updateElementText('restoration-cost', `$${(impact.economic_impact_usd.recovery_cost_estimate_usd / 1000).toFixed(0)} thousand`);
    updateElementText('species-loss-risk', `${impact.biodiversity_impact.estimated_species_loss_percent.toFixed(1)}%`);

    // Update recommendations
    updateRecommendationsList(impact.mitigation_recommendations);

    // Update charts
    updateEnvironmentalCharts(impact);
}

function updateRecommendationsList(recommendations) {
    const container = document.getElementById('environmental-recommendations');
    if (!container) return;

    container.innerHTML = '';
    
    recommendations.forEach(recommendation => {
        const item = document.createElement('div');
        item.className = 'recommendation-item';
        item.innerHTML = `
            <i class="fas fa-leaf"></i>
            <span>${recommendation}</span>
        `;
        container.appendChild(item);
    });
}

function updateEnvironmentalCharts(impact) {
    // Update recovery progress chart
    if (window.recoveryProgressChart) {
        const recoveryData = [
            Math.max(0, 100 - impact.biodiversity_impact.estimated_species_loss_percent),
            impact.soil_impact.soil_erosion_risk_level === 'low' ? 80 : 
            impact.soil_impact.soil_erosion_risk_level === 'moderate' ? 60 : 30,
            Math.max(0, 100 - impact.biodiversity_impact.estimated_species_loss_percent * 0.8),
            impact.water_cycle_impact.flood_risk_increase === 'low' ? 70 : 40,
            Math.max(0, 100 - impact.carbon_sequestration_loss.total_sequestration_loss_tonnes_co2 / 1000)
        ];
        
        window.recoveryProgressChart.data.datasets[0].data = recoveryData;
        window.recoveryProgressChart.update('none');
    }

    // Update economic impact chart
    if (window.economicImpactChart) {
        const economicData = [
            impact.economic_impact_usd.direct_timber_loss_usd,
            impact.economic_impact_usd.ecosystem_service_loss_usd,
            impact.economic_impact_usd.recreation_tourism_loss_usd,
            impact.economic_impact_usd.recovery_cost_estimate_usd
        ];
        
        window.economicImpactChart.data.datasets[0].data = economicData;
        window.economicImpactChart.update('none');
    }

    // Update carbon loss chart
    if (window.carbonLossChart) {
        const totalLoss = impact.carbon_sequestration_loss.total_sequestration_loss_tonnes_co2;
        const lossData = [
            totalLoss * 0.3,  // Years 1-5
            totalLoss * 0.25, // Years 6-10
            totalLoss * 0.2,  // Years 11-20
            totalLoss * 0.15, // Years 21-30
            totalLoss * 0.1   // Years 31+
        ];
        
        window.carbonLossChart.data.datasets[0].data = lossData;
        window.carbonLossChart.update('none');
    }
}

function generateFallbackCarbonData() {
    const area = parseFloat(document.getElementById('analysis-area').value) || 100;
    const vegetationType = document.getElementById('vegetation-type').value;
    
    const emissionFactors = {
        'coniferous': 1.83,
        'deciduous': 1.79,
        'mixed_forest': 1.81,
        'grassland': 1.76,
        'shrubland': 1.78
    };
    
    const biomassDensity = {
        'coniferous': 45,
        'deciduous': 35,
        'mixed_forest': 40,
        'grassland': 2.5,
        'shrubland': 8
    };
    
    const factor = emissionFactors[vegetationType] || 1.81;
    const density = biomassDensity[vegetationType] || 40;
    const burnedBiomass = area * 10000 * density * 0.35; // 35% combustion
    const totalEmissions = burnedBiomass * factor;
    
    return {
        total_co2_emissions_kg: totalEmissions,
        total_co2_emissions_tonnes: totalEmissions / 1000,
        burned_area_hectares: area,
        vegetation_type: vegetationType,
        equivalent_metrics: {
            car_driving_km: totalEmissions / 0.12,
            trees_annual_absorption: totalEmissions / 22,
            households_annual_emissions: (totalEmissions / 1000) / 4.6
        }
    };
}

function generateFallbackEnvironmentalData() {
    const area = parseFloat(document.getElementById('analysis-area').value) || 100;
    const severity = document.getElementById('fire-severity').value;
    
    const severityMultipliers = {
        'low': 0.7, 'moderate': 1.0, 'high': 1.5, 'severe': 2.2, 'extreme': 3.0
    };
    
    const multiplier = severityMultipliers[severity] || 1.0;
    
    return {
        overall_severity_score: Math.min(10, 4 * multiplier),
        biodiversity_impact: {
            estimated_species_loss_percent: Math.min(95, 25 * multiplier)
        },
        soil_impact: {
            soil_erosion_risk_level: multiplier > 1.5 ? 'high' : multiplier > 1.0 ? 'moderate' : 'low'
        },
        water_cycle_impact: {
            flood_risk_increase: multiplier > 1.5 ? 'high' : 'moderate'
        },
        economic_impact_usd: {
            total_economic_impact_usd: area * 5000 * multiplier,
            direct_timber_loss_usd: area * 400 * multiplier,
            ecosystem_service_loss_usd: area * 3000 * multiplier,
            recreation_tourism_loss_usd: area * 1200 * multiplier,
            recovery_cost_estimate_usd: area * 2500
        },
        carbon_sequestration_loss: {
            total_sequestration_loss_tonnes_co2: area * 7.3 * 25 * multiplier
        },
        recovery_timeline_years: {
            vegetation_regrowth: Math.round(12 * multiplier),
            wildlife_habitat: Math.round(16 * multiplier),
            full_canopy_recovery: Math.round(32 * multiplier)
        },
        mitigation_recommendations: [
            "Implement immediate erosion control measures",
            "Conduct comprehensive soil testing",
            "Priority reforestation with native species",
            "Establish wildlife corridors",
            "Monitor water quality downstream"
        ]
    };
}

function exportAnalysisReport() {
    showToast('Generating environmental analysis report...', 'processing', 2000);
    
    const area = document.getElementById('analysis-area').value;
    const vegetationType = document.getElementById('vegetation-type').value;
    const severity = document.getElementById('fire-severity').value;
    
    const reportContent = `
NeuroNix Environmental Impact Analysis Report
Generated: ${new Date().toLocaleString()}

Analysis Parameters:
- Burned Area: ${area} hectares
- Vegetation Type: ${vegetationType}
- Fire Severity: ${severity}

Carbon Emissions Summary:
- Total CO₂ Emissions: ${document.getElementById('total-co2-emissions').textContent} tonnes
- Car Driving Equivalent: ${document.getElementById('car-equivalent').textContent} km
- Tree Absorption Equivalent: ${document.getElementById('tree-equivalent').textContent} trees/year

Environmental Impact:
- Overall Severity Score: ${document.getElementById('severity-score').textContent}/10
- Species Loss Risk: ${document.getElementById('species-loss-risk').textContent}
- Carbon Sequestration Loss: ${document.getElementById('carbon-sequestration-loss').textContent}
- Total Economic Impact: ${document.getElementById('total-economic-impact').textContent}

Recovery Timeline:
- Early Recovery: ${document.getElementById('early-recovery-duration').textContent}
- Ecosystem Restoration: ${document.getElementById('restoration-duration').textContent}
- Full Recovery: ${document.getElementById('full-recovery-duration').textContent}

Generated by NeuroNix Forest Fire Intelligence Platform
    `.trim();
    
    setTimeout(() => {
        const link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent);
        link.download = `neuronix-environmental-impact-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Environmental analysis report downloaded successfully!', 'success');
    }, 2000);
}

// Enhanced keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
            showToast('Search activated', 'processing', 1000);
        }
    }

    if (e.key === 'Escape') {
        closeModal();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        downloadReport();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        const section = document.getElementById('resource-optimization');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
            showToast('Resource Optimization activated', 'processing', 1500);
        }
    }
});