/*
  # Permettre aux admins de voir tous les profils

  1. Modification
    - Ajout d'une politique permettant aux utilisateurs avec role='admin' de voir tous les profils
    
  2. Sécurité
    - Les utilisateurs normaux ne peuvent toujours voir que leur propre profil
    - Les admins peuvent voir tous les profils pour gérer les propriétaires
*/

-- Ajouter une politique pour permettre aux admins de voir tous les profils
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );