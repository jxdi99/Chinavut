import { createClient } from '@supabase/supabase-js'

// Try to load credentials from VITE environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Initialize Supabase only if credentials exist
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null

/**
 * Common Logic: Prefer Remote DB, Fallback to local
 */

export const StaffAPI = {
  async getByEmpId(empId) {
    if (supabase) {
      const { data } = await supabase.from('staff').select('*').eq('emp_id', empId).single()
      return data
    }
    // Fallback: Check window.STAFF_DATA (from data.js)
    return window.STAFF_DATA?.[empId] 
      ? { emp_id: empId, ...window.STAFF_DATA[empId] } 
      : null
  }
}

export const MasterDataAPI = {
  async get() {
    if (supabase) {
      // In a real prod app, you'd fetch from multiple tables
      // For this migration, we assume MasterData is a single JSON or fetched per request
      const { data } = await supabase.from('app_config').select('state').eq('id', 'prod').single()
      return data?.state
    }
    return null // Caller should handle fallback to AppStorage.loadState()
  }
}
