# ADR-0028: Shared HTML signature for candidate emails

Accepted, 2026-11-01.

Recruitment stage messages and formal applicant offers use a shared Blade signature with inline styles and email-compatible presentation tables. The signatory defaults to the authenticated sending HR user's name and the title HR; a fixed signatory/title can be configured. The supplied office addresses, telephone, HR email, complaints email, website, social destinations and terms link are used centrally. General portal invitations do not receive the recruitment signature.

The existing logo and the user-supplied referral banner are embedded inline in received messages, as are small PNG social icons derived from the installed Tabler icon set. The browser preview uses data URIs, while sent messages use MIME content IDs. There is no requirement to host the supplied banner publicly. Configured replacement image and destination URLs must use HTTPS.

The editable message body excludes the signature. The backend renders it independently, escapes names and body text, and provides a sandboxed iframe preview in the email dialog. A plain-text alternative contains the contact information and destination links. Reply-To remains hr@aspomtravels.com in every environment. Following the user's development-email clarification, HR is CC'd only when the backend environment is production; local, development, testing and staging omit that CC. A shared recipient helper controls both stage messages and offer invitations, and the preview reflects the same rule. This does not change the primary candidate recipient or mail transport.

Each stage delivery snapshots the structured signature inside the existing sender JSON alongside the actor ID/name. A failed retry reuses that snapshot; configuration changes do not silently replace an already reviewed signature. Exact generated plain-text footers on old failed messages are removed to prevent duplicate sign-offs. Delivered historical rows are not rewritten. No database migration is required.

Tests cover HTML escaping, the configured links, multipart rendering, signature snapshots on retries, existing CC/Reply-To settings, and formal-offer versus generic-invitation scope. Synthetic HTML was rendered at desktop/mobile sizes with network requests blocked; all embedded images loaded and neither viewport overflowed horizontally.
