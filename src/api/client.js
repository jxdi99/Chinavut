import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://lgzupozkfkllssgpnwnm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenVwb3prZmtsbHNzZ3Bud25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTc4MzEsImV4cCI6MjA5MTI5MzgzMX0.tITz0Zys9j5YixYqXLGz_ubHbj6sQ4HoZRw1NSkPkss";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const StaffAPI = {
  async getAll() {
    if (!supabase) return [];
    const { data, error } = await supabase.from("staff").select("*");
    if (error) console.error("StaffAPI.getAll error:", error);
    return data || [];
  },
  async getByUsername(username) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("staff")
          .select("*")
          .ilike("username", username)
          .single();
        if (error) {
          console.error("StaffAPI.getByUsername error:", error);
          return null;
        }
        return data;
      } catch (err) {
        console.error("StaffAPI connection failed:", err);
        return null;
      }
    }
    return null;
  },
  async getByNameAndNick(name, nick) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("staff")
          .select("*")
          .ilike("name", `%${name}%`)
          .ilike("nick", nick);
        if (error) {
          console.error("StaffAPI.getByNameAndNick error:", error);
          return null;
        }
        // Return first match if found
        return data && data.length > 0 ? data[0] : null;
      } catch (err) {
        console.error("StaffAPI connection failed:", err);
        return null;
      }
    }
    return null;
  },
  async getByEmail(email) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("staff")
          .select("*")
          .eq("email", email)
          .single();
        if (error) {
          console.error("StaffAPI.getByEmail error:", error);
          return null;
        }
        return data;
      } catch (err) {
        console.error("StaffAPI connection failed:", err);
        return null;
      }
    }
    return null;
  },
};

export const MasterDataAPI = {
  async fetchFull() {
    if (!supabase) {
      console.error("Supabase client not initialized. Check .env credentials.");
      return null;
    }
    try {
      const [models, controllers, accessories] = await Promise.all([
        supabase.from("led_models").select("*").order("id", { ascending: true }),
        supabase.from("controllers").select("*").order("id", { ascending: true }),
        supabase.from("accessories").select("*").order("id", { ascending: true }),
      ]);

      // Log errors but don't fail entirely - load whatever we can
      if (models.error)
        console.warn("Supabase Warning (led_models):", models.error);
      if (controllers.error)
        console.warn("Supabase Warning (controllers):", controllers.error);
      if (accessories.error)
        console.warn("Supabase Warning (accessories):", accessories.error);

      // Reconstruct the grouped object format expected by the app
      const groupedModels = {
        UIR: { w: 640, h: 480, weight: 7.8, type: "indoor", items: [] },
        UOS: { w: 960, h: 960, weight: 26.5, type: "outdoor", items: [] },
        CIH: { w: 600, h: 337.5, weight: 4.0, type: "indoor", items: [] },
      };

      (models.data || []).forEach((m) => {
        // Infer group from model_name (UIR, UOS, CIH)
        let groupId = "UIR"; 
        const nameUpper = String(m.model_name || "").toUpperCase();
        if (nameUpper.startsWith("UOS")) groupId = "UOS";
        else if (nameUpper.startsWith("CIH")) groupId = "CIH";
        else if (nameUpper.startsWith("UIR")) groupId = "UIR";

        if (groupedModels[groupId]) {
          // Mapping based on the actual misaligned structure provided by the user:
          // price_per_sqm -> modules_per_cabinet (6)
          // module_size -> beam_angle (160/140)
          // cabinet_resolution -> color_temp (6500K)
          // display_type -> led_type (SMD1010)
          // modules_per_cabinet -> grayscale (14)
          // resolution_width -> PRICE (69000)
          // resolution_height -> ? (320)
          // max_power_w -> RW (416)
          // avg_power_w -> ? (0)
          // brightness_nits -> MAX_POWER (416)
          // refresh_rate_hz -> RH (312)
          // frame_rate -> IP_RATING (IP30)
          // material -> ? (386)
          // weight_kg -> LIFE_HOURS (100000)
          // maintenance -> AVG_POWER (116)
          // ip_rating -> BRIGHTNESS (600)
          // led_type -> REFRESH_RATE (3840)
          // beam_angle -> FRAME_RATE (60 Hz)
          // color_temp -> MATERIAL (Die-casting Aluminum)
          // grayscale -> WEIGHT (7.8)

          groupedModels[groupId].items.push({
            id: m.id,
            name: m.model_name,
            // Calculation fields (mapped from misaligned columns)
            rw: parseInt(m.max_power_w, 10) || 0,
            rh: parseInt(m.refresh_rate_hz, 10) || 0,
            w: m.cabinet_w_width || groupedModels[groupId].w,
            h: m.cabinet_h_height || groupedModels[groupId].h,
            weight: parseFloat(m.grayscale) || groupedModels[groupId].weight,
            max: parseInt(m.brightness_nits, 10) || 0,
            avg: parseInt(m.maintenance, 10) || 0,
            price: parseFloat(m.resolution_width) || 0,
            
            // Info fields
            brightness: parseInt(m.ip_rating, 10) || 0,
            refresh_rate: parseInt(m.led_type, 10) || 0,
            material: m.color_temp, // "Die-casting Aluminum"
            maintenance: m.status_checking, 
            ingress_protection: m.frame_rate, // "IP30"
            led_type: m.display_type, // "SMD1010"
            beam_angle: m.module_size, // "160/140"
            color_temperature: m.cabinet_resolution, // "6500K"
            processing_depth: m.modules_per_cabinet, // 14
            life_hours: m.weight_kg, // 100000
            video_support: m.beam_angle, // "60 Hz"
            
            // Raw fields for safety
            module_size: m.module_size,
            cabinet_resolution: m.cabinet_resolution,
            modules_per_cabinet: m.modules_per_cabinet,
            contrast_ratio: m.contrast_ratio,
            working_temp: m.working_temp,
            humidity: m.humidity,
            status_checking: m.status_checking
          });
        }
      });

      return {
        ...groupedModels,
        controllers: (controllers.data || []).map((c) => ({
          id: c.id,
          name: c.name,
          load: c.load_pixels,
          price: c.price,
        })),
        accessories: (accessories.data || []).map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
        })),
      };
    } catch (err) {
      console.error("DB Fetch Error:", err);
      return null;
    }
  },

  async updateItem(table, id, data) {
    if (!supabase) return false;
    const { error } = await supabase.from(table).update(data).eq("id", id);
    return !error;
  },

  async syncToDb(masterData) {
    if (!supabase) {
      console.error("Supabase not initialized");
      return { success: false, error: "Supabase not initialized" };
    }
    try {
      const toInt = (v) => { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; };
      const toFloat = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

      // ---- SAFE SYNC: Insert new data FIRST, delete old AFTER ----

      // === 1. LED Models ===
      const modelsToSync = [];
      ["UIR", "UOS", "CIH"].forEach((group) => {
        if (masterData[group] && masterData[group].items) {
          masterData[group].items.forEach((item) => {
            modelsToSync.push({
              model_name: String(item.name || ""),
              group_id: group,
              // Mapping back to misaligned columns based on Turn 12 discovery:
              resolution_width: toFloat(item.price),      // Logical Price -> DB resolution_width
              max_power_w: toInt(item.rw),               // Logical RW -> DB max_power_w
              refresh_rate_hz: toInt(item.rh),            // Logical RH -> DB refresh_rate_hz
              brightness_nits: toInt(item.max),           // Logical MAX -> DB brightness_nits
              maintenance: toInt(item.avg),               // Logical AVG -> DB maintenance
              grayscale: toFloat(item.weight),            // Logical WEIGHT -> DB grayscale
              
              // Map remaining fields to misaligned columns
              modules_per_cabinet: toInt(item.processing_depth), 
              price_per_sqm: toInt(item.modules_per_cabinet),    
              module_size: String(item.beam_angle || ""),       
              cabinet_resolution: String(item.color_temperature || ""), 
              display_type: String(item.led_type || ""),        
              frame_rate: String(item.ingress_protection || ""),
              weight_kg: toInt(item.life_hours),                
              ip_rating: toInt(item.brightness),                
              led_type: toInt(item.refresh_rate),               
              beam_angle: String(item.video_support || ""),     
              color_temp: String(item.material || ""),          
              status_checking: String(item.maintenance || ""),  
              
              // Stable fields
              contrast_ratio: String(item.contrast_ratio || ""),
              working_temp: String(item.working_temp || ""),
              humidity: String(item.humidity || ""),
              life_hours: toInt(item.life_hours || 0)
            });
          });
        }
      });

      // Get old IDs before inserting
      const { data: oldModels } = await supabase.from("led_models").select("id");
      const oldModelIds = (oldModels || []).map(r => r.id);

      // Insert new first
      if (modelsToSync.length > 0) {
        const { data: inserted, error: err } = await supabase.from("led_models").insert(modelsToSync).select();
        if (err) return { success: false, error: "led_models Insert: " + err.message };
        if (!inserted || inserted.length === 0) return { success: false, error: "led_models: DB rejected data (check RLS)" };
      }
      // Delete old only after insert succeeded
      if (oldModelIds.length > 0) {
        await supabase.from("led_models").delete().in("id", oldModelIds);
      }

      // === 2. Controllers ===
      const cData = (masterData.controllers || []).map(c => ({
        name: String(c.name || ""), load_pixels: toInt(c.load), price: toFloat(c.price),
      }));
      const { data: oldC } = await supabase.from("controllers").select("id");
      const oldCIds = (oldC || []).map(r => r.id);

      if (cData.length > 0) {
        const { data: inserted, error: err } = await supabase.from("controllers").insert(cData).select();
        if (err) return { success: false, error: "controllers Insert: " + err.message };
        if (!inserted || inserted.length === 0) return { success: false, error: "controllers: DB rejected data (check RLS)" };
      }
      if (oldCIds.length > 0) {
        await supabase.from("controllers").delete().in("id", oldCIds);
      }

      // === 3. Accessories ===
      const aData = (masterData.accessories || []).map(a => ({
        name: String(a.name || ""), price: toFloat(a.price),
      }));
      const { data: oldA } = await supabase.from("accessories").select("id");
      const oldAIds = (oldA || []).map(r => r.id);

      if (aData.length > 0) {
        const { data: inserted, error: err } = await supabase.from("accessories").insert(aData).select();
        if (err) return { success: false, error: "accessories Insert: " + err.message };
        if (!inserted || inserted.length === 0) return { success: false, error: "accessories: DB rejected data (check RLS)" };
      }
      if (oldAIds.length > 0) {
        await supabase.from("accessories").delete().in("id", oldAIds);
      }

      return { success: true };
    } catch (err) {
      console.error("Sync Error:", err);
      return { success: false, error: "Exception: " + err.message };
    }
  },
};
