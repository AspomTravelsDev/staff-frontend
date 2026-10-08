# Attendance: departures after 8 PM

Implemented locally on 7 October 2026.

Attendance keeps the actual clock-out time and marks departures strictly later than 8:00:00 PM Africa/Lagos on the clock-in day. Exactly 8 PM is unflagged. An open record has no departure flag. Recorded overnight departures use the original attendance day's cutoff and show the departure date beside the time.

General Attendance and My Attendance show an **After 8 PM** badge beside the clock-out time. The general page includes a visible **Clock-outs → Late clock-outs** filter and a matching summary card showing the number of departures and distinct staff for the active date/staff filters. Filtering occurs on the backend before pagination, and browser navigation restores the selected filters. Date filters use the attendance/clock-in date, including for overnight records.

Filtered exports list the matching staff and actual departure dates/times. The full attendance matrix adds late-departure information while retaining arrival status. The personal attendance tour explains the badge.

The flag is derived from existing timestamps, so historical records are covered immediately with no new database column or backfill. Existing location validation, role visibility, and the earliest clock-out rule still apply. The badge identifies timing and does not grant overtime approval.

Validation: `LateClockOutAttendanceTest` covers the strict cutoff, historical and overnight records, successful late clock-outs with their exact timestamp, filters across pages, staff/date counts, personal history, permissions, and existing clock-out restrictions.
