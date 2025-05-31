
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Eye, Download, RefreshCw } from 'lucide-react';

interface ConflictData {
  time: string;
  location: {
    x: number;
    y: number;
    z: number;
  };
  conflict_with: string;
}

interface SimulationResult {
  id: string;
  name: string;
  timestamp: string;
  primary_mission: any;
  simulated_flights: any[];
  conflicts: ConflictData[];
  status: string;
  conflicts_found: boolean;
  total_conflicts: number;
  parameters: {
    distance_threshold: number;
    time_tolerance: number;
  };
}

const ConflictAnalysis = () => {
  const { toast } = useToast();
  const [simulations, setSimulations] = useState<SimulationResult[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [visualizationLoading, setVisualizationLoading] = useState(false);

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
          // Fetch detailed data for each simulation
          const detailedSims = await Promise.all(
            data.simulations.map(async (sim: any) => {
              const detailResponse = await fetch(`/api/simulation/${sim.id}`);
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                return detailData.simulation;
              }
              return sim;
            })
          );
          setSimulations(detailedSims);
        }
      }
    } catch (error) {
      console.error('Error fetching simulations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch simulation data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectSimulation = (simulation: SimulationResult) => {
    setSelectedSimulation(simulation);
  };

  const view2DVisualization = () => {
    if (!selectedSimulation) return;
    setVisualizationLoading(true);
    const url = `/api/visualize-2d/${selectedSimulation.id}`;
    const newWindow = window.open(url, '_blank', 'width=1000,height=800');
    if (newWindow) {
      newWindow.onload = () => setVisualizationLoading(false);
    } else {
      setVisualizationLoading(false);
    }
  };

  const view4DVisualization = () => {
    if (!selectedSimulation) return;
    setVisualizationLoading(true);
    const url = `/api/visualize-4d/${selectedSimulation.id}`;
    const newWindow = window.open(url, '_blank', 'width=1200,height=900');
    if (newWindow) {
      newWindow.onload = () => setVisualizationLoading(false);
    } else {
      setVisualizationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <div className="text-xl">Loading conflict analysis data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Conflict Analysis</h1>
          <p className="text-gray-600 mt-2">Analyze spatial and temporal conflicts in drone missions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulation List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Simulations
                  <Button onClick={fetchSimulations} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                {simulations.map((sim) => (
                  <div
                    key={sim.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSimulation?.id === sim.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => selectSimulation(sim)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium truncate">{sim.name}</div>
                      {sim.conflicts_found && (
                        <Badge variant="destructive" className="text-xs">
                          {sim.total_conflicts}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(sim.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {(sim.simulated_flights?.length || 0) + 1} drones
                    </div>
                  </div>
                ))}
                {simulations.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No simulations found. Run a simulation first.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analysis Details */}
          <div className="lg:col-span-2">
            {selectedSimulation ? (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
                  <TabsTrigger value="2d-view">2D View</TabsTrigger>
                  <TabsTrigger value="4d-view">4D View</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedSimulation.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Status</div>
                          <div className={`font-semibold ${
                            selectedSimulation.status === 'clear' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {selectedSimulation.status}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Total Conflicts</div>
                          <div className="font-semibold">{selectedSimulation.total_conflicts}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Distance Threshold</div>
                          <div className="font-semibold">{selectedSimulation.parameters?.distance_threshold}m</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Time Tolerance</div>
                          <div className="font-semibold">{selectedSimulation.parameters?.time_tolerance}s</div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="font-semibold mb-3">Mission Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-600">Primary Mission</div>
                            <div className="font-medium">{selectedSimulation.primary_mission?.mission_id}</div>
                            <div className="text-sm text-gray-500">
                              {selectedSimulation.primary_mission?.waypoints?.length} waypoints
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Simulated Flights</div>
                            <div className="font-medium">{selectedSimulation.simulated_flights?.length} drones</div>
                            <div className="text-sm text-gray-500">
                              {selectedSimulation.simulated_flights?.map(f => f.id).join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="conflicts" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Conflict Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedSimulation.conflicts && selectedSimulation.conflicts.length > 0 ? (
                        <div className="space-y-4">
                          {selectedSimulation.conflicts.map((conflict, index) => (
                            <div key={index} className="border rounded-lg p-4 bg-red-50">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="destructive">Conflict {index + 1}</Badge>
                                <div className="text-sm text-gray-600">
                                  vs. {conflict.conflict_with}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-600">Time</div>
                                  <div className="font-medium">
                                    {new Date(conflict.time).toLocaleTimeString()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-600">X Position</div>
                                  <div className="font-medium">{conflict.location.x.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Y Position</div>
                                  <div className="font-medium">{conflict.location.y.toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Z Position</div>
                                  <div className="font-medium">{conflict.location.z.toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                          <div className="text-lg font-medium text-green-600">No Conflicts Detected</div>
                          <div className="text-sm">All drone trajectories are clear of conflicts.</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="2d-view" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        2D Mission Visualization (Matplotlib)
                        <Button 
                          onClick={view2DVisualization}
                          disabled={visualizationLoading}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          {visualizationLoading ? 'Loading...' : 'Open 2D View'}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="text-gray-600 mb-4">
                          2D trajectory animation with conflict visualization
                        </div>
                        <div className="text-sm text-gray-500">
                          Click "Open 2D View" to launch the matplotlib animation in a new window
                        </div>
                        <div className="mt-4 text-xs text-gray-400">
                          • Primary drone trajectory in blue
                          • Simulated drones in different colors
                          • Conflicts highlighted with markers
                          • Time-based animation
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="4d-view" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        4D Mission Visualization (Plotly - 3D + Time)
                        <Button 
                          onClick={view4DVisualization}
                          disabled={visualizationLoading}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          {visualizationLoading ? 'Loading...' : 'Open 4D View'}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="text-gray-600 mb-4">
                          Interactive 3D trajectory with time dimension controls
                        </div>
                        <div className="text-sm text-gray-500">
                          Click "Open 4D View" to launch the interactive plotly visualization
                        </div>
                        <div className="mt-4 text-xs text-gray-400">
                          • 3D spatial representation (X, Y, Z)
                          • Time slider and animation controls
                          • Interactive zoom and rotation
                          • Conflict markers in 3D space
                          • Play/pause animation controls
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <div className="text-xl text-gray-600 mb-2">Select a Simulation</div>
                  <div className="text-gray-500">
                    Choose a simulation from the list to analyze conflicts and view visualizations
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictAnalysis;
