param(
    [string]$MySqlBase = 'C:\Program Files\MySQL\MySQL Server 8.0'
)

$ErrorActionPreference = 'Stop'
$mysqld = Join-Path $MySqlBase 'bin\mysqld.exe'
$mysql = Join-Path $MySqlBase 'bin\mysql.exe'
$mysqladmin = Join-Path $MySqlBase 'bin\mysqladmin.exe'
foreach ($binary in @($mysqld, $mysql, $mysqladmin)) {
    if (-not (Test-Path -LiteralPath $binary)) { throw "MySQL 8.0 nao encontrado: $binary" }
}
if ($env:NODE_ENV -eq 'production') { throw 'NODE_ENV=production: teste isolado recusado.' }

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$listener.Start()
$port = $listener.LocalEndpoint.Port
$listener.Stop()
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
$schema = "cineastra_$($suffix)_test"
$user = "cineastra_$suffix"
$password = [guid]::NewGuid().ToString('N')
$testRoot = Join-Path $env:TEMP "cineastra-mysql-test-$suffix"
$data = Join-Path $testRoot 'data'
New-Item -ItemType Directory -Path $data -Force | Out-Null
$server = $null
$started = $false
$exitCode = 1

try {
    & $mysqld --no-defaults --initialize-insecure "--basedir=$MySqlBase" "--datadir=$data" "--log-error=$testRoot\init.err"
    if ($LASTEXITCODE -ne 0) { throw "Falha ao inicializar MySQL; veja $testRoot\init.err" }

    $serverArgs = "--no-defaults --datadir=`"$data`" --port=$port --bind-address=127.0.0.1 --mysqlx=OFF --log-error=`"$testRoot\server.err`""
    $server = Start-Process -FilePath $mysqld -ArgumentList $serverArgs -PassThru -WindowStyle Hidden
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        Start-Sleep -Milliseconds 500
        $server.Refresh()
        if ($server.HasExited) { throw "MySQL encerrou durante a inicializacao; veja $testRoot\server.err" }
        $ready = $false
        try {
            & $mysqladmin --no-defaults --protocol=tcp --host=127.0.0.1 "--port=$port" --user=root ping 2>$null | Out-Null
            $ready = $LASTEXITCODE -eq 0
        } catch { $ready = $false }
        if ($ready) { $started = $true; break }
    }
    if (-not $started) { throw "MySQL nao iniciou; veja $testRoot\server.err" }

    $sql = "CREATE DATABASE ``$schema``; CREATE USER '$user'@'127.0.0.1' IDENTIFIED BY '$password'; GRANT ALL PRIVILEGES ON ``$schema``.* TO '$user'@'127.0.0.1';"
    & $mysql --no-defaults --protocol=tcp --host=127.0.0.1 "--port=$port" --user=root "--execute=$sql"
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar schema ou usuario de teste.' }

    $env:TEST_DB_HOST = '127.0.0.1'
    $env:TEST_DB_PORT = [string]$port
    $env:TEST_DB_NAME = $schema
    $env:TEST_DB_USER = $user
    $env:TEST_DB_PASSWORD = $password
    $env:TEST_DB_CONFIRMED_NON_PRODUCTION = 'true'
    $env:RUN_MYSQL_TESTS = 'true'
    $env:RUN_IDENTITY_MYSQL_TESTS = 'true'
    Write-Host "Executando integracao em MySQL temporario 127.0.0.1:$port, schema $schema"
    Push-Location (Split-Path -Parent $PSScriptRoot)
    try {
        & npm run test:integration
        $exitCode = $LASTEXITCODE
    } finally { Pop-Location }
    if ($exitCode -eq 0) {
        $env:MYSQL_PWD = $password
        $queries = @(
            "EXPLAIN SELECT id_pedido FROM pedidos WHERE status='AGUARDANDO_PAGAMENTO' AND checkout_expira_em<=UTC_TIMESTAMP(3) ORDER BY checkout_expira_em,id_pedido LIMIT 50",
            "EXPLAIN SELECT id_pagamento FROM pagamentos WHERE data_pagamento>='2026-01-01' AND data_pagamento<'2027-01-01' AND status IN ('APROVADO','ESTORNADO')",
            "EXPLAIN SELECT id_envio FROM newsletter_envios WHERE status='PENDENTE' ORDER BY id_envio LIMIT 50"
        )
        Write-Host 'Planos EXPLAIN em dados sinteticos (nao medem desempenho em producao):'
        foreach ($query in $queries) {
            & $mysql --no-defaults --protocol=tcp --host=127.0.0.1 "--port=$port" "--user=$user" "--database=$schema" --batch "--execute=$query"
            if ($LASTEXITCODE -ne 0) { $exitCode = 1; break }
        }
    }
} finally {
    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
    if ($started -and $server -and -not $server.HasExited) {
        try {
            & $mysqladmin --no-defaults --protocol=tcp --host=127.0.0.1 "--port=$port" --user=root shutdown 2>$null
            if ($LASTEXITCODE -ne 0) { Stop-Process -Id $server.Id -Force }
        } catch {
            if (-not $server.HasExited) { Stop-Process -Id $server.Id -Force }
        }
    } elseif ($server -and -not $server.HasExited) {
        Stop-Process -Id $server.Id -Force
    }
    Remove-Item Env:TEST_DB_PASSWORD -ErrorAction SilentlyContinue
    Write-Host "MySQL temporario encerrado; dados de diagnostico em $testRoot"
}
exit $exitCode
