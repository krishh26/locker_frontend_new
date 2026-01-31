"use client";

import { FC } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAppSelector } from "@/store/hooks";
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
  onReupload: (evidence: EvidenceEntry) => void;
  onDownload: () => void;
  onDelete: () => void;
}

export const ActionMenu: FC<ActionMenuProps> = ({
  evidence,
  onReupload,
  onDownload,
  onDelete,
}) => {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const isEmployer = user?.role === "Employer";

  const handleView = () => {
    router.push(`/evidence-library/${evidence.assignment_id}`);
  };

  const handleReuploadClick = () => {
    onReupload(evidence);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {!isEmployer && (
          <>
            <DropdownMenuItem onClick={handleReuploadClick} className="cursor-pointer">
              <CloudUpload className="mr-2 h-4 w-4" />
              Reupload
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleView} className="cursor-pointer">
              <Eye className="mr-2 h-4 w-4" />
              View/Edit
            </DropdownMenuItem>
          </>
        )}
        {isEmployer && (
          <DropdownMenuItem onClick={handleView} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
        )}
        {evidence.file && (
          <DropdownMenuItem onClick={onDownload} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
        )}
        {!isEmployer && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

