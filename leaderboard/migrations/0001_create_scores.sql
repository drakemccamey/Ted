CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL CHECK (length(nickname) BETWEEN 1 AND 24),
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 999999),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX scores_rank ON scores (score DESC, created_at ASC, id ASC);
