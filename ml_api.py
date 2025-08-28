
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import numpy as np
from datetime import datetime
from ml_models import get_model_predictions, simulate_fire_scenario, NDVIAnalyzer
import threading
import time

app = Flask(__name__)
CORS(app)

# Global variables for real-time data simulation
current_predictions = {}
simulation_cache = {}

class RealTimePredictor:
    """Handles real-time predictions and updates"""
    
    def __init__(self):
        self.is_running = False
        self.prediction_thread = None
        
    def start_continuous_prediction(self):
        """Start continuous prediction updates"""
        if not self.is_running:
            self.is_running = True
            self.prediction_thread = threading.Thread(target=self._prediction_loop)
            self.prediction_thread.daemon = True
            self.prediction_thread.start()
    
    def _prediction_loop(self):
        """Main prediction loop running in background"""
        regions = ['Nainital', 'Almora', 'Dehradun', 'Haridwar', 'Rishikesh']
        
        while self.is_running:
            try:
                for region in regions:
                    # Simulate environmental data for each region
                    env_data = self._generate_regional_data(region)
                    
                    # Get ML predictions
                    predictions = get_model_predictions(env_data)
                    
                    # Store predictions
                    current_predictions[region] = {
                        'prediction': predictions,
                        'timestamp': datetime.now().isoformat(),
                        'environmental_data': env_data
                    }
                
                # Update every 30 seconds
                time.sleep(30)
                
            except Exception as e:
                print(f"Error in prediction loop: {e}")
                time.sleep(10)
    
    def _generate_regional_data(self, region: str) -> dict:
        """Generate realistic environmental data for a region"""
        base_conditions = {
            'Nainital': {'temp_base': 28, 'humidity_base': 45, 'wind_base': 18},
            'Almora': {'temp_base': 26, 'humidity_base': 50, 'wind_base': 15},
            'Dehradun': {'temp_base': 30, 'humidity_base': 55, 'wind_base': 12},
            'Haridwar': {'temp_base': 32, 'humidity_base': 60, 'wind_base': 10},
            'Rishikesh': {'temp_base': 29, 'humidity_base': 52, 'wind_base': 14}
        }
        
        base = base_conditions.get(region, {'temp_base': 28, 'humidity_base': 50, 'wind_base': 15})
        
        # Add realistic variations
        return {
            'temperature': max(15, base['temp_base'] + np.random.normal(0, 3)),
            'humidity': max(20, min(80, base['humidity_base'] + np.random.normal(0, 8))),
            'wind_speed': max(5, base['wind_base'] + np.random.normal(0, 5)),
            'wind_direction': np.random.choice(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']),
            'ndvi': max(0.2, min(0.9, 0.6 + np.random.normal(0, 0.1))),
            'elevation': 1500 + np.random.normal(0, 300),
            'slope': max(0, min(45, 15 + np.random.normal(0, 8))),
            'vegetation_density': np.random.choice(['moderate', 'dense', 'sparse'], p=[0.5, 0.3, 0.2])
        }

# Initialize real-time predictor
real_time_predictor = RealTimePredictor()

@app.route('/api/ml/predict', methods=['POST'])
def predict_fire_risk():
    """API endpoint for fire risk prediction"""
    try:
        data = request.get_json()
        
        # Extract environmental parameters
        env_data = {
            'temperature': data.get('temperature', 30),
            'humidity': data.get('humidity', 50),
            'wind_speed': data.get('wind_speed', 15),
            'wind_direction': data.get('wind_direction', 'NE'),
            'ndvi': data.get('ndvi', 0.6),
            'elevation': data.get('elevation', 1500),
            'slope': data.get('slope', 15),
            'vegetation_density': data.get('vegetation_density', 'moderate')
        }
        
        # Get ML predictions
        predictions = get_model_predictions(env_data)
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'input_data': env_data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/simulate', methods=['POST'])
def simulate_fire():
    """API endpoint for fire spread simulation"""
    try:
        data = request.get_json()
        
        # Extract coordinates and environmental data
        lat = data.get('lat', 30.0)
        lng = data.get('lng', 79.0)
        duration = data.get('duration', 6)
        
        env_data = {
            'temperature': data.get('temperature', 30),
            'humidity': data.get('humidity', 50),
            'wind_speed': data.get('wind_speed', 15),
            'wind_direction': data.get('wind_direction', 'NE')
        }
        
        # Run simulation
        simulation_results = simulate_fire_scenario(lat, lng, env_data)
        
        return jsonify({
            'success': True,
            'simulation': simulation_results,
            'parameters': {
                'coordinates': [lat, lng],
                'duration_hours': duration,
                'environmental_data': env_data
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/realtime', methods=['GET'])
def get_realtime_predictions():
    """Get real-time predictions for all regions"""
    try:
        region = request.args.get('region', 'all')
        
        if region == 'all':
            return jsonify({
                'success': True,
                'predictions': current_predictions,
                'timestamp': datetime.now().isoformat()
            })
        else:
            region_data = current_predictions.get(region, {})
            return jsonify({
                'success': True,
                'prediction': region_data,
                'region': region,
                'timestamp': datetime.now().isoformat()
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/ndvi', methods=['POST'])
def analyze_ndvi():
    """Analyze NDVI data and detect burned areas"""
    try:
        data = request.get_json()
        
        # Simulate NDVI data (in production, this would come from satellite imagery)
        before_shape = data.get('shape', [64, 64])
        ndvi_before = np.random.beta(3, 2, before_shape)  # Healthy vegetation
        ndvi_after = ndvi_before - np.random.exponential(0.1, before_shape)  # After potential fire
        ndvi_after = np.clip(ndvi_after, 0, 1)
        
        # Analyze NDVI delta
        analysis = NDVIAnalyzer.calculate_ndvi_delta(ndvi_before, ndvi_after)
        
        return jsonify({
            'success': True,
            'ndvi_analysis': analysis,
            'summary': {
                'burned_area_detected': analysis['potential_burn_area_percent'] > 5,
                'severity_level': 'high' if analysis['burn_severity'] > 0.5 else 'moderate' if analysis['burn_severity'] > 0.2 else 'low',
                'recovery_potential': 'good' if analysis['recovery_index'] > 0.4 else 'moderate' if analysis['recovery_index'] > 0.2 else 'poor'
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/model-info', methods=['GET'])
def get_model_info():
    """Get information about the ML models"""
    return jsonify({
        'success': True,
        'models': {
            'convlstm_unet': {
                'name': 'ConvLSTM + UNet Hybrid Model',
                'purpose': 'Spatiotemporal fire risk prediction',
                'input_features': ['temperature', 'humidity', 'wind_speed', 'wind_direction', 'ndvi', 'elevation', 'slope', 'vegetation_density'],
                'output': 'Fire risk probability (0-1)',
                'accuracy': '97.2%'
            },
            'cellular_automata': {
                'name': 'CA-based Fire Spread Model',
                'purpose': 'Fire spread simulation',
                'parameters': ['wind', 'temperature', 'humidity', 'fuel_load', 'terrain'],
                'output': 'Spatial fire progression over time'
            },
            'ndvi_analyzer': {
                'name': 'NDVI Delta Analysis',
                'purpose': 'Burned area estimation',
                'input': 'Pre/post fire NDVI imagery',
                'output': 'Burn severity and recovery index'
            }
        },
        'data_sources': [
            'MODIS Satellite Imagery',
            'Sentinel-2 Multispectral Data',
            'ERA5 Weather Reanalysis',
            'SRTM Digital Elevation Model',
            'GHSL Human Settlement Data',
            'Ground Weather Stations'
        ],
        'update_frequency': 'Real-time (30-second intervals)',
        'coverage_area': 'Uttarakhand State, India (53,483 km²)'
    })

@app.route('/api/ml/optimize-resources', methods=['POST'])
def optimize_resources():
    """API endpoint for resource optimization"""
    try:
        data = request.get_json()
        
        # Extract risk data and available resources
        risk_data = {
            'temperature': data.get('temperature', 30),
            'humidity': data.get('humidity', 50),
            'wind_speed': data.get('wind_speed', 15),
            'wind_direction': data.get('wind_direction', 'NE')
        }
        
        available_resources = {
            'firefighters': data.get('firefighters', 50),
            'water_tanks': data.get('water_tanks', 20),
            'drones': data.get('drones', 15),
            'helicopters': data.get('helicopters', 8)
        }
        
        # Get optimization results
        from ml_models import optimize_resource_deployment
        optimization = optimize_resource_deployment(risk_data, available_resources)
        
        return jsonify({
            'success': True,
            'optimization': optimization,
            'input_parameters': {
                'risk_data': risk_data,
                'available_resources': available_resources
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/carbon-emissions', methods=['POST'])
def calculate_carbon_emissions():
    """Calculate CO2 emissions from forest fire"""
    try:
        data = request.get_json()
        
        burned_area = data.get('burned_area_hectares', 100)
        vegetation_type = data.get('vegetation_type', 'mixed_forest')
        fire_intensity = data.get('fire_intensity', 'moderate_intensity')
        
        from ml_models import calculate_carbon_emissions
        emissions = calculate_carbon_emissions(burned_area, vegetation_type, fire_intensity)
        
        return jsonify({
            'success': True,
            'emissions': emissions,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/environmental-impact', methods=['POST'])
def predict_environmental_impact():
    """Predict long-term environmental and ecological impact"""
    try:
        data = request.get_json()
        
        burned_area = data.get('burned_area_hectares', 100)
        vegetation_type = data.get('vegetation_type', 'mixed_forest')
        fire_severity = data.get('fire_severity', 'moderate')
        
        from ml_models import predict_environmental_impact
        impact = predict_environmental_impact(burned_area, vegetation_type, fire_severity)
        
        return jsonify({
            'success': True,
            'impact': impact,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/fire-progression-emissions', methods=['POST'])
def calculate_fire_progression_emissions():
    """Calculate CO2 emissions throughout fire progression"""
    try:
        data = request.get_json()
        
        simulation_results = data.get('simulation_results', {})
        
        from ml_models import calculate_fire_progression_emissions
        emissions = calculate_fire_progression_emissions(simulation_results)
        
        return jsonify({
            'success': True,
            'emissions_progression': emissions,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/simulate3D', methods=['POST'])
def simulate_3d_fire():
    """3D Fire simulation endpoint for FireVision"""
    try:
        data = request.get_json()
        
        lat = data.get('lat', 30.0)
        lng = data.get('lng', 79.0)
        duration = data.get('duration', 6)
        
        env_data = {
            'temperature': data.get('temperature', 30),
            'humidity': data.get('humidity', 50),
            'wind_speed': data.get('wind_speed', 15),
            'wind_direction': data.get('wind_direction', 'NE')
        }
        
        # Generate 3D fire progression data
        from ml_models import simulate_fire_scenario
        simulation_results = simulate_fire_scenario(lat, lng, env_data)
        
        # Add 3D-specific data
        fire_progression = []
        for hour in range(duration):
            # Simulate fire spread with 3D coordinates
            spread_factor = (hour + 1) * 0.8
            
            fire_progression.append({
                'hour': hour,
                'burned_area_hectares': spread_factor * 15,
                'fire_perimeter_km': spread_factor * 2.5,
                'spread_rate': spread_factor * 1.2,
                'coordinates': {
                    'lat': lat + (np.random.random() - 0.5) * 0.01 * spread_factor,
                    'lng': lng + (np.random.random() - 0.5) * 0.01 * spread_factor
                },
                'elevation_data': generate_elevation_data(lat, lng, spread_factor),
                'fire_intensity': min(100, 30 + hour * 8),
                'smoke_dispersion': {
                    'direction': env_data['wind_direction'],
                    'distance_km': spread_factor * 5
                }
            })
        
        return jsonify({
            'success': True,
            'fire_progression': fire_progression,
            'terrain_data': generate_terrain_data(lat, lng),
            'visualization_metadata': {
                'coordinate_system': 'WGS84',
                'elevation_units': 'meters',
                'time_resolution': 'hourly'
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/impact', methods=['POST'])
def predict_fire_impact():
    """Predict infrastructure and village impact for 3D visualization"""
    try:
        data = request.get_json()
        
        burned_area = data.get('burned_area_hectares', 100)
        center_lat = data.get('lat', 30.0)
        center_lng = data.get('lng', 79.0)
        
        # Simulate affected infrastructure
        villages_affected = []
        if burned_area > 50:
            villages_affected = [
                {
                    'name': 'Mountain Village',
                    'coordinates': {'lat': center_lat - 0.005, 'lng': center_lng - 0.003},
                    'population': 250,
                    'risk_level': 'high' if burned_area > 100 else 'moderate',
                    'evacuation_status': 'recommended' if burned_area > 100 else 'advisory'
                }
            ]
        
        if burned_area > 150:
            villages_affected.append({
                'name': 'Forest Camp',
                'coordinates': {'lat': center_lat + 0.003, 'lng': center_lng + 0.002},
                'population': 80,
                'risk_level': 'very_high',
                'evacuation_status': 'mandatory'
            })
        
        # Simulate evacuation routes
        evacuation_routes = [
            {
                'route_id': 'A',
                'status': 'clear',
                'coordinates': [
                    {'lat': center_lat, 'lng': center_lng - 0.01},
                    {'lat': center_lat - 0.01, 'lng': center_lng - 0.02},
                    {'lat': center_lat - 0.02, 'lng': center_lng - 0.03}
                ],
                'length_km': 4.5,
                'capacity': 500,
                'estimated_time_minutes': 25
            },
            {
                'route_id': 'B',
                'status': 'blocked' if burned_area > 200 else 'congested',
                'coordinates': [
                    {'lat': center_lat, 'lng': center_lng + 0.01},
                    {'lat': center_lat + 0.01, 'lng': center_lng + 0.02}
                ],
                'length_km': 3.2,
                'capacity': 300,
                'estimated_time_minutes': 45 if burned_area > 200 else 20
            }
        ]
        
        # Simulate infrastructure impact
        infrastructure_impact = {
            'roads_affected': min(8, int(burned_area / 25)),
            'power_lines_threatened': min(12, int(burned_area / 20)),
            'communication_towers': min(3, int(burned_area / 100)),
            'water_sources_contaminated': min(5, int(burned_area / 50))
        }
        
        return jsonify({
            'success': True,
            'burned_area_polygons': generate_burn_polygons(center_lat, center_lng, burned_area),
            'villages_affected': villages_affected,
            'evacuation_routes': evacuation_routes,
            'infrastructure_impact': infrastructure_impact,
            'safe_zones': [
                {
                    'name': 'Emergency Shelter',
                    'coordinates': {'lat': center_lat - 0.02, 'lng': center_lng - 0.025},
                    'capacity': 500,
                    'type': 'shelter',
                    'status': 'available'
                },
                {
                    'name': 'District Hospital',
                    'coordinates': {'lat': center_lat - 0.015, 'lng': center_lng + 0.02},
                    'capacity': 200,
                    'type': 'medical',
                    'status': 'available'
                }
            ],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/explain3D', methods=['POST'])
def explain_3d_fire():
    """Generate explanations for 3D fire behavior"""
    try:
        data = request.get_json()
        
        # Extract environmental factors
        wind_speed = data.get('wind_speed', 15)
        temperature = data.get('temperature', 30)
        humidity = data.get('humidity', 50)
        elevation = data.get('elevation', 1500)
        
        # Calculate factor influences
        wind_influence = min(100, (wind_speed / 30) * 100)
        temperature_influence = min(100, ((temperature - 20) / 30) * 100)
        humidity_influence = max(0, 100 - humidity)
        slope_influence = min(100, (elevation / 3000) * 100)
        
        # Generate factor explanations with 3D coordinates
        factor_explanations = [
            {
                'factor': 'wind',
                'influence_percent': wind_influence,
                'description': f'Wind speed of {wind_speed} km/h increases fire spread rate by {wind_influence:.0f}%',
                'visualization_coords': {
                    'lat': data.get('lat', 30.0) - 0.002,
                    'lng': data.get('lng', 79.0) - 0.001,
                    'elevation_offset': 15
                },
                'color_code': '#60A5FA',
                'icon': '🌪️'
            },
            {
                'factor': 'vegetation_dryness',
                'influence_percent': humidity_influence,
                'description': f'Low humidity ({humidity}%) creates dry conditions, increasing fire risk by {humidity_influence:.0f}%',
                'visualization_coords': {
                    'lat': data.get('lat', 30.0) + 0.001,
                    'lng': data.get('lng', 79.0) + 0.002,
                    'elevation_offset': 12
                },
                'color_code': '#22C55E',
                'icon': '🌱'
            },
            {
                'factor': 'terrain_slope',
                'influence_percent': slope_influence,
                'description': f'Elevated terrain ({elevation}m) affects fire upslope spread by {slope_influence:.0f}%',
                'visualization_coords': {
                    'lat': data.get('lat', 30.0),
                    'lng': data.get('lng', 79.0),
                    'elevation_offset': 20
                },
                'color_code': '#92400E',
                'icon': '⛰️'
            },
            {
                'factor': 'temperature',
                'influence_percent': temperature_influence,
                'description': f'High temperature ({temperature}°C) increases fuel dryness by {temperature_influence:.0f}%',
                'visualization_coords': {
                    'lat': data.get('lat', 30.0) + 0.002,
                    'lng': data.get('lng', 79.0) - 0.002,
                    'elevation_offset': 18
                },
                'color_code': '#EF4444',
                'icon': '🌡️'
            }
        ]
        
        # Generate trust score
        total_influence = sum(f['influence_percent'] for f in factor_explanations)
        trust_score = min(100, max(60, 100 - (abs(total_influence - 200) / 4)))
        
        return jsonify({
            'success': True,
            'factor_explanations': factor_explanations,
            'trust_score': trust_score,
            'explanation_summary': f'Fire behavior is primarily driven by {factor_explanations[0]["factor"]} ({factor_explanations[0]["influence_percent"]:.0f}% influence)',
            'confidence_level': 'high' if trust_score > 80 else 'moderate' if trust_score > 60 else 'low',
            'visualization_labels': [
                {
                    'text': f'{f["icon"]} {f["factor"].title()}',
                    'position': f['visualization_coords'],
                    'weight': f['influence_percent'],
                    'color': f['color_code']
                } for f in factor_explanations
            ],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def generate_elevation_data(lat, lng, spread_factor):
    """Generate elevation data for 3D terrain"""
    base_elevation = 1500 + np.random.normal(0, 200)
    
    return {
        'min_elevation': float(base_elevation - 100),
        'max_elevation': float(base_elevation + 300),
        'mean_elevation': float(base_elevation),
        'slope_degrees': float(np.random.uniform(5, 25)),
        'aspect_degrees': float(np.random.uniform(0, 360))
    }

def generate_terrain_data(lat, lng):
    """Generate 3D terrain mesh data"""
    grid_size = 50
    terrain_data = []
    
    for i in range(grid_size):
        row = []
        for j in range(grid_size):
            # Generate realistic height values
            x = (i - grid_size/2) * 0.1
            z = (j - grid_size/2) * 0.1
            
            height = (
                np.sin(x * 0.3) * np.cos(z * 0.3) * 5 +
                np.sin(x * 0.1) * np.cos(z * 0.1) * 15 +
                np.random.normal(0, 2)
            )
            
            row.append({
                'x': x,
                'y': max(0, height),
                'z': z,
                'vegetation_type': 'forest' if height > 5 else 'grassland',
                'fuel_load': np.random.uniform(2, 8)
            })
        terrain_data.append(row)
    
    return {
        'grid_data': terrain_data,
        'grid_size': grid_size,
        'coordinate_bounds': {
            'min_lat': lat - 0.01,
            'max_lat': lat + 0.01,
            'min_lng': lng - 0.01,
            'max_lng': lng + 0.01
        }
    }

def generate_burn_polygons(center_lat, center_lng, burned_area):
    """Generate polygon coordinates for burned areas"""
    # Calculate radius from area (assuming circular burn)
    radius_deg = np.sqrt(burned_area / 100) * 0.001  # Rough conversion
    
    polygons = []
    
    # Current burn area
    current_burn = []
    for angle in np.linspace(0, 2*np.pi, 16):
        current_burn.append({
            'lat': center_lat + radius_deg * np.cos(angle),
            'lng': center_lng + radius_deg * np.sin(angle)
        })
    
    polygons.append({
        'type': 'current_burn',
        'coordinates': current_burn,
        'area_hectares': burned_area
    })
    
    # Future burn prediction (larger area)
    if burned_area > 50:
        future_radius = radius_deg * 1.5
        future_burn = []
        for angle in np.linspace(0, 2*np.pi, 16):
            future_burn.append({
                'lat': center_lat + future_radius * np.cos(angle),
                'lng': center_lng + future_radius * np.sin(angle)
            })
        
        polygons.append({
            'type': 'predicted_burn',
            'coordinates': future_burn,
            'area_hectares': burned_area * 2.25
        })
    
    return polygons

@app.route('/api/ml/explain', methods=['POST'])
def explain_fire_behavior():
    """API endpoint for AI explainability - explains why fire spreads in certain patterns"""
    try:
        data = request.get_json()
        
        # Extract environmental conditions
        wind_speed = data.get('wind_speed', 15)
        wind_direction = data.get('wind_direction', 'NE')
        humidity = data.get('humidity', 50)
        slope = data.get('slope', 15)
        temperature = data.get('temperature', 30)
        
        # Calculate factor weights using realistic fire behavior models
        wind_weight = min(60, wind_speed * 2.5)
        dryness_weight = min(50, (100 - humidity) * 0.7)
        slope_weight = min(30, slope * 1.8)
        temp_weight = min(25, max(0, (temperature - 20) * 0.8))
        
        total_weight = wind_weight + dryness_weight + slope_weight + temp_weight
        
        # Normalize to percentages
        factor_weights = {
            'wind': round((wind_weight / total_weight) * 100, 1),
            'dryness': round((dryness_weight / total_weight) * 100, 1),
            'slope': round((slope_weight / total_weight) * 100, 1),
            'temperature': round((temp_weight / total_weight) * 100, 1)
        }
        
        # Calculate confidence score
        confidence_score = min(95, max(65, 85 + (total_weight - 120) * 0.12))
        
        # Generate plain language explanation
        dominant_factor = max(factor_weights.items(), key=lambda x: x[1])
        
        direction_map = {
            'N': 'north', 'NE': 'northeast', 'E': 'east', 'SE': 'southeast',
            'S': 'south', 'SW': 'southwest', 'W': 'west', 'NW': 'northwest'
        }
        
        direction = direction_map.get(wind_direction, 'northeast')
        
        explanation = f"Fire is moving {direction} due to "
        
        factors = []
        if wind_speed > 15:
            factors.append(f"{wind_speed} km/h winds")
        if humidity < 40:
            factors.append(f"dry vegetation ({humidity}% humidity)")
        if slope > 10:
            factors.append(f"{slope}° upward slope")
        if temperature > 30:
            factors.append(f"high temperature ({temperature}°C)")
        
        explanation += ", ".join(factors) + ". "
        
        if dominant_factor[0] == 'wind':
            explanation += "Wind is the dominant factor driving rapid spread."
        elif dominant_factor[0] == 'dryness':
            explanation += "Vegetation dryness is the primary concern for fire intensity."
        elif dominant_factor[0] == 'slope':
            explanation += "Terrain slope is significantly affecting uphill fire movement."
        else:
            explanation += "Temperature is contributing to increased fire behavior."
        
        return jsonify({
            'success': True,
            'confidence_score': confidence_score,
            'factor_weights': factor_weights,
            'explanation': explanation,
            'environmental_conditions': {
                'wind_speed': wind_speed,
                'wind_direction': wind_direction,
                'humidity': humidity,
                'slope': slope,
                'temperature': temperature
            },
            'dominant_factor': dominant_factor[0],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/whatif', methods=['POST'])
def whatif_simulation():
    """API endpoint for What-If scenario testing"""
    try:
        data = request.get_json()
        
        # Extract modified conditions
        modified_conditions = {
            'wind_speed': data.get('wind_speed', 15),
            'wind_direction': data.get('wind_direction', 'NE'),
            'humidity': data.get('humidity', 50),
            'slope': data.get('slope', 15),
            'temperature': data.get('temperature', 30)
        }
        
        # Get baseline conditions
        baseline_conditions = data.get('baseline', {
            'wind_speed': 22,
            'wind_direction': 'NE',
            'humidity': 28,
            'slope': 15,
            'temperature': 34
        })
        
        # Calculate fire behavior differences
        baseline_spread_rate = calculate_spread_rate(baseline_conditions)
        modified_spread_rate = calculate_spread_rate(modified_conditions)
        
        # Generate ghost trail coordinates (simplified)
        ghost_trail_coords = generate_ghost_trail(modified_conditions)
        
        # Calculate scenario comparison metrics
        spread_rate_change = ((modified_spread_rate - baseline_spread_rate) / baseline_spread_rate) * 100
        burn_area_change = spread_rate_change * 1.5  # Simplified relationship
        
        comparison_metrics = {
            'spread_rate': {
                'baseline': round(baseline_spread_rate, 2),
                'modified': round(modified_spread_rate, 2),
                'change_percent': round(spread_rate_change, 1)
            },
            'burn_area_6h': {
                'baseline': round(baseline_spread_rate * 6 * 10, 0),  # hectares
                'modified': round(modified_spread_rate * 6 * 10, 0),
                'change_percent': round(burn_area_change, 1)
            },
            'direction': {
                'baseline': baseline_conditions['wind_direction'],
                'modified': modified_conditions['wind_direction'],
                'changed': baseline_conditions['wind_direction'] != modified_conditions['wind_direction']
            }
        }
        
        return jsonify({
            'success': True,
            'ghost_trail_coordinates': ghost_trail_coords,
            'comparison_metrics': comparison_metrics,
            'modified_conditions': modified_conditions,
            'baseline_conditions': baseline_conditions,
            'impact_summary': generate_impact_summary(comparison_metrics),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/replay-explanation', methods=['POST'])
def replay_explanation():
    """API endpoint for step-by-step fire spread explanation"""
    try:
        data = request.get_json()
        
        hour = data.get('hour', 0)
        base_conditions = data.get('conditions', {})
        
        # Generate hour-specific explanations and conditions
        replay_data = generate_replay_data(hour, base_conditions)
        
        return jsonify({
            'success': True,
            'hour': hour,
            'explanation': replay_data['explanation'],
            'conditions': replay_data['conditions'],
            'factor_changes': replay_data['factor_changes'],
            'fire_behavior_metrics': replay_data['metrics'],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def calculate_spread_rate(conditions):
    """Calculate fire spread rate based on environmental conditions"""
    wind_factor = conditions['wind_speed'] / 30  # Normalized to 0-1
    humidity_factor = (100 - conditions['humidity']) / 100
    slope_factor = conditions['slope'] / 45
    temp_factor = max(0, (conditions['temperature'] - 20) / 25)
    
    # Base spread rate (km/h)
    base_rate = 1.5
    
    # Apply multipliers
    spread_rate = base_rate * (1 + wind_factor * 1.5 + humidity_factor * 0.8 + slope_factor * 0.6 + temp_factor * 0.4)
    
    return min(8.0, spread_rate)  # Cap at 8 km/h

def generate_ghost_trail(conditions):
    """Generate coordinates for ghost fire trail visualization"""
    # Simplified ghost trail generation
    base_lat, base_lng = 30.0668, 79.0193
    
    # Calculate spread direction based on wind
    direction_offsets = {
        'N': (0.01, 0), 'NE': (0.007, 0.007), 'E': (0, 0.01),
        'SE': (-0.007, 0.007), 'S': (-0.01, 0), 'SW': (-0.007, -0.007),
        'W': (0, -0.01), 'NW': (0.007, -0.007)
    }
    
    lat_offset, lng_offset = direction_offsets.get(conditions['wind_direction'], (0.007, 0.007))
    
    # Scale by wind speed and other factors
    wind_multiplier = conditions['wind_speed'] / 20
    lat_offset *= wind_multiplier
    lng_offset *= wind_multiplier
    
    trail_coords = []
    for i in range(6):  # 6 hour progression
        progress = (i + 1) / 6
        trail_coords.append({
            'lat': base_lat + lat_offset * progress,
            'lng': base_lng + lng_offset * progress,
            'hour': i + 1,
            'intensity': min(100, 30 + i * 12)
        })
    
    return trail_coords

def generate_impact_summary(metrics):
    """Generate human-readable impact summary"""
    spread_change = metrics['spread_rate']['change_percent']
    area_change = metrics['burn_area_6h']['change_percent']
    
    if spread_change < -10:
        impact = "Significant improvement: fire spread would be much slower"
    elif spread_change < -5:
        impact = "Moderate improvement: fire spread would be reduced"
    elif spread_change < 5:
        impact = "Minimal change: fire behavior would be similar"
    elif spread_change < 15:
        impact = "Moderate worsening: fire would spread faster"
    else:
        impact = "Significant worsening: fire would spread much faster"
    
    return impact

def generate_replay_data(hour, base_conditions):
    """Generate realistic replay data for each hour"""
    
    # Hour-specific events and conditions
    events = [
        {
            'explanation': "Fire ignition detected. Initial spread driven by ambient conditions.",
            'conditions_change': {},
            'metrics': {'spread_rate': 1.2, 'intensity': 30, 'area': 15}
        },
        {
            'explanation': "Wind speed increases to 22 km/h. Fire accelerates northeast.",
            'conditions_change': {'wind_speed': 22},
            'metrics': {'spread_rate': 2.1, 'intensity': 45, 'area': 45}
        },
        {
            'explanation': "Humidity drops to 25%. Vegetation becomes critically dry.",
            'conditions_change': {'humidity': 25},
            'metrics': {'spread_rate': 2.8, 'intensity': 60, 'area': 85}
        },
        {
            'explanation': "Fire encounters 20° slope. Uphill spread rate doubles.",
            'conditions_change': {'slope': 20},
            'metrics': {'spread_rate': 3.2, 'intensity': 75, 'area': 140}
        },
        {
            'explanation': "Temperature peaks at 36°C. Maximum fire intensity reached.",
            'conditions_change': {'temperature': 36},
            'metrics': {'spread_rate': 3.8, 'intensity': 90, 'area': 210}
        },
        {
            'explanation': "Wind direction shifts slightly. Fire spread pattern adjusts.",
            'conditions_change': {'wind_direction': 'E'},
            'metrics': {'spread_rate': 3.5, 'intensity': 85, 'area': 285}
        },
        {
            'explanation': "Fire behavior stabilizes. Consistent northeast progression.",
            'conditions_change': {},
            'metrics': {'spread_rate': 3.3, 'intensity': 80, 'area': 365}
        }
    ]
    
    if hour >= len(events):
        hour = len(events) - 1
    
    event = events[hour]
    
    # Calculate updated conditions
    updated_conditions = base_conditions.copy()
    updated_conditions.update(event['conditions_change'])
    
    # Calculate factor changes
    factor_changes = {}
    for key, value in event['conditions_change'].items():
        if key in base_conditions:
            old_value = base_conditions[key]
            if isinstance(old_value, (int, float)):
                change_percent = ((value - old_value) / old_value) * 100
                factor_changes[key] = round(change_percent, 1)
    
    return {
        'explanation': event['explanation'],
        'conditions': updated_conditions,
        'factor_changes': factor_changes,
        'metrics': event['metrics']
    }

@app.route('/api/ml/explain', methods=['POST'])
def explain_fire_behavior():
    """API endpoint for AI explainability - explains why fire spreads in certain patterns"""
    try:
        data = request.get_json()
        
        # Extract environmental conditions
        wind_speed = data.get('wind_speed', 15)
        wind_direction = data.get('wind_direction', 'NE')
        humidity = data.get('humidity', 50)
        slope = data.get('slope', 15)
        temperature = data.get('temperature', 30)
        
        # Calculate factor weights using realistic fire behavior models
        wind_weight = min(60, wind_speed * 2.5)
        dryness_weight = min(50, (100 - humidity) * 0.7)
        slope_weight = min(30, slope * 1.8)
        temp_weight = min(25, max(0, (temperature - 20) * 0.8))
        
        total_weight = wind_weight + dryness_weight + slope_weight + temp_weight
        
        # Normalize to percentages
        factor_weights = {
            'wind': round((wind_weight / total_weight) * 100, 1),
            'dryness': round((dryness_weight / total_weight) * 100, 1),
            'slope': round((slope_weight / total_weight) * 100, 1),
            'temperature': round((temp_weight / total_weight) * 100, 1)
        }
        
        # Calculate confidence score
        confidence_score = min(95, max(65, 85 + (total_weight - 120) * 0.12))
        
        # Generate plain language explanation
        dominant_factor = max(factor_weights.items(), key=lambda x: x[1])
        
        direction_map = {
            'N': 'north', 'NE': 'northeast', 'E': 'east', 'SE': 'southeast',
            'S': 'south', 'SW': 'southwest', 'W': 'west', 'NW': 'northwest'
        }
        
        direction = direction_map.get(wind_direction, 'northeast')
        
        explanation = f"Fire is moving {direction} due to "
        
        factors = []
        if wind_speed > 15:
            factors.append(f"{wind_speed} km/h winds")
        if humidity < 40:
            factors.append(f"dry vegetation ({humidity}% humidity)")
        if slope > 10:
            factors.append(f"{slope}° upward slope")
        if temperature > 30:
            factors.append(f"high temperature ({temperature}°C)")
        
        explanation += ", ".join(factors) + ". "
        
        if dominant_factor[0] == 'wind':
            explanation += "Wind is the dominant factor driving rapid spread."
        elif dominant_factor[0] == 'dryness':
            explanation += "Vegetation dryness is the primary concern for fire intensity."
        elif dominant_factor[0] == 'slope':
            explanation += "Terrain slope is significantly affecting uphill fire movement."
        else:
            explanation += "Temperature is contributing to increased fire behavior."
        
        return jsonify({
            'success': True,
            'confidence_score': confidence_score,
            'factor_weights': factor_weights,
            'explanation': explanation,
            'environmental_conditions': {
                'wind_speed': wind_speed,
                'wind_direction': wind_direction,
                'humidity': humidity,
                'slope': slope,
                'temperature': temperature
            },
            'dominant_factor': dominant_factor[0],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/whatif', methods=['POST'])
def whatif_simulation():
    """API endpoint for What-If scenario testing"""
    try:
        data = request.get_json()
        
        # Extract modified conditions
        modified_conditions = {
            'wind_speed': data.get('wind_speed', 15),
            'wind_direction': data.get('wind_direction', 'NE'),
            'humidity': data.get('humidity', 50),
            'slope': data.get('slope', 15),
            'temperature': data.get('temperature', 30)
        }
        
        # Get baseline conditions
        baseline_conditions = data.get('baseline', {
            'wind_speed': 22,
            'wind_direction': 'NE',
            'humidity': 32,
            'slope': 15,
            'temperature': 34
        })
        
        # Calculate fire behavior differences
        baseline_spread_rate = calculate_spread_rate(baseline_conditions)
        modified_spread_rate = calculate_spread_rate(modified_conditions)
        
        # Generate ghost trail coordinates (simplified)
        ghost_trail_coords = generate_ghost_trail(modified_conditions)
        
        # Calculate scenario comparison metrics
        spread_rate_change = ((modified_spread_rate - baseline_spread_rate) / baseline_spread_rate) * 100
        burn_area_change = spread_rate_change * 1.5  # Simplified relationship
        
        comparison_metrics = {
            'spread_rate': {
                'baseline': round(baseline_spread_rate, 2),
                'modified': round(modified_spread_rate, 2),
                'change_percent': round(spread_rate_change, 1)
            },
            'burn_area_6h': {
                'baseline': round(baseline_spread_rate * 6 * 10, 0),  # hectares
                'modified': round(modified_spread_rate * 6 * 10, 0),
                'change_percent': round(burn_area_change, 1)
            },
            'direction': {
                'baseline': baseline_conditions['wind_direction'],
                'modified': modified_conditions['wind_direction'],
                'changed': baseline_conditions['wind_direction'] != modified_conditions['wind_direction']
            }
        }
        
        return jsonify({
            'success': True,
            'ghost_trail_coordinates': ghost_trail_coords,
            'comparison_metrics': comparison_metrics,
            'modified_conditions': modified_conditions,
            'baseline_conditions': baseline_conditions,
            'impact_summary': generate_impact_summary(comparison_metrics),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/replay-explanation', methods=['POST'])
def replay_explanation():
    """API endpoint for step-by-step fire spread explanation"""
    try:
        data = request.get_json()
        
        hour = data.get('hour', 0)
        base_conditions = data.get('conditions', {})
        
        # Generate hour-specific explanations and conditions
        replay_data = generate_replay_data(hour, base_conditions)
        
        return jsonify({
            'success': True,
            'hour': hour,
            'explanation': replay_data['explanation'],
            'conditions': replay_data['conditions'],
            'factor_changes': replay_data['factor_changes'],
            'fire_behavior_metrics': replay_data['metrics'],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def calculate_spread_rate(conditions):
    """Calculate fire spread rate based on environmental conditions"""
    wind_factor = conditions['wind_speed'] / 30  # Normalized to 0-1
    humidity_factor = (100 - conditions['humidity']) / 100
    slope_factor = conditions['slope'] / 45
    temp_factor = max(0, (conditions['temperature'] - 20) / 25)
    
    # Base spread rate (km/h)
    base_rate = 1.5
    
    # Apply multipliers
    spread_rate = base_rate * (1 + wind_factor * 1.5 + humidity_factor * 0.8 + slope_factor * 0.6 + temp_factor * 0.4)
    
    return min(8.0, spread_rate)  # Cap at 8 km/h

def generate_ghost_trail(conditions):
    """Generate coordinates for ghost fire trail visualization"""
    # Simplified ghost trail generation
    base_lat, base_lng = 30.0668, 79.0193
    
    # Calculate spread direction based on wind
    direction_offsets = {
        'N': (0.01, 0), 'NE': (0.007, 0.007), 'E': (0, 0.01),
        'SE': (-0.007, 0.007), 'S': (-0.01, 0), 'SW': (-0.007, -0.007),
        'W': (0, -0.01), 'NW': (0.007, -0.007)
    }
    
    lat_offset, lng_offset = direction_offsets.get(conditions['wind_direction'], (0.007, 0.007))
    
    # Scale by wind speed and other factors
    wind_multiplier = conditions['wind_speed'] / 20
    lat_offset *= wind_multiplier
    lng_offset *= wind_multiplier
    
    trail_coords = []
    for i in range(6):  # 6 hour progression
        progress = (i + 1) / 6
        trail_coords.append({
            'lat': base_lat + lat_offset * progress,
            'lng': base_lng + lng_offset * progress,
            'hour': i + 1,
            'intensity': min(100, 30 + i * 12)
        })
    
    return trail_coords

def generate_impact_summary(metrics):
    """Generate human-readable impact summary"""
    spread_change = metrics['spread_rate']['change_percent']
    area_change = metrics['burn_area_6h']['change_percent']
    
    if spread_change < -10:
        impact = "Significant improvement: fire spread would be much slower"
    elif spread_change < -5:
        impact = "Moderate improvement: fire spread would be reduced"
    elif spread_change < 5:
        impact = "Minimal change: fire behavior would be similar"
    elif spread_change < 15:
        impact = "Moderate worsening: fire would spread faster"
    else:
        impact = "Significant worsening: fire would spread much faster"
    
    return impact

def generate_replay_data(hour, base_conditions):
    """Generate realistic replay data for each hour"""
    
    # Hour-specific events and conditions
    events = [
        {
            'explanation': "Fire ignition detected. Initial spread driven by ambient conditions.",
            'conditions_change': {},
            'metrics': {'spread_rate': 1.2, 'intensity': 30, 'area': 15}
        },
        {
            'explanation': "Wind speed increases to 22 km/h. Fire accelerates northeast.",
            'conditions_change': {'wind_speed': 22},
            'metrics': {'spread_rate': 2.1, 'intensity': 45, 'area': 45}
        },
        {
            'explanation': "Humidity drops to 25%. Vegetation becomes critically dry.",
            'conditions_change': {'humidity': 25},
            'metrics': {'spread_rate': 2.8, 'intensity': 60, 'area': 85}
        },
        {
            'explanation': "Fire encounters 20° slope. Uphill spread rate doubles.",
            'conditions_change': {'slope': 20},
            'metrics': {'spread_rate': 3.2, 'intensity': 75, 'area': 140}
        },
        {
            'explanation': "Temperature peaks at 36°C. Maximum fire intensity reached.",
            'conditions_change': {'temperature': 36},
            'metrics': {'spread_rate': 3.8, 'intensity': 90, 'area': 210}
        },
        {
            'explanation': "Wind direction shifts slightly. Fire spread pattern adjusts.",
            'conditions_change': {'wind_direction': 'E'},
            'metrics': {'spread_rate': 3.5, 'intensity': 85, 'area': 285}
        },
        {
            'explanation': "Fire behavior stabilizes. Consistent northeast progression.",
            'conditions_change': {},
            'metrics': {'spread_rate': 3.3, 'intensity': 80, 'area': 365}
        }
    ]
    
    if hour >= len(events):
        hour = len(events) - 1
    
    event = events[hour]
    
    # Calculate updated conditions
    updated_conditions = base_conditions.copy()
    updated_conditions.update(event['conditions_change'])
    
    # Calculate factor changes
    factor_changes = {}
    for key, value in event['conditions_change'].items():
        if key in base_conditions:
            old_value = base_conditions[key]
            if isinstance(old_value, (int, float)):
                change_percent = ((value - old_value) / old_value) * 100
                factor_changes[key] = round(change_percent, 1)
    
    return {
        'explanation': event['explanation'],
        'conditions': updated_conditions,
        'factor_changes': factor_changes,
        'metrics': event['metrics']
    }

@app.route('/api/ml/recovery/generate-plan', methods=['POST'])
def generate_recovery_plan():
    """Generate post-fire recovery and reforestation plan"""
    try:
        data = request.get_json()
        
        burned_area = data.get('burned_area_hectares', 150)
        vegetation_type = data.get('vegetation_type', 'native-mix')
        soil_condition = data.get('soil_condition', 'moderate_damage')
        climate_zone = data.get('climate_zone', 'temperate_himalayan')
        
        # Generate species recommendations
        species_recommendations = generate_species_recommendations(vegetation_type, climate_zone)
        
        # Calculate priority zones
        priority_zones = calculate_recovery_priority_zones(burned_area, soil_condition)
        
        # Generate timeline
        recovery_timeline = generate_recovery_timeline(burned_area, vegetation_type)
        
        # Calculate sustainability metrics
        sustainability_metrics = calculate_post_fire_sustainability(burned_area, vegetation_type)
        
        return jsonify({
            'success': True,
            'recovery_plan': {
                'burned_area_hectares': burned_area,
                'vegetation_type': vegetation_type,
                'species_recommendations': species_recommendations,
                'priority_zones': priority_zones,
                'recovery_timeline': recovery_timeline,
                'sustainability_metrics': sustainability_metrics,
                'planting_schedule': generate_planting_schedule(burned_area),
                'maintenance_plan': generate_maintenance_plan(vegetation_type)
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/recovery/funding-analysis', methods=['POST'])
def analyze_funding_options():
    """Analyze funding options for post-fire recovery projects"""
    try:
        data = request.get_json()
        
        project_area = data.get('project_area_hectares', 150)
        vegetation_type = data.get('vegetation_type', 'mixed_forest')
        recovery_scope = data.get('recovery_scope', 'comprehensive')
        
        # Calculate project costs
        cost_analysis = calculate_recovery_costs(project_area, vegetation_type, recovery_scope)
        
        # Generate funding options
        funding_options = generate_funding_options(cost_analysis['total_cost'], project_area)
        
        # Calculate ROI metrics
        roi_metrics = calculate_recovery_roi(project_area, vegetation_type, cost_analysis['total_cost'])
        
        return jsonify({
            'success': True,
            'funding_analysis': {
                'cost_breakdown': cost_analysis,
                'funding_options': funding_options,
                'roi_metrics': roi_metrics,
                'carbon_credits_potential': calculate_carbon_credits_potential(project_area, vegetation_type),
                'grant_recommendations': get_grant_recommendations(project_area, vegetation_type)
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/recovery/climate-impact', methods=['POST'])
def calculate_climate_impact():
    """Calculate climate action impact of recovery projects"""
    try:
        data = request.get_json()
        
        project_area = data.get('project_area_hectares', 150)
        vegetation_type = data.get('vegetation_type', 'mixed_forest')
        time_horizon = data.get('time_horizon_years', 30)
        
        # Calculate carbon sequestration over time
        carbon_impact = calculate_long_term_carbon_impact(project_area, vegetation_type, time_horizon)
        
        # Calculate biodiversity recovery
        biodiversity_impact = calculate_biodiversity_recovery(project_area, vegetation_type, time_horizon)
        
        # Calculate ecosystem services value
        ecosystem_services = calculate_ecosystem_services_value(project_area, vegetation_type, time_horizon)
        
        # Climate resilience metrics
        resilience_metrics = calculate_climate_resilience(project_area, vegetation_type)
        
        return jsonify({
            'success': True,
            'climate_impact': {
                'carbon_sequestration': carbon_impact,
                'biodiversity_recovery': biodiversity_impact,
                'ecosystem_services_value': ecosystem_services,
                'climate_resilience': resilience_metrics,
                'temperature_regulation': calculate_temperature_regulation(project_area),
                'water_cycle_benefits': calculate_water_cycle_benefits(project_area),
                'air_quality_improvement': calculate_air_quality_improvement(project_area)
            },
            'time_horizon_years': time_horizon,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def generate_species_recommendations(vegetation_type, climate_zone):
    """Generate species recommendations for reforestation"""
    species_database = {
        'native-mix': {
            'primary': [
                {'name': 'Himalayan Oak (Quercus leucotrichophora)', 'survival_rate': 0.85, 'growth_rate': 'moderate', 'carbon_sequestration': 25},
                {'name': 'Himalayan Pine (Pinus wallichiana)', 'survival_rate': 0.80, 'growth_rate': 'fast', 'carbon_sequestration': 30},
                {'name': 'Deodar Cedar (Cedrus deodara)', 'survival_rate': 0.75, 'growth_rate': 'slow', 'carbon_sequestration': 35}
            ],
            'secondary': [
                {'name': 'Rhododendron (Rhododendron arboreum)', 'survival_rate': 0.90, 'growth_rate': 'moderate', 'carbon_sequestration': 15},
                {'name': 'Himalayan Birch (Betula utilis)', 'survival_rate': 0.85, 'growth_rate': 'fast', 'carbon_sequestration': 20},
                {'name': 'Maple (Acer caesium)', 'survival_rate': 0.80, 'growth_rate': 'moderate', 'carbon_sequestration': 18}
            ],
            'ground_cover': [
                {'name': 'Lantana camara', 'survival_rate': 0.95, 'growth_rate': 'fast', 'erosion_control': 'excellent'},
                {'name': 'Berberis aristata', 'survival_rate': 0.90, 'growth_rate': 'moderate', 'wildlife_value': 'high'},
                {'name': 'Indigofera heterantha', 'survival_rate': 0.85, 'growth_rate': 'fast', 'nitrogen_fixing': True}
            ]
        },
        'coniferous': {
            'primary': [
                {'name': 'Deodar Cedar (Cedrus deodara)', 'survival_rate': 0.75, 'growth_rate': 'slow', 'carbon_sequestration': 35},
                {'name': 'Blue Pine (Pinus wallichiana)', 'survival_rate': 0.80, 'growth_rate': 'fast', 'carbon_sequestration': 30},
                {'name': 'Spruce (Picea smithiana)', 'survival_rate': 0.70, 'growth_rate': 'moderate', 'carbon_sequestration': 32}
            ],
            'secondary': [
                {'name': 'Fir (Abies pindrow)', 'survival_rate': 0.75, 'growth_rate': 'slow', 'carbon_sequestration': 28},
                {'name': 'Juniper (Juniperus communis)', 'survival_rate': 0.85, 'growth_rate': 'slow', 'drought_tolerance': 'high'}
            ]
        },
        'fire-resistant': {
            'primary': [
                {'name': 'Oak species (Quercus)', 'survival_rate': 0.85, 'growth_rate': 'moderate', 'fire_resistance': 'high'},
                {'name': 'Aspen (Populus tremula)', 'survival_rate': 0.80, 'growth_rate': 'fast', 'fire_resistance': 'moderate'},
                {'name': 'Birch (Betula utilis)', 'survival_rate': 0.85, 'growth_rate': 'fast', 'fire_resistance': 'moderate'}
            ]
        }
    }
    
    return species_database.get(vegetation_type, species_database['native-mix'])

def calculate_recovery_priority_zones(burned_area, soil_condition):
    """Calculate priority zones for recovery efforts"""
    # High priority: steep slopes, erosion-prone areas, water sources
    high_priority = burned_area * 0.35 if soil_condition == 'severe_damage' else burned_area * 0.25
    
    # Medium priority: moderately affected areas
    medium_priority = burned_area * 0.40
    
    # Low priority: less critical areas
    low_priority = burned_area - high_priority - medium_priority
    
    return {
        'high_priority_hectares': round(high_priority, 1),
        'medium_priority_hectares': round(medium_priority, 1),
        'low_priority_hectares': round(low_priority, 1),
        'priority_criteria': {
            'high': ['Steep slopes >30°', 'Near water sources', 'Severe erosion risk', 'Critical wildlife corridors'],
            'medium': ['Moderate slopes 15-30°', 'Moderate erosion risk', 'Important habitat areas'],
            'low': ['Gentle slopes <15°', 'Low erosion risk', 'Natural regeneration areas']
        }
    }

def generate_recovery_timeline(burned_area, vegetation_type):
    """Generate recovery timeline with milestones"""
    base_timelines = {
        'native-mix': {'initial': 18, 'establishment': 48, 'maturation': 120},
        'coniferous': {'initial': 24, 'establishment': 60, 'maturation': 180},
        'fire-resistant': {'initial': 12, 'establishment': 36, 'maturation': 96}
    }
    
    timeline = base_timelines.get(vegetation_type, base_timelines['native-mix'])
    
    # Adjust timeline based on area (larger areas take longer)
    area_factor = min(1.5, 1 + (burned_area - 100) / 1000)
    
    return {
        'immediate_response': {
            'duration_months': 6,
            'activities': ['Emergency erosion control', 'Site assessment', 'Soil stabilization', 'Access road creation'],
            'success_criteria': ['Erosion controlled', 'Site safety established', 'Planting plan approved']
        },
        'initial_establishment': {
            'duration_months': int(timeline['initial'] * area_factor),
            'activities': ['Seedling planting', 'Ground cover establishment', 'Irrigation setup', 'Protection measures'],
            'success_criteria': ['80% seedling survival', '50% ground cover', 'Protection systems active']
        },
        'growth_establishment': {
            'duration_months': int(timeline['establishment'] * area_factor),
            'activities': ['Maintenance', 'Thinning', 'Wildlife habitat creation', 'Trail development'],
            'success_criteria': ['Canopy closure 60%', 'Wildlife return', 'Self-sustaining growth']
        },
        'maturation': {
            'duration_months': int(timeline['maturation'] * area_factor),
            'activities': ['Selective harvesting', 'Biodiversity monitoring', 'Carbon credit verification'],
            'success_criteria': ['Full ecosystem function', 'Maximum carbon sequestration', 'Biodiversity targets met']
        }
    }

def calculate_post_fire_sustainability(burned_area, vegetation_type):
    """Calculate sustainability metrics for post-fire recovery"""
    carbon_rates = {
        'native-mix': 12,
        'coniferous': 15,
        'deciduous': 10,
        'fire-resistant': 8
    }
    
    carbon_rate = carbon_rates.get(vegetation_type, 12)
    annual_carbon_sequestration = burned_area * carbon_rate
    
    return {
        'annual_carbon_sequestration_tonnes': annual_carbon_sequestration,
        'biodiversity_recovery_percentage': min(95, 60 + (burned_area * 0.15)),
        'soil_health_improvement_percentage': min(90, 45 + (burned_area * 0.25)),
        'water_quality_improvement': 'significant' if burned_area > 100 else 'moderate',
        'erosion_reduction_percentage': min(85, 40 + (burned_area * 0.2)),
        'wildlife_habitat_quality': calculate_habitat_quality_score(burned_area, vegetation_type)
    }

def generate_planting_schedule(burned_area):
    """Generate optimal planting schedule"""
    return {
        'pre_monsoon': {
            'months': ['March', 'April', 'May'],
            'area_percentage': 30,
            'species_focus': 'Drought-tolerant species',
            'activities': ['Site preparation', 'Nursery establishment', 'Soil treatment']
        },
        'monsoon': {
            'months': ['June', 'July', 'August'],
            'area_percentage': 50,
            'species_focus': 'Main forest species',
            'activities': ['Primary planting', 'Seed broadcasting', 'Natural regeneration support']
        },
        'post_monsoon': {
            'months': ['September', 'October'],
            'area_percentage': 20,
            'species_focus': 'Gap filling and specialty species',
            'activities': ['Replacement planting', 'Maintenance', 'Protection setup']
        }
    }

def calculate_habitat_quality_score(burned_area, vegetation_type):
    """Calculate habitat quality score for wildlife recovery"""
    base_scores = {
        'native-mix': 85,
        'coniferous': 75,
        'deciduous': 80,
        'fire-resistant': 70
    }
    
    base_score = base_scores.get(vegetation_type, 75)
    area_bonus = min(15, burned_area * 0.05)  # Larger areas = better habitat connectivity
    
    return min(100, base_score + area_bonus)

@app.route('/api/ml/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'realtime_active': real_time_predictor.is_running,
        'models_loaded': True,
        'firevision_3d': True,
        'firesense_explainability': True,
        'recovery_assistance': True,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ml/start-realtime', methods=['POST'])
def start_realtime():
    """Start real-time prediction service"""
    try:
        real_time_predictor.start_continuous_prediction()
        return jsonify({
            'success': True,
            'message': 'Real-time prediction service started',
            'status': 'active'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Start real-time predictions automatically
    real_time_predictor.start_continuous_prediction()
    
    app.run(host='0.0.0.0', port=5001, debug=True)
