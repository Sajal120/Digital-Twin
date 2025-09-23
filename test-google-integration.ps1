$body = @{
    message = "book a meeting with you"
    enhancedMode = $true
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "🧪 Testing Google Integration..." -ForegroundColor Yellow
Write-Host "📡 Sending request to: http://localhost:3000/api/chat" -ForegroundColor Cyan
Write-Host "💬 Message: 'book a meeting with you'" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -Headers $headers -Body $body -TimeoutSec 30
    
    Write-Host "`n✅ SUCCESS! API Response:" -ForegroundColor Green
    Write-Host "─────────────────────────────────────" -ForegroundColor Gray
    Write-Host $response.response -ForegroundColor White
    
    if ($response.metadata) {
        Write-Host "`n📋 Metadata:" -ForegroundColor Cyan
        Write-Host "─────────────────" -ForegroundColor Gray
        $response.metadata | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor DarkGray
    }
    
    Write-Host "`n🔍 Integration Status:" -ForegroundColor Magenta
    if ($response.metadata.action -eq "book_meeting_auth_needed") {
        Write-Host "✅ Meeting booking detection: WORKING" -ForegroundColor Green
        Write-Host "ℹ️  Authentication required (as expected)" -ForegroundColor Yellow
    } elseif ($response.metadata.action -eq "meeting_created") {
        Write-Host "✅ Meeting booking: FULLY WORKING" -ForegroundColor Green
        Write-Host "🎉 Google Calendar integration: SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unexpected response type" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "`n❌ ERROR occurred:" -ForegroundColor Red
    Write-Host "─────────────────" -ForegroundColor Gray
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Message -like "*Unable to connect*") {
        Write-Host "`nServer might not be running on port 3000" -ForegroundColor Yellow
    }
}