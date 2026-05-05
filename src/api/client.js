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
            updated_at: m.updated_at,
            // Calculation fields (Direct Mapping)
            rw: parseInt(m.resolution_width, 10) || 0,
            rh: parseInt(m.resolution_height, 10) || 0,
            w: m.cabinet_w_width || groupedModels[groupId].w,
            h: m.cabinet_h_height || groupedModels[groupId].h,
            weight: parseFloat(m.weight_kg) || groupedModels[groupId].weight,
            max: parseInt(m.max_power_w, 10) || 0,
            avg: parseInt(m.avg_power_w, 10) || 0,
            price: parseFloat(m.price_per_sqm) || 0,
            
            // Info fields
            brightness: parseInt(m.brightness_nits, 10) || 0,
            refresh_rate: parseInt(m.refresh_rate_hz, 10) || 0,
            material: m.material, 
            maintenance: m.maintenance, 
            ingress_protection: m.ip_rating, 
            led_type: m.led_type, 
            beam_angle: m.beam_angle, 
            color_temperature: m.color_temp, 
            processing_depth: m.grayscale, 
            life_hours: m.life_hours, 
            video_support: m.frame_rate,
            
            // Raw fields for safety
            module_size: m.module_size,
            cabinet_resolution: m.cabinet_resolution,
            modules_per_cabinet: m.modules_per_cabinet,
            weight_kg: m.weight_kg,
            contrast_ratio: m.contrast_ratio,
            working_temp: m.working_temp,
            humidity: m.humidity,
            status_checking: m.status_checking,
            display_type: m.display_type,
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
          updated_at: c.updated_at
        })),
        accessories: (accessories.data || []).map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
          updated_at: a.updated_at
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

  async syncToDb(subsetData, deletions = {}) {
    if (!supabase) {
      console.error("Supabase not initialized");
      return { success: false, error: "Supabase not initialized" };
    }
    try {
      const toInt = (v) => { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; };
      const toFloat = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

      const modelFieldMap = {
        name: "model_name", price: "price_per_sqm", rw: "resolution_width", rh: "resolution_height",
        max: "max_power_w", avg: "avg_power_w", weight_kg: "weight_kg", brightness: "brightness_nits",
        refresh_rate: "refresh_rate_hz", material: "material", maintenance: "maintenance",
        ingress_protection: "ip_rating", led_type: "led_type", beam_angle: "beam_angle",
        color_temperature: "color_temp", processing_depth: "grayscale", life_hours: "life_hours",
        video_support: "frame_rate", display_type: "display_type", module_size: "module_size",
        cabinet_resolution: "cabinet_resolution", modules_per_cabinet: "modules_per_cabinet",
        status_checking: "status_checking", contrast_ratio: "contrast_ratio",
        working_temp: "working_temp", humidity: "humidity"
      };

      if (subsetData.UIR || subsetData.UOS || subsetData.CIH) {
        for (const g of ["UIR", "UOS", "CIH"]) {
          if (!subsetData[g] || !subsetData[g].items) continue;
          for (const item of subsetData[g].items) {
            let row = {};
            if (!item.id) {
              // Full row for new items
              row = {
                model_name: String(item.name || ""), price_per_sqm: toFloat(item.price),
                resolution_width: toInt(item.rw), resolution_height: toInt(item.rh),
                max_power_w: toInt(item.max), avg_power_w: toInt(item.avg),
                weight_kg: toFloat(item.weight_kg), brightness_nits: toInt(item.brightness),
                refresh_rate_hz: toInt(item.refresh_rate), material: String(item.material || ""),
                maintenance: String(item.maintenance || ""), ip_rating: String(item.ingress_protection || ""),
                led_type: String(item.led_type || ""), beam_angle: String(item.beam_angle || ""),
                color_temp: String(item.color_temperature || ""), grayscale: String(item.processing_depth || ""),
                life_hours: toInt(item.life_hours), frame_rate: String(item.video_support || ""),
                display_type: String(item.display_type || ""), module_size: String(item.module_size || ""),
                cabinet_resolution: String(item.cabinet_resolution || ""), modules_per_cabinet: toInt(item.modules_per_cabinet),
                status_checking: String(item.status_checking || ""), contrast_ratio: String(item.contrast_ratio || ""),
                working_temp: String(item.working_temp || ""), humidity: String(item.humidity || "")
              };
              const { error } = await supabase.from("led_models").insert(row);
              if (error) return { success: false, error: "led_models Insert Error: " + error.message };
            } else {
              // Partial row for updates (Merge support)
              if (item._dirtyFields) {
                Object.keys(item._dirtyFields).forEach(f => {
                  const dbCol = modelFieldMap[f];
                  if (dbCol) {
                    const val = item[f];
                    row[dbCol] = (typeof val === 'number') ? val : String(val || "");
                  }
                });
              } else {
                // Fallback: entire row if no dirty tracking
                row = { model_name: item.name, price_per_sqm: item.price }; 
              }
              const { error } = await supabase.from("led_models").update(row).eq("id", item.id);
              if (error) return { success: false, error: "led_models Update Error: " + error.message };
            }
          }
        }
      }
      
      if (deletions.led_models && deletions.led_models.length > 0) {
        await supabase.from("led_models").delete().in("id", deletions.led_models);
      }

      // === 2. Controllers ===
      if (subsetData.controllers && subsetData.controllers.length > 0) {
        for (const c of subsetData.controllers) {
          if (!c.id) {
            await supabase.from("controllers").insert({ name: String(c.name || ""), load_pixels: toInt(c.load), price: toFloat(c.price) });
          } else {
            const row = {};
            if (c._dirtyFields) {
               if (c._dirtyFields.name) row.name = c.name;
               if (c._dirtyFields.load) row.load_pixels = toInt(c.load);
               if (c._dirtyFields.price) row.price = toFloat(c.price);
            }
            await supabase.from("controllers").update(row).eq("id", c.id);
          }
        }
      }
      if (deletions.controllers && deletions.controllers.length > 0) {
        await supabase.from("controllers").delete().in("id", deletions.controllers);
      }

      // === 3. Accessories ===
      if (subsetData.accessories && subsetData.accessories.length > 0) {
        for (const a of subsetData.accessories) {
          if (!a.id) {
            await supabase.from("accessories").insert({ name: String(a.name || ""), price: toFloat(a.price) });
          } else {
            const row = {};
            if (a._dirtyFields) {
               if (a._dirtyFields.name) row.name = a.name;
               if (a._dirtyFields.price) row.price = toFloat(a.price);
            }
            await supabase.from("accessories").update(row).eq("id", a.id);
          }
        }
      }
      if (deletions.accessories && deletions.accessories.length > 0) {
        await supabase.from("accessories").delete().in("id", deletions.accessories);
      }
      if (deletions.accessories && deletions.accessories.length > 0) {
        await supabase.from("accessories").delete().in("id", deletions.accessories);
      }

      return { success: true };
    } catch (err) {
      console.error("Sync Error:", err);
      return { success: false, error: "Exception: " + err.message };
    }
  },
};
