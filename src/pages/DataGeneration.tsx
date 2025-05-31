
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface MissionData {
  mission_id: string;
  drone_id: string;
  priority: number;
  waypoints: Array<{
    x: number;
    y: number;
    z: number;
    time: string;
  }>;
}

interface FlightData {
  id: string;
  waypoints: Array<{
    x: number;
    y: number;
    z: number;
    time: string;
  }>;
}

const DataGeneration = () => {
  const { toast } = useToast();
  const [primaryMission, setPrimaryMission] = useState<MissionData>({
    mission_id: '',
    drone_id: '',
    priority: 1,
    waypoints: []
  });
  
  const [simulatedFlights, setSimulatedFlights] = useState<FlightData[]>([]);
  const [currentFlight, setCurrentFlight] = useState<FlightData>({
    id: '',
    waypoints: []
  });

  // Parameters from your Python code
  const [distanceThreshold, setDistanceThreshold] = useState(20);
  const [timeTolerance, setTimeTolerance] = useState(1);
  const [animateOption, setAnimateOption] = useState(false);

  const [waypointInput, setWaypointInput] = useState({
    x: 0,
    y: 0,
    z: 0,
    time: ''
  });

  const [trajectoryInput, setTrajectoryInput] = useState({
    x: 0,
    y: 0,
    z: 0,
    time: ''
  });

  const addWaypoint = () => {
    if (!waypointInput.time) {
      toast({
        title: "Missing Timestamp",
        description: "Please provide a timestamp for the waypoint",
        variant: "destructive"
      });
      return;
    }

    setPrimaryMission(prev => ({
      ...prev,
      waypoints: [...prev.waypoints, { ...waypointInput }]
    }));

    setWaypointInput({ x: 0, y: 0, z: 0, time: '' });
    
    toast({
      title: "Waypoint Added",
      description: "Waypoint added to primary mission",
    });
  };

  const addTrajectoryPoint = () => {
    if (!trajectoryInput.time) {
      toast({
        title: "Missing Timestamp",
        description: "Please provide a timestamp for the trajectory point",
        variant: "destructive"
      });
      return;
    }

    setCurrentFlight(prev => ({
      ...prev,
      waypoints: [...prev.waypoints, { ...trajectoryInput }]
    }));

    setTrajectoryInput({ x: 0, y: 0, z: 0, time: '' });
  };

  const addSimulatedFlight = () => {
    if (!currentFlight.id || currentFlight.waypoints.length === 0) {
      toast({
        title: "Incomplete Flight Data",
        description: "Please fill in flight ID and at least one waypoint",
        variant: "destructive"
      });
      return;
    }

    setSimulatedFlights(prev => [...prev, { ...currentFlight }]);
    setCurrentFlight({ id: '', waypoints: [] });
    
    toast({
      title: "Flight Added",
      description: `Flight ${currentFlight.id} added to simulation`,
    });
  };

  const generateSampleData = async () => {
    try {
      const response = await fetch('/api/generate-sample-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setPrimaryMission(data.data.primary_mission);
          setSimulatedFlights(data.data.simulated_flights);
          toast({
            title: "Sample Data Generated",
            description: "Sample mission and flight data have been loaded",
          });
        }
      }
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast({
        title: "Backend Connection Failed",
        description: "Make sure your Flask backend is running on port 5000",
        variant: "destructive"
      });
    }
  };

  const runDeconfliction = async () => {
    if (!primaryMission.mission_id || simulatedFlights.length === 0) {
      toast({
        title: "Insufficient Data",
        description: "Please add primary mission and at least one simulated flight",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/run-deconfliction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_mission: primaryMission,
          simulated_flights: simulatedFlights,
          distance_threshold: distanceThreshold,
          time_tolerance: timeTolerance,
          animate: animateOption
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Deconfliction Complete",
          description: `Status: ${result.mission_status}. ${result.conflicts_found ? `${result.total_conflicts} conflicts detected!` : 'No conflicts found.'}`,
        });
        
        // Store result for later viewing
        localStorage.setItem('latest_simulation', JSON.stringify({
          id: result.simulation_id,
          name: `Mission ${primaryMission.mission_id}`,
          timestamp: new Date().toISOString(),
          primary_mission: primaryMission,
          simulated_flights: simulatedFlights,
          result: result
        }));
      } else {
        throw new Error('Deconfliction failed');
      }
    } catch (error) {
      console.error('Error running deconfliction:', error);
      toast({
        title: "Backend Connection Failed",
        description: "Make sure your Flask backend is running on port 5000",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Generation & Configuration</h1>
            <p className="text-gray-600 mt-2">Configure drone missions and deconfliction parameters</p>
          </div>
          <Button onClick={generateSampleData} variant="outline">
            Generate Sample Data
          </Button>
        </div>

        {/* Configuration Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>Deconfliction Parameters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="distance_threshold">Distance Threshold (meters)</Label>
              <Input
                id="distance_threshold"
                type="number"
                value={distanceThreshold}
                onChange={(e) => setDistanceThreshold(Number(e.target.value))}
                placeholder="20"
              />
              <p className="text-sm text-gray-500 mt-1">Minimum safe distance between drones</p>
            </div>
            <div>
              <Label htmlFor="time_tolerance">Time Tolerance (seconds)</Label>
              <Input
                id="time_tolerance"
                type="number"
                value={timeTolerance}
                onChange={(e) => setTimeTolerance(Number(e.target.value))}
                placeholder="1"
              />
              <p className="text-sm text-gray-500 mt-1">Temporal overlap tolerance</p>
            </div>
            <div>
              <Label htmlFor="animate_option">Enable Animation</Label>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  id="animate_option"
                  type="checkbox"
                  checked={animateOption}
                  onChange={(e) => setAnimateOption(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Enable 2D animation</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primary Mission */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mission_id">Mission ID</Label>
                  <Input
                    id="mission_id"
                    value={primaryMission.mission_id}
                    onChange={(e) => setPrimaryMission(prev => ({ ...prev, mission_id: e.target.value }))}
                    placeholder="MISSION_001"
                  />
                </div>
                <div>
                  <Label htmlFor="drone_id">Drone ID</Label>
                  <Input
                    id="drone_id"
                    value={primaryMission.drone_id}
                    onChange={(e) => setPrimaryMission(prev => ({ ...prev, drone_id: e.target.value }))}
                    placeholder="DRONE_001"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={primaryMission.priority}
                  onChange={(e) => setPrimaryMission(prev => ({ ...prev, priority: Number(e.target.value) }))}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Add Waypoint</h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="X Position"
                    value={waypointInput.x}
                    onChange={(e) => setWaypointInput(prev => ({ ...prev, x: Number(e.target.value) }))}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Y Position"
                    value={waypointInput.y}
                    onChange={(e) => setWaypointInput(prev => ({ ...prev, y: Number(e.target.value) }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Z Position (altitude)"
                    value={waypointInput.z}
                    onChange={(e) => setWaypointInput(prev => ({ ...prev, z: Number(e.target.value) }))}
                  />
                  <Input
                    type="datetime-local"
                    value={waypointInput.time}
                    onChange={(e) => setWaypointInput(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                <Button onClick={addWaypoint} className="w-full" size="sm">
                  Add Waypoint
                </Button>
              </div>

              <div className="max-h-32 overflow-y-auto">
                <div className="text-sm text-gray-600">
                  Waypoints ({primaryMission.waypoints.length}):
                </div>
                {primaryMission.waypoints.map((wp, index) => (
                  <div key={index} className="text-xs bg-gray-100 p-2 rounded mt-1">
                    ({wp.x}, {wp.y}, {wp.z}) @ {new Date(wp.time).toLocaleString()}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Simulated Flights */}
          <Card>
            <CardHeader>
              <CardTitle>Current Simulated Flight</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="flight_id">Flight ID</Label>
                <Input
                  id="flight_id"
                  value={currentFlight.id}
                  onChange={(e) => setCurrentFlight(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="DRONE_002"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Add Trajectory Point</h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="X Position"
                    value={trajectoryInput.x}
                    onChange={(e) => setTrajectoryInput(prev => ({ ...prev, x: Number(e.target.value) }))}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Y Position"
                    value={trajectoryInput.y}
                    onChange={(e) => setTrajectoryInput(prev => ({ ...prev, y: Number(e.target.value) }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Z Position (altitude)"
                    value={trajectoryInput.z}
                    onChange={(e) => setTrajectoryInput(prev => ({ ...prev, z: Number(e.target.value) }))}
                  />
                  <Input
                    type="datetime-local"
                    value={trajectoryInput.time}
                    onChange={(e) => setTrajectoryInput(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                <Button onClick={addTrajectoryPoint} className="w-full" size="sm">
                  Add Point
                </Button>
              </div>

              <div className="max-h-32 overflow-y-auto">
                <div className="text-sm text-gray-600">
                  Trajectory Points ({currentFlight.waypoints.length}):
                </div>
                {currentFlight.waypoints.map((point, index) => (
                  <div key={index} className="text-xs bg-gray-100 p-2 rounded mt-1">
                    ({point.x}, {point.y}, {point.z}) @ {new Date(point.time).toLocaleString()}
                  </div>
                ))}
              </div>

              <Button onClick={addSimulatedFlight} className="w-full">
                Add This Flight to Simulation
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Added Simulated Flights List */}
        <Card>
          <CardHeader>
            <CardTitle>Added Simulated Flights ({simulatedFlights.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {simulatedFlights.map((flight, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold">{flight.id}</div>
                    <div className="text-sm text-gray-600">
                      {flight.waypoints.length} waypoints
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setSimulatedFlights(prev => prev.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {simulatedFlights.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No simulated flights added yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Run Analysis */}
        <div className="flex justify-center">
          <Button
            onClick={runDeconfliction}
            size="lg"
            className="px-8 py-4 text-lg"
            disabled={!primaryMission.mission_id || simulatedFlights.length === 0}
          >
            Run Deconfliction Analysis
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataGeneration;
