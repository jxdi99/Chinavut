import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

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
          .eq("username", username)
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

      if (models.error)
        console.error("Supabase Error (led_models):", models.error);
      if (controllers.error)
        console.error("Supabase Error (controllers):", controllers.error);
      if (accessories.error)
        console.error("Supabase Error (accessories):", accessories.error);

      if (models.error || controllers.error || accessories.error) {
        return null;
      }

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
      return false;
    }
    try {
      // Sync LED Models
      const modelsToSync = [];
      ["UIR", "UOS", "CIH"].forEach((group) => {
        if (masterData[group] && masterData[group].items) {
          masterData[group].items.forEach((item) => {
            modelsToSync.push({
              name: item.name,
              group_id: group,
              rw: item.rw || 0,
              rh: item.rh || 0,
              max_w: item.max || 0,
              avg_w: item.avg || 0,
              price: item.price || 0,
              brightness: item.brightness || 0,
              refresh_rate: item.refresh_rate || 0,
              material: item.material || "",
              maintenance: item.maintenance || "",
              ingress_protection: item.ingress_protection || "",
              led_type: item.led_type || "",
              beam_angle: item.beam_angle || "",
              color_temperature: item.color_temperature || "",
              processing_depth: item.processing_depth || "",
              life_hours: item.life_hours || 0,
              video_support: item.video_support || "",
              display_type: item.display_type || "",
            });
          });
        }
      });

      // Delete and re-insert models
      await supabase
        .from("led_models")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (modelsToSync.length > 0) {
        const { error: modelsError } = await supabase
          .from("led_models")
          .insert(modelsToSync);
        if (modelsError) {
          console.error("Error syncing models:", modelsError);
          return false;
        }
      }

      // Sync Controllers
      if (masterData.controllers && masterData.controllers.length > 0) {
        await supabase
          .from("controllers")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        const { error: controllersError } = await supabase
          .from("controllers")
          .insert(
            masterData.controllers.map((c) => ({
              name: c.name,
              load_pixels: c.load || 0,
              price: c.price || 0,
            })),
          );
        if (controllersError) {
          console.error("Error syncing controllers:", controllersError);
          return false;
        }
      }

      // Sync Accessories
      if (masterData.accessories && masterData.accessories.length > 0) {
        await supabase
          .from("accessories")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        const { error: accessoriesError } = await supabase
          .from("accessories")
          .insert(
            masterData.accessories.map((a) => ({
              name: a.name,
              price: a.price || 0,
            })),
          );
        if (accessoriesError) {
          console.error("Error syncing accessories:", accessoriesError);
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error("Sync Error:", err);
      return false;
    }
  },
};
