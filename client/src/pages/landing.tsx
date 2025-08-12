import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, UsersIcon, TrendingUpIcon } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Venuine Events
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Streamline your venue management with AI-powered insights, seamless booking management, 
            and comprehensive customer communications.
          </p>
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="px-8 py-3 text-lg"
            data-testid="button-login"
          >
            Sign In to Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-gray-900 dark:text-white">
                <CalendarIcon className="h-6 w-6 mr-2 text-blue-600" />
                Smart Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                AI-powered booking management with conflict detection and automated scheduling optimization.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-gray-900 dark:text-white">
                <UsersIcon className="h-6 w-6 mr-2 text-green-600" />
                Customer Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Comprehensive customer communications, proposals, and relationship tracking in one place.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-gray-900 dark:text-white">
                <TrendingUpIcon className="h-6 w-6 mr-2 text-purple-600" />
                Analytics & Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Data-driven insights and predictive analytics to maximize revenue and optimize operations.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Professional venue management made simple
          </p>
        </div>
      </div>
    </div>
  );
}