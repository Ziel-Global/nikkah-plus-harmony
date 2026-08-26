import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ActiveMatchBanner() {
  return (
    <Alert className="border-secondary/50 bg-secondary/10">
      <Info className="h-4 w-4 text-primary" aria-hidden="true" />
      <AlertTitle>You have an active match</AlertTitle>
      <AlertDescription>
        You are welcome to keep browsing, though new interest requests are paused until your current
        match has been concluded with your mosque. This helps everyone give one introduction their
        full attention.
      </AlertDescription>
    </Alert>
  );
}
