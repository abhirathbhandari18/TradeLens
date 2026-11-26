# TradeLens API Automated QA Test Suite
$baseUrl = "http://localhost:8080/api"
$token = "demo-token-12345"

Write-Host "=========================================================="
Write-Host "   TRADELENS END-TO-END QA TEST SUITE (Arnav's QA Task)   "
Write-Host "=========================================================="

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers,
        [string]$Body,
        [int]$ExpectedStatus
    )

    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 5
        }
        if ($Headers) { $params["Headers"] = $Headers }
        if ($Body) { 
            $params["Body"] = $Body 
            $params["ContentType"] = "application/json"
        }

        $res = Invoke-WebRequest @params -UseBasicParsing -ErrorAction Stop
        $actualCode = $res.StatusCode
        $actualBody = $res.Content

        if ($actualCode -eq $ExpectedStatus) {
            Write-Host "[PASS] $Name | Status: $actualCode" -ForegroundColor Green
            return @{ Name = $Name; Method = $Method; Url = $Url; Input = ($Body -replace "`n"," "); Expected = $ExpectedStatus; Actual = $actualCode; Status = "PASS"; Output = $actualBody }
        } else {
            Write-Host "[FAIL] $Name | Expected: $ExpectedStatus, Got: $actualCode" -ForegroundColor Red
            return @{ Name = $Name; Method = $Method; Url = $Url; Input = ($Body -replace "`n"," "); Expected = $ExpectedStatus; Actual = $actualCode; Status = "FAIL"; Output = $actualBody }
        }
    } catch {
        $actualCode = $_.Exception.Response.StatusCode.value__
        if (-not $actualCode) { $actualCode = 500 }
        
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $respBody = $reader.ReadToEnd()

        if ($actualCode -eq $ExpectedStatus) {
            Write-Host "[PASS] $Name | Status: $actualCode (Expected Error Caught)" -ForegroundColor Green
            return @{ Name = $Name; Method = $Method; Url = $Url; Input = ($Body -replace "`n"," "); Expected = $ExpectedStatus; Actual = $actualCode; Status = "PASS"; Output = $respBody }
        } else {
            Write-Host "[FAIL] $Name | Expected: $ExpectedStatus, Got: $actualCode" -ForegroundColor Red
            return @{ Name = $Name; Method = $Method; Url = $Url; Input = ($Body -replace "`n"," "); Expected = $ExpectedStatus; Actual = $actualCode; Status = "FAIL"; Output = $respBody }
        }
    }
}

$results = @()

# 1. Health
$results += Test-Endpoint "Health Check" "GET" "$baseUrl/health" $null $null 200

# 2. Auth: Signup
$randUser = "qa_user_" + (Get-Random -Minimum 1000 -Maximum 9999)
$results += Test-Endpoint "Auth: Signup New User" "POST" "$baseUrl/auth/signup" $null "{`"username`":`"$randUser`",`"email`":`"$randUser@test.com`",`"password`":`"pass123`"}" 201

# 3. Auth: Login
$results += Test-Endpoint "Auth: Login Valid" "POST" "$baseUrl/auth/login" $null "{`"username`":`"investor`",`"password`":`"password123`"}" 200

# 4. Auth: Login Invalid
$results += Test-Endpoint "Auth: Login Invalid Credentials" "POST" "$baseUrl/auth/login" $null "{`"username`":`"investor`",`"password`":`"wrong`"}" 401

# 5. Stocks: List
$results += Test-Endpoint "Stocks: Get All Stocks" "GET" "$baseUrl/stocks" $null $null 200

# 6. Stocks: Search by Symbol
$results += Test-Endpoint "Stocks: Search Keyword" "GET" "$baseUrl/stocks?keyword=RELIANCE" $null $null 200

# 7. Stocks: Detail Valid
$results += Test-Endpoint "Stocks: Get Detail Valid" "GET" "$baseUrl/stocks/detail?symbol=TCS" $null $null 200

# 8. Stocks: Detail Invalid Symbol
$results += Test-Endpoint "Stocks: Detail Invalid Symbol" "GET" "$baseUrl/stocks/detail?symbol=NONEXISTENT" $null $null 404

# 9. Watchlist: GET (Authorized)
$results += Test-Endpoint "Watchlist: GET Authorized" "GET" "$baseUrl/watchlist" @{ Authorization = "Bearer $token" } $null 200

# 10. Watchlist: GET (Unauthorized)
$results += Test-Endpoint "Watchlist: GET Unauthorized (No Token)" "GET" "$baseUrl/watchlist" $null $null 401

# 11. Watchlist: POST Add Valid
$results += Test-Endpoint "Watchlist: POST Add Valid (SUNPHARMA)" "POST" "$baseUrl/watchlist" @{ Authorization = "Bearer $token" } "{`"symbol`":`"SUNPHARMA`"}" 201

# 12. Watchlist: POST Duplicate Rejection
$results += Test-Endpoint "Watchlist: POST Duplicate Stock (409)" "POST" "$baseUrl/watchlist" @{ Authorization = "Bearer $token" } "{`"symbol`":`"SUNPHARMA`"}" 409

# 13. Watchlist: POST Invalid Stock
$results += Test-Endpoint "Watchlist: POST Nonexistent Stock (400)" "POST" "$baseUrl/watchlist" @{ Authorization = "Bearer $token" } "{`"symbol`":`"FAKESTOCK`"}" 400

# 14. Watchlist: DELETE Remove
$results += Test-Endpoint "Watchlist: DELETE Remove Stock" "DELETE" "$baseUrl/watchlist?symbol=SUNPHARMA" @{ Authorization = "Bearer $token" } $null 200

# 15. Holdings: GET (Authorized)
$results += Test-Endpoint "Holdings: GET Authorized" "GET" "$baseUrl/holdings" @{ Authorization = "Bearer $token" } $null 200

# 16. Orders: GET History (Authorized)
$results += Test-Endpoint "Orders: GET History Authorized" "GET" "$baseUrl/orders" @{ Authorization = "Bearer $token" } $null 200

# 17. Trade: BUY Valid
$results += Test-Endpoint "Trade: BUY Shares Valid" "POST" "$baseUrl/trade/buy" @{ Authorization = "Bearer $token" } "{`"symbol`":`"INFY`",`"quantity`":`"5`"}" 201

# 18. Trade: BUY Zero Quantity (Negative Test)
$results += Test-Endpoint "Trade: BUY Zero Quantity (400)" "POST" "$baseUrl/trade/buy" @{ Authorization = "Bearer $token" } "{`"symbol`":`"INFY`",`"quantity`":`"0`"}" 400

# 19. Trade: BUY Negative Quantity (Negative Test)
$results += Test-Endpoint "Trade: BUY Negative Quantity (400)" "POST" "$baseUrl/trade/buy" @{ Authorization = "Bearer $token" } "{`"symbol`":`"INFY`",`"quantity`":`"-10`"}" 400

# 20. Trade: SELL Valid
$results += Test-Endpoint "Trade: SELL Shares Valid" "POST" "$baseUrl/trade/sell" @{ Authorization = "Bearer $token" } "{`"symbol`":`"INFY`",`"quantity`":`"2`"}" 200

# 21. Trade: SELL Exceeding Holdings (Negative Test)
$results += Test-Endpoint "Trade: SELL Excessive Shares (400)" "POST" "$baseUrl/trade/sell" @{ Authorization = "Bearer $token" } "{`"symbol`":`"INFY`",`"quantity`":`"99999`"}" 400

# 22. Account: Overview
$results += Test-Endpoint "Account: GET Overview" "GET" "$baseUrl/account" @{ Authorization = "Bearer $token" } $null 200

# 23. Account: Deposit Funds
$results += Test-Endpoint "Account: POST Deposit Funds" "POST" "$baseUrl/account/deposit" @{ Authorization = "Bearer $token" } "{`"amount`":`"50000`"}" 200

# 24. Account: Deposit Negative Amount (Negative Test)
$results += Test-Endpoint "Account: Deposit Negative Amount (400)" "POST" "$baseUrl/account/deposit" @{ Authorization = "Bearer $token" } "{`"amount`":`"-100`"}" 400

# 25. Method Not Allowed Test
$results += Test-Endpoint "Invalid Method on /api/orders (405)" "POST" "$baseUrl/orders" @{ Authorization = "Bearer $token" } "{}" 405

Write-Host "=========================================================="
Write-Host "QA SUITE FINISHED: $($results.Count) TEST CASES EVALUATED"
Write-Host "=========================================================="
