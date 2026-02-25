-- ==============================================================================
-- SYSTÈME DE SAUVEGARDE AVEC HISTORIQUE (ROLLING BACKUP)
-- ==============================================================================
-- Objectif : Conserver les 2 dernières versions majeures de chaque personnage.
-- Logique  : 
--   1. Sauvegarder l'état AVANT mise à jour dans 'characters_history'.
--   2. Ne créer une archive que si :
--      a. C'est une sauvegarde MANUELLE.
--      b. OU la dernière archive date de plus de 1 HEURE (pour l'Auto-Save).
--   3. Supprimer les archives anciennes pour ne garder que les 2 plus récentes.

-- ------------------------------------------------------------------------------
-- 1. Création de la table d'historique
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Utilisation de gen_random_uuid() (standard PG 13+)
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    metadata JSONB, -- Pour stocker player_name, character_name, last_synced
    archived_at TIMESTAMPTZ DEFAULT NOW(),
    version_reason TEXT DEFAULT 'auto' -- 'manual' ou 'auto_1h'
);

-- Index pour optimiser les recherches par personnage et par date (pour le nettoyage)
CREATE INDEX IF NOT EXISTS idx_characters_history_character_id ON characters_history(character_id);
CREATE INDEX IF NOT EXISTS idx_characters_history_archived_at ON characters_history(archived_at);

-- ------------------------------------------------------------------------------
-- 2. Fonction du Trigger (Logique Métier)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_character_history()
RETURNS TRIGGER AS $$
DECLARE
    max_history INT := 2; -- LIMITE CONFIGURABLE : 2 versions
    last_archived_time TIMESTAMPTZ;
    is_manual_save BOOLEAN;
    should_archive BOOLEAN := false;
BEGIN
    -- Déterminer si c'est une sauvegarde manuelle via le champ syncMode potentiellement présent dans data
    -- Si syncMode n'est pas présent, on considère que c'est 'auto' par défaut, sauf si on change la logique client.
    -- Pour l'instant, on assume que le client enverra { syncMode: 'manual' } lors d'un clic explicite.
    is_manual_save := (NEW.data->>'syncMode' = 'manual');

    -- Récupérer la date de la dernière archive pour ce personnage
    SELECT archived_at INTO last_archived_time
    FROM characters_history
    WHERE character_id = OLD.id
    ORDER BY archived_at DESC
    LIMIT 1;

    -- DÉCISION D'ARCHIVAGE
    IF is_manual_save THEN
        -- Cas 1 : Force Manual -> On archive toujours
        should_archive := true;
    ELSIF last_archived_time IS NULL OR (NOW() - last_archived_time > INTERVAL '1 hour') THEN
        -- Cas 2 : Auto ou Indéfini -> On archive si > 1h depuis la dernière
        should_archive := true;
    END IF;

    -- EXÉCUTION DE L'ARCHIVAGE
    IF should_archive THEN
        -- 1. Insérer la version actuelle (OLD) dans l'historique
        INSERT INTO characters_history (character_id, data, metadata, archived_at, version_reason)
        VALUES (
            OLD.id, 
            OLD.data, 
            jsonb_build_object(
                'player_name', OLD.player_name, 
                'character_name', OLD.character_name,
                'last_synced', OLD.last_synced
            ), 
            NOW(),
            CASE WHEN is_manual_save THEN 'manual' ELSE 'auto_1h' END
        );

        -- 2. Rotation : Nettoyage des vieilles versions
        -- On garde les 'max_history' plus récents, on supprime le reste
        DELETE FROM characters_history
        WHERE id IN (
            SELECT id FROM characters_history
            WHERE character_id = OLD.id
            ORDER BY archived_at DESC
            OFFSET max_history
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 3. Application du Trigger
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_character_history ON characters;

CREATE TRIGGER trigger_character_history
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION handle_character_history();

-- Fin du script
