try {
    Write-Host "Testing chat API..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -ContentType "application/json" -Body '{"message": "hello", "enhancedMode": true}' -TimeoutSec 30
    Write-Host "SUCCESS! Chat API is working" -ForegroundColor Green
    Write-Host "Response preview: $($response.response.Substring(0, [Math]::Min(100, $response.response.Length)))..." -ForegroundColor White
} catch {
    Write-Host "ERROR: Chat API failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}