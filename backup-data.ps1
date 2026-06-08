# Script de sauvegarde CleanWeek
# Usage : .\backup-data.ps1

$date = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupName = "cleanweek_backup_$date.db"
$source = "C:\Users\NayJeej\Desktop\cleanweek\CleanWeek\backend\data\cleanweek.db"
$dest = "C:\Users\NayJeej\Desktop\cleanweek\CleanWeek\backend\data\$backupName"

# Arrêter temporairement le serveur pour s'assurer que la DB est cohérente
Write-Host "Création de la sauvegarde : $backupName" -ForegroundColor Green
Copy-Item $source $dest -Force

# Afficher les backups existants
Write-Host "`nSauvegardes disponibles :" -ForegroundColor Cyan
Get-ChildItem "C:\Users\NayJeej\Desktop\cleanweek\CleanWeek\backend\data\*.db" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 10 Name,@{N="Taille";E={"$([math]::Round($_.Length/1KB,0)) KB"}},LastWriteTime | 
    Format-Table -AutoSize

Write-Host "`nBackup terminé ! Fichier : $backupName" -ForegroundColor Green
