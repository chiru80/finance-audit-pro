export interface Customer {
  id: string;
  profile_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  enrollment_date: string | Date | null;
  enrollment_week_start: string | Date | null;
  status: 'active' | 'inactive' | 'suspended';
  weekly_due_amount: number; // in paise
  outstanding_balance: number; // in paise
  total_paid: number; // in paise
  total_due: number; // in paise
  village_id: string | null;
  village_name?: string; // from join with villages table
  loan_amount: number; // in paise - total credit extended (before deduction)
  amount_given: number; // in paise - actual amount received after deduction (loan_amount - deduction)
  total_weeks: number;
  created_at: string | Date | null;
  updated_at: string | Date | null;
}

export interface CustomerFormValues {
  name: string;
  phone: string;
  email: string;
  enrollment_date: string; // ISO date string (YYYY-MM-DD)
  village_id: string;
  loan_amount: number; // in rupees (form), converted to paise on submit
  amount_given: number; // in rupees, auto-computed, for display/audit
  total_weeks: number;
  weekly_due_amount: number; // in rupees (form), converted to paise on submit
}

export interface CustomerFilters {
  status?: 'active' | 'inactive' | 'suspended';
  searchTerm?: string;
}

export interface Village {
  id: string;
  profile_id: string;
  name: string;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}
