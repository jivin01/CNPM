import React from "react";

interface ImageViewerProps {
  src?: string | null;
  onClose?: () => void;
}

export default function ImageViewer({ src, onClose }: ImageViewerProps) {
  if (!src) return null;

  return (
    <div className="viewer-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="viewer-card" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Retinal image with annotations" className="viewer-img" />
        <div className="viewer-controls">
          <a className="btn btn-secondary" href={src} download>
            📥 Download Image
          </a>
          <button className="btn btn-primary" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
}
