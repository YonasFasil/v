import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface SimpleDevAuthProps {
  onAuthenticated: (userId: string) => void;
}

export function SimpleDevAuth({ onAuthenticated }: SimpleDevAuthProps) {
  const [userId, setUserId] = useState("dev-user-123");

  const handleAuth = () => {
    if (userId.trim()) {
      // Store in localStorage for dev mode
      localStorage.setItem('devUserId', userId);
      onAuthenticated(userId);
      toast({ 
        title: "Development Authentication", 
        description: `Authenticated as user: ${userId}` 
      });
    }
  };

  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <Card className="w-96 mx-auto mt-20">
      <CardHeader>
        <CardTitle>Development Authentication</CardTitle>
        <CardDescription>
          Enter a user ID for development testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user ID"
        />
        <Button onClick={handleAuth} className="w-full">
          Login as Dev User
        </Button>
      </CardContent>
    </Card>
  );
}