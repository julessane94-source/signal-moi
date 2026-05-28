-- Liste des colonnes pour la table signalements dans toutes les schemas
SELECT table_schema, table_name, column_name
FROM information_schema.columns
WHERE table_name = 'signalements'
ORDER BY table_schema, column_name;
