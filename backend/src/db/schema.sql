/*
  UpEvents Database Schema - MySQL Version

  Tables:
  1. categories - Event categories
  2. events - Event information
  3. custom_fields - Dynamic form fields per event
  4. registrations - Participant registrations
  5. registration_data - Custom field values
  6. attendance - Check-in records
  7. participants - Gamification participant profiles
  8. participant_badges - Earned badges
  9. program_slots - Event schedule/agenda
*/

-- Drop tables if they exist (for fresh install)
DROP TABLE IF EXISTS participant_badges;
DROP TABLE IF EXISTS participants;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS registration_data;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS program_slots;
DROP TABLE IF EXISTS custom_fields;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS categories;

-- Categories table
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories
INSERT INTO categories (name, color) VALUES
  ('Conférence', '#3B82F6'),
  ('Formation', '#10B981'),
  ('Atelier', '#F59E0B'),
  ('Webinaire', '#8B5CF6'),
  ('Networking', '#EC4899');

-- Events table
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date DATETIME NOT NULL,
  registration_code VARCHAR(255) UNIQUE NOT NULL,
  attendance_code VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_closed BOOLEAN DEFAULT FALSE NOT NULL,
  category_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for events
CREATE INDEX idx_events_registration_code ON events(registration_code);
CREATE INDEX idx_events_attendance_code ON events(attendance_code);
CREATE INDEX idx_events_category_id ON events(category_id);

-- Custom fields table
CREATE TABLE custom_fields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  field_name TEXT NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'email', 'number', 'select', 'textarea')),
  field_options JSON DEFAULT ('[]'),
  is_required BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for custom_fields
CREATE INDEX idx_custom_fields_event_id ON custom_fields(event_id);

-- Registrations table
CREATE TABLE registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  company TEXT,
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  cancelled BOOLEAN DEFAULT FALSE,
  points_earned INT DEFAULT 0,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for registrations
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_qr_code ON registrations(qr_code);

-- Registration data for custom fields
CREATE TABLE registration_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  custom_field_id INT NOT NULL,
  value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
  FOREIGN KEY (custom_field_id) REFERENCES custom_fields(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for registration_data
CREATE INDEX idx_registration_data_registration_id ON registration_data(registration_id);
CREATE INDEX idx_registration_data_custom_field_id ON registration_data(custom_field_id);

-- Attendance tracking
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  points_awarded INT DEFAULT 0,
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for attendance
CREATE INDEX idx_attendance_registration_id ON attendance(registration_id);

-- Participants table (gamification)
CREATE TABLE participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  total_points INT DEFAULT 0,
  level INT DEFAULT 1,
  events_attended INT DEFAULT 0,
  streak INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for participants
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_total_points ON participants(total_points DESC);

-- Participant badges
CREATE TABLE participant_badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participant_id INT NOT NULL,
  badge_type VARCHAR(50) NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for participant_badges
CREATE INDEX idx_participant_badges_participant_id ON participant_badges(participant_id);

-- Program slots table
CREATE TABLE program_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  is_break BOOLEAN DEFAULT FALSE,
  speaker TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for program_slots
CREATE INDEX idx_program_slots_event_id ON program_slots(event_id);
CREATE INDEX idx_program_slots_order ON program_slots(event_id, order_index);
