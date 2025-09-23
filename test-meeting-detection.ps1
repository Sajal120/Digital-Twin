$body = @{
    messages = @(
        @{
            role = "user"
            content = "I'd like to schedule a meeting with you"
        }
    )
    userId = "test-user-123"
} | ConvertTo-Json -Depth 3

try {
    Write-Host "Testing meeting detection..."
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!"
    Write-Host "Response: $($response.response)"
} catch {
    Write-Host "❌ ERROR:"
    Write-Host $_.Exception.Message
}