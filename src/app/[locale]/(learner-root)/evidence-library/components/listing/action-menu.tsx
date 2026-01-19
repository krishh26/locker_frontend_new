"use client";

import { FC } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  CloudUpload,
  Download,
  Eye,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { EvidenceEntry } from "@/store/api/evidence/types";

interface ActionMenuProps {
  evidence: EvidenceEntry;
  onReupload: () => void;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export const ActionMenu: FC<ActionMenuProps> = ({
  evidence,
  onReupload,
  onView,
  onDownload,
  onDelete,
}) => {
  const router = useRouter();

  const handleView = () => {
    router.push(`/evidence-library/${evidence.assignment_id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onReupload} className="cursor-pointer">
          <CloudUpload className="mr-2 h-4 w-4" />
          Reupload
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleView} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          View/Edit
        </DropdownMenuItem>
        {evidence.file && (
          <DropdownMenuItem onClick={onDownload} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

