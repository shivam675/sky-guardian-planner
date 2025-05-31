
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
import math
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import plotly.graph_objects as go
import plotly.io as pio
from functools import lru_cache

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Store simulation results in memory (use database in production)
simulation_results = []

# Your Python utility functions
def euclidean_distance(p1, p2):
    return math.sqrt((p1['x'] - p2['x'])**2 + (p1['y'] - p2['y'])**2)

def is_spatial_conflict(p1, p2, threshold=10):
    """Returns True if the distance between p1 and p2 is less than threshold."""
    return euclidean_distance(p1, p2) < threshold

def is_temporal_overlap(t1, t2, time_tolerance=1):
    """
    Returns True if two time points t1 and t2 are within `time_tolerance` seconds.
    t1 and t2 are expected to be datetime.datetime objects.
    """
    return abs((t1 - t2).total_seconds()) <= time_tolerance

def parse_iso_time(ts):
    """Parse ISO 8601 time strings into datetime objects."""
    return datetime.fromisoformat(ts)

def check_mission(primary_mission, simulated_flights, distance_threshold=20):
    conflicts = []
    primary_traj = primary_mission['waypoints']
    
    for p_wp in primary_traj:
        p_time = parse_iso_time(p_wp['time'])
        small_offset = 0
        
        for drone in simulated_flights:
            drone_id = drone['id']
            drone_traj = drone['waypoints']

            for d_wp in drone_traj:
                d_time = parse_iso_time(d_wp['time'])
                
                if is_temporal_overlap(p_time, d_time):
                    if is_spatial_conflict(p_wp, d_wp, distance_threshold):
                        small_offset += 1
                        conflicts.append({
                            'time': p_wp['time'],
                            'location': {'x': p_wp['x'], 'y': p_wp['y'], 'z': p_wp['z'] + small_offset},
                            'conflict_with': drone_id
                        })

    if conflicts:
        return "conflict detected", conflicts
    else:
        return "clear", []

@lru_cache
def parse_time_cached(tstr):
    return datetime.fromisoformat(tstr)

def is_time_close(t1, t2, tol=0.5):
    return abs((t1 - t2).total_seconds()) <= tol

def create_2d_animation(primary, simulated, conflicts):
    """Create 2D matplotlib animation and return path to saved file"""
    # Sort all unique timestamps
    all_times = sorted({
        *(parse_time_cached(wp['time']) for wp in primary['waypoints']),
        *(parse_time_cached(wp['time']) for drone in simulated for wp in drone['waypoints']),
        *(parse_time_cached(conflict['time']) for conflict in conflicts)
    })

    # Color and marker maps
    color_map = {'primary': 'blue'}
    marker_map = {'primary': 'x'}
    palette = ['orange', 'green', 'purple', 'brown', 'cyan', 'magenta', 'olive', 'teal']
    marker_styles = ['o', 's', '^', 'D', 'v', 'P', '*', 'H']

    for i, drone in enumerate(simulated):
        color_map[drone['id']] = palette[i % len(palette)]
        marker_map[drone['id']] = marker_styles[i % len(marker_styles)]

    def filter_xy(waypoints, up_to_time):
        filtered = [wp for wp in waypoints if parse_time_cached(wp['time']) <= up_to_time]
        return [wp['x'] for wp in filtered], [wp['y'] for wp in filtered]

    fig, ax = plt.subplots(figsize=(10, 8))

    def update(frame_idx):
        ax.clear()
        current_time = all_times[frame_idx]
        ax.set_title(f"Drone Trajectories at {current_time.strftime('%H:%M:%S')}")
        ax.set_xlabel('X Position')
        ax.set_ylabel('Y Position')
        ax.grid(True)
        ax.axis('equal')

        # Plot primary drone
        x, y = filter_xy(primary['waypoints'], current_time)
        ax.plot(x, y, color=color_map['primary'], marker=marker_map['primary'], label='Primary Drone')

        # Plot simulated drones
        for drone in simulated:
            dx, dy = filter_xy(drone['waypoints'], current_time)
            ax.plot(dx, dy, linestyle='--', color=color_map[drone['id']], marker=marker_map[drone['id']], label=f"Sim {drone['id']}")

        # Plot current conflicts
        for c in conflicts:
            if is_time_close(parse_time_cached(c['time']), current_time):
                cid = c['conflict_with']
                color = color_map.get(cid, 'red')
                marker = marker_map.get(cid, 'x')
                ax.scatter(c['location']['x'], c['location']['y'], color=color, s=510, marker=marker, label=f"Conflict with {cid}")

        ax.legend(loc='upper right')

    # Create animation and save as HTML
    anim = FuncAnimation(fig, update, frames=len(all_times), interval=200, repeat=False)
    
    # Save as HTML file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.html')
    with open(temp_file.name, 'w') as f:
        f.write(f"""
        <!DOCTYPE html>
        <html>
        <head><title>2D Animation</title></head>
        <body>
            <h1>2D Drone Trajectory Animation</h1>
            <p>Animation created with {len(all_times)} frames</p>
            <p>Primary drone with {len(simulated)} simulated drones</p>
            <p>Conflicts detected: {len(conflicts)}</p>
        </body>
        </html>
        """)
    
    return temp_file.name

def create_4d_plot(primary, simulated, conflicts):
    """Create 4D plotly visualization and return HTML"""
    all_times = sorted({
        *(parse_time_cached(wp['time']) for wp in primary['waypoints']),
        *(parse_time_cached(wp['time']) for drone in simulated for wp in drone['waypoints']),
        *(parse_time_cached(conflict['time']) for conflict in conflicts)
    })

    def extract_xyz(waypoints):
        return zip(*[(wp['x'], wp['y'], wp['z']) for wp in waypoints])

    # Assign colors and symbols
    shape_map = {'primary': 'x'}
    color_map = {'primary': 'blue'}
    palette = ['orange', 'green', 'purple', 'brown', 'cyan', 'magenta', 'olive', 'teal']
    shape_palette = ['x', 'circle', 'circle-open', 'cross', 'diamond', 'diamond-open', 'square', 'square-open']
    
    for i, drone in enumerate(simulated):
        color_map[drone['id']] = palette[i % len(palette)]
        shape_map[drone['id']] = shape_palette[i % len(shape_palette)]

    fig = go.Figure()

    # Primary drone trace
    px, py, pz = extract_xyz(primary['waypoints'])
    fig.add_trace(go.Scatter3d(
        x=px, y=py, z=pz,
        mode='lines+markers',
        name='Primary Drone',
        line=dict(color=color_map['primary']),
        marker=dict(size=4),
    ))

    # Simulated drones traces
    for drone in simulated:
        dx, dy, dz = extract_xyz(drone['waypoints'])
        fig.add_trace(go.Scatter3d(
            x=dx, y=dy, z=dz,
            mode='lines+markers',
            name=f"Sim {drone['id']}",
            line=dict(color=color_map[drone['id']]),
            marker=dict(size=4),
        ))

    # Static marker for all conflicts
    if conflicts:
        for c in conflicts:
            cid = c['conflict_with']
            color = color_map.get(cid, 'red')
            shape = shape_map.get(cid, 'x')
            fig.add_trace(go.Scatter3d(
                x=[c['location']['x']],
                y=[c['location']['y']],
                z=[c['location']['z']],
                mode='markers',
                marker=dict(color=color, size=6, symbol=shape),
                name=f"Conflict with {cid}"
            ))

    fig.update_layout(
        scene=dict(xaxis_title='X', yaxis_title='Y', zaxis_title='Z'),
        title='4D Drone Trajectory with Conflict Visualization',
        showlegend=True
    )

    return fig.to_html()

def generate_sample_data():
    """Generate sample mission and flight data"""
    sample_primary = {
        "mission_id": "MISSION_001",
        "drone_id": "DRONE_PRIMARY",
        "priority": 1,
        "waypoints": [
            {"x": 10, "y": 10, "z": 50, "time": "2024-01-01T10:00:00"},
            {"x": 50, "y": 50, "z": 60, "time": "2024-01-01T10:05:00"},
            {"x": 100, "y": 100, "z": 70, "time": "2024-01-01T10:10:00"}
        ]
    }
    
    sample_simulated = [
        {
            "id": "DRONE_002",
            "waypoints": [
                {"x": 15, "y": 15, "z": 55, "time": "2024-01-01T10:00:30"},
                {"x": 45, "y": 45, "z": 65, "time": "2024-01-01T10:05:30"},
                {"x": 95, "y": 95, "z": 75, "time": "2024-01-01T10:10:30"}
            ]
        }
    ]
    
    return {
        "primary_mission": sample_primary,
        "simulated_flights": sample_simulated
    }

@app.route('/api/generate-sample-data', methods=['POST'])
def generate_sample_data_endpoint():
    """Generate sample mission and flight data"""
    try:
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
        distance_threshold = data.get('distance_threshold', 20)
        time_tolerance = data.get('time_tolerance', 1)
        
        if not primary_mission or not simulated_flights:
            return jsonify({
                "status": "error",
                "message": "Missing primary_mission or simulated_flights data"
            }), 400
        
        # Run conflict detection using your function
        status, conflicts = check_mission(primary_mission, simulated_flights, distance_threshold)
        
        # Store results
        simulation_result = {
            "id": str(len(simulation_results) + 1),
            "name": f"Mission {primary_mission.get('mission_id', 'Unknown')}",
            "timestamp": datetime.now().isoformat(),
            "primary_mission": primary_mission,
            "simulated_flights": simulated_flights,
            "conflicts": conflicts,
            "status": status,
            "conflicts_found": len(conflicts) > 0,
            "total_conflicts": len(conflicts),
            "parameters": {
                "distance_threshold": distance_threshold,
                "time_tolerance": time_tolerance
            }
        }
        
        simulation_results.append(simulation_result)
        
        return jsonify({
            "status": "success",
            "mission_status": status,
            "conflicts_found": simulation_result["conflicts_found"],
            "total_conflicts": simulation_result["total_conflicts"],
            "conflicts": conflicts,
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
        simulation = next((s for s in simulation_results if s["id"] == simulation_id), None)
        if not simulation:
            return jsonify({"status": "error", "message": "Simulation not found"}), 404
        
        animation_path = create_2d_animation(
            simulation["primary_mission"], 
            simulation["simulated_flights"],
            simulation["conflicts"]
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
        simulation = next((s for s in simulation_results if s["id"] == simulation_id), None)
        if not simulation:
            return jsonify({"status": "error", "message": "Simulation not found"}), 404
        
        plot_html = create_4d_plot(
            simulation["primary_mission"], 
            simulation["simulated_flights"],
            simulation["conflicts"]
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
        simplified_results = []
        for sim in simulation_results:
            simplified_results.append({
                "id": sim["id"],
                "name": sim["name"],
                "timestamp": sim["timestamp"],
                "conflicts_found": sim["conflicts_found"],
                "total_conflicts": sim["total_conflicts"],
                "flight_count": len(sim["simulated_flights"]) + 1,
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
        original = next((s for s in simulation_results if s["id"] == simulation_id), None)
        if not original:
            return jsonify({"status": "error", "message": "Original simulation not found"}), 404
        
        # Rerun the analysis with the same data
        status, conflicts = check_mission(
            original["primary_mission"], 
            original["simulated_flights"],
            original["parameters"]["distance_threshold"]
        )
        
        simulation_result = {
            "id": str(len(simulation_results) + 1),
            "name": f"Resim {original['primary_mission'].get('mission_id', 'Unknown')}",
            "timestamp": datetime.now().isoformat(),
            "primary_mission": original["primary_mission"],
            "simulated_flights": original["simulated_flights"],
            "conflicts": conflicts,
            "status": status,
            "conflicts_found": len(conflicts) > 0,
            "total_conflicts": len(conflicts),
            "parameters": original["parameters"]
        }
        
        simulation_results.append(simulation_result)
        
        return jsonify({
            "status": "success",
            "mission_status": status,
            "conflicts_found": simulation_result["conflicts_found"],
            "total_conflicts": simulation_result["total_conflicts"],
            "simulation_id": simulation_result["id"]
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    print("Starting UAV Deconfliction Flask Backend...")
    print("Make sure your frontend is running on http://localhost:3000")
    print("Backend will be available at http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
