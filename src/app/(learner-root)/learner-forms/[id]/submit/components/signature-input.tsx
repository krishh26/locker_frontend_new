"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PenTool, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Control, Controller } from "react-hook-form";

interface SignatureInputProps {
  name: string;
  control: Control<Record<string, string | string[] | File | undefined>>;
  label: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export function SignatureInput({
  name,
  control,
  label,
  required,
  error,
  disabled,
}: SignatureInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = (onChange: (value: Record<string, string | string[] | File | undefined>) => void) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");

    const signatureData = {
      name: label,
      timestamp: new Date().toISOString(),
      dataURL,
    };

    onChange(signatureData);
    setIsOpen(false);
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => {
        const hasSignature = value && typeof value === "object" && (value as unknown as { dataURL: string }).dataURL;

        return (
          <div className="space-y-2">
            <Label>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(true)}
                disabled={disabled}
                className="flex-1"
              >
                <PenTool className="mr-2 h-4 w-4" />
                {hasSignature ? "Edit Signature" : "Sign"}
              </Button>
              {hasSignature && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onChange(undefined)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {hasSignature && (
              <div className="border rounded-md p-2">
                <Image
                  src={(value as unknown as { dataURL?: string }).dataURL || "" }
                  alt="Signature"
                  width={200}
                  height={80}
                  className="max-h-20 object-contain"
                  style={{ height: 'auto', width: 'auto', maxHeight: '5rem' }}
                  unoptimized
                  priority={false}
                />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Sign Here</DialogTitle>
                  <DialogDescription>
                    Draw your signature in the box below
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border rounded-md bg-white">
                    <canvas
                      ref={canvasRef}
                      width={450}
                      height={200}
                      className="w-full cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      style={{ touchAction: "none" }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearSignature}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    onClick={() => saveSignature(onChange)}
                  >
                    Save Signature
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );
      }}
    />
  );
}

