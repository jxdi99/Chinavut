-- ### RAZR LED Solution - Supabase Setup & Seed Script ###
-- Copy and paste this entire script into your Supabase SQL Editor to initialize your production database.

-- 1. CLEANUP (Optional: Uncomment if you want to reset existing tables)
-- DROP TABLE IF EXISTS staff CASCADE;
-- DROP TABLE IF EXISTS led_models CASCADE;
-- DROP TABLE IF EXISTS controllers CASCADE;
-- DROP TABLE IF EXISTS accessories CASCADE;

-- 2. CREATE TABLES

-- Staff Profiles
CREATE TABLE IF NOT EXISTS staff (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text UNIQUE NOT NULL,
  email text UNIQUE,
  emp_id text UNIQUE NOT NULL,
  name text NOT NULL,
  nick text,
  role text,
  position text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- LED Models
CREATE TABLE IF NOT EXISTS led_models (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id text NOT NULL, -- UIR, UOS, CIH
  name text UNIQUE NOT NULL,
  rw integer NOT NULL,
  rh integer NOT NULL,
  max_w float NOT NULL,
  avg_w float NOT NULL,
  price double precision DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Controllers
CREATE TABLE IF NOT EXISTS controllers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  load_pixels integer NOT NULL,
  price double precision DEFAULT 0
);

-- Accessories
CREATE TABLE IF NOT EXISTS accessories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  price double precision DEFAULT 0
);

-- 3. INSERT DATA (SEEDING)

-- Insert Staff
INSERT INTO staff (emp_id, name, nick, role, position, status) VALUES
('HR-MK-4-025', 'นาย ดำรง สูงเรือง', 'ดำ', 'admin', null, 'active'),
('HR-SP-7-007', 'นาย ภาวัต ศิริวัฒน์', 'หน่อง', 'dev', null, 'active'),
('HR-SP-7-009', 'นาย ศิริศักดิ์ ทุมดี', 'ศักดิ์', 'dev', null, 'active'),
('HR-SP-7-010', 'นาย สรศักดิ์ หัดกันยา', 'เจได', 'dev', null, 'active'),
('HR-SV-6-014', 'นาย ลักษมัณต์ กันชาดี', 'ปลาย', 'dev', null, 'active'),
('HR-SP-0-000', 'น.ส.สุทธิดา ผดุงฮะ', 'นะ', 'admin', null, 'active'),
('HR-ST-5-029', 'นาย พิชิตชัย กุตัน', 'กี้', 'store', null, 'active'),
('HR-SL-1-001', 'นางสาว ไพรินทร์ ทัพด้วง', 'ริน', 'sale', null, 'active'),
('HR-SL-1-006', 'นาย ต้นตระกานต์ ไชยโคตรไพศาล', 'ต้น', 'sale', null, 'active'),
('HR-SL-1-007', 'นาย ประทีป อมรดิษฐ์', 'โหน่ง', 'sale', null, 'active'),
('HR-SL-1-008', 'นาย ภานุวัฒน์ หัวใจแก้ว', 'โน๊ต', 'sale', null, 'active'),
('HR-SL-1-014', 'นางสาว สกาวรัตน์ คงเกตุ', 'กาว', 'sale', null, 'active'),
('HR-SL-1-017', 'นาย ธนาพัฒน์ รุ้งเรืองรอง', 'ตรังค์', 'sale', null, 'active'),
('HR-SL-1-020', 'นางสาว อิสรี มาลีอังศุกุล', 'ขิม', 'sale', null, 'active'),
('HR-SL-1-022', 'นางสาว อาฑิตยา สิงหราช', 'กิ๊ฟ', 'sale', null, 'active')
ON CONFLICT (emp_id) DO NOTHING;

-- Insert LED Models (UIR)
INSERT INTO led_models (group_id, name, rw, rh, max_w, avg_w, price) VALUES
('UIR', 'UIRx 1.25', 512, 384, 522, 157, 0),
('UIR', 'UIRx 1.5', 416, 312, 386, 116, 50000),
('UIR', 'UIRx 1.8', 348, 261, 432, 130, 35000),
('UIR', 'UIRx 2.0', 320, 240, 408, 122, 0),
('UIR', 'UIRx 2.5', 256, 192, 356, 107, 25000),
('UIR', 'UIRx 3.0', 208, 156, 295, 89, 0),
('UIR', 'UIRx 4.0', 160, 120, 331, 99, 20000),
('UIR', 'UIRc 1.5', 416, 312, 386, 116, 69000),
('UIR', 'UIRc 1.8', 348, 261, 432, 130, 52000)
ON CONFLICT (name) DO NOTHING;

-- Insert LED Models (UOS)
INSERT INTO led_models (group_id, name, rw, rh, max_w, avg_w, price) VALUES
('UOS', 'UOS 4', 240, 240, 675, 203, 0),
('UOS', 'UOS 5', 192, 192, 712, 214, 30000),
('UOS', 'UOS 8', 120, 120, 847, 254, 0),
('UOS', 'UOS 10', 96, 96, 756, 227, 28000)
ON CONFLICT (name) DO NOTHING;

-- Insert LED Models (CIH)
INSERT INTO led_models (group_id, name, rw, rh, max_w, avg_w, price) VALUES
('CIH', 'CIH 1.2', 480, 270, 350, 150, 0),
('CIH', 'CIH 1.5', 384, 216, 350, 125, 0),
('CIH', 'CIH 1.8', 320, 180, 350, 115, 0)
ON CONFLICT (name) DO NOTHING;

-- Insert Controllers
INSERT INTO controllers (name, load_pixels, price) VALUES
('A2K', 2000000, 15000),
('A4K', 8800000, 20000),
('A35', 650000, 0),
('A40', 650000, 0),
('A100', 1300000, 25000),
('A200', 2300000, 30000),
('A500', 5200000, 60000),
('A800', 8800000, 110000),
('X2s', 1300000, 25000),
('X4m', 2600000, 20000),
('X4E', 2600000, 40000),
('X4E-W', 2600000, 55000),
('X6', 3930000, 45000),
('X7', 5240000, 50000),
('X8E', 5240000, 70000),
('X8M', 5240000, 80000),
('X12M', 7860000, 65000),
('X16E', 10480000, 110000),
('X16PRO', 10480000, 140000),
('X20', 13100000, 110000),
('X20M', 13100000, 200000),
('VX20', 13100000, 250000),
('VX10', 6500000, 110000),
('VX6', 3900000, 80000),
('AX08', 5240000, 67000),
('AX06', 3930000, 49000)
ON CONFLICT (name) DO NOTHING;

-- Insert Accessories
INSERT INTO accessories (name, price) VALUES
('SL10', 15000)
ON CONFLICT (name) DO NOTHING;

-- 4. ENABLE RLS (Security Best Practices)
-- Turn on Row Level Security for all public tables
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE led_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE controllers ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow EVERYONE (including anonymous) to READ the data
-- This is necessary so the Public Calculator can load master data without login.
CREATE POLICY "Allow public read access" ON staff FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON led_models FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON controllers FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON accessories FOR SELECT USING (true);

-- Policy 2: Allow ONLY AUTHENTICATED users to INSERT/UPDATE/DELETE
-- Anyone who logs in via Email/Password gets the 'authenticated' role in Supabase.
CREATE POLICY "Allow authenticated full access" ON staff FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access" ON led_models FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access" ON controllers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access" ON accessories FOR ALL USING (auth.role() = 'authenticated');
