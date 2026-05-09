#Requires -RunAsAdministrator
<#
  Opens Windows Defender Firewall for Vite dev (5173) and preview (4173) so other
  devices on the LAN (e.g. iPhone) can reach http://<this-PC-IP>:5173

  Run from PowerShell **as Administrator**:
    cd path\to\DemoEnglish\frontend
    .\scripts\open-windows-firewall-lan.ps1
#>

$rules = @(
  @{ Name = 'DemoEnglish Vite dev (TCP 5173)'; Port = 5173 }
  @{ Name = 'DemoEnglish Vite preview (TCP 4173)'; Port = 4173 }
)

foreach ($r in $rules) {
  $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "Rule already exists: $($r.Name)"
    continue
  }
  New-NetFirewallRule `
    -DisplayName $r.Name `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort $r.Port `
    -Profile Private, Public, Domain `
    -Description 'Allow LAN access to Vite for DemoEnglish local development.'
  Write-Host "Created: $($r.Name)"
}

$ips = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' } |
  Select-Object -ExpandProperty IPAddress -Unique
Write-Host "`nDone. On your iPhone (same Wi‑Fi), open one of:"
foreach ($ip in $ips) { Write-Host "  http://${ip}:5173" }
Write-Host "`nIf it still fails: set this Wi‑Fi as Private (Settings > Network) or run this script as Administrator."
