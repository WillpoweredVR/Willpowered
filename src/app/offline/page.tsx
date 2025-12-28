import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-slate-400" />
        </div>
        
        <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
          You're Offline
        </h1>
        
        <p className="text-muted-foreground mb-8">
          It looks like you've lost your internet connection. Don't worry—your 
          progress is saved, and we'll sync everything when you're back online.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => window.location.reload()} 
            className="gradient-ember text-white gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          
          <p className="text-sm text-muted-foreground">
            While you wait, remember: willpower is built one moment at a time. 
            This moment counts too.
          </p>
        </div>
      </div>
    </div>
  );
}



