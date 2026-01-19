// Helper functions for downloading evidence files

/**
 * Get MIME type from file extension
 */
export const getMimeTypeFromExtension = (
  extension: string | undefined
): string => {
  if (!extension) return "application/octet-stream";

  const mimeTypes: { [key: string]: string } = {
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    rtf: "application/rtf",

    // Spreadsheets
    xls: "application/vnd.ms-excel",
    xlsx:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv",

    // Presentations
    ppt: "application/vnd.ms-powerpoint",
    pptx:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    bmp: "image/bmp",
    svg: "image/svg+xml",
    webp: "image/webp",
    tiff: "image/tiff",

    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",

    // Video
    mp4: "video/mp4",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    wmv: "video/x-ms-wmv",
    webm: "video/webm",

    // Archives
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",

    // Code
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    xml: "application/xml",

    // Other
    exe: "application/x-msdownload",
    dmg: "application/x-apple-diskimage",
    iso: "application/x-iso9660-image",
  };

  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
};

/**
 * Sanitize filename by removing problematic characters
 */
export const sanitizeFileName = (filename: string): string => {
  // Remove or replace problematic characters
  return filename
    .replace(/[<>:"/\\|?*]/g, "_") // Replace invalid characters with underscore
    .replace(/\s+/g, "_") // Replace spaces with underscore
    .replace(/_{2,}/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, "") // Remove leading/trailing underscores
    .substring(0, 200); // Limit length to prevent issues
};

/**
 * Download file with CORS handling
 */
export const downloadFile = async (
  url: string,
  filename: string
): Promise<Blob> => {
  try {
    console.log(`Attempting to download file: ${filename} from URL: ${url}`);

    // Method 1: Try direct fetch first (for files with proper CORS headers)
    try {
      const response = await fetch(url, {
        mode: "cors",
        credentials: "omit",
        headers: {
          Accept: "*/*",
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        console.log(
          `Direct fetch successful. Blob type: ${blob.type}, size: ${blob.size}`
        );

        // Validate that we got a proper file blob
        if (blob.size === 0) {
          throw new Error("Downloaded file is empty");
        }

        // Detect and set proper MIME type based on file extension
        const extension = filename.split(".").pop()?.toLowerCase();
        let mimeType = blob.type;

        // If blob type is empty or generic, set based on extension
        if (
          !mimeType ||
          mimeType === "application/octet-stream" ||
          mimeType === "text/html"
        ) {
          mimeType = getMimeTypeFromExtension(extension);
        }

        const properBlob = new Blob([blob], { type: mimeType });
        return properBlob;
      } else {
        console.warn(`Direct fetch failed with status: ${response.status}`);
      }
    } catch (corsError) {
      console.warn(
        "Direct fetch failed due to CORS, trying alternative methods:",
        corsError
      );
    }

    // Method 2: Use a proxy endpoint (recommended)
    // You'll need to create a backend endpoint that proxies the S3 request
    const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        Accept: "*/*",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to download file via proxy: ${response.statusText}`
      );
    }

    const blob = await response.blob();
    console.log(
      `Proxy download successful. Blob type: ${blob.type}, size: ${blob.size}`
    );

    // Detect and set proper MIME type based on file extension
    const extension = filename.split(".").pop()?.toLowerCase();
    let mimeType = blob.type;

    // If blob type is empty or generic, set based on extension
    if (
      !mimeType ||
      mimeType === "application/octet-stream" ||
      mimeType === "text/html"
    ) {
      mimeType = getMimeTypeFromExtension(extension);
    }

    const properBlob = new Blob([blob], { type: mimeType });
    return properBlob;
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};

/**
 * Alternative method: Download file by opening in new tab (for direct S3 URLs)
 */
export const downloadFileDirect = (url: string, filename: string) => {
  try {
    // Create a temporary link element
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading file directly:", error);
    // Fallback: open in new tab
    window.open(url, "_blank");
  }
};

/**
 * Create ZIP file from multiple files
 */
export const createZipFile = async (
  files: { name: string; blob: Blob }[]
): Promise<Blob> => {
  // Using JSZip library - you'll need to install it: npm install jszip
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  files.forEach((file, index) => {
    const originalName = file.name || `evidence_${index + 1}.pdf`;
    const sanitizedName = sanitizeFileName(originalName);
    const finalName = sanitizedName || `evidence_${index + 1}.pdf`;

    console.log(
      `Adding file to ZIP: ${finalName}, Blob type: ${file.blob.type}, size: ${file.blob.size}`
    );

    // Ensure the file has a proper extension
    if (!finalName.includes(".")) {
      const extension = originalName.split(".").pop() || "pdf";
      const fileNameWithExt = `${finalName}.${extension}`;

      // Create a new blob with proper MIME type
      const mimeType = getMimeTypeFromExtension(extension);
      const properBlob = new Blob([file.blob], { type: mimeType });

      zip.file(fileNameWithExt, properBlob);
    } else {
      // Create a new blob with proper MIME type based on extension
      const extension = finalName.split(".").pop()?.toLowerCase();
      const mimeType = getMimeTypeFromExtension(extension);

      const properBlob = new Blob([file.blob], { type: mimeType });
      zip.file(finalName, properBlob);
    }
  });

  return await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6, // Balanced compression
    },
  });
};

