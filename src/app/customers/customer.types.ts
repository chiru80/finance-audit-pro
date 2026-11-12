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
  created_at: string | Date | null;
  updated_at: string | Date | null;
}

export interface CustomerFormValues {
  name: string;
  phone: string;
  email: string;
  weekly_due_amount: number; // in paise
}

export interface CustomerFilters {
  status?: 'active' | 'inactive' | 'suspended';
  searchTerm?: string;
}