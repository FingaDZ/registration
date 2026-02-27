CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Compte admin par défaut (mot de passe: admin123)
-- Hash généré avec bcryptjs.hashSync('admin123', 10)
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2b$10$M4GQV9OjIoXXIAJNnAeOrugbS.zkO4SeFcsw72KnvsqShNFtQT7x6', 'admin')
ON CONFLICT (username) DO NOTHING;
