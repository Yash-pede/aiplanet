"use client";

import { cn } from "@/lib/utils";
import { Handle, Position } from "@xyflow/react";

const CustomHandle = ({
  type,
  position,
  className,
}: {
  type: "source" | "target";
  position: Position;
  className?: string;
}) => {
  return (
    <Handle
      type={type}
      position={position}
      className={cn(
        "!w-4 !h-4 !bg-ring border-2 border-white rounded-full shadow-md hover:scale-110 transition-transform",
        className
      )}
      style={{
        bottom: 100,
      }}
    />
  );
};

export default CustomHandle;
