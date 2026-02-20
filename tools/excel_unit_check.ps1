Add-Type -AssemblyName System.IO.Compression.FileSystem
function U($codes) { return ($codes | ForEach-Object { [char]$_ }) -join '' }
$seg1 = U @(0x9879,0x76ee,0x9700,0x6c42)
$seg2 = U @(0x5efa,0x6750,0x6210,0x672c,0x7ba1,0x7406,0x7cfb,0x7edf)
$seg3 = U @(0x7ebf,0x8def,0x5de5,0x7a0b,0x002d,0x6210,0x672c,0x8ba1,0x5212,0x5355)
$path = "d:\\$seg1\\$seg2\\cost-system\\docs\\$seg3.xlsx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($path)
function Read-ZipEntryText($zip,$entryName) {
  $entry = $zip.GetEntry($entryName)
  if ($null -eq $entry) { return $null }
  $stream = $entry.Open()
  $reader = New-Object System.IO.StreamReader($stream, [Text.Encoding]::UTF8, $true)
  $text = $reader.ReadToEnd()
  $reader.Close(); $stream.Close()
  return $text
}
$kwMaterialName = U @(0x7269,0x8d44,0x540d,0x79f0)
$kwQty = U @(0x6570,0x91cf)
$kwUnit = U @(0x5355,0x4f4d)
$kwItemName = U @(0x9879,0x76ee,0x540d,0x79f0)
$kwTestItem = U @(0x68c0,0x6d4b,0x9879,0x76ee)
$kwFeeDetail = U @(0x8d39,0x7528,0x660e,0x7ec6)
$kwFeature = U @(0x9879,0x76ee,0x7279,0x5f81)
$kwTestParam = U @(0x68c0,0x6d4b,0x53c2,0x6570)
$kwWorkReq = U @(0x5de5,0x4f5c,0x8981,0x6c42)
$kwUnitAlt = U @(0x8ba1,0x91cf,0x5355,0x4f4d)
$kwQty1 = U @(0x53f0,0x73ed,0x6570)
$kwQty2 = U @(0x5de5,0x7a0b,0x91cf)
$kwQty3 = U @(0x6295,0x6807,0x5de5,0x7a0b,0x91cf)
$kwQty4 = U @(0x8ba1,0x4ef6,0x91cf)
$kwQty5 = U @(0x68c0,0x6d4b,0x6570,0x91cf)
$kwQty6 = U @(0x6570,0x91cf)
$kwPrice1 = U @(0x5355,0x4ef7)
$kwPrice2 = U @(0x6682,0x5217,0x5355,0x4ef7)
$kwPrice3 = U @(0x6846,0x67b6,0x5355,0x4ef7)
$kwPrice4 = U @(0x8ba1,0x4ef6,0x5355,0x4ef7)
$kwPrice5 = U @(0x5168,0x8d39,0x7528,0x7efc,0x5408,0x5355,0x4ef7)
$kwAmount1 = U @(0x5408,0x4ef7)
$kwAmount2 = U @(0x5408,0x8ba1)
$kwAmountAlt1 = U @(0x6682,0x5217,0x4ef7)
$kwAmountAlt2 = U @(0x6295,0x6807,0x62a5,0x4ef7)
$kwRemark = U @(0x5907,0x6ce8)
function ColLettersToIndex($letters) {
  $index = 0
  $letters.ToCharArray() | ForEach-Object { $index = $index * 26 + ([int][char]$_ - [int][char]'A' + 1) }
  return $index
}
function Get-SharedStrings($zip) {
  $text = Read-ZipEntryText $zip 'xl/sharedStrings.xml'
  if ([string]::IsNullOrWhiteSpace($text)) { return @() }
  $xml = [xml]$text
  $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
  $ns.AddNamespace('x','http://schemas.openxmlformats.org/spreadsheetml/2006/main')
  $list = @()
  foreach ($si in $xml.SelectNodes('//x:sst/x:si', $ns)) {
    $parts = @()
    $t = $si.SelectNodes('x:t', $ns)
    if ($t) { foreach ($n in $t) { $parts += $n.InnerText } }
    $r = $si.SelectNodes('x:r/x:t', $ns)
    if ($r) { foreach ($n in $r) { $parts += $n.InnerText } }
    $list += ($parts -join '')
  }
  return $list
}
$sharedStrings = Get-SharedStrings $zip
function Get-CellText($cell,$sharedStrings,$ns) {
  $t = $cell.GetAttribute('t')
  $vNode = $cell.SelectSingleNode('x:v', $ns)
  if ($vNode -ne $null) {
    $v = $vNode.InnerText
    if ($t -eq 's') { return $sharedStrings[[int]$v] }
    return $v
  }
  $inlineText = @()
  $isNode = $cell.SelectSingleNode('x:is/x:t', $ns)
  if ($isNode -ne $null) { $inlineText += $isNode.InnerText }
  $runs = $cell.SelectNodes('x:is/x:r/x:t', $ns)
  if ($runs) { foreach ($n in $runs) { $inlineText += $n.InnerText } }
  if ($inlineText.Count -gt 0) { return ($inlineText -join '') }
  return ''
}
function Get-RowCells($sheetXml,$rowIndex,$sharedStrings) {
  $ns = New-Object System.Xml.XmlNamespaceManager($sheetXml.NameTable)
  $ns.AddNamespace('x','http://schemas.openxmlformats.org/spreadsheetml/2006/main')
  $rowNode = $sheetXml.SelectSingleNode("//x:sheetData/x:row[@r='$rowIndex']", $ns)
  $result = @{}
  if ($rowNode -eq $null) { return $result }
  foreach ($cell in $rowNode.SelectNodes('x:c', $ns)) {
    $ref = $cell.GetAttribute('r')
    if (-not $ref) { continue }
    $colLetters = ($ref -replace '\\d','')
    $colIndex = ColLettersToIndex $colLetters
    $text = Get-CellText $cell $sharedStrings $ns
    $result[$colIndex] = $text
  }
  return $result
}
function Get-RowText($rowCells) {
  $parts = @()
  foreach ($k in ($rowCells.Keys | Sort-Object)) {
    $v = $rowCells[$k]
    if ($v) { $parts += $v }
  }
  return ($parts -join '')
}
function Find-HeaderRow($sheetXml,$keywords,$sharedStrings) {
  for ($r=1; $r -le 20; $r++) {
    $rowCells = Get-RowCells $sheetXml $r $sharedStrings
    $rowText = Get-RowText $rowCells
    $ok = $true
    foreach ($k in $keywords) { if ($rowText -notlike "*$k*") { $ok = $false; break } }
    if ($ok) { return $r }
  }
  return -1
}
function Find-Column($sheetXml,$keywords,$sharedStrings) {
  for ($r=1; $r -le 20; $r++) {
    $rowCells = Get-RowCells $sheetXml $r $sharedStrings
    foreach ($k in $rowCells.Keys) {
      $text = $rowCells[$k]
      if ([string]::IsNullOrWhiteSpace($text)) { continue }
      foreach ($kw in $keywords) { if ($text -like "*$kw*") { return @{ Row=$r; Col=$k } } }
    }
  }
  return @{ Row=-1; Col=-1 }
}
function Max-Row($positions) {
  $m = -1
  foreach ($p in $positions) { if ($p.Row -gt $m) { $m = $p.Row } }
  return $m
}
$workbookXml = [xml](Read-ZipEntryText $zip 'xl/workbook.xml')
$relsXml = [xml](Read-ZipEntryText $zip 'xl/_rels/workbook.xml.rels')
$nsW = New-Object System.Xml.XmlNamespaceManager($workbookXml.NameTable)
$nsW.AddNamespace('x','http://schemas.openxmlformats.org/spreadsheetml/2006/main')
$nsR = New-Object System.Xml.XmlNamespaceManager($relsXml.NameTable)
$nsR.AddNamespace('r','http://schemas.openxmlformats.org/package/2006/relationships')
$sheetNodes = $workbookXml.SelectNodes('//x:sheets/x:sheet', $nsW)
foreach ($sheetNode in $sheetNodes) {
  $sheetName = $sheetNode.GetAttribute('name')
  $rid = $sheetNode.GetAttribute('r:id')
  $rel = $relsXml.SelectSingleNode("//r:Relationship[@Id='$rid']", $nsR)
  if ($rel -eq $null) { continue }
  $target = $rel.GetAttribute('Target')
  if (-not $target.StartsWith('worksheets/')) { continue }
  $sheetPath = 'xl/' + $target
  $sheetText = Read-ZipEntryText $zip $sheetPath
  if ([string]::IsNullOrWhiteSpace($sheetText)) { continue }
  $sheetXml = [xml]$sheetText
  $header = Find-HeaderRow $sheetXml @($kwMaterialName,$kwQty) $sharedStrings
  if ($header -gt 0) {
    $rowCells = Get-RowCells $sheetXml $header $sharedStrings
    $unitCol = -1
    foreach ($k in $rowCells.Keys) { if ($rowCells[$k] -like "*$kwUnit*") { $unitCol = $k; break } }
    if ($unitCol -le 0) { continue }
    for ($r = $header + 1; $r -le 200; $r++) {
      $cells = Get-RowCells $sheetXml $r $sharedStrings
      if ($cells.Count -eq 0) { continue }
      $unit = ''
      if ($cells.ContainsKey($unitCol)) { $unit = $cells[$unitCol] }
      if ($unit -and $unit.ToString().Trim().Length -gt 32) {
        Write-Host ("ERROR|sheet={0}|row={1}|unitLen={2}|unit={3}" -f $sheetName,$r,$unit.ToString().Trim().Length,$unit)
      }
    }
    continue
  }
  $namePos = Find-Column $sheetXml @($kwItemName,$kwTestItem) $sharedStrings
  $specPos = Find-Column $sheetXml @($kwFeeDetail,$kwFeature,$kwTestParam,$kwWorkReq) $sharedStrings
  $unitPos = Find-Column $sheetXml @($kwUnit,$kwUnitAlt) $sharedStrings
  $qtyPos = Find-Column $sheetXml @($kwQty1,$kwQty2,$kwQty3,$kwQty4,$kwQty5,$kwQty6) $sharedStrings
  $pricePos = Find-Column $sheetXml @($kwPrice1,$kwPrice2,$kwPrice3,$kwPrice4,$kwPrice5) $sharedStrings
  $amountPos = Find-Column $sheetXml @($kwAmount1,$kwAmount2) $sharedStrings
  if ($pricePos.Col -lt 1) { $pricePos = Find-Column $sheetXml @($kwAmountAlt1,$kwAmountAlt2) $sharedStrings }
  if ($amountPos.Col -lt 1) { $amountPos = Find-Column $sheetXml @($kwAmountAlt1,$kwAmountAlt2) $sharedStrings }
  $remarkPos = Find-Column $sheetXml @($kwRemark) $sharedStrings
  $header = Max-Row @($namePos,$specPos,$unitPos,$qtyPos,$pricePos,$amountPos,$remarkPos)
  $unitCol = $unitPos.Col
  if ($header -lt 0 -or $unitCol -lt 1) { continue }
  for ($r = $header + 1; $r -le 200; $r++) {
    $cells = Get-RowCells $sheetXml $r $sharedStrings
    if ($cells.Count -eq 0) { continue }
    $unit = ''
    if ($cells.ContainsKey($unitCol)) { $unit = $cells[$unitCol] }
    if ($unit -and $unit.ToString().Trim().Length -gt 32) {
      Write-Host ("ERROR|sheet={0}|row={1}|unitLen={2}|unit={3}" -f $sheetName,$r,$unit.ToString().Trim().Length,$unit)
    }
  }
}
$zip.Dispose()
