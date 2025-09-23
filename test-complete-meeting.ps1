$body = @{
    messages = @(
        @{
            role = "user"
            content = "I'd like to schedule a meeting tomorrow at 2pm about Digital Twin project"
        }
    )
    userId = "test-user-123"
} | ConvertTo-Json -Depth 3

try {
    Write-Host "Testing complete meeting booking flow..."
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!"
    Write-Host "Response: $($response.response)"
    if ($response.meeting) {
        Write-Host "Meeting created:"
        Write-Host "- Event ID: $($response.meeting.eventId)"
        Write-Host "- Meet Link: $($response.meeting.meetLink)"
    }
} catch {
    Write-Host "❌ ERROR:"
    Write-Host $_.Exception.Message
}