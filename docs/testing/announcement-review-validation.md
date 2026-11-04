# Announcement review access

Fixed on 2026-10-28. **Announcement Reviews** links to `/admin/announcements`; **All Announcements** remains the published feed at `/announcements`.

## Access and pending counts

Active individual staff with any primary or secondary role of IT, Super Admin, MP, MD, Compliance or Office Operations can open the review page and approve/reject submissions. Admin alone has no review permission. No backend role permission was expanded: page access and navigation now match the existing `view-announcements-admin` permission. The controller and pending notification provider share the same backend access helper; navigation/page access share the same frontend policy.

The new review link uses the `announcements` pending counter and the published feed keeps `unreadAnnouncements`. The notification menu derives its review destination from the new navigation item. Decisions invalidate notification counts so the badge refreshes immediately. The page defaults to Pending; reviewers can still select other statuses and preview content. Loading follows API pagination instead of silently stopping after 100 submissions. A failed load shows a retry state rather than an empty queue.

## Checks

```powershell
# Backend repository
php vendor/phpunit/phpunit/phpunit --filter AnnouncementReviewTest --no-progress

# Frontend repository
node --test tests/announcement-review-access.test.mjs tests/announcement-preview.test.mjs lib/navigation-badges.test.mjs
npx tsc --noEmit
npx eslint lib/announcement-review-access.ts lib/navigation.ts 'app/(admin)/admin/announcements/page.tsx' 'app/(admin)/admin/announcements/queries.ts' 'app/(admin)/admin/announcements/components/admin-announcements-content.tsx' tests/announcement-review-access.test.mjs
```

The focused backend tests use an isolated SQLite database and synthetic users, exercising all six reviewer roles, pending counts through the registered provider, preview/detail access, rejection reasons, author correction/resubmission, approval, secondary roles, and denied decisions. No real announcements were published or rejected. The frontend checks exercise actual navigation/page guards, approval/rejection payloads, multi-page loading, failure states and the existing isolated announcement preview renderer.

Visual scope is limited to the restored sidebar link, consistent page title and initial Pending filter. The existing review table, preview sheet, decision controls, published feed and global design styling are preserved. A live authenticated browser walkthrough was not performed for this fix.
