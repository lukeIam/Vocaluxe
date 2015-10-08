if($Env:APPVEYOR_REPO_TAG -eq "false" -or $Env:APPVEYOR_REPO_TAG -eq "False") {
	$targetTag = $Env:APPVEYOR_REPO_TAG_NAME
	Write-Host "Tag=$targetTag"
}
else{
	if($Env:APPVEYOR_REPO_TAG_NAME -eq "appveyorTest"){		
		$targetTag = "Nightly"		
	}
	else{
		Write-Host "No tag or special branch found"
		Return
	}
	git config --global user.email "build@vocaluxe.de";
	git config --global user.name "Vocaluxe_Automatic_Build";
	git tag "$targetTag" -f;
	git push -q -f "https://$($Env:GitHubKey):x-oauth-basic@github.com/lukeIam/Vocaluxe.git" "$targetTag";
	
	Write-Host "Branch $Env:APPVEYOR_REPO_TAG_NAME -> Tag=$targetTag"
}

$getRelaseInfoParams = @{
	Uri = "https://api.github.com/repos/lukeIam/Vocaluxe/releases/tags/$targetTag";
	Method = 'GET';   
}
try{
	$result = Invoke-RestMethod @getRelaseInfoParams 
}
catch [System.Net.WebException] 
{
	# No Release found for this tag
    $statusCode = [int]$_.Exception.Response.StatusCode
    $html = $_.Exception.Response.StatusDescription
	Write-Host "No Release found for this tag ($html)"
	Return
}

$assetId = ($result.assets | where {$_.name -EQ "Vocaluxe_$Env:APPVEYOR_REPO_BRANCH_Windows_$Env:PLATFORM.zip" }  | Select-Object -first 1 ).id

if(!$assetId){
	# No matching asset found in this release
	Write-Host "No matching asset found in this release"
	Return
}

$deleteAssetParams = @{
	Uri = "https://api.github.com/repos/lukeIam/Vocaluxe/releases/assets/$assetId";
	Method = 'DELETE';
	Headers = @{
		Authorization = 'Basic ' + [Convert]::ToBase64String(
		[Text.Encoding]::ASCII.GetBytes($Env:GitHubKey + ":x-oauth-basic"));
	}
}
try{
	$result = Invoke-RestMethod @deleteAssetParams 
	Write-Host "Successfully deleted asset"
}
catch [System.Net.WebException] 
{
	# Could not delete asset
    $statusCode = [int]$_.Exception.Response.StatusCode
    $html = $_.Exception.Response.StatusDescription
	Write-Host "Could not delete asset ($html)"
	Return
}
 