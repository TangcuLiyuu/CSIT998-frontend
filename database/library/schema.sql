CREATE TABLE IF NOT EXISTS library_subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  intent TEXT NOT NULL,
  frequency VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL,
  tags JSON NOT NULL,
  last_push_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS library_briefs (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  resource_type VARCHAR(32) NOT NULL,
  subject VARCHAR(128) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  target_module VARCHAR(32) NOT NULL,
  difficulty VARCHAR(32) NOT NULL,
  age_group VARCHAR(16) NOT NULL,
  language VARCHAR(8) NOT NULL,
  tags JSON NOT NULL,
  read_time VARCHAR(32) NOT NULL,
  source VARCHAR(128) NOT NULL,
  source_url TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  keywords JSON NOT NULL,
  pdf_url TEXT NULL,
  original_text_preview TEXT NULL
);

CREATE TABLE IF NOT EXISTS library_brief_feedback (
  id VARCHAR(64) PRIMARY KEY,
  brief_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  value VARCHAR(8) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_library_feedback_brief
    FOREIGN KEY (brief_id) REFERENCES library_briefs(id)
);
