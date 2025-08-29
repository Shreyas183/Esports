import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Loading = ({ className, size = "md" }: LoadingProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div 
        className={cn(
          "animate-spin rounded-full border-2 border-muted border-t-primary",
          sizeClasses[size]
        )}
      />
    </div>
  );
};

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loading size="lg" />
  </div>
);