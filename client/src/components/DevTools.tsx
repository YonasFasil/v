import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings } from "lucide-react";

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);

  const makeSuperAdminMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/dev/make-superadmin');
    },
    onSuccess: (data) => {
      toast({ 
        title: "Success", 
        description: data.message || "You are now a superadmin. Visit /superadmin to access the dashboard."
      });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to make user superadmin", 
        variant: "destructive" 
      });
    },
  });

  const createTestTenantMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/dev/create-test-tenant');
    },
    onSuccess: (data) => {
      toast({ 
        title: "Success", 
        description: data.message || "Test tenant created successfully"
      });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to create test tenant", 
        variant: "destructive" 
      });
    },
  });

  // Only show in development mode
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full shadow-lg"
          size="sm"
        >
          <Settings className="h-4 w-4" />
        </Button>
      ) : (
        <Card className="w-80 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              Dev Tools
              <Badge variant="outline">Development</Badge>
            </CardTitle>
            <CardDescription>
              Development helper tools for testing multi-tenant features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => makeSuperAdminMutation.mutate()}
              disabled={makeSuperAdminMutation.isPending}
              className="w-full"
              variant="outline"
            >
              {makeSuperAdminMutation.isPending ? "Making Superadmin..." : "Make Me Superadmin"}
            </Button>
            
            <Button 
              onClick={() => createTestTenantMutation.mutate()}
              disabled={createTestTenantMutation.isPending}
              className="w-full"
              variant="outline"
            >
              {createTestTenantMutation.isPending ? "Creating..." : "Create Test Tenant"}
            </Button>

            <div className="text-sm text-muted-foreground pt-2 border-t">
              <p>• Make yourself a superadmin to access /superadmin</p>
              <p>• Create test data for multi-tenant testing</p>
            </div>

            <Button 
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
              className="w-full mt-3"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}