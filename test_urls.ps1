
$urls = @(
    "https://mp.weixin.qq.com/s/q0twThaTJEM2Z75SVoI53A",
    "https://mp.weixin.qq.com/s/TyVfmkzVF6fpLyv02_nuyw",
    "https://mp.weixin.qq.com/s/hqu1V3kNJ0UeWeXuFwtfQg",
    "https://blog.csdn.net/2301_81810326/article/details/157738283",
    "https://blog.csdn.net/systeminof/article/details/157972392",
    "https://blog.csdn.net/dong123dddd/article/details/157472639",
    "https://www.nowcoder.com/discuss/845331258220556288",
    "https://www.nowcoder.com/feed/main/detail/526d2c956d3c49828303df515035ee39",
    "https://juejin.cn/post/7581870491756478499",
    "https://juejin.cn/post/7606555427166060586"
)

$failed = 0
$passed = 0

foreach ($url in $urls) {
    Write-Host "Testing URL: $url" -NoNewline
    try {
        $body = @{ url = $url } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/parse" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        
        if ($response.content.Length -gt 50) {
            Write-Host " [PASS] - Length: $($response.content.Length)" -ForegroundColor Green
            $passed++
        } else {
             Write-Host " [FAIL] - Content too short/empty" -ForegroundColor Red
             $failed++
        }
    } catch {
        Write-Host " [FAIL] - Error: $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`nSummary: Passed: $passed, Failed: $failed"
if ($failed -eq 0) {
    Write-Host "All Tests Passed!" -ForegroundColor Green
} else {
    Write-Host "Some Tests Failed." -ForegroundColor Red
}
