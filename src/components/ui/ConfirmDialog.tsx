import React from "react";
import { Modal, Button } from "@/components/ui";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "info" | "warning" | "error" | "success" | "confirm";
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  type = "info",
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "CANCEL",
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      title={title}
      onClose={onCancel || onConfirm || (() => {})}
      width={400}
      footer={
        <>
          {type === "confirm" && onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              {cancelText}
            </Button>
          )}
          <Button
            variant={type === "error" || type === "warning" ? "amber" : "primary"}
            onClick={onConfirm || onCancel}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div style={{ padding: "16px 0", fontSize: "14px", lineHeight: "1.5", color: "var(--text-primary)", textAlign: "center" }}>
        {message}
      </div>
    </Modal>
  );
};
