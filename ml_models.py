
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.optimizers import Adam
import json
import datetime
from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional
import requests
import warnings
warnings.filterwarnings('ignore')

@dataclass
class EnvironmentalData:
    """Data structure for environmental parameters"""
    temperature: float
    humidity: float
    wind_speed: float
    wind_direction: str
    ndvi: float
    elevation: float
    slope: float
    vegetation_density: str
    timestamp: datetime.datetime

class DataProcessor:
    """Handles data preprocessing and feature engineering"""
    
    def __init__(self):
        self.wind_direction_mapping = {
            'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
            'S': 180, 'SW': 225, 'W': 270, 'NW': 315
        }
        
        self.vegetation_mapping = {
            'sparse': 0.2, 'moderate': 0.5, 'dense': 0.8, 'very_dense': 1.0
        }
    
    def normalize_features(self, data: Dict) -> np.ndarray:
        """Normalize environmental features for ML model input"""
        # Temperature normalization (typical range: 0-50°C)
        temp_norm = min(max(data['temperature'] / 50.0, 0), 1)
        
        # Humidity normalization (0-100%)
        humidity_norm = data['humidity'] / 100.0
        
        # Wind speed normalization (typical max: 40 km/h)
        wind_norm = min(data['wind_speed'] / 40.0, 1)
        
        # Wind direction to radians
        wind_dir_degrees = self.wind_direction_mapping.get(data['wind_direction'], 0)
        wind_dir_norm = wind_dir_degrees / 360.0
        
        # NDVI is already normalized (0-1)
        ndvi_norm = data.get('ndvi', 0.5)
        
        # Elevation normalization (typical max: 4000m for Uttarakhand)
        elevation_norm = min(data.get('elevation', 1000) / 4000.0, 1)
        
        # Slope normalization (0-90 degrees)
        slope_norm = min(data.get('slope', 15) / 90.0, 1)
        
        # Vegetation density
        veg_norm = self.vegetation_mapping.get(data.get('vegetation_density', 'moderate'), 0.5)
        
        return np.array([temp_norm, humidity_norm, wind_norm, wind_dir_norm, 
                        ndvi_norm, elevation_norm, slope_norm, veg_norm])
    
    def calculate_fire_weather_index(self, temp: float, humidity: float, wind_speed: float) -> float:
        """Calculate Fire Weather Index (FWI) - simplified version"""
        # Fine Fuel Moisture Code (FFMC)
        ffmc = 85 + 0.4 * (temp - 20) - 0.5 * humidity
        ffmc = max(min(ffmc, 101), 0)
        
        # Duff Moisture Code (DMC) - simplified
        dmc = max(1, 50 - humidity * 0.5)
        
        # Drought Code (DC) - simplified
        dc = max(1, temp * 2 - humidity * 0.8)
        
        # Initial Spread Index (ISI)
        isi = 0.208 * ffmc * (0.05 + 0.1 * wind_speed)
        
        # Fire Weather Index
        fwi = 2 * np.log(isi + 1) + 0.45 * np.log(dmc + 1) + 0.15 * np.log(dc + 1)
        
        return min(max(fwi / 50.0, 0), 1)  # Normalize to 0-1

class ConvLSTMUNetModel:
    """Hybrid ConvLSTM + UNet model for fire risk prediction"""
    
    def __init__(self, input_shape=(64, 64, 8), sequence_length=5):
        self.input_shape = input_shape
        self.sequence_length = sequence_length
        self.model = None
        self.build_model()
    
    def build_model(self):
        """Build the hybrid ConvLSTM + UNet architecture"""
        # Input for environmental features
        env_input = layers.Input(shape=(8,), name='environmental_features')
        
        # Input for spatial data (satellite imagery simulation)
        spatial_input = layers.Input(shape=self.input_shape, name='spatial_features')
        
        # ConvLSTM branch for temporal patterns
        convlstm = layers.ConvLSTM2D(
            filters=32, kernel_size=3, padding='same', 
            return_sequences=False, activation='tanh'
        )(tf.expand_dims(spatial_input, axis=1))
        
        # UNet-style encoder
        conv1 = layers.Conv2D(64, 3, activation='relu', padding='same')(spatial_input)
        conv1 = layers.Conv2D(64, 3, activation='relu', padding='same')(conv1)
        pool1 = layers.MaxPooling2D(pool_size=(2, 2))(conv1)
        
        conv2 = layers.Conv2D(128, 3, activation='relu', padding='same')(pool1)
        conv2 = layers.Conv2D(128, 3, activation='relu', padding='same')(conv2)
        pool2 = layers.MaxPooling2D(pool_size=(2, 2))(conv2)
        
        # Bridge
        conv3 = layers.Conv2D(256, 3, activation='relu', padding='same')(pool2)
        conv3 = layers.Conv2D(256, 3, activation='relu', padding='same')(conv3)
        
        # UNet decoder
        up1 = layers.UpSampling2D(size=(2, 2))(conv3)
        up1 = layers.concatenate([up1, conv2])
        conv4 = layers.Conv2D(128, 3, activation='relu', padding='same')(up1)
        conv4 = layers.Conv2D(128, 3, activation='relu', padding='same')(conv4)
        
        up2 = layers.UpSampling2D(size=(2, 2))(conv4)
        up2 = layers.concatenate([up2, conv1])
        conv5 = layers.Conv2D(64, 3, activation='relu', padding='same')(up2)
        conv5 = layers.Conv2D(64, 3, activation='relu', padding='same')(conv5)
        
        # Combine ConvLSTM and UNet features
        combined_spatial = layers.Add()([convlstm, conv5])
        
        # Global features from spatial data
        global_features = layers.GlobalAveragePooling2D()(combined_spatial)
        
        # Environmental features processing
        env_features = layers.Dense(32, activation='relu')(env_input)
        env_features = layers.Dense(16, activation='relu')(env_features)
        
        # Combine all features
        combined = layers.concatenate([global_features, env_features])
        combined = layers.Dense(128, activation='relu')(combined)
        combined = layers.Dropout(0.3)(combined)
        combined = layers.Dense(64, activation='relu')(combined)
        
        # Output layers
        risk_output = layers.Dense(1, activation='sigmoid', name='fire_risk')(combined)
        
        # Spatial risk map output
        spatial_risk = layers.Conv2D(1, 1, activation='sigmoid', name='spatial_risk')(combined_spatial)
        
        self.model = models.Model(
            inputs=[env_input, spatial_input],
            outputs=[risk_output, spatial_risk]
        )
        
        self.model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss={
                'fire_risk': 'binary_crossentropy',
                'spatial_risk': 'binary_crossentropy'
            },
            metrics={
                'fire_risk': ['accuracy'],
                'spatial_risk': ['accuracy']
            }
        )
    
    def predict_fire_risk(self, env_data: Dict, spatial_data: Optional[np.ndarray] = None) -> Dict:
        """Predict fire risk based on environmental and spatial data"""
        if spatial_data is None:
            # Generate synthetic spatial data for demo
            spatial_data = self.generate_synthetic_spatial_data(env_data)
        
        # Normalize environmental features
        processor = DataProcessor()
        env_features = processor.normalize_features(env_data).reshape(1, -1)
        spatial_features = spatial_data.reshape(1, 64, 64, 8)
        
        # Make prediction
        risk_prob, spatial_risk = self.model.predict([env_features, spatial_features], verbose=0)
        
        # Calculate additional risk metrics
        fwi = processor.calculate_fire_weather_index(
            env_data['temperature'], 
            env_data['humidity'], 
            env_data['wind_speed']
        )
        
        return {
            'overall_risk': float(risk_prob[0][0]),
            'fire_weather_index': float(fwi),
            'spatial_risk_map': spatial_risk[0].tolist(),
            'confidence': float(max(risk_prob[0][0], 1 - risk_prob[0][0])),
            'risk_category': self.categorize_risk(risk_prob[0][0])
        }
    
    def generate_synthetic_spatial_data(self, env_data: Dict) -> np.ndarray:
        """Generate synthetic spatial data for demonstration"""
        # Create a 64x64x8 array representing different data layers
        spatial_data = np.random.random((64, 64, 8))
        
        # Layer 0-2: NDVI patterns
        ndvi_base = env_data.get('ndvi', 0.5)
        spatial_data[:, :, 0] = np.random.normal(ndvi_base, 0.1, (64, 64))
        spatial_data[:, :, 1] = np.random.normal(ndvi_base - 0.1, 0.05, (64, 64))  # NDVI delta
        spatial_data[:, :, 2] = np.random.normal(ndvi_base + 0.05, 0.08, (64, 64))  # Vegetation health
        
        # Layer 3-4: Temperature and humidity patterns
        temp_norm = env_data['temperature'] / 50.0
        humidity_norm = env_data['humidity'] / 100.0
        spatial_data[:, :, 3] = np.random.normal(temp_norm, 0.1, (64, 64))
        spatial_data[:, :, 4] = np.random.normal(humidity_norm, 0.1, (64, 64))
        
        # Layer 5-6: Terrain features
        elevation_norm = 0.5  # Simplified
        slope_norm = 0.3
        spatial_data[:, :, 5] = np.random.normal(elevation_norm, 0.2, (64, 64))
        spatial_data[:, :, 6] = np.random.normal(slope_norm, 0.15, (64, 64))
        
        # Layer 7: Human activity/burned area index
        spatial_data[:, :, 7] = np.random.beta(1, 5, (64, 64))  # Low human activity
        
        return np.clip(spatial_data, 0, 1)
    
    def categorize_risk(self, risk_score: float) -> str:
        """Categorize risk score into human-readable categories"""
        if risk_score >= 0.8:
            return "very-high"
        elif risk_score >= 0.6:
            return "high"
        elif risk_score >= 0.4:
            return "moderate"
        elif risk_score >= 0.2:
            return "low"
        else:
            return "very-low"

class CellularAutomataFireSpread:
    """Cellular Automata model for fire spread simulation"""
    
    def __init__(self, grid_size=(100, 100)):
        self.grid_size = grid_size
        self.grid = np.zeros(grid_size)
        self.fuel_map = np.random.beta(2, 2, grid_size)  # Fuel distribution
        self.elevation_map = np.random.normal(0.5, 0.2, grid_size)
        self.moisture_map = np.random.beta(3, 2, grid_size)
        
    def ignite_fire(self, x: int, y: int):
        """Start a fire at given coordinates"""
        if 0 <= x < self.grid_size[0] and 0 <= y < self.grid_size[1]:
            self.grid[x, y] = 1.0
    
    def spread_step(self, wind_speed: float, wind_direction: float, temperature: float, humidity: float):
        """Perform one step of fire spread simulation"""
        new_grid = self.grid.copy()
        
        # Convert wind direction to vector
        wind_x = np.cos(np.radians(wind_direction)) * wind_speed / 30.0
        wind_y = np.sin(np.radians(wind_direction)) * wind_speed / 30.0
        
        # Temperature and humidity effects
        temp_factor = min(temperature / 40.0, 1.5)
        humidity_factor = max(0.1, 1.0 - humidity / 100.0)
        
        for i in range(1, self.grid_size[0] - 1):
            for j in range(1, self.grid_size[1] - 1):
                if self.grid[i, j] > 0:  # If there's fire
                    # Check 8 neighbors
                    for di in [-1, 0, 1]:
                        for dj in [-1, 0, 1]:
                            if di == 0 and dj == 0:
                                continue
                            
                            ni, nj = i + di, j + dj
                            if 0 <= ni < self.grid_size[0] and 0 <= nj < self.grid_size[1]:
                                if new_grid[ni, nj] == 0:  # Unburned cell
                                    # Calculate spread probability
                                    base_prob = 0.1
                                    
                                    # Fuel availability
                                    fuel_factor = self.fuel_map[ni, nj]
                                    
                                    # Slope effect (fire spreads faster uphill)
                                    slope_factor = 1.0
                                    if self.elevation_map[ni, nj] > self.elevation_map[i, j]:
                                        slope_factor = 1.5
                                    elif self.elevation_map[ni, nj] < self.elevation_map[i, j]:
                                        slope_factor = 0.7
                                    
                                    # Wind effect
                                    wind_factor = 1.0
                                    if abs(di - wind_x) < 0.5 and abs(dj - wind_y) < 0.5:
                                        wind_factor = 1.8
                                    
                                    # Moisture effect
                                    moisture_factor = max(0.1, 1.0 - self.moisture_map[ni, nj])
                                    
                                    # Calculate total probability
                                    spread_prob = (base_prob * fuel_factor * slope_factor * 
                                                 wind_factor * temp_factor * humidity_factor * moisture_factor)
                                    
                                    if np.random.random() < spread_prob:
                                        new_grid[ni, nj] = 1.0
        
        # Fire decay (burned areas become less intense over time)
        self.grid = self.grid * 0.95
        self.grid = np.maximum(self.grid, new_grid)
        
        return self.calculate_spread_metrics()
    
    def calculate_spread_metrics(self) -> Dict:
        """Calculate metrics about fire spread"""
        burned_area = np.sum(self.grid > 0.1)
        total_cells = self.grid_size[0] * self.grid_size[1]
        
        # Calculate perimeter (simplified)
        fire_cells = self.grid > 0.1
        perimeter = 0
        for i in range(self.grid_size[0]):
            for j in range(self.grid_size[1]):
                if fire_cells[i, j]:
                    # Check if cell is on the edge of fire
                    neighbors = 0
                    for di in [-1, 0, 1]:
                        for dj in [-1, 0, 1]:
                            ni, nj = i + di, j + dj
                            if (0 <= ni < self.grid_size[0] and 0 <= nj < self.grid_size[1] 
                                and fire_cells[ni, nj]):
                                neighbors += 1
                    if neighbors < 9:  # Not completely surrounded
                        perimeter += 1
        
        return {
            'burned_area_hectares': burned_area * 0.25,  # Assuming each cell = 0.25 hectares
            'fire_perimeter_km': perimeter * 0.05,  # Rough conversion
            'fire_intensity': np.mean(self.grid[self.grid > 0]),
            'spread_rate': burned_area  # Simplified spread rate
        }

class NDVIAnalyzer:
    """NDVI Delta calculation and burned area estimation"""
    
    @staticmethod
    def calculate_ndvi_delta(ndvi_before: np.ndarray, ndvi_after: np.ndarray) -> Dict:
        """Calculate NDVI delta and estimate burned areas"""
        delta = ndvi_before - ndvi_after
        
        # Threshold for significant NDVI decrease (indicating possible burn)
        burn_threshold = 0.2
        potential_burns = delta > burn_threshold
        
        # Calculate Burned Area Index (BAI)
        bai = np.where(potential_burns, 
                      1.0 / ((0.1 - ndvi_after)**2 + (0.06 - ndvi_after)**2),
                      0)
        
        return {
            'ndvi_delta_mean': float(np.mean(delta)),
            'ndvi_delta_std': float(np.std(delta)),
            'potential_burn_area_percent': float(np.sum(potential_burns) / len(delta.flat) * 100),
            'burn_severity': float(np.mean(bai[bai > 0])) if np.any(bai > 0) else 0.0,
            'recovery_index': float(np.mean(ndvi_after[potential_burns])) if np.any(potential_burns) else 1.0
        }

class FireRiskPredictor:
    """Main class that orchestrates all ML components"""
    
    def __init__(self):
        self.convlstm_model = ConvLSTMUNetModel()
        self.ca_simulator = CellularAutomataFireSpread()
        self.data_processor = DataProcessor()
        
        # Simulated model weights (in production, load from trained model)
        self._initialize_pretrained_weights()
    
    def _initialize_pretrained_weights(self):
        """Initialize with simulated pre-trained weights"""
        # In production, you would load actual trained weights
        # For demo, we'll use the randomly initialized weights
        pass
    
    def predict_comprehensive_risk(self, environmental_data: Dict) -> Dict:
        """Comprehensive fire risk prediction"""
        # Primary ML prediction
        ml_prediction = self.convlstm_model.predict_fire_risk(environmental_data)
        
        # Traditional fire weather index
        fwi = self.data_processor.calculate_fire_weather_index(
            environmental_data['temperature'],
            environmental_data['humidity'], 
            environmental_data['wind_speed']
        )
        
        # Combine predictions with ensemble approach
        ensemble_risk = (ml_prediction['overall_risk'] * 0.7 + fwi * 0.3)
        
        return {
            'ensemble_risk_score': float(ensemble_risk),
            'ml_prediction': ml_prediction,
            'fire_weather_index': float(fwi),
            'risk_factors': self._analyze_risk_factors(environmental_data),
            'confidence_interval': self._calculate_confidence(ml_prediction),
            'recommendations': self._generate_recommendations(ensemble_risk, environmental_data)
        }
    
    def simulate_fire_spread(self, ignition_point: Tuple[int, int], 
                           environmental_data: Dict, duration_hours: int = 6) -> Dict:
        """Simulate fire spread using cellular automata"""
        # Initialize fire
        self.ca_simulator.ignite_fire(ignition_point[0], ignition_point[1])
        
        # Convert wind direction string to degrees
        wind_dir_map = {'N': 0, 'NE': 45, 'E': 90, 'SE': 135, 'S': 180, 'SW': 225, 'W': 270, 'NW': 315}
        wind_direction_deg = wind_dir_map.get(environmental_data['wind_direction'], 0)
        
        simulation_results = []
        
        # Run simulation for specified duration
        for hour in range(duration_hours):
            # Simulate hourly variations
            temp_variation = environmental_data['temperature'] + np.random.normal(0, 2)
            humidity_variation = max(10, environmental_data['humidity'] + np.random.normal(0, 5))
            wind_variation = max(0, environmental_data['wind_speed'] + np.random.normal(0, 3))
            
            # Perform spread step
            metrics = self.ca_simulator.spread_step(
                wind_variation, wind_direction_deg, temp_variation, humidity_variation
            )
            
            metrics['hour'] = hour
            metrics['temperature'] = temp_variation
            metrics['humidity'] = humidity_variation
            metrics['wind_speed'] = wind_variation
            
            simulation_results.append(metrics)
        
        return {
            'hourly_progression': simulation_results,
            'final_state': simulation_results[-1] if simulation_results else {},
            'fire_map': self.ca_simulator.grid.tolist()
        }
    
    def _analyze_risk_factors(self, env_data: Dict) -> Dict:
        """Analyze individual risk factors"""
        factors = {}
        
        # Temperature risk
        if env_data['temperature'] > 35:
            factors['temperature'] = 'high'
        elif env_data['temperature'] > 25:
            factors['temperature'] = 'moderate'
        else:
            factors['temperature'] = 'low'
        
        # Humidity risk (lower humidity = higher risk)
        if env_data['humidity'] < 30:
            factors['humidity'] = 'high'
        elif env_data['humidity'] < 50:
            factors['humidity'] = 'moderate'
        else:
            factors['humidity'] = 'low'
        
        # Wind risk
        if env_data['wind_speed'] > 25:
            factors['wind'] = 'high'
        elif env_data['wind_speed'] > 15:
            factors['wind'] = 'moderate'
        else:
            factors['wind'] = 'low'
        
        return factors
    
    def _calculate_confidence(self, prediction: Dict) -> Dict:
        """Calculate prediction confidence intervals"""
        base_confidence = prediction['confidence']
        
        return {
            'lower_bound': max(0, prediction['overall_risk'] - (1 - base_confidence) * 0.2),
            'upper_bound': min(1, prediction['overall_risk'] + (1 - base_confidence) * 0.2),
            'confidence_level': base_confidence
        }
    
    def _generate_recommendations(self, risk_score: float, env_data: Dict) -> List[str]:
        """Generate actionable recommendations based on risk assessment"""
        recommendations = []
        
        if risk_score > 0.8:
            recommendations.extend([
                "Implement immediate fire prevention measures",
                "Consider evacuation planning for high-risk areas",
                "Deploy additional fire monitoring resources",
                "Issue red flag warning to public"
            ])
        elif risk_score > 0.6:
            recommendations.extend([
                "Increase fire patrol frequency",
                "Restrict outdoor burning activities",
                "Prepare firefighting resources for rapid deployment",
                "Issue fire weather watch"
            ])
        elif risk_score > 0.4:
            recommendations.extend([
                "Monitor weather conditions closely",
                "Maintain standard fire prevention protocols",
                "Educate public about fire safety"
            ])
        else:
            recommendations.append("Continue routine fire monitoring")
        
        # Add specific recommendations based on environmental factors
        if env_data['wind_speed'] > 20:
            recommendations.append("High wind speeds detected - extra caution with any ignition sources")
        
        if env_data['humidity'] < 30:
            recommendations.append("Very low humidity - vegetation extremely dry and flammable")
        
        return recommendations

# Global model instance
fire_predictor = FireRiskPredictor()

def get_model_predictions(environmental_data: Dict) -> Dict:
    """Main function to get comprehensive fire risk predictions"""
    return fire_predictor.predict_comprehensive_risk(environmental_data)

def simulate_fire_scenario(lat: float, lng: float, env_data: Dict) -> Dict:
    """Simulate fire spread scenario at given coordinates"""
    # Convert lat/lng to grid coordinates (simplified)
    grid_x = int((lat - 29.0) * 50)  # Rough conversion for Uttarakhand region
    grid_y = int((lng - 79.0) * 50)
    
    # Ensure coordinates are within grid bounds
    grid_x = max(0, min(99, grid_x))
    grid_y = max(0, min(99, grid_y))
    
    return fire_predictor.simulate_fire_spread((grid_x, grid_y), env_data)
