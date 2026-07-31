"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteDocument } from "@/lib/actions/document-delete";
import type { DocumentOverviewRow } from "@/lib/queries/documents";

const TYPE_LABELS: Record<string, string> = {
  loading_document: "Loading document",
  delivery_document: "Delivery document",
  pod: "Proof of delivery",
};

interface DocumentWithUrl extends DocumentOverviewRow {
  signedUrl: string | null;
}

// Grouped by order number -- the whole point of this page (per the
// client's request) is documents linked by order number, in one place,
// rather than only reachable by opening each order individually.
export function DocumentsOverviewList({
  documents,
  orderUrlPrefix,
  canDelete,
}: {
  documents: DocumentWithUrl[];
  orderUrlPrefix: string;
  canDelete: boolean;
}) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-slate">
        No documents yet.
      </div>
    );
  }

  const byOrder = new Map<string, { order_number: string; docs: DocumentWithUrl[] }>();
  for (const doc of documents) {
    const existing = byOrder.get(doc.order_id) ?? { order_number: doc.order_number, docs: [] };
    existing.docs.push(doc);
    byOrder.set(doc.order_id, existing);
  }

  async function handleDelete() {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    const result = await deleteDocument(pendingDeleteId);
    setIsDeleting(false);
    setPendingDeleteId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Document deleted");
  }

  return (
    <div className="space-y-4">
      {[...byOrder.entries()].map(([orderId, group]) => (
        <div key={orderId} className="space-y-3 rounded-xl bg-card p-5 ring-1 ring-ink/8 shadow-sm shadow-ink/[0.03]">
          <Link
            href={`${orderUrlPrefix}/${orderId}`}
            className="font-mono text-sm text-slate hover:text-brand hover:underline"
          >
            {group.order_number}
          </Link>
          <ul className="space-y-2">
            {group.docs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-2.5 rounded-lg bg-canvas/40 px-3.5 py-2.5 text-sm ring-1 ring-ink/8"
              >
                <FileText className="size-4 shrink-0 text-mist" aria-hidden="true" />
                <span className="text-label shrink-0 text-mist">{TYPE_LABELS[doc.type] ?? doc.type}</span>
                {doc.signedUrl ? (
                  <a
                    href={doc.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-brand hover:underline"
                  >
                    {doc.file_name}
                  </a>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-slate">{doc.file_name}</span>
                )}
                {canDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${doc.file_name}`}
                    onClick={() => setPendingDeleteId(doc.id)}
                  >
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <AlertDialog open={pendingDeleteId != null} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the file and its record. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
