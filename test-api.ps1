try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -ContentType "application/json" -Body '{"message": "book a meeting with you", "enhancedMode": true}'
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host $response.response
    if ($response.metadata) {
        Write-Host "Action: " $response.metadata.action
    }
} catch {
    Write-Host "ERROR:" $_.Exception.Message -ForegroundColor Red
}