/*
  # Ajout de la synchronisation iCal pour les logements

  1. Modifications
    - Ajout du champ `ical_url` dans la table properties pour stocker l'URL du calendrier iCal (Airbnb, Booking, etc.)
    - Ajout du champ `last_ical_sync` pour tracker la dernière synchronisation
    - Ajout du champ `ical_sync_enabled` pour activer/désactiver la synchro par logement
    
  2. Nouvelles Colonnes
    - `ical_url` (text) - URL du calendrier iCal fourni par Airbnb/Booking
    - `last_ical_sync` (timestamptz) - Date et heure de la dernière synchronisation
    - `ical_sync_enabled` (boolean) - Activer/désactiver la synchronisation automatique
    
  3. Notes
    - Ces champs sont optionnels pour permettre une adoption progressive
    - Seuls les admins peuvent modifier ces champs (géré côté application)
*/

-- Ajouter les champs de synchronisation iCal à la table properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'ical_url'
  ) THEN
    ALTER TABLE properties ADD COLUMN ical_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'last_ical_sync'
  ) THEN
    ALTER TABLE properties ADD COLUMN last_ical_sync timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'ical_sync_enabled'
  ) THEN
    ALTER TABLE properties ADD COLUMN ical_sync_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Ajouter un champ source aux réservations pour identifier d'où elles viennent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'source'
  ) THEN
    ALTER TABLE reservations ADD COLUMN source text DEFAULT 'manual';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE reservations ADD COLUMN external_id text;
  END IF;
END $$;

-- Créer un index pour les recherches par external_id
CREATE INDEX IF NOT EXISTS idx_reservations_external_id ON reservations(external_id);

-- Commentaires pour documentation
COMMENT ON COLUMN properties.ical_url IS 'URL du calendrier iCal (Airbnb, Booking, etc.)';
COMMENT ON COLUMN properties.last_ical_sync IS 'Date et heure de la dernière synchronisation iCal';
COMMENT ON COLUMN properties.ical_sync_enabled IS 'Activer/désactiver la synchronisation automatique iCal';
COMMENT ON COLUMN reservations.source IS 'Source de la réservation: manual, airbnb, booking, ical';
COMMENT ON COLUMN reservations.external_id IS 'ID externe de la réservation (UID du iCal)';