#!/usr/bin/env pwsh

param(
    [string]$TargetWorkspace,
    [Alias('KitTier')]
    [ValidateSet('minimal', 'standard', 'heavy')]
    [string]$Tier,
    [ValidateSet('Manual', 'Auto')]
    [string]$Mode,
    [ValidateSet('Ask', 'Shared', 'LocalOnly')]
    [string]$GitMode,
    [switch]$InstallUserProfile,
    [switch]$ReopenWorkspace,
    [string]$UserPromptsPath,
    [switch]$VerboseLogs
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($TargetWorkspace)) { $TargetWorkspace = (Get-Location).Path }
if ([string]::IsNullOrWhiteSpace($Tier)) { $Tier = 'standard' }
if ([string]::IsNullOrWhiteSpace($Mode)) { $Mode = 'Manual' }
if ([string]::IsNullOrWhiteSpace($GitMode)) { $GitMode = 'Ask' }

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = 'INFO'
    )

    if ($Level -eq 'DEBUG' -and -not $VerboseLogs) {
        return
    }

    Write-Host "[CopilotKit][$Level] $Message"
}

function New-DirectoryIfMissing {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -Path $Path -ItemType Directory -Force | Out-Null
    }
}

function Sync-DirectoryFiles {
    param(
        [string]$SourceRoot,
        [string]$DestinationRoot
    )

    if (-not (Test-Path -LiteralPath $SourceRoot)) {
        return
    }

    Get-ChildItem -LiteralPath $SourceRoot -Recurse -File | ForEach-Object {
        $relativePath = $_.FullName.Substring($SourceRoot.Length).TrimStart('\', '/')
        $destinationPath = Join-Path -Path $DestinationRoot -ChildPath $relativePath
        $destinationDir = Split-Path -Path $destinationPath -Parent
        New-DirectoryIfMissing -Path $destinationDir
        Copy-Item -LiteralPath $_.FullName -Destination $destinationPath -Force
    }
}

function Get-MarkdownSection {
    param(
        [string]$Content,
        [string]$Heading
    )

    $pattern = "(?ms)^##\s+$([regex]::Escape($Heading))\s*\r?\n(.*?)(?=^##\s+|\z)"
    $match = [regex]::Match($Content, $pattern)
    if ($match.Success) {
        return $match.Groups[1].Value.Trim()
    }

    return ''
}

function Build-CopilotInstructions {
    param(
        [string]$WorkspacePath,
        [string]$TemplatePath
    )

    $template = Get-Content -LiteralPath $TemplatePath -Raw
    $agentsPath = Join-Path -Path $WorkspacePath -ChildPath 'AGENTS.md'

    if (-not (Test-Path -LiteralPath $agentsPath)) {
        return $template
    }

    $agentsText = Get-Content -LiteralPath $agentsPath -Raw

    $corePrinciples = Get-MarkdownSection -Content $agentsText -Heading 'Core Principles'
    $securityGuidelines = Get-MarkdownSection -Content $agentsText -Heading 'Security Guidelines'
    $testingRequirements = Get-MarkdownSection -Content $agentsText -Heading 'Testing Requirements'
    $developmentWorkflow = Get-MarkdownSection -Content $agentsText -Heading 'Development Workflow'

    $overlay = @"

## AGENTS Overlay (Auto-Extracted)

Source: workspace `AGENTS.md`.

### Core Principles
$corePrinciples

### Security Guidelines
$securityGuidelines

### Testing Requirements
$testingRequirements

### Development Workflow
$developmentWorkflow
"@

    return ($template.TrimEnd() + "`r`n" + $overlay.Trim() + "`r`n")
}

function Resolve-GitMode {
    param(
        [string]$WorkspacePath,
        [string]$RequestedGitMode,
        [string]$SelectedMode
    )

    if ($RequestedGitMode -ne 'Ask') {
        return $RequestedGitMode
    }

    $statePath = Join-Path -Path $WorkspacePath -ChildPath '.copilot-kit/state.json'
    if ($SelectedMode -eq 'Auto' -and (Test-Path -LiteralPath $statePath)) {
        try {
            $existingState = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
            if ($existingState.gitMode -in @('Shared', 'LocalOnly')) {
                return [string]$existingState.gitMode
            }
        }
        catch {
            Write-Log -Message 'Unable to parse existing state, defaulting git mode to Shared in Auto mode.' -Level 'DEBUG'
        }

        return 'Shared'
    }

    while ($true) {
        $response = Read-Host 'Choose git mode for kit-managed files: [S]hared commit or [L]ocal-only'
        switch -Regex ($response.Trim()) {
            '^(S|SHARED)$' { return 'Shared' }
            '^(L|LOCAL|LOCALONLY)$' { return 'LocalOnly' }
            default { Write-Host 'Please enter S or L.' }
        }
    }
}

function Set-GitModePolicy {
    param(
        [string]$WorkspacePath,
        [string]$ResolvedGitMode
    )

    $gitDir = Join-Path -Path $WorkspacePath -ChildPath '.git'
    if (-not (Test-Path -LiteralPath $gitDir)) {
        Write-Log -Message 'No .git directory found; skipping git mode application.' -Level 'DEBUG'
        return
    }

    $excludePath = Join-Path -Path $gitDir -ChildPath 'info/exclude'
    New-DirectoryIfMissing -Path (Split-Path -Path $excludePath -Parent)
    if (-not (Test-Path -LiteralPath $excludePath)) {
        New-Item -Path $excludePath -ItemType File -Force | Out-Null
    }

    $managedEntries = @(
        '.github/copilot-instructions.md',
        '.github/instructions/',
        '.github/agents/',
        '.github/prompts/',
        '.vscode/tasks.json',
        '.vscode/settings.json',
        '.mcp.json',
        '.env.copilot.example'
    )

    $currentLines = Get-Content -LiteralPath $excludePath -ErrorAction SilentlyContinue
    if ($null -eq $currentLines) { $currentLines = @() }

    $filtered = $currentLines | Where-Object { $_ -and ($managedEntries -notcontains $_) }

    if ($ResolvedGitMode -eq 'LocalOnly') {
        $newLines = @($filtered + $managedEntries)
    }
    else {
        $newLines = @($filtered)
    }

    $newLines | Set-Content -LiteralPath $excludePath -Encoding UTF8
    Write-Log -Message "Applied git mode: $ResolvedGitMode"
}

function Write-StateFile {
    param(
        [string]$WorkspacePath,
        [string]$KitVersion,
        [string]$SelectedTier,
        [string]$SelectedMode,
        [string]$SelectedGitMode
    )

    $stateDir = Join-Path -Path $WorkspacePath -ChildPath '.copilot-kit'
    New-DirectoryIfMissing -Path $stateDir

    $state = [ordered]@{
        kitVersion = $KitVersion
        tier = $SelectedTier
        mode = $SelectedMode
        gitMode = $SelectedGitMode
        lastAppliedUtc = (Get-Date).ToUniversalTime().ToString('o')
    }

    $statePath = Join-Path -Path $stateDir -ChildPath 'state.json'
    $state | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $statePath -Encoding UTF8
}

function Invoke-WorkspaceReopen {
    param(
        [string]$WorkspacePath,
        [string]$SelectedMode
    )

    if ($SelectedMode -ne 'Manual') {
        Write-Log -Message 'Skipping workspace reopen in Auto mode.' -Level 'DEBUG'
        return
    }

    $codeCommand = Get-Command code -ErrorAction SilentlyContinue
    if (-not $codeCommand) {
        $codeCommand = Get-Command code.cmd -ErrorAction SilentlyContinue
    }

    if (-not $codeCommand) {
        Write-Log -Message 'VS Code CLI not found in PATH. Reopen manually.' -Level 'INFO'
        return
    }

    Start-Process -FilePath $codeCommand.Source -ArgumentList @('--reuse-window', $WorkspacePath) | Out-Null
    Write-Log -Message 'Requested VS Code workspace reopen.'
}

$workspacePath = (Resolve-Path -LiteralPath $TargetWorkspace).Path
$kitRoot = (Resolve-Path -LiteralPath (Join-Path -Path $PSScriptRoot -ChildPath '..')).Path
$manifestPath = Join-Path -Path $kitRoot -ChildPath 'manifest.json'

if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Manifest not found at $manifestPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$kitVersion = [string]$manifest.version

$workspaceTemplateRoot = Join-Path -Path $kitRoot -ChildPath 'templates/workspace'
$userTemplateRoot = Join-Path -Path $kitRoot -ChildPath 'templates/user'
$resolvedGitMode = Resolve-GitMode -WorkspacePath $workspacePath -RequestedGitMode $GitMode -SelectedMode $Mode

Write-Log -Message "Applying kit v$kitVersion to $workspacePath (tier: $Tier, mode: $Mode, gitMode: $resolvedGitMode)"

$workspaceSyncRoots = @(
    '.github/instructions',
    '.github/agents',
    '.github/prompts',
    '.vscode'
)

foreach ($relativeRoot in $workspaceSyncRoots) {
    $sourceRoot = Join-Path -Path $workspaceTemplateRoot -ChildPath $relativeRoot
    $destinationRoot = Join-Path -Path $workspacePath -ChildPath $relativeRoot
    New-DirectoryIfMissing -Path $destinationRoot
    Sync-DirectoryFiles -SourceRoot $sourceRoot -DestinationRoot $destinationRoot
    Write-Log -Message "Synced $relativeRoot"
}

$envTemplateSource = Join-Path -Path $workspaceTemplateRoot -ChildPath '.env.copilot.example'
$envTemplateTarget = Join-Path -Path $workspacePath -ChildPath '.env.copilot.example'
if (Test-Path -LiteralPath $envTemplateSource) {
    Copy-Item -LiteralPath $envTemplateSource -Destination $envTemplateTarget -Force
    Write-Log -Message 'Synced .env.copilot.example'
}

$tierPath = Join-Path -Path $workspaceTemplateRoot -ChildPath (".mcp.profiles/{0}.json" -f $Tier)
if (-not (Test-Path -LiteralPath $tierPath)) {
    throw "MCP profile not found: $tierPath"
}

$mcpTargetPath = Join-Path -Path $workspacePath -ChildPath '.mcp.json'
New-DirectoryIfMissing -Path (Split-Path -Path $mcpTargetPath -Parent)
Copy-Item -LiteralPath $tierPath -Destination $mcpTargetPath -Force
Write-Log -Message "Applied MCP profile: $Tier"

$instructionsTemplatePath = Join-Path -Path $workspaceTemplateRoot -ChildPath '.github/copilot-instructions.md'
if (-not (Test-Path -LiteralPath $instructionsTemplatePath)) {
    throw "Instructions template not found: $instructionsTemplatePath"
}

$renderedInstructions = Build-CopilotInstructions -WorkspacePath $workspacePath -TemplatePath $instructionsTemplatePath
$instructionsTarget = Join-Path -Path $workspacePath -ChildPath '.github/copilot-instructions.md'

New-DirectoryIfMissing -Path (Split-Path -Path $instructionsTarget -Parent)
$renderedInstructions | Set-Content -LiteralPath $instructionsTarget -Encoding UTF8
Write-Log -Message 'Generated .github/copilot-instructions.md from template + AGENTS overlay'

Set-GitModePolicy -WorkspacePath $workspacePath -ResolvedGitMode $resolvedGitMode

if ($InstallUserProfile) {
    if ([string]::IsNullOrWhiteSpace($UserPromptsPath)) {
        if (-not [string]::IsNullOrWhiteSpace($env:VSCODE_USER_PROMPTS_FOLDER)) {
            $UserPromptsPath = $env:VSCODE_USER_PROMPTS_FOLDER
        }
        else {
            $UserPromptsPath = Join-Path -Path $env:APPDATA -ChildPath 'Code/User/prompts'
        }
    }

    New-DirectoryIfMissing -Path $UserPromptsPath
    Sync-DirectoryFiles -SourceRoot $userTemplateRoot -DestinationRoot $UserPromptsPath
    Write-Log -Message "Installed user profile templates to $UserPromptsPath"
}

Write-StateFile -WorkspacePath $workspacePath -KitVersion $kitVersion -SelectedTier $Tier -SelectedMode $Mode -SelectedGitMode $resolvedGitMode
Write-Log -Message 'State file updated at .copilot-kit/state.json'

if ($ReopenWorkspace) {
    Invoke-WorkspaceReopen -WorkspacePath $workspacePath -SelectedMode $Mode
}

Write-Log -Message 'Done.'
