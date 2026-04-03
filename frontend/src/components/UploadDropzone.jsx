import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function UploadDropzone({ onFilesAdded }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (onFilesAdded) {
        onFilesAdded(acceptedFiles);
      }
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx"
      ],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
        ".pptx"
      ]
    }
  });

  return (
    <div
      {...getRootProps()}
      className={`rounded-2xl border border-dashed px-6 py-10 text-center transition ${
        isDragActive
          ? "border-emerald-400 bg-emerald-400/10"
          : "border-slate-700 bg-slate-900/40"
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-sm text-slate-300">
        Drag and drop PDFs, DOCX, or PPTX files, or click to select.
      </p>
    </div>
  );
}
