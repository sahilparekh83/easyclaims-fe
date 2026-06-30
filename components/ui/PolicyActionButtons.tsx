"use client";

import styled from "styled-components";
import { Download, FileSearch, Eye, Trash2 } from "lucide-react";

const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Btn = styled.button<{ $danger?: boolean }>`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${p => p.$danger ? "#dc2626" : "#64748b"};
  transition: background 0.12s, color 0.12s;
  &:hover {
    background: ${p => p.$danger ? "#fef2f2" : "#f1f5f9"};
    color: ${p => p.$danger ? "#b91c1c" : "#0050b0"};
  }
`;

interface Props {
  onView?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  viewTitle?: string;
  downloadTitle?: string;
  deleteTitle?: string;
  useEyeIcon?: boolean;
}

export default function PolicyActionButtons({
  onView,
  onDownload,
  onDelete,
  viewTitle = "View Policy",
  downloadTitle = "Download PDF",
  deleteTitle = "Delete",
  useEyeIcon = false,
}: Props) {
  return (
    <Wrap>
      {onDownload && (
        <Btn title={downloadTitle} onClick={onDownload}>
          <Download size={14} />
        </Btn>
      )}
      {onView && (
        <Btn title={viewTitle} onClick={onView}>
          {useEyeIcon ? <Eye size={14} /> : <FileSearch size={14} />}
        </Btn>
      )}
      {onDelete && (
        <Btn $danger title={deleteTitle} onClick={onDelete}>
          <Trash2 size={14} />
        </Btn>
      )}
    </Wrap>
  );
}
