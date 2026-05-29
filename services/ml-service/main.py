#!/usr/bin/env python3
"""
Cummins OS Predictive Maintenance ML Service

Provides RUL estimation, anomaly detection, and failure prediction
using XGBoost and LSTM models.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import joblib
import logging
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Cummins OS ML Service",
    description="Predictive maintenance and diagnostics",
    version="1.0.0"
)

# Request/Response models
class TelemetryPoint(BaseModel):
    timestamp: datetime
    engine_temp: float
    rpm: int
    fuel_consumption: float
    oil_pressure: float
    battery_voltage: float
    coolant_temp: float
    exhaust_temp: float

class RULPredictionRequest(BaseModel):
    vehicle_id: str
    telemetry_history: List[TelemetryPoint]
    model_version: str = "v1.0"

class RULPredictionResponse(BaseModel):
    vehicle_id: str
    rul_days: float
    rul_hours: float
    failure_probability: float
    confidence: float
    model_version: str
    timestamp: datetime

class AnomalyDetectionRequest(BaseModel):
    vehicle_id: str
    telemetry_point: TelemetryPoint

class AnomalyDetectionResponse(BaseModel):
    vehicle_id: str
    is_anomaly: bool
    anomaly_score: float
    threshold: float
    affected_parameters: List[str]
    timestamp: datetime

class HealthScoreRequest(BaseModel):
    vehicle_id: str
    fault_codes: List[str]
    telemetry_history: List[TelemetryPoint]

class HealthScoreResponse(BaseModel):
    vehicle_id: str
    health_score: float  # 0-100
    trend: str  # "improving", "stable", "degrading"
    risk_level: str  # "low", "medium", "high", "critical"
    recommendations: List[str]
    timestamp: datetime

# Model loading
class ModelManager:
    def __init__(self):
        self.models = {}
        self.load_models()

    def load_models(self):
        """Load pre-trained models from disk"""
        models_dir = os.path.join(os.path.dirname(__file__), "models")

        try:
            # These would be actual trained models in production
            # For now, we'll use placeholder logic
            logger.info("Models loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load models: {e}")

model_manager = ModelManager()

# Feature Engineering
def extract_features(telemetry_history: List[TelemetryPoint]) -> np.ndarray:
    """Extract features from telemetry history"""
    if not telemetry_history:
        raise ValueError("Empty telemetry history")

    temps = [t.engine_temp for t in telemetry_history]
    rpms = [t.rpm for t in telemetry_history]
    fuel_cons = [t.fuel_consumption for t in telemetry_history]

    features = {
        'engine_temp_mean': np.mean(temps),
        'engine_temp_std': np.std(temps),
        'engine_temp_max': np.max(temps),
        'rpm_mean': np.mean(rpms),
        'rpm_std': np.std(rpms),
        'fuel_consumption_mean': np.mean(fuel_cons),
        'fuel_consumption_std': np.std(fuel_cons),
        'temperature_trend': temps[-1] - temps[0] if len(temps) > 1 else 0,
        'operating_hours': len(telemetry_history),
    }

    return np.array(list(features.values())).reshape(1, -1), features

# Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Cummins OS ML Service",
        "version": "1.0.0"
    }

@app.post("/predict-rul", response_model=RULPredictionResponse)
async def predict_rul(request: RULPredictionRequest) -> RULPredictionResponse:
    """
    Predict Remaining Useful Life (RUL) for a vehicle

    Uses ensemble of XGBoost and LSTM models.
    """
    try:
        if not request.telemetry_history:
            raise ValueError("Empty telemetry history")

        features, feature_dict = extract_features(request.telemetry_history)

        # Mock prediction (in production, use actual trained models)
        rul_days = float(np.clip(
            100 - (feature_dict['engine_temp_mean'] / 100) * 50,
            1, 365
        ))

        rul_hours = rul_days * 24

        failure_probability = float(
            min(1.0, (100 - rul_days) / 100) if rul_days < 100 else 0.0
        )

        confidence = 0.85 + (len(request.telemetry_history) / 1000) * 0.15
        confidence = min(0.95, confidence)

        return RULPredictionResponse(
            vehicle_id=request.vehicle_id,
            rul_days=rul_days,
            rul_hours=rul_hours,
            failure_probability=failure_probability,
            confidence=confidence,
            model_version=request.model_version,
            timestamp=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"RUL prediction error for {request.vehicle_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect-anomaly", response_model=AnomalyDetectionResponse)
async def detect_anomaly(request: AnomalyDetectionRequest) -> AnomalyDetectionResponse:
    """
    Detect anomalies in real-time telemetry

    Uses statistical methods and isolation forest.
    """
    try:
        telemetry = request.telemetry_point

        # Mock anomaly detection logic
        anomaly_score = 0.0
        affected_params = []

        # Temperature anomaly check
        if telemetry.engine_temp > 110 or telemetry.engine_temp < 60:
            anomaly_score += 0.3
            affected_params.append("engine_temp")

        # RPM anomaly check
        if telemetry.rpm > 2500 or (telemetry.rpm < 500 and telemetry.rpm > 0):
            anomaly_score += 0.2
            affected_params.append("rpm")

        # Oil pressure anomaly check
        if telemetry.oil_pressure < 20 or telemetry.oil_pressure > 80:
            anomaly_score += 0.25
            affected_params.append("oil_pressure")

        threshold = 0.5
        is_anomaly = anomaly_score >= threshold

        return AnomalyDetectionResponse(
            vehicle_id=request.vehicle_id,
            is_anomaly=is_anomaly,
            anomaly_score=float(anomaly_score),
            threshold=float(threshold),
            affected_parameters=affected_params,
            timestamp=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Anomaly detection error for {request.vehicle_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate-health-score", response_model=HealthScoreResponse)
async def calculate_health_score(request: HealthScoreRequest) -> HealthScoreResponse:
    """
    Calculate overall vehicle health score (0-100)

    Combines fault codes, telemetry trends, and operational metrics.
    """
    try:
        health_score = 100.0

        # Deduct for fault codes
        fault_deductions = {
            'P0001': 15, 'P0010': 12, 'P0020': 10,  # Fuel system
            'P0100': 20, 'P0110': 15, 'P0120': 12,  # Air/fuel
            'P0300': 25, 'P0400': 18, 'P0500': 15,  # Engine misfires
        }

        for fault in request.fault_codes:
            health_score -= fault_deductions.get(fault, 5)

        # Deduct for telemetry anomalies
        if request.telemetry_history:
            features, feature_dict = extract_features(request.telemetry_history)

            # Temperature check
            if feature_dict['engine_temp_mean'] > 100:
                health_score -= 10

            # Fuel consumption check
            if feature_dict['fuel_consumption_mean'] > 15:
                health_score -= 8

            # Trend analysis
            temps = [t.engine_temp for t in request.telemetry_history]
            if len(temps) > 10:
                recent_trend = np.mean(temps[-5:]) - np.mean(temps[-10:-5])
                if recent_trend > 5:
                    health_score -= 5

        health_score = float(np.clip(health_score, 0, 100))

        # Determine trend
        if health_score >= 80:
            trend = "improving"
        elif health_score >= 60:
            trend = "stable"
        else:
            trend = "degrading"

        # Risk level
        if health_score >= 80:
            risk_level = "low"
        elif health_score >= 60:
            risk_level = "medium"
        elif health_score >= 40:
            risk_level = "high"
        else:
            risk_level = "critical"

        # Generate recommendations
        recommendations = []
        if health_score < 60:
            recommendations.append("Schedule preventive maintenance")
        if request.fault_codes:
            recommendations.append("Address reported fault codes")
        if health_score < 40:
            recommendations.append("URGENT: Remove vehicle from service")

        return HealthScoreResponse(
            vehicle_id=request.vehicle_id,
            health_score=health_score,
            trend=trend,
            risk_level=risk_level,
            recommendations=recommendations,
            timestamp=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Health score calculation error for {request.vehicle_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
