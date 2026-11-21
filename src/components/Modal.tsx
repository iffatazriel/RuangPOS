import type React from "react";
import { useRef } from "react";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { X } from "lucide-react";

export function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useDialogFocus(ref, true, close);
  return (
    <div className="modal-backdrop">
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
      >
        <div className="section-heading">
          <h2>{title}</h2>
          <button aria-label="Tutup" onClick={close}>
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
