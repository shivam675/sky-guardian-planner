
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface FlightParameters {
  droneId: string;
  startLat: number;
  startLon: number;
  startAlt: number;
  endLat: number;
  endLon: number;
  endAlt: number;
  speed: number;
  startTime: string;
  duration: number;
  waypoints: string;
}

const DataGeneration = () => {
  const { toast } = useToast();
  const [flights, setFlights] = useState<FlightParameters[]>([]);
  const [currentFlight, setCurrentFlight] = useState<FlightParameters>({
    droneId: '',
    startLat: 0,
    startLon: 0,
    startAlt: 0,
    endLat: 0,
    endLon: 0,
    endAlt: 0,
    speed: 10,
    startTime: '',
    duration: 300,
    waypoints: ''
  });

  const handleInputChange = (field: keyof FlightParameters, value: string | number) => {
    setCurrentFlight(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addFlight = () => {
    if (!currentFlight.droneId || !currentFlight.startTime) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Drone ID and Start Time",
        variant: "destructive"
      });
      return;
    }

    setFlights(prev => [...prev, { ...currentFlight }]);
    setCurrentFlight({
      droneId: '',
      startLat: 0,
      startLon: 0,
      startAlt: 0,
      endLat: 0,
      endLon: 0,
      endAlt: 0,
      speed: 10,
      startTime: '',
      duration: 300,
      waypoints: ''
    });

    toast({
      title: "Flight Added",
      description: `Flight for drone ${currentFlight.droneId} has been added`,
    });
  };

  const generateTrajectory = () => {
    if (flights.length === 0) {
      toast({
        title: "No Flights",
        description: "Please add at least one flight before generating trajectory",
        variant: "destructive"
      });
      return;
    }

    // This would call your Python backend
    console.log('Generating trajectory with flights:', flights);
    
    toast({
      title: "Trajectory Generated",
      description: `Generated trajectory for ${flights.length} flights`,
    });
  };

  const removeFlight = (index: number) => {
    setFlights(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Data Generation</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Flight Parameters Input */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Flight</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="droneId">Drone ID *</Label>
                  <Input
                    id="droneId"
                    value={currentFlight.droneId}
                    onChange={(e) => handleInputChange('droneId', e.target.value)}
                    placeholder="e.g., DRONE_001"
                  />
                </div>
                <div>
                  <Label htmlFor="speed">Speed (m/s)</Label>
                  <Input
                    id="speed"
                    type="number"
                    value={currentFlight.speed}
                    onChange={(e) => handleInputChange('speed', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="startLat">Start Latitude</Label>
                  <Input
                    id="startLat"
                    type="number"
                    step="0.000001"
                    value={currentFlight.startLat}
                    onChange={(e) => handleInputChange('startLat', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="startLon">Start Longitude</Label>
                  <Input
                    id="startLon"
                    type="number"
                    step="0.000001"
                    value={currentFlight.startLon}
                    onChange={(e) => handleInputChange('startLon', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="startAlt">Start Altitude (m)</Label>
                  <Input
                    id="startAlt"
                    type="number"
                    value={currentFlight.startAlt}
                    onChange={(e) => handleInputChange('startAlt', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="endLat">End Latitude</Label>
                  <Input
                    id="endLat"
                    type="number"
                    step="0.000001"
                    value={currentFlight.endLat}
                    onChange={(e) => handleInputChange('endLat', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="endLon">End Longitude</Label>
                  <Input
                    id="endLon"
                    type="number"
                    step="0.000001"
                    value={currentFlight.endLon}
                    onChange={(e) => handleInputChange('endLon', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="endAlt">End Altitude (m)</Label>
                  <Input
                    id="endAlt"
                    type="number"
                    value={currentFlight.endAlt}
                    onChange={(e) => handleInputChange('endAlt', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={currentFlight.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={currentFlight.duration}
                    onChange={(e) => handleInputChange('duration', Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="waypoints">Waypoints (JSON format)</Label>
                <Textarea
                  id="waypoints"
                  value={currentFlight.waypoints}
                  onChange={(e) => handleInputChange('waypoints', e.target.value)}
                  placeholder='[{"lat": 37.7749, "lon": -122.4194, "alt": 100}]'
                  rows={3}
                />
              </div>

              <Button onClick={addFlight} className="w-full">
                Add Flight
              </Button>
            </CardContent>
          </Card>

          {/* Flight List */}
          <Card>
            <CardHeader>
              <CardTitle>Current Flights ({flights.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {flights.map((flight, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold">{flight.droneId}</div>
                      <div className="text-sm text-gray-600">
                        Start: {new Date(flight.startTime).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        ({flight.startLat}, {flight.startLon}) → ({flight.endLat}, {flight.endLon})
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFlight(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {flights.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No flights added yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <Button
            onClick={generateTrajectory}
            size="lg"
            className="px-8 py-4 text-lg"
            disabled={flights.length === 0}
          >
            Generate Trajectory
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataGeneration;
