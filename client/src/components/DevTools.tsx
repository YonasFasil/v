import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, User, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function DevTools() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleMakeSuperadmin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dev/make-superadmin');
      const data = await response.json();
      
      toast({
        title: "Success",
        description: `Superadmin access ready! ${data.instructions || 'Navigate to /superadmin'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create superadmin access",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="bg-background/80 backdrop-blur-sm">
            <Settings className="h-4 w-4 mr-1" />
            Dev Tools
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Development Tools
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Super Admin Access
              </h4>
              <p className="text-sm text-muted-foreground">
                Create superadmin credentials to access the platform management console at /superadmin
              </p>
              <Button 
                onClick={handleMakeSuperadmin}
                disabled={loading}
                className="w-full"
              >
                <User className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Make Me Superadmin'}
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Development tools are only available in development mode
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}