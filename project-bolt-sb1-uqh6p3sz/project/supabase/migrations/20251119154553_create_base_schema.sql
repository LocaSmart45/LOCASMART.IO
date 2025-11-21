/*
  # Schéma initial - Les Clefs de Jeanne - SaaS Conciergerie

  ## Description
  Migration initiale créant l'infrastructure complète pour le SaaS de gestion de conciergerie Airbnb.
  
  ## 1. Nouvelles Tables
  
  ### `profiles`
  - `id` (uuid, clé primaire) - Lié à auth.users
  - `email` (text) - Email de l'utilisateur
  - `full_name` (text) - Nom complet
  - `role` (text) - Rôle : 'admin' ou 'owner'
  - `phone` (text, nullable) - Téléphone
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Date de mise à jour
  
  ### `properties`
  - `id` (uuid, clé primaire)
  - `owner_id` (uuid) - Référence au propriétaire
  - `name` (text) - Nom du logement
  - `address` (text) - Adresse complète
  - `type` (text) - Type : appartement, maison, etc.
  - `bedrooms` (integer) - Nombre de chambres
  - `bathrooms` (integer) - Nombre de salles de bain
  - `airbnb_url` (text, nullable) - URL Airbnb
  - `booking_url` (text, nullable) - URL Booking
  - `commission_rate` (decimal) - Taux de commission (%)
  - `status` (text) - Statut : 'active', 'inactive'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `reservations`
  - `id` (uuid, clé primaire)
  - `property_id` (uuid) - Référence au logement
  - `guest_name` (text) - Nom du voyageur
  - `guest_email` (text, nullable) - Email du voyageur
  - `guest_phone` (text, nullable) - Téléphone du voyageur
  - `check_in` (date) - Date d'arrivée
  - `check_out` (date) - Date de départ
  - `platform` (text) - Plateforme : 'airbnb', 'booking', 'direct'
  - `total_amount` (decimal) - Montant total
  - `commission_amount` (decimal) - Commission conciergerie
  - `status` (text) - Statut : 'confirmed', 'cancelled', 'completed'
  - `notes` (text, nullable) - Notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `interventions`
  - `id` (uuid, clé primaire)
  - `property_id` (uuid) - Référence au logement
  - `reservation_id` (uuid, nullable) - Référence à la réservation
  - `type` (text) - Type : 'cleaning', 'maintenance', 'check_in', 'check_out'
  - `title` (text) - Titre de l'intervention
  - `description` (text, nullable) - Description détaillée
  - `scheduled_date` (date) - Date planifiée
  - `scheduled_time` (time, nullable) - Heure planifiée
  - `status` (text) - Statut : 'pending', 'in_progress', 'completed', 'cancelled'
  - `assigned_to` (text, nullable) - Personne assignée
  - `cost` (decimal, nullable) - Coût de l'intervention
  - `completed_at` (timestamptz, nullable) - Date de réalisation
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `messages`
  - `id` (uuid, clé primaire)
  - `sender_id` (uuid) - Référence à l'expéditeur
  - `recipient_id` (uuid) - Référence au destinataire
  - `property_id` (uuid, nullable) - Référence au logement concerné
  - `subject` (text) - Sujet
  - `content` (text) - Contenu du message
  - `read` (boolean) - Lu ou non
  - `created_at` (timestamptz)
  
  ## 2. Sécurité (RLS)
  
  Toutes les tables ont RLS activé avec des politiques restrictives :
  - Les propriétaires accèdent uniquement à leurs données
  - Les admins accèdent à toutes les données
  - Authentification requise pour toutes les opérations
  
  ## 3. Index
  
  Index créés pour optimiser les requêtes fréquentes sur :
  - Relations foreign keys
  - Recherches par dates
  - Filtres par statut
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'owner')),
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir leur propre profil"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins peuvent voir tous les profils"
  ON profiles FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Utilisateurs peuvent mettre à jour leur profil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins peuvent insérer des profils"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Table des logements
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  type text NOT NULL DEFAULT 'apartment',
  bedrooms integer NOT NULL DEFAULT 1,
  bathrooms integer NOT NULL DEFAULT 1,
  airbnb_url text,
  booking_url text,
  commission_rate decimal(5,2) NOT NULL DEFAULT 20.00,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaires voient leurs logements"
  ON properties FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins peuvent insérer des logements"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins peuvent mettre à jour des logements"
  ON properties FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins peuvent supprimer des logements"
  ON properties FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Table des réservations
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  guest_email text,
  guest_phone text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  platform text NOT NULL DEFAULT 'airbnb' CHECK (platform IN ('airbnb', 'booking', 'direct')),
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  commission_amount decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaires voient les réservations de leurs logements"
  ON reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = reservations.property_id 
      AND (properties.owner_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
    )
  );

CREATE POLICY "Admins peuvent insérer des réservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins peuvent mettre à jour des réservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins peuvent supprimer des réservations"
  ON reservations FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Table des interventions
CREATE TABLE IF NOT EXISTS interventions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES reservations(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('cleaning', 'maintenance', 'check_in', 'check_out')),
  title text NOT NULL,
  description text,
  scheduled_date date NOT NULL,
  scheduled_time time,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to text,
  cost decimal(10,2) DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaires voient les interventions de leurs logements"
  ON interventions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = interventions.property_id 
      AND (properties.owner_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
    )
  );

CREATE POLICY "Admins peuvent insérer des interventions"
  ON interventions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins peuvent mettre à jour des interventions"
  ON interventions FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins peuvent supprimer des interventions"
  ON interventions FOR DELETE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  subject text NOT NULL,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs voient leurs messages envoyés et reçus"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Utilisateurs peuvent envoyer des messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Destinataires peuvent marquer comme lu"
  ON messages FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_reservations_property ON reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_interventions_property ON interventions(property_id);
CREATE INDEX IF NOT EXISTS idx_interventions_date ON interventions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);