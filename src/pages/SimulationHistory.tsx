
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SimulationRun {
  id: string;
  name: string;
  timestamp: string;
  flightCount: number;
  conflictsDetected: number;
  status: 'completed' | 'failed' | 'running';
  duration: number;
}

const SimulationHistory = () => {
  const { toast } = useToast();
  const [simulations, setSimulations] = useState<SimulationRun[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API call
    setSimulations([
      {
        id: '1',
        name: 'Urban Delivery Scenario',
        timestamp: '2024-01-15T10:30:00Z',
        flightCount: 5,
        conflictsDetected: 2,
        status: 'completed',
        duration: 450
      },
      {
        id: '2',
        name: 'Emergency Response Test',
        timestamp: '2024-01-14T14:15:00Z',
        flightCount: 8,
        conflictsDetected: 0,
        status: 'completed',
        duration: 380
      },
      {
        id: '3',
        name: 'High Traffic Scenario',
        timestamp: '2024-01-14T09:45:00Z',
        flightCount: 12,
        conflictsDetected: 5,
        status: 'completed',
        duration: 720
      }
    ]);
  }, []);

  const resimulate = (simulation: SimulationRun) => {
    toast({
      title: "Starting Resimulation",
      description: `Resimulating "${simulation.name}" with ${simulation.flightCount} flights`,
    });
    
    // This would trigger your Python backend
    console.log('Resimulating:', simulation);
  };

  const viewDetails = (simulation: SimulationRun) => {
    toast({
      title: "Opening Details",
      description: `Loading detailed results for "${simulation.name}"`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Simulation History</h1>
          <p className="text-gray-600 mt-2">View and resimulate previous drone mission scenarios</p>
        </div>

        <div className="grid gap-6">
          {simulations.map((simulation) => (
            <Card key={simulation.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{simulation.name}</CardTitle>
                  <Badge className={getStatusColor(simulation.status)}>
                    {simulation.status.charAt(0).toUpperCase() + simulation.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Timestamp</div>
                    <div className="font-semibold">
                      {new Date(simulation.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Flight Count</div>
                    <div className="font-semibold">{simulation.flightCount} drones</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Conflicts Detected</div>
                    <div className={`font-semibold ${simulation.conflictsDetected > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {simulation.conflictsDetected} conflicts
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-semibold">{Math.floor(simulation.duration / 60)}m {simulation.duration % 60}s</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button onClick={() => resimulate(simulation)} variant="default">
                    Resimulate
                  </Button>
                  <Button onClick={() => viewDetails(simulation)} variant="outline">
                    View Details
                  </Button>
                  <Button variant="outline">
                    View 2D Animation
                  </Button>
                  <Button variant="outline">
                    View 4D Visualization
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {simulations.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-500">
                  <div className="text-xl mb-2">No simulations found</div>
                  <div>Run your first simulation to see results here</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationHistory;
