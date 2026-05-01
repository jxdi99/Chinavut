import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = "https://lgzupozkfkllssgpnwnm.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnenVwb3prZmtsbHNzZ3Bud25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTc4MzEsImV4cCI6MjA5MTI5MzgzMX0.tITz0Zys9j5YixYqXLGz_ubHbj6sQ4HoZRw1NSkPkss";

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
        supabase.from("led_models").select("*").order("name"),
        supabase.from("controllers").select("*").order("name"),
        supabase.from("accessories").select("*").order("name"),
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
            maintenance: m.maintenance,
            ingress_protection: m.ingress_protection,
            led_type: m.led_type,
            beam_angle: m.beam_angle,
            color_temperature: m.color_temperature,
            processing_depth: m.processing_depth,
            life_hours: m.life_hours,
            video_support: m.video_support,
            display_type: m.display_type,
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
              name: String(item.name || ""),
              group_id: group,
              rw: toInt(item.rw),
              rh: toInt(item.rh),
              max_w: toInt(item.max),
              avg_w: toInt(item.avg),
              price: toFloat(item.price),
              brightness: toInt(item.brightness),
              refresh_rate: toInt(item.refresh_rate),
              material: String(item.material || ""),
              maintenance: String(item.maintenance || ""),
              ingress_protection: String(item.ingress_protection || ""),
              led_type: String(item.led_type || ""),
              beam_angle: String(item.beam_angle || ""),
              color_temperature: String(item.color_temperature || ""),
              processing_depth: String(item.processing_depth || ""),
              life_hours: toInt(item.life_hours),
              video_support: String(item.video_support || ""),
              display_type: String(item.display_type || ""),
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
