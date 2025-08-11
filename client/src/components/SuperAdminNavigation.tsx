import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Settings, Users, Building2, Package, BarChart3, Shield } from "lucide-react";

export function SuperAdminNavigation() {
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  // Only show for super admins
  if (!user?.isSuperAdmin) {
    return null;
  }

  return (
    <Card className="fixed top-4 right-4 z-50 bg-red-50 border-red-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-red-700 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Super Admin Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild className="text-xs">
            <Link href="/admin">
              <BarChart3 className="w-3 h-3 mr-1" />
              Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="text-xs">
            <Link href="/admin/users">
              <Users className="w-3 h-3 mr-1" />
              Users
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="text-xs">
            <Link href="/admin/tenants">
              <Building2 className="w-3 h-3 mr-1" />
              Tenants
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="text-xs">
            <Link href="/admin/analytics">
              <Package className="w-3 h-3 mr-1" />
              Packages
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}