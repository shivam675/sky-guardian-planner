
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SimulationRun {
  id: string;
  name: string;
  timestamp: string;
  flight_count: number;
  conflicts_found: boolean;
  total_conflicts: number;
  status: 'completed' | 'failed' | 'running';
}

const SimulationHistory = () => {
  const { toast } = useToast();
  const [simulations, setSimulations] = useState<SimulationRun[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSimulations();
  }, []);

  const fetchSimulations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/simulations');
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setSimulations(data.simulations);
        }
      } else {
        // Fallback to localStorage if backend is not available
        const localSim = localStorage.getItem('latest_simulation');
        if (localSim) {
          const parsed = JSON.parse(localSim);
          setSimulations([{
            id: parsed.id,
            name: parsed.name,
            timestamp: parsed.timestamp,
            flight_count: (parsed.simulated_flights?.length || 0) + 1,
            conflicts_found: parsed.result?.conflicts_found || false,
            total_conflicts: parsed.result?.total_conflicts || 0,
            status: 'completed'
          }]);
        }
      }
    } catch (error) {
      console.error('Error fetching simulations:', error);
      toast({
        title: "Backend Connection Failed",
        description: "Make sure your Flask backend is running on port 5000",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resimulate = async (simulation: SimulationRun) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/resimulate/${simulation.id}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast({
          title: "Resimulation Started",
          description: `Resimulating "${simulation.name}"`,
        });
        
        // Refresh the simulations list
        await fetchSimulations();
      } else {
        throw new Error('Resimulation failed');
      }
    } catch (error) {
      console.error('Error resimulating:', error);
      toast({
        title: "Resimulation Failed",
        description: "Could not resimulate. Check backend connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (simulation: SimulationRun) => {
    try {
      const response = await fetch(`/api/simulation/${simulation.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Simulation details:', data.simulation);
        toast({
          title: "Simulation Details",
          description: `${data.simulation.total_conflicts} conflicts found`,
        });
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      toast({
        title: "Error",
        description: "Could not fetch simulation details",
        variant: "destructive"
      });
    }
  };

  const view2DAnimation = (simulation: SimulationRun) => {
    const url = `/api/visualize-2d/${simulation.id}`;
    window.open(url, '_blank');
  };

  const view4DVisualization = (simulation: SimulationRun) => {
    const url = `/api/visualize-4d/${simulation.id}`;
    window.open(url, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'running': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-xl">Loading simulations...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Simulation History</h1>
            <p className="text-gray-600 mt-2">View and resimulate previous drone mission scenarios</p>
          </div>
          <Button onClick={fetchSimulations} variant="outline">
            Refresh
          </Button>
        </div>

        <div className="grid gap-6">
          {simulations.map((simulation) => (
            <Card key={simulation.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{simulation.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(simulation.status)}>
                      {simulation.status.charAt(0).toUpperCase() + simulation.status.slice(1)}
                    </Badge>
                    {simulation.conflicts_found && (
                      <Badge variant="destructive">
                        {simulation.total_conflicts} Conflicts
                      </Badge>
                    )}
                  </div>
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
                    <div className="font-semibold">{simulation.flight_count} drones</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Conflicts Detected</div>
                    <div className={`font-semibold ${simulation.conflicts_found ? 'text-red-600' : 'text-green-600'}`}>
                      {simulation.total_conflicts} conflicts
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="font-semibold capitalize">{simulation.status}</div>
                  </div>
                </div>
                
                <div className="flex gap-3 flex-wrap">
                  <Button 
                    onClick={() => resimulate(simulation)} 
                    variant="default"
                    disabled={loading}
                  >
                    Resimulate
                  </Button>
                  <Button 
                    onClick={() => viewDetails(simulation)} 
                    variant="outline"
                  >
                    View Details
                  </Button>
                  <Button 
                    onClick={() => view2DAnimation(simulation)}
                    variant="outline"
                  >
                    View 2D Animation
                  </Button>
                  <Button 
                    onClick={() => view4DVisualization(simulation)}
                    variant="outline"
                  >
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
                  <div className="mt-4 text-sm">
                    Make sure your Flask backend is running on port 5000
                  </div>
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
