import { useCallback, useRef, useState } from "react";

const MAX_FILES = 5;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function Dropzone({ files, onChange, error }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const addFiles = useCallback(
    (incoming) => {
      const valid = Array.from(incoming).filter((f) =>
        ACCEPTED.includes(f.type)
      );
      const combined = [...files, ...valid].slice(0, MAX_FILES);
      onChange(combined);
    },
    [files, onChange]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div
        className={`dropzone ${dragActive ? "dropzone--active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload product images"
      >
        <p className="dropzone__icon" aria-hidden="true">
          ↑
        </p>
        <p className="dropzone__title">Drop images here</p>
        <p className="dropzone__hint">
          Up to {MAX_FILES} images · JPG, PNG, WebP
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="form__error">{error}</p>}

      {files.length > 0 && (
        <div className="dropzone__previews">
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="dropzone__preview">
              <img src={URL.createObjectURL(file)} alt={file.name} />
              <button
                type="button"
                className="dropzone__remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
