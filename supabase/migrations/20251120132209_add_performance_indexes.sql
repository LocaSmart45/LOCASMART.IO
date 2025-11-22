/*
  # Add Performance Indexes

  ## Performance Optimizations
  
  Add indexes on frequently queried columns to improve query performance:
  
  ### Reservations Table
  - Index on `check_in` for date-based queries
  - Index on `property_id` for filtering by property
  - Index on `status` for filtering by reservation status
  - Composite index on (property_id, check_in) for common queries
  
  ### Interventions Table
  - Index on `property_id` for filtering by property
  - Index on `scheduled_date` for date-based queries
  - Index on `status` for filtering by intervention status
  - Composite index on (property_id, scheduled_date) for common queries
  
  ### Properties Table
  - Index on `owner_id` for filtering by owner
  - Index on `status` for active/inactive filtering

  ## Notes
  - Uses IF NOT EXISTS to prevent errors on re-run
  - Indexes are created with meaningful names for easy identification
*/

-- Indexes for reservations table
CREATE INDEX IF NOT EXISTS idx_reservations_check_in ON reservations(check_in);
CREATE INDEX IF NOT EXISTS idx_reservations_property_id ON reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_property_checkin ON reservations(property_id, check_in);

-- Indexes for interventions table
CREATE INDEX IF NOT EXISTS idx_interventions_property_id ON interventions(property_id);
CREATE INDEX IF NOT EXISTS idx_interventions_scheduled_date ON interventions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
CREATE INDEX IF NOT EXISTS idx_interventions_property_scheduled ON interventions(property_id, scheduled_date);

-- Indexes for properties table
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
