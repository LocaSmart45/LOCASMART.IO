/*
  # Correction du chemin JWT dans la politique admin

  1. Problème
    - La politique utilisait auth.jwt() ->> 'role' 
    - Mais le rôle est stocké dans auth.jwt() -> 'app_metadata' ->> 'role'
    
  2. Solution
    - Corriger le chemin d'accès au rôle dans le JWT
    
  3. Sécurité
    - Les admins peuvent maintenant correctement voir tous les profils
*/

-- Supprimer l'ancienne politique avec le mauvais chemin
DROP POLICY IF EXISTS "Admins can view all profiles via JWT" ON profiles;

-- Créer la politique avec le bon chemin JWT
CREATE POLICY "Admins can view all profiles via JWT"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );