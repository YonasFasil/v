-- Create communication_tokens table for secure email threading
CREATE TABLE IF NOT EXISTS communication_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(32) UNIQUE NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  record_type VARCHAR(50) NOT NULL, -- 'proposal', 'booking', 'general'
  record_id VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  thread_id UUID, -- Links all communications in a thread
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  used_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_communication_tokens_token ON communication_tokens(token);
CREATE INDEX IF NOT EXISTS idx_communication_tokens_thread ON communication_tokens(thread_id);
CREATE INDEX IF NOT EXISTS idx_communication_tokens_tenant ON communication_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_communication_tokens_expires ON communication_tokens(expires_at);

-- Add thread_id and reply_to columns to communications table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'communications'
                 AND column_name = 'thread_id') THEN
    ALTER TABLE communications ADD COLUMN thread_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'communications'
                 AND column_name = 'reply_to_address') THEN
    ALTER TABLE communications ADD COLUMN reply_to_address VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'communications'
                 AND column_name = 'parent_communication_id') THEN
    ALTER TABLE communications ADD COLUMN parent_communication_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'communications'
                 AND column_name = 'direction') THEN
    ALTER TABLE communications ADD COLUMN direction VARCHAR(20) DEFAULT 'outbound';
  END IF;
END $$;

-- Create index on thread_id for faster thread queries
CREATE INDEX IF NOT EXISTS idx_communications_thread ON communications(thread_id);
CREATE INDEX IF NOT EXISTS idx_communications_parent ON communications(parent_communication_id);