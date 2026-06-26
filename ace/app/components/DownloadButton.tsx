"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

interface DownloadButtonProps {
  downloadUrl: string;
  version: string;
  variant?: "primary" | "secondary";
}

export default function DownloadButton({
  downloadUrl,
  version,
  variant = "primary",
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return; // Prevent double-clicks

    setIsDownloading(true);

    try {
      // Trigger download by opening in new tab/window
      // The browser will automatically handle the Content-Disposition header
      const downloadApiUrl = `/api/download?url=${encodeURIComponent(downloadUrl)}`;
      
      // Open in new tab - browser will download the file
      const newWindow = window.open(downloadApiUrl, '_blank');
      
      // If popup was blocked, fallback to direct navigation
      if (!newWindow) {
        window.location.href = downloadApiUrl;
      }

      // Reset state after a short delay
      setTimeout(() => {
        setIsDownloading(false);
      }, 2000);
    } catch (error) {
      console.error("Download error:", error);
      setIsDownloading(false);
      // Fallback: direct navigation
      window.location.href = `/api/download?url=${encodeURIComponent(downloadUrl)}`;
    }
  };

  const baseClasses = variant === "primary"
    ? "mt-8 inline-flex items-center gap-3 px-8 py-4 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform"
    : "px-4 py-2 font-medium rounded-full transition-colors flex items-center gap-2";

  const colorClasses = isDownloading
    ? "bg-slate-500 cursor-not-allowed"
    : "bg-blue-600 hover:bg-blue-500 text-white hover:scale-105";

  if (variant === "primary") {
    return (
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`${baseClasses} ${colorClasses}`}
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <Download className="w-6 h-6" />
            Download APK ({version})
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={`${baseClasses} ${colorClasses}`}
    >
      {isDownloading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="hidden sm:inline">Downloading...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download</span>
        </>
      )}
    </button>
  );
}