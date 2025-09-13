// components/ErrorCard.tsx
"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ErrorCardProps = {
  title?: string;
  description?: string;
  ctaText?: string;
  onRetry?: () => void;
  className?: string;
};

const ErrorCard = ({
  title = "Something went wrong",
  description = "We couldn’t load the data. Please try again.",
  ctaText = "Retry",
  onRetry,
  className
}: ErrorCardProps) => {
  return (
    <div className={cn("w-full h-full grid place-items-center mt-4", className)}>
      <Card className="w-full max-w-md border-red-500 border">
        <CardHeader className="flex flex-col items-center text-center">
          <AlertTriangle className="text-red-500 w-8 h-8 mb-2" />
          <CardTitle className="text-red-700 text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {onRetry && (
          <CardFooter className="flex justify-center">
            <Button onClick={onRetry} variant="destructive">
              {ctaText}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ErrorCard;
