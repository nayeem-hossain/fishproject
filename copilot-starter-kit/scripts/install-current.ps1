#!/usr/bin/env pwsh

param(
    [ValidateSet('minimal', 'standard', 'heavy')]
    [string]$Tier = 'standard',
    [switch]$InstallUserProfile,
    [switch]$ReopenWorkspace,
    [switch]$VerboseLogs
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Path $PSCommandPath -Parent
$applyScript = Join-Path -Path $scriptDir -ChildPath 'apply-kit.ps1'

if (-not (Test-Path -LiteralPath $applyScript)) {
    throw "Missing apply script at $applyScript"
}

& $applyScript -TargetWorkspace (Get-Location).Path -KitTier $Tier -Mode Manual -InstallUserProfile:$InstallUserProfile -ReopenWorkspace:$ReopenWorkspace -VerboseLogs:$VerboseLogs
