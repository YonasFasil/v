import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User } from "lucide-react";
import { type User as UserType } from "@shared/schema";

export function AuthHeader() {
  const { user } = useAuth() as { user: UserType | null };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (!user) return null;

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.name || user.email || "User";
  
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <span className="font-medium text-gray-900 dark:text-white">
          {displayName}
        </span>
        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {user.role}
        </div>
      </div>
      
      <Button 
        onClick={handleLogout} 
        variant="outline" 
        size="sm"
        data-testid="button-logout"
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}