-- Create complaint_status_history table to track all status changes
CREATE TABLE IF NOT EXISTS complaint_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(255),
    notes TEXT,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    INDEX idx_complaint_id (complaint_id),
    INDEX idx_changed_at (changed_at)
);

-- Optionally: Migrate existing complaints to have initial status history
-- This will create a history entry for each existing complaint using their current status
INSERT INTO complaint_status_history (complaint_id, status, changed_at, changed_by, notes)
SELECT id, status, submitted_at, submitted_by, 'Initial status (migrated)'
FROM complaints
WHERE id NOT IN (SELECT DISTINCT complaint_id FROM complaint_status_history);
