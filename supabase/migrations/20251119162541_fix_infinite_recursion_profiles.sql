/*
  # Correction de la récursion infinie dans les politiques RLS profiles

  1. Problème
    - La politique "Admins can view all profiles" créait une récursion infinie
    - Elle faisait une requête sur profiles pour vérifier le rôle admin
    
  2. Solution
    - Supprimer la politique récursive
    - Créer une nouvelle politique utilisant auth.jwt() pour stocker le rôle
    - Mettre à jour les métadonnées des utilisateurs pour inclure le rôle dans le JWT
    
  3. Sécurité
    - Les utilisateurs normaux peuvent voir leur propre profil
    - Les admins peuvent voir tous les profils via le rôle stocké dans app_metadata
*/

-- Supprimer la politique problématique
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Créer une fonction pour mettre à jour les métadonnées utilisateur
CREATE OR REPLACE FUNCTION update_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les métadonnées JWT avec le rôle
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer un trigger pour maintenir les métadonnées à jour
DROP TRIGGER IF EXISTS on_profile_role_update ON profiles;
CREATE TRIGGER on_profile_role_update
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_metadata();

-- Mettre à jour les métadonnées pour les utilisateurs existants
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN SELECT id, role FROM profiles
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', profile_record.role)
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- Créer une nouvelle politique pour les admins utilisant JWT
CREATE POLICY "Admins can view all profiles via JWT"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'admin'
  );