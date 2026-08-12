CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student TEXT NOT NULL,
  kelas TEXT DEFAULT '',
  type TEXT NOT NULL,
  work TEXT DEFAULT '',
  file TEXT DEFAULT '',
  correct_count INTEGER,
  total_count INTEGER,
  percent INTEGER,
  wrong_json TEXT DEFAULT '[]',
  skills_json TEXT DEFAULT '{}',
  ts TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_student ON events(student);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);