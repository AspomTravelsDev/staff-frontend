export interface ManagementDashboardSummary {
  generated_at: string;
  date: string;
  timezone: string;
  period: { from: string; to: string };
  attendance: {
    early: number;
    late: number;
    late_permitted: number;
    present: number;
    on_leave: number;
    work_from_home: number;
    half_day: number;
    not_yet_clocked_in: number;
    unrecorded: number;
    flagged: number;
    expected: number;
    working_day: boolean;
  };
  employees: {
    active: number;
    full_time: number;
    intern_nysc: number;
    other: number;
  };
  leave: { today: number; next_seven_days: number };
  decisions: {
    total: number;
    recruitment: number;
    leave: number;
    loans: number;
    salary_advances: number;
    loan_hr: number;
    loan_accounts: number;
    advance_hr: number;
    advance_accounts: number;
  };
  trend: {
    date: string;
    early: number;
    late: number;
    late_permitted: number;
    present: number;
    on_leave: number;
    work_from_home: number;
    half_day: number;
  }[];
  departments: {
    name: string;
    employees: number;
    present: number;
    on_leave: number;
    unrecorded: number;
  }[];
}
