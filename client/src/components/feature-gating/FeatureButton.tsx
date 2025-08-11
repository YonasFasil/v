import React from 'react';
import { Button } from '@/components/ui/button';
import { useTenantFeatures } from '@/hooks/useTenantFeatures';
import { Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FeatureButtonProps extends React.ComponentProps<typeof Button> {
  feature: string;
  children: React.ReactNode;
  upgradeMessage?: string;
}

export function FeatureButton({ 
  feature, 
  children, 
  onClick,
  upgradeMessage,
  ...props 
}: FeatureButtonProps) {
  const { hasFeature, tenantInfo } = useTenantFeatures();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!hasFeature(feature)) {
      e.preventDefault();
      toast({
        title: "Upgrade Required",
        description: upgradeMessage || `This feature requires a higher plan. Upgrade your ${tenantInfo?.planName || 'current'} plan to continue.`,
        variant: "destructive",
      });
      return;
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Button 
      {...props}
      onClick={handleClick}
      disabled={!hasFeature(feature) || props.disabled}
      className={`${props.className} ${!hasFeature(feature) ? 'opacity-75' : ''}`}
    >
      {!hasFeature(feature) && <Lock className="w-4 h-4 mr-2" />}
      {children}
    </Button>
  );
}