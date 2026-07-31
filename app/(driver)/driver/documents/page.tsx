import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getDocumentsOverview, getSignedDocumentUrl } from "@/lib/queries/documents";
import { DocumentsOverviewList } from "@/components/orders/documents-overview-list";

export const metadata: Metadata = { title: "Documents | Driver TMS" };

export default async function DriverDocumentsPage() {
  await requireRole("driver");
  // RLS already scopes this to the signed-in driver's own orders.
  const documents = await getDocumentsOverview();
  const documentsWithUrls = await Promise.all(
    documents.map(async (doc) => ({ ...doc, signedUrl: await getSignedDocumentUrl(doc.file_path) })),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display text-ink">Documents</h1>
        <p className="mt-1 text-sm text-slate">Every loading/delivery document and POD you&apos;ve submitted, grouped by order.</p>
      </div>
      <DocumentsOverviewList documents={documentsWithUrls} orderUrlPrefix="/driver/orders" canDelete={false} />
    </div>
  );
}
