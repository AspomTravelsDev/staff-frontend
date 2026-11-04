param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$InputPath,

    [Parameter(Position = 1)]
    [string]$OutputFolder = ".\converted-images",

    [ValidateRange(50, 300)]
    [int]$Dpi = 150,

    [ValidateRange(1, 100)]
    [int]$Quality = 85
)

$ErrorActionPreference = "Stop"

# Poppler's pdftoppm renders PDF pages and supports JPEG quality controls.
$converter = Get-Command pdftoppm -ErrorAction SilentlyContinue
if (-not $converter) {
    throw "pdftoppm was not found. Install Poppler for Windows and add its Library\bin folder to PATH."
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$resolvedOutput = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputFolder)
New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null

$pdfFiles = @()
if ((Get-Item -LiteralPath $resolvedInput).PSIsContainer) {
    $pdfFiles = @(Get-ChildItem -LiteralPath $resolvedInput -Filter "*.pdf" -File)
} elseif ([IO.Path]::GetExtension($resolvedInput) -ieq ".pdf") {
    $pdfFiles = @(Get-Item -LiteralPath $resolvedInput)
} else {
    throw "Input must be a PDF file or a folder containing PDF files."
}

if ($pdfFiles.Count -eq 0) {
    throw "No PDF files found in '$resolvedInput'."
}

foreach ($pdf in $pdfFiles) {
    $prefix = Join-Path $resolvedOutput $pdf.BaseName
    & $converter.Source -jpeg -r $Dpi -jpegopt "quality=$Quality,optimize=y,progressive=y" -singlefile $pdf.FullName $prefix
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Conversion failed for '$($pdf.Name)' (exit code $LASTEXITCODE)."
        continue
    }

    # Single-page PDFs produce <name>.jpg. If a PDF has multiple pages,
    # omit -singlefile's assumption and keep Poppler's numbered page output.
    $outputFile = "$prefix.jpg"
    if (Test-Path -LiteralPath $outputFile) {
        Write-Host "Created: $outputFile"
    }
}
