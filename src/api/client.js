import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://lgzupozkfkllssgpnwnm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenVwb3prZmtsbHNzZ3Bud25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTc4MzEsImV4cCI6MjA5MTI5MzgzMX0.tITz0Zys9j5YixYqXLGz_ubHbj6sQ4HoZRw1NSkPkss'

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null

export const StaffAPI = {
  async getAll() {
    if (!supabase) return []
    const { data, error } = await supabase.from('staff').select('*')
    if (error) console.error('StaffAPI.getAll error:', error)
    return data || []
  },
  async getByEmpId(empId) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('staff').select('*').eq('emp_id', empId).single()
        if (error) {
          console.error('StaffAPI.getByEmpId error:', error)
          return null
        }
        return data
      } catch (err) {
        console.error('StaffAPI connection failed:', err)
        return null
      }
    }
    return window.STAFF_DATA?.[empId] ? { emp_id: empId, ...window.STAFF_DATA[empId] } : null
  }
}

export const MasterDataAPI = {
  async fetchFull() {
    if (!supabase) {
      console.error('Supabase client not initialized. Check .env credentials.');
      return null;
    }
    try {
      const [models, controllers, accessories] = await Promise.all([
        supabase.from('led_models').select('*').order('name'),
        supabase.from('controllers').select('*').order('name'),
        supabase.from('accessories').select('*').order('name')
      ]);

      if (models.error) console.error('Supabase Error (led_models):', models.error);
      if (controllers.error) console.error('Supabase Error (controllers):', controllers.error);
      if (accessories.error) console.error('Supabase Error (accessories):', accessories.error);

      if (models.error || controllers.error || accessories.error) {
        return null;
      }

      // Reconstruct the grouped object format expected by the app
      const groupedModels = {
        UIR: { w: 640, h: 480, weight: 7.8, type: 'indoor', items: [] },
        UOS: { w: 960, h: 960, weight: 26.5, type: 'outdoor', items: [] },
        CIH: { w: 600, h: 337.5, weight: 4.0, type: 'indoor', items: [] }
      };

      (models.data || []).forEach(m => {
        if (groupedModels[m.group_id]) {
          groupedModels[m.group_id].items.push({
            id: m.id,
            name: m.name,
            rw: m.rw,
            rh: m.rh,
            max: m.max_w,
            avg: m.avg_w,
            price: m.price,
            brightness: m.brightness,
            refresh_rate: m.refresh_rate,
            material: m.material,
            maintenance: m.maintenance
          });
        }
      });

      return {
        ...groupedModels,
        controllers: (controllers.data || []).map(c => ({
          id: c.id,
          name: c.name,
          load: c.load_pixels,
          price: c.price
        })),
        accessories: (accessories.data || []).map(a => ({
          id: a.id,
          name: a.name,
          price: a.price
        }))
      };
    } catch (err) {
      console.error('DB Fetch Error:', err);
      return null;
    }
  },

  async updateItem(table, id, data) {
    if (!supabase) return false;
    const { error } = await supabase.from(table).update(data).eq('id', id);
    return !error;
  }
}
