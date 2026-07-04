# This script optimizes system RAM by stopping Dell bloatware services and trimming the working set of running processes.
# It needs to be run as Administrator to stop services.

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "      Windows RAM Optimization Script     " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check for Administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[WARNING] This script is NOT running as Administrator." -ForegroundColor Yellow
    Write-Host "To disable Dell background services, please run PowerShell as Administrator and run this script again." -ForegroundColor Yellow
    Write-Host "Proceeding with non-administrative RAM trimming only...`n" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Running with Administrator privileges. Proceeding with service optimization...`n" -ForegroundColor Green
    
    # List of Dell services to stop and disable
    $dellServices = @(
        "SupportAssistAgent",
        "DellTechHub",
        "DellClientManagementService",
        "Dell SupportAssist Remediation",
        "Dell Digital Delivery Services",
        "DellConnectedServiceDelivery"
    )

    foreach ($service in $dellServices) {
        $status = Get-Service -Name $service -ErrorAction SilentlyContinue
        if ($status) {
            Write-Host "Stopping and disabling service: $service..." -ForegroundColor Cyan
            try {
                Stop-Service -Name $service -Force -ErrorAction Stop
                Set-Service -Name $service -StartupType Disabled -ErrorAction Stop
                Write-Host "  Successfully stopped and disabled $service." -ForegroundColor Green
            } catch {
                Write-Host "  Failed to stop/disable ${service}: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "Service $service not found. Skipping." -ForegroundColor DarkGray
        }
    }
}

# 2. Trim working sets of running processes to free up RAM
Write-Host "`nTrimming memory working sets of running processes to free up physical RAM..." -ForegroundColor Cyan

# Add Windows API for EmptyWorkingSet
$apiCode = @'
using System;
using System.Runtime.InteropServices;

public class MemoryOptimizer {
    [DllImport("psapi.dll", SetLastError = true)]
    public static extern bool EmptyWorkingSet(IntPtr hProcess);
}
'@

try {
    Add-Type -TypeDefinition $apiCode -ErrorAction SilentlyContinue
} catch {}

$processes = Get-Process
$successCount = 0
$failCount = 0

foreach ($proc in $processes) {
    # Skip critical system processes
    if ($proc.Name -eq "Idle" -or $proc.Name -eq "System") { continue }
    
    try {
        $result = [MemoryOptimizer]::EmptyWorkingSet($proc.Handle)
        if ($result) {
            $successCount++
        } else {
            $failCount++
        }
    } catch {
        $failCount++
    }
}

Write-Host "Trimmed memory for $successCount processes." -ForegroundColor Green

# 3. Check and report new memory status
$os = Get-CimInstance Win32_OperatingSystem
$totalRAM = [math]::round($os.TotalVisibleMemorySize / 1MB, 2)
$freeRAM = [math]::round($os.FreePhysicalMemory / 1MB, 2)
$usedRAM = [math]::round($totalRAM - $freeRAM, 2)

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "RAM Status after Optimization:" -ForegroundColor Cyan
Write-Host "Total RAM: $totalRAM GB"
Write-Host "Used RAM:  $usedRAM GB" -ForegroundColor Yellow
Write-Host "Free RAM:  $freeRAM GB" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "`nOptimization complete!" -ForegroundColor Green
