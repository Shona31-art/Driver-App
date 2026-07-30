import { FileText } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  loading_document: "Loading document",
  delivery_document: "Delivery document",
  pod: "Proof of delivery",
  receipt: "Receipt",
};

interface DocumentRow {
  id: string;
  type: string;
  file_name: string;
  signedUrl: string | null;
}

export function OrderDocumentsList({ documents }: { documents: DocumentRow[] }) {
  if (documents.length === 0) {
    return <p className="text-sm text-slate">No documents uploaded yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center gap-2.5 rounded-lg bg-card px-3.5 py-2.5 text-sm ring-1 ring-ink/8 transition-colors hover:bg-canvas/40"
        >
          <FileText className="size-4 shrink-0 text-mist" aria-hidden="true" />
          <span className="text-label text-mist">{TYPE_LABELS[doc.type] ?? doc.type}</span>
          {doc.signedUrl ? (
            <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
              {doc.file_name}
            </a>
          ) : (
            <span className="text-slate">{doc.file_name}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
