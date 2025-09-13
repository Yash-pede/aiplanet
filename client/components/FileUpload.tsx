"use client";

import React, { useEffect, useState } from "react";
import {
  UploadIcon,
  PaperclipIcon,
  XIcon,
  ArrowUpRightFromSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { useWorkflowStore } from "@/providers/workflow-store-provider";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Database } from "@/database.types";
import { GetWorkflowDocument } from "@/lib/queryFunctions";
import ErrorCard from "./layput/error/ErrorCard";
import { Skeleton } from "./ui/skeleton";

export default function FileUploadDirect() {
  const maxSize = 5 * 1024 * 1024; // 5 MB
  const supabase = createClient();

  const selectedWorkflow = useWorkflowStore((s) => s.selectedWorkflow);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const {
    data: initialDocument,
    isLoading,
    error,
    isSuccess,
  } = useQuery<Database["public"]["Tables"]["documents"]["Row"]>({
    queryKey: ["documents", selectedWorkflow?.id],
    enabled: !!selectedWorkflow,
    queryFn: () => GetWorkflowDocument(selectedWorkflow?.id as string),
  });
  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    maxSize,
    accept: "application/pdf",
    multiple: false,
  });
  const fileWrapper = files[0];

  useEffect(() => {
    if (!fileWrapper?.file || !selectedWorkflow) return;

    const doUpload = async () => {
      setUploading(true);
      setUploadError(null);

      try {
        // 1. Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("User not authenticated");
        }

        const file = fileWrapper.file;
        const fileName = `${Date.now()}_${file.name}`;
        const storagePath = `documents/${selectedWorkflow.id}/${fileName}`;

        // 2. Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(storagePath, file as File, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // 3. Get public URL
        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(storagePath);

        const fileUrl = urlData.publicUrl;

        // 4. Insert metadata into documents table with proper user_id
        const { data: metaData, error: metaError } = await supabase
          .from("documents")
          .insert({
            file_name: fileName,
            file_url: fileUrl,
            workflow_id: selectedWorkflow.id,
            user_id: user.id, // Use authenticated user's ID
            status: "pending", // Use "pending" to match your backend schema
          })
          .select()
          .single();

        if (metaError) throw metaError;

        setUploadedUrl(fileUrl);
        console.log("Document uploaded successfully:", metaData);
      } catch (err: any) {
        console.error("Upload failed:", err);
        setUploadError(err.message || "Upload error");
      } finally {
        setUploading(false);
      }
    };

    doUpload();
  }, [fileWrapper, selectedWorkflow, supabase]);

  if (error) return <ErrorCard description="Error loading document" />;
  if (isLoading) return <Skeleton className="w-full min-h-28" />;
  if (initialDocument[0]?.file_url) {
    return (
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <PaperclipIcon />
          <span className="truncate">{initialDocument[0].file_name}</span>
        </div>
        <Link href={initialDocument[0].file_url} target="_blank">
          <ArrowUpRightFromSquare />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        onClick={openFileDialog}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        className="border-dashed border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer"
      >
        <input
          {...getInputProps()}
          className="sr-only"
          disabled={Boolean(fileWrapper)}
        />

        <UploadIcon className="w-6 h-6 mb-2" />
        <p>
          Drag & drop or click to upload a PDF file (max {formatBytes(maxSize)})
        </p>
      </div>

      {errors.length > 0 && (
        <div className="text-red-500 text-sm">{errors[0]}</div>
      )}

      {fileWrapper && (
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <PaperclipIcon />
            <span className="truncate">{fileWrapper.file.name}</span>
          </div>
          <Link href={uploadedUrl ?? ""} target="_blank">
            <ArrowUpRightFromSquare />
          </Link>
        </div>
      )}

      {uploading && <p>Uploading...</p>}
      {uploadError && (
        <div className="text-red-500 text-sm flex items-center gap-2">
          <span>{uploadError}</span>
        </div>
      )}
      {uploadedUrl && (
        <p className="text-green-600">
          Uploaded!{" "}
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
            View file
          </a>
        </p>
      )}
    </div>
  );
}
