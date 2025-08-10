import { useState } from "react";
import { AnalyticsDashboard } from "@/components/ai/analytics-dashboard";
import { CreatePackageModal } from "@/components/forms/create-package-modal";
import { CreateServiceModal } from "@/components/forms/create-service-modal";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useToast } from "@/hooks/use-toast";

export default function AIAnalytics() {
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const [showCreateService, setShowCreateService] = useState(false);
  const [prefilledPackageData, setPrefilledPackageData] = useState<any>(null);
  const [prefilledServiceData, setPrefilledServiceData] = useState<any>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { toast } = useToast();

  const handleCreatePackage = (packageData: any) => {
    setPrefilledPackageData(packageData);
    setShowCreatePackage(true);
    toast({
      title: "AI Package Suggestion",
      description: `Opening package creation with AI-recommended data for ${packageData.name}`
    });
  };

  const handleCreateService = (serviceData: any) => {
    setPrefilledServiceData(serviceData);
    setShowCreateService(true);
    toast({
      title: "AI Service Suggestion", 
      description: `Opening service creation with AI-recommended data for ${serviceData.name}`
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMobileNavToggle={() => setMobileNavOpen(true)} />
        
        <main className="flex-1 overflow-y-auto">
          <AnalyticsDashboard 
            onCreatePackage={handleCreatePackage}
            onCreateService={handleCreateService}
          />
        </main>
      </div>
      
      <CreatePackageModal
        open={showCreatePackage}
        onOpenChange={(open) => {
          setShowCreatePackage(open);
          if (!open) setPrefilledPackageData(null);
        }}
        initialData={prefilledPackageData}
      />

      <CreateServiceModal
        open={showCreateService}
        onOpenChange={(open) => {
          setShowCreateService(open);
          if (!open) setPrefilledServiceData(null);
        }}
        initialData={prefilledServiceData}
      />
    </div>
  );
}