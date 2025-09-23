$body = @{
    message = "book a meeting with you"
    enhancedMode = $true
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    Write-Host "Testing meeting booking request..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -Headers $headers -Body $body
    
    Write-Host "`nResponse received:" -ForegroundColor Green
    Write-Host $response.response -ForegroundColor White
    
    if ($response.metadata) {
        Write-Host "`nMetadata:" -ForegroundColor Cyan
        $response.metadata | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
    }
} catch {
    Write-Host "Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}