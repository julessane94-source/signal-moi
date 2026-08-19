-- Les nouveaux dossiers ne sont plus attribues automatiquement selon la
-- position GPS. Ils restent visibles dans la file commune jusqu'a ce qu'un
-- commissariat les prenne en charge.
--
-- Les dossiers deja en cours ou termines conservent leur responsable afin de
-- ne pas interrompre une intervention existante.
UPDATE signal_moi.signalements
SET assigned_to = NULL,
    updated_at = NOW()
WHERE COALESCE(LOWER(statut), 'nouveau') = 'nouveau'
  AND assigned_to IS NOT NULL;
