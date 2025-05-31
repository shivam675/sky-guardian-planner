
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface MissionData {
  mission_id: string;
  drone_id: string;
  priority: number;
  start_time: string;
  end_time: string;
  waypoints: Array<{
    lat: number;
    lon: number;
    alt: number;
    timestamp: string;
  }>;
}

interface FlightData {
  flight_id: string;
  drone_id: string;
  trajectory: Array<{
    lat: number;
    lon: number;
    alt: number;
    timestamp: string;
  }>;
}

const DataGeneration = () => {
  const { toast } = useToast();
  const [primaryMission, setPrimaryMission] = useState<MissionData>({
    mission_id: '',
    drone_id: '',
    priority: 1,
    start_time: '',
    end_time: '',
    waypoints: []
  });
  
  const [simulatedFlights, setSimulatedFlights] = useState<FlightData[]>([]);
  const [currentFlight, setCurrentFlight] = useState<FlightData>({
    flight_id: '',
    drone_id: '',
    trajectory: []
  });

  const [waypointInput, setWaypointInput] = useState({
    lat: 0,
    lon: 0,
    alt: 0,
    timestamp: ''
  });

  const [trajectoryInput, setTrajectoryInput] = useState({
    lat: 0,
    lon: 0,
    alt: 0,
    timestamp: ''
  });

  const addWaypoint = () => {
    if (!waypointInput.timestamp) {
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

    setWaypointInput({ lat: 0, lon: 0, alt: 0, timestamp: '' });
    
    toast({
      title: "Waypoint Added",
      description: "Waypoint added to primary mission",
    });
  };

  const addTrajectoryPoint = () => {
    if (!trajectoryInput.timestamp) {
      toast({
        title: "Missing Timestamp",
        description: "Please provide a timestamp for the trajectory point",
        variant: "destructive"
      });
      return;
    }

    setCurrentFlight(prev => ({
      ...prev,
      trajectory: [...prev.trajectory, { ...trajectoryInput }]
    }));

    setTrajectoryInput({ lat: 0, lon: 0, alt: 0, timestamp: '' });
  };

  const addSimulatedFlight = () => {
    if (!currentFlight.flight_id || !currentFlight.drone_id || currentFlight.trajectory.length === 0) {
      toast({
        title: "Incomplete Flight Data",
        description: "Please fill in flight ID, drone ID, and at least one trajectory point",
        variant: "destructive"
      });
      return;
    }

    setSimulatedFlights(prev => [...prev, { ...currentFlight }]);
    setCurrentFlight({ flight_id: '', drone_id: '', trajectory: [] });
    
    toast({
      title: "Flight Added",
      description: `Flight ${currentFlight.flight_id} added to simulation`,
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
        toast({
          title: "Sample Data Generated",
          description: "Sample mission and flight data have been generated",
        });
        // You can update the state with the generated data here
      }
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast({
        title: "Error",
        description: "Failed to generate sample data",
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
          simulated_flights: simulatedFlights
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Deconfliction Complete",
          description: `Analysis complete. ${result.conflicts_found ? 'Conflicts detected!' : 'No conflicts found.'}`,
        });
        
        // Store result for later viewing
        localStorage.setItem('latest_simulation', JSON.stringify({
          id: Date.now().toString(),
          name: `Mission ${primaryMission.mission_id}`,
          timestamp: new Date().toISOString(),
          primary_mission: primaryMission,
          simulated_flights: simulatedFlights,
          result: result
        }));
      }
    } catch (error) {
      console.error('Error running deconfliction:', error);
      toast({
        title: "Error",
        description: "Failed to run deconfliction analysis",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Data Generation</h1>
          <Button onClick={generateSampleData} variant="outline">
            Generate Sample Data
          </Button>
        </div>
        
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={primaryMission.priority}
                    onChange={(e) => setPrimaryMission(prev => ({ ...prev, priority: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={primaryMission.start_time}
                    onChange={(e) => setPrimaryMission(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={primaryMission.end_time}
                    onChange={(e) => setPrimaryMission(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Add Waypoint</h4>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    type="number"
                    step="0.000001"
                    placeholder="Latitude"
                    value={waypointInput.lat}
                    onChange={(e) => setWaypointInput(prev => ({ ...prev, lat: Number(e.target.value) }))}
                  />
                  <Input
                    type="number"
                    step="0.000001"
                    placeholder="Longitude"
                    value={waypointInput.lon}
                    onChange={(e) => setWaypointInput(prev => ({ ...prev, lon: Number(e.target.value) }))}
                  />
                  <Input
                    type="number"
                    placeholder="Altitude (m)"
                    value={waypointInput.alt}
                    onChange={(e) => setWaypointInput(prev => ({ ...prev, alt: Number(e.target.value) }))}
                  />
                  <Input
                    type="datetime-local"
                    value={waypointInput.timestamp}
                    onChange={(e) => setWaypointInput(prev => ({ ...prev, timestamp: e.target.value }))}
                  />
                </div>
                <Button onClick={addWaypoint} className="mt-2 w-full" size="sm">
                  Add Waypoint
                </Button>
              </div>

              <div className="max-h-32 overflow-y-auto">
                <div className="text-sm text-gray-600">
                  Waypoints ({primaryMission.waypoints.length}):
                </div>
                {primaryMission.waypoints.map((wp, index) => (
                  <div key={index} className="text-xs bg-gray-100 p-2 rounded mt-1">
                    {wp.lat.toFixed(6)}, {wp.lon.toFixed(6)}, {wp.alt}m @ {new Date(wp.timestamp).toLocaleString()}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Simulated Flights */}
          <Card>
            <CardHeader>
              <CardTitle>Simulated Flights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="flight_id">Flight ID</Label>
                  <Input
                    id="flight_id"
                    value={currentFlight.flight_id}
                    onChange={(e) => setCurrentFlight(prev => ({ ...prev, flight_id: e.target.value }))}
                    placeholder="FLIGHT_001"
                  />
                </div>
                <div>
                  <Label htmlFor="sim_drone_id">Drone ID</Label>
                  <Input
                    id="sim_drone_id"
                    value={currentFlight.drone_id}
                    onChange={(e) => setCurrentFlight(prev => ({ ...prev, drone_id: e.target.value }))}
                    placeholder="DRONE_002"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Add Trajectory Point</h4>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    type="number"
                    step="0.000001"
                    placeholder="Latitude"
                    value={trajectoryInput.lat}
                    onChange={(e) => setTrajectoryInput(prev => ({ ...prev, lat: Number(e.target.value) }))}
                  />
                  <Input
                    type="number"
                    step="0.000001"
                    placeholder="Longitude"
                    value={trajectoryInput.lon}
                    onChange={(e) => setTrajectoryInput(prev => ({ ...prev, lon: Number(e.target.value) }))}
                  />
                  <Input
                    type="number"
                    placeholder="Altitude (m)"
                    value={trajectoryInput.alt}
                    onChange={(e) => setTrajectoryInput(prev => ({ ...prev, alt: Number(e.target.value) }))}
                  />
                  <Input
                    type="datetime-local"
                    value={trajectoryInput.timestamp}
                    onChange={(e) => setTrajectoryInput(prev => ({ ...prev, timestamp: e.target.value }))}
                  />
                </div>
                <Button onClick={addTrajectoryPoint} className="mt-2 w-full" size="sm">
                  Add Point
                </Button>
              </div>

              <div className="max-h-32 overflow-y-auto">
                <div className="text-sm text-gray-600">
                  Trajectory Points ({currentFlight.trajectory.length}):
                </div>
                {currentFlight.trajectory.map((point, index) => (
                  <div key={index} className="text-xs bg-gray-100 p-2 rounded mt-1">
                    {point.lat.toFixed(6)}, {point.lon.toFixed(6)}, {point.alt}m @ {new Date(point.timestamp).toLocaleString()}
                  </div>
                ))}
              </div>

              <Button onClick={addSimulatedFlight} className="w-full">
                Add Simulated Flight
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Current Simulated Flights List */}
        <Card>
          <CardHeader>
            <CardTitle>Added Simulated Flights ({simulatedFlights.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {simulatedFlights.map((flight, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold">{flight.flight_id} - {flight.drone_id}</div>
                    <div className="text-sm text-gray-600">
                      {flight.trajectory.length} trajectory points
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

        {/* Generate and Run */}
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
