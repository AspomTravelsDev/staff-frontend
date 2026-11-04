# ADR-0034: Birth Services information desk

Accepted, 2026-11-01.

## Decision

Provide a focused Birth Services information desk with FAQs first and Files second. FAQs support rich text; files are private uploads with a title, optional country label, download endpoint, safe replacement, and deletion with their parent entry. Keep content in a separate birth_services_information table and expose authenticated REST endpoints with the same response shape as Visa where applicable. Birth Services and Super roles (including secondary roles) can manage; all authenticated staff can read. Do not copy Visa records or invent Birth Services guidance.

Extract the existing Visa view, accordion and editor into shared information-desk components with an explicit visa/birth-services configuration. Keep the existing Visa component exports and routes as compatibility wrappers. Shared server actions select a fixed, known resource and revalidate both department and staff pages. Initial content and edit records load on the server. Keep existing Visa API/storage behavior intact.

Birth Services structured content accepts only FAQ and Files categories. FAQ HTML is sanitized to supported formatting/link tags before storage. Files are stored on the private disk, linked to their owning Birth Services entry, and served through an authenticated application route. Preserve rich-text formatting while dropping active elements and unsafe link schemes. Keep author identity server-assigned. This does not add AI, external data ingestion or outbound messaging.

Add /birth-services/information-desk and its manage page, replace /my/birth-services placeholder, enable the staff menu entry and add the department management link. Apply the same management navigation exclusions as Visa and protect the new route prefix in the existing proxy.

## Validation and deployment

Apply migration 2026_11_01_000006_create_birth_services_information_table.php. Verify primary/secondary-role write permissions, staff reads, department isolation, FAQ validation and rich-text sanitization, and file upload/download/replacement/deletion. Test shared Visa/Birth view/editor routing and mutation endpoints, read-only staff pages, edit hydration and responsive layout.
