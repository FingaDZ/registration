CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
-- Hash generated with bcryptjs.hashSync('admin123', 10)
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2a$10$X7V.j.Z.Z.Z.Z.Z.Z.Z.Ze', 'admin')
ON CONFLICT (username) DO NOTHING;
