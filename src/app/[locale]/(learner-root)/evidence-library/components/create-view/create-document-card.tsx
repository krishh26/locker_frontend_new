"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Table, Presentation, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WordEditor } from "./word-editor";
import { ExcelEditor } from "./excel-editor";
import { PowerPointEditor } from "./powerpoint-editor";

interface ExcelRow {
  [key: string]: string;
}

interface Slide {
  id: string;
  title: string;
  content: string;
}

interface CreateDocumentCardProps {
  onDocumentCreated: (file: File) => void;
  disabled?: boolean;
  isEditMode?: boolean;
  fileUrl?: string;
  fileName?: string;
}

export function CreateDocumentCard({
  onDocumentCreated,
  disabled = false,
  isEditMode = false,
  fileUrl,
  fileName,
}: CreateDocumentCardProps) {
  const [docTab, setDocTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [createdFile, setCreatedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Word document states
  const [wordContent, setWordContent] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");

  // Excel document states
  const [excelData, setExcelData] = useState<ExcelRow[]>([
    { A: "Header 1", B: "Header 2", C: "Header 3" },
    { A: "", B: "", C: "" },
  ]);
  const [sheetName, setSheetName] = useState("Evidence_Sheet");

  // PowerPoint document states
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: "1",
      title: "Evidence Slide 1",
      content: "Enter your evidence content here...",
    },
  ]);
  const [presentationTitle, setPresentationTitle] = useState("");

  // Generate Word document
  const generateWordDocument = (): Blob => {
    const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${documentTitle}</title></head><body>`;
    const footer = "</body></html>";
    const html = `${header}<h2>${documentTitle}</h2>${wordContent}${footer}`;

    return new Blob([html], {
      type: "application/msword;charset=utf-8",
    });
  };

  // Generate Excel document (CSV)
  const generateExcelDocument = (): Blob => {
    const csvContent = excelData
      .map((row) => Object.values(row).join(","))
      .join("\n");
    return new Blob([csvContent], { type: "text/csv" });
  };

  // Generate PowerPoint document (HTML)
  const generatePowerPointDocument = (): Blob => {
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${presentationTitle}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .presentation-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .presentation-header {
            background: #d83b01;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .presentation-title {
            font-size: 2.5em;
            margin: 0;
            font-weight: bold;
        }
        .presentation-info {
            margin-top: 10px;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .slide {
            padding: 40px;
            border-bottom: 3px solid #f0f0f0;
            min-height: 400px;
            display: flex;
            flex-direction: column;
        }
        .slide:last-child {
            border-bottom: none;
        }
        .slide-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        .slide-number {
            background: #d83b01;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9em;
        }
        .slide-title {
            color: #d83b01;
            font-size: 2em;
            font-weight: bold;
            margin: 0;
            flex: 1;
            margin-left: 20px;
        }
        .slide-content {
            font-size: 1.2em;
            line-height: 1.6;
            color: #333;
            white-space: pre-wrap;
            flex: 1;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        @media print {
            body { background: white; }
            .slide { page-break-after: always; }
            .slide:last-child { page-break-after: auto; }
        }
    </style>
</head>
<body>
    <div class="presentation-container">
        <div class="presentation-header">
            <h1 class="presentation-title">${presentationTitle}</h1>
            <div class="presentation-info">
                Created: ${new Date().toLocaleDateString()} | ${slides.length} Slides | Evidence Presentation
            </div>
        </div>
`;

    slides.forEach((slide) => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = slide.content;
      const plainContent = tempDiv.textContent || tempDiv.innerText || "";

      htmlContent += `
        <div class="slide">
            <div class="slide-header">
                <h2 class="slide-title">${slide.title}</h2>
            </div>
            <div class="slide-content">${plainContent}</div>
        </div>`;
    });

    htmlContent += `
        <div class="footer">
            <p>${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;

    return new Blob([htmlContent], { type: "text/html" });
  };

  // Handle Word document creation
  const handleWordCreate = async () => {
    try {
      if (!documentTitle.trim()) {
        throw new Error("Document title is required");
      }
      if (!wordContent.trim()) {
        throw new Error("Document content cannot be empty");
      }

      setLoading(true);
      const blob = generateWordDocument();
      const filename = `${documentTitle || "document"}.doc`;
      const file = new File([blob], filename, {
        type: "application/msword",
      });
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setCreatedFile(file);
      setPreviewUrl(url);
      
      onDocumentCreated(file);
    } catch (error) {
      console.error("Word creation error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle Excel document creation
  const handleExcelCreate = async () => {
    try {
      if (!sheetName.trim()) {
        throw new Error("Sheet name is required");
      }

      const hasData = excelData.some((row) =>
        Object.values(row).some((cell) => cell.trim() !== "")
      );

      if (!hasData) {
        throw new Error("Please add some data to the spreadsheet");
      }

      setLoading(true);
      const blob = generateExcelDocument();
      const filename = `${sheetName}.csv`;
      const file = new File([blob], filename, { type: "text/csv" });
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setCreatedFile(file);
      setPreviewUrl(url);
      
      onDocumentCreated(file);
    } catch (error) {
      console.error("Excel creation error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle PowerPoint document creation
  const handlePowerPointCreate = async () => {
    try {
      if (!presentationTitle.trim()) {
        throw new Error("Presentation title is required");
      }

      const invalidSlides = slides.filter(
        (slide) => !slide.title.trim() || !slide.content.trim()
      );

      if (invalidSlides.length > 0) {
        throw new Error("All slides must have both title and content");
      }

      setLoading(true);
      const blob = generatePowerPointDocument();
      const filename = `${presentationTitle}.html`;
      const file = new File([blob], filename, { type: "text/html" });
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setCreatedFile(file);
      setPreviewUrl(url);
      
      onDocumentCreated(file);
    } catch (error) {
      console.error("PowerPoint creation error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // If in edit mode, show file preview only
  if (isEditMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {fileUrl ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{fileName || "Document"}</p>
                    <p className="text-sm text-muted-foreground">Uploaded file</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(fileUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = fileUrl;
                      link.download = fileName || "document";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No file available for preview</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Create mode: show document creation options
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Document</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={docTab.toString()}
          onValueChange={(value) => setDocTab(parseInt(value, 10))}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="0" disabled={disabled || loading}>
              <FileText className="h-4 w-4 mr-2" />
              Word Document
            </TabsTrigger>
            <TabsTrigger value="1" disabled={disabled || loading}>
              <Table className="h-4 w-4 mr-2" />
              Excel Spreadsheet
            </TabsTrigger>
            <TabsTrigger value="2" disabled={disabled || loading}>
              <Presentation className="h-4 w-4 mr-2" />
              PowerPoint
            </TabsTrigger>
          </TabsList>

          <TabsContent value="0" className="mt-4">
            <div className="min-h-[500px]">
              <WordEditor
                documentTitle={documentTitle}
                setDocumentTitle={setDocumentTitle}
                wordContent={wordContent}
                setWordContent={setWordContent}
                onSaveUpload={handleWordCreate}
                loading={loading}
                disabled={disabled}
              />
            </div>
          </TabsContent>

          <TabsContent value="1" className="mt-4">
            <div className="min-h-[500px]">
              <ExcelEditor
                sheetName={sheetName}
                setSheetName={setSheetName}
                excelData={excelData}
                setExcelData={setExcelData}
                onSaveUpload={handleExcelCreate}
                loading={loading}
                disabled={disabled}
              />
            </div>
          </TabsContent>

          <TabsContent value="2" className="mt-4">
            <div className="min-h-[500px]">
              <PowerPointEditor
                presentationTitle={presentationTitle}
                setPresentationTitle={setPresentationTitle}
                slides={slides}
                setSlides={setSlides}
                onSaveUpload={handlePowerPointCreate}
                loading={loading}
                disabled={disabled}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* File Preview Section - Show after document is created */}
        {createdFile && previewUrl && (
          <div className="mt-2 space-y-4 border-t pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Document Preview</h3>
                <p className="text-sm text-muted-foreground">
                  Your document has been created successfully
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = previewUrl;
                    link.download = createdFile.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{createdFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(createdFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

