export type MonitorType = 'http' | 'https' | 'ping' | 'Website' | 'API' | 'TCP' | 'SSL' | 'Supabase';

export interface Monitor {
  id: string;
  user_id: string;
  name: string;
  url: string;
  type: MonitorType;
  interval_seconds: number; // in seconds
  interval?: number; // legacy compatibility
  method?: string;
  body?: string;
  headers?: string;
  expected_status?: number | number[];
  keep_alive?: boolean;
  last_is_up?: number;
  last_pinged_at?: string;
  last_error_message?: string;
  created_at: string;
  failure_count?: number; // Added for 3-strike rule
}

export interface PingResult {
  monitor_id: string;
  is_up: number;
  response_time: number;
  status_code: number | null;
  error_message: string | null;
  created_at: string;
  interval_seconds: number;
  interval?: number;
}

export interface Incident {
  id?: string;
  monitor_id: string;
  status: 'ongoing' | 'resolved';
  error_message: string | null;
  started_at: string;
  resolved_at?: string;
}

export interface MonitorStatus {
  id: string;
  last_is_up: number | boolean;
  last_response_time: number;
  last_status_code: number | null;
  last_error_message: string | null;
  last_pinged_at: string;
}
