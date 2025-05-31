
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plane, Database, History, AlertTriangle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              UAV Deconfliction System
            </h1>
            <p className="text-xl text-gray-600">
              Advanced spatial and temporal conflict detection for drone missions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Database className="h-8 w-8 text-blue-600" />
                  <div>
                    <CardTitle>Data Generation</CardTitle>
                    <CardDescription>
                      Create and configure drone mission parameters
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Generate primary missions and simulated flight data for conflict analysis.
                </p>
                <Link to="/data-generation">
                  <Button className="w-full">
                    Generate Mission Data
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div>
                    <CardTitle>Conflict Analysis</CardTitle>
                    <CardDescription>
                      Analyze conflicts with 2D and 4D visualizations
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  View detailed conflict analysis with matplotlib and plotly visualizations.
                </p>
                <Link to="/conflict-analysis">
                  <Button className="w-full">
                    Analyze Conflicts
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <History className="h-8 w-8 text-green-600" />
                  <div>
                    <CardTitle>Simulation History</CardTitle>
                    <CardDescription>
                      View and manage previous simulation runs
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Access historical simulation data and resimulate scenarios.
                </p>
                <Link to="/simulation-history">
                  <Button className="w-full">
                    View History
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Plane className="h-8 w-8 text-purple-600" />
                  <div>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>
                      Monitor backend connectivity and system health
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Frontend</span>
                    <span className="text-green-600 font-semibold">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Backend (Port 5000)</span>
                    <span className="text-yellow-600 font-semibold">Check Connection</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
                <p className="text-gray-600 mb-4">
                  1. Generate mission data → 2. Run deconfliction analysis → 3. View conflict analysis
                </p>
                <div className="space-x-3">
                  <Link to="/data-generation">
                    <Button variant="outline">Start Here</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
