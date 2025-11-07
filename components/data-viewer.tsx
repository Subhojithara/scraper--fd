"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";

interface DataViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: string;
  type: "raw" | "cleaned";
}

export function DataViewer({ open, onOpenChange, title, data, type }: DataViewerProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scraped-${type}-${Date.now()}.${type === "raw" ? "html" : "txt"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            <Badge variant="outline">{type === "raw" ? "HTML" : "Text"}</Badge>
          </DialogTitle>
          <DialogDescription>
            {type === "raw" ? "Raw HTML content from the scraped page" : "Cleaned and processed text content"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
        
        <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
          <pre className="text-xs font-mono whitespace-pre-wrap break-words">
            {data}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


