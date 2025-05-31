
"""
Flask Backend for UAV Deconfliction System
This file provides the API endpoints that connect to your existing Python modules.
Place this file in your uav_deconfliction/ directory and run it.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import json
import os
import sys
from datetime import datetime
import tempfile

# Add your project directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import your existing modules
try:
    from data.generate_sample_data import generate_sample_data
    from deconfliction.spatial_check import check_spatial_conflicts
    from deconfliction.temporal_check import check_temporal_conflicts
    from deconfliction.conflict_explainer import explain_conflicts
    from visualisation.plot_2d import create_2d_animation
    from visualisation.plot_4d import create_4d_plot
except ImportError as e:
    print(f"Warning: Could not import modules: {e}")
    print("Make sure you're running this from the uav_deconfliction directory")

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Store simulation results in memory (use database in production)
simulation_results = []

@app.route('/api/generate-sample-data', methods=['POST'])
def generate_sample_data_endpoint():
    """Generate sample mission and flight data"""
    try:
        # Call your existing generate_sample_data function
        sample_data = generate_sample_data()
        
        return jsonify({
            "status": "success",
            "data": sample_data,
            "message": "Sample data generated successfully"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/run-deconfliction', methods=['POST'])
def run_deconfliction():
    """Run spatial and temporal conflict detection"""
    try:
        data = request.get_json()
        primary_mission = data.get('primary_mission')
        simulated_flights = data.get('simulated_flights')
        
        if not primary_mission or not simulated_flights:
            return jsonify({
                "status": "error",
                "message": "Missing primary_mission or simulated_flights data"
            }), 400
        
        # Run spatial conflict detection
        spatial_conflicts = check_spatial_conflicts(primary_mission, simulated_flights)
        
        # Run temporal conflict detection  
        temporal_conflicts = check_temporal_conflicts(primary_mission, simulated_flights)
        
        # Generate human-readable explanations
        conflict_explanations = explain_conflicts(spatial_conflicts, temporal_conflicts)
        
        # Store results
        simulation_result = {
            "id": str(len(simulation_results) + 1),
            "name": f"Mission {primary_mission.get('mission_id', 'Unknown')}",
            "timestamp": datetime.now().isoformat(),
            "primary_mission": primary_mission,
            "simulated_flights": simulated_flights,
            "spatial_conflicts": spatial_conflicts,
            "temporal_conflicts": temporal_conflicts,
            "explanations": conflict_explanations,
            "conflicts_found": len(spatial_conflicts) > 0 or len(temporal_conflicts) > 0,
            "total_conflicts": len(spatial_conflicts) + len(temporal_conflicts)
        }
        
        simulation_results.append(simulation_result)
        
        return jsonify({
            "status": "success",
            "conflicts_found": simulation_result["conflicts_found"],
            "total_conflicts": simulation_result["total_conflicts"],
            "spatial_conflicts": spatial_conflicts,
            "temporal_conflicts": temporal_conflicts,
            "explanations": conflict_explanations,
            "simulation_id": simulation_result["id"]
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/visualize-2d/<simulation_id>', methods=['GET'])
def visualize_2d(simulation_id):
    """Generate 2D matplotlib animation"""
    try:
        # Find the simulation result
        simulation = next((s for s in simulation_results if s["id"] == simulation_id), None)
        if not simulation:
            return jsonify({"status": "error", "message": "Simulation not found"}), 404
        
        # Create 2D animation using your existing code
        animation_path = create_2d_animation(
            simulation["primary_mission"], 
            simulation["simulated_flights"],
            simulation["spatial_conflicts"]
        )
        
        return send_file(animation_path, as_attachment=True)
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/visualize-4d/<simulation_id>', methods=['GET'])
def visualize_4d(simulation_id):
    """Generate 4D plotly visualization"""
    try:
        # Find the simulation result
        simulation = next((s for s in simulation_results if s["id"] == simulation_id), None)
        if not simulation:
            return jsonify({"status": "error", "message": "Simulation not found"}), 404
        
        # Create 4D plot using your existing code
        plot_html = create_4d_plot(
            simulation["primary_mission"], 
            simulation["simulated_flights"],
            simulation["spatial_conflicts"],
            simulation["temporal_conflicts"]
        )
        
        return plot_html, 200, {'Content-Type': 'text/html'}
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/simulations', methods=['GET'])
def get_simulations():
    """Get list of all simulation results"""
    try:
        # Return simplified version for list view
        simplified_results = []
        for sim in simulation_results:
            simplified_results.append({
                "id": sim["id"],
                "name": sim["name"],
                "timestamp": sim["timestamp"],
                "conflicts_found": sim["conflicts_found"],
                "total_conflicts": sim["total_conflicts"],
                "flight_count": len(sim["simulated_flights"]) + 1,  # +1 for primary mission
                "status": "completed"
            })
        
        return jsonify({
            "status": "success",
            "simulations": simplified_results
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/simulation/<simulation_id>', methods=['GET'])
def get_simulation_details(simulation_id):
    """Get detailed results for a specific simulation"""
    try:
        simulation = next((s for s in simulation_results if s["id"] == simulation_id), None)
        if not simulation:
            return jsonify({"status": "error", "message": "Simulation not found"}), 404
        
        return jsonify({
            "status": "success",
            "simulation": simulation
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/resimulate/<simulation_id>', methods=['POST'])
def resimulate(simulation_id):
    """Resimulate an existing scenario"""
    try:
        # Find the original simulation
        original = next((s for s in simulation_results if s["id"] == simulation_id), None)
        if not original:
            return jsonify({"status": "error", "message": "Original simulation not found"}), 404
        
        # Rerun the analysis with the same data
        return run_deconfliction_with_data(
            original["primary_mission"], 
            original["simulated_flights"]
        )
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

def run_deconfliction_with_data(primary_mission, simulated_flights):
    """Helper function to run deconfliction with provided data"""
    # Same logic as run_deconfliction but with provided data
    spatial_conflicts = check_spatial_conflicts(primary_mission, simulated_flights)
    temporal_conflicts = check_temporal_conflicts(primary_mission, simulated_flights)
    conflict_explanations = explain_conflicts(spatial_conflicts, temporal_conflicts)
    
    simulation_result = {
        "id": str(len(simulation_results) + 1),
        "name": f"Resim {primary_mission.get('mission_id', 'Unknown')}",
        "timestamp": datetime.now().isoformat(),
        "primary_mission": primary_mission,
        "simulated_flights": simulated_flights,
        "spatial_conflicts": spatial_conflicts,
        "temporal_conflicts": temporal_conflicts,
        "explanations": conflict_explanations,
        "conflicts_found": len(spatial_conflicts) > 0 or len(temporal_conflicts) > 0,
        "total_conflicts": len(spatial_conflicts) + len(temporal_conflicts)
    }
    
    simulation_results.append(simulation_result)
    
    return jsonify({
        "status": "success",
        "conflicts_found": simulation_result["conflicts_found"],
        "total_conflicts": simulation_result["total_conflicts"],
        "simulation_id": simulation_result["id"]
    })

if __name__ == '__main__':
    print("Starting UAV Deconfliction Flask Backend...")
    print("Make sure your frontend is running on http://localhost:3000")
    print("Backend will be available at http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
