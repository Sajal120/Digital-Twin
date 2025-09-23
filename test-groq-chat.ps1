$body = @{
    messages = @(
        @{
            role = "user"
            content = "Hello, can you tell me about yourself?"
        }
    )
    userId = "test-user-123"
} | ConvertTo-Json -Depth 3

try {
    Write-Host "Testing Groq-powered chat API..."
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!"
    Write-Host "Response: $($response.response)"
    Write-Host "Timestamp: $($response.timestamp)"
} catch {
    Write-Host "❌ ERROR:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Server response:"
        Write-Host $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
    }
}