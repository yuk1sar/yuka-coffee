$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$env:ADMIN_USERNAME = Read-Host 'Admin username'
$secretInput = Read-Host 'New admin password (12+ characters, max 72 UTF-8 bytes)' -AsSecureString
$secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretInput)
try {
  $env:ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
  node create-admin.js
  if ($LASTEXITCODE -ne 0) { throw 'Admin creation failed' }
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
  Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:ADMIN_USERNAME -ErrorAction SilentlyContinue
}
