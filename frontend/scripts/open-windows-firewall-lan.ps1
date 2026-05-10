#Requires -RunAsAdministrator
<#
  Opens Windows Defender Firewall for:
  - Vite: 5173 (dev), 4173 (preview)
  - DemoEnglish API (Kestrel): 5183 (HTTP), 7282 (HTTPS)

  Run from PowerShell **as Administrator**:
    cd path\to\DemoEnglish\frontend
    .\scripts\open-windows-firewall-lan.ps1
#>

$rules = @(
  @{ Name = 'DemoEnglish Vite dev (TCP 5173)'; Port = 5173 }
  @{ Name = 'DemoEnglish Vite preview (TCP 4173)'; Port = 4173 }
  @{ Name = 'DemoEnglish API HTTP (TCP 5183)'; Port = 5183 }
  @{ Name = 'DemoEnglish API HTTPS (TCP 7282)'; Port = 7282 }
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
    -Description 'Allow LAN access to DemoEnglish (Vite + Kestrel API).'
  Write-Host "Created: $($r.Name)"
}

$ips = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' } |
  Select-Object -ExpandProperty IPAddress -Unique
Write-Host "`nDone. On your iPhone (same Wi‑Fi), examples (replace IP):"
foreach ($ip in $ips) {
  Write-Host "  Front:  http://${ip}:5173"
  Write-Host "  API:    http://${ip}:5183/swagger"
}
Write-Host "`nSet frontend .env: VITE_API_BASE_URL=http://<PC-IP>:5183 (no /swagger path)."
Write-Host "If it still fails: Wi‑Fi profile Private, or run this script as Administrator."
