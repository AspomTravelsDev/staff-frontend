# Assigned deal notifications

New assignments and reassignments create an unread alert for the recipient, regardless of the payment confirmation's age or pending, approved, or rejected status. The bell and Assigned Deals sidebar badge use these assignment records. Email and push delivery are attempted after the assignment and alert are committed; a delivery failure leaves the portal alert intact. Selecting the same assignee again does not send another alert.

Reassignment marks the previous recipient's unread alerts for that deal as read and records a new alert for the new assignee. Notification links open the assigned deal directly. Opening the assigned list clears alerts only for the loaded rows, up to the notification snapshot returned with those rows. Filtered or paginated rows and newer assignments stay unread. Prefetching a page does not mark alerts as read. Clear all affects only the signed-in user's alerts. Deleted deals do not contribute to unread counts.

The migration `2026_10_07_160000_create_assigned_deal_notifications.php` adds the notification table and is applied locally. It does not invent assignment dates for existing deals or send retrospective messages. Future changes of assignee generate the new alerts. Push requires an enabled browser/device subscription; email requires the existing mail queue worker.

Backend tests cover older deals of every status, recipients, repeat assignments, reassignment back to a previous recipient, scoped read receipts, newer arrivals, filtered rows, permissions, inactive staff, delivery failure, transaction rollback, deletion, and Clear all isolation.
