  XPStyle on
  
  !include "MUI2.nsh"
  !include "x64.nsh"
  !include "LogicLib.nsh"
  !include "DotNetVer.nsh"

  ;Name and file
  !define PRODUCT_NAME "Vocaluxe"
  !define PRODUCT_VERSION "0.3.0"
  !define PRODUCT_STAGE "Beta"
  !define PRODUCT_WEBSITE "www.vocaluxe.org"
  !define UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
  !define ADD_BG_VIDS "0"
  Name "${PRODUCT_NAME} ${PRODUCT_VERSION} ${PRODUCT_STAGE}"
  OutFile "VocaluxeSetup_${PRODUCT_VERSION}${PRODUCT_STAGE}.exe"
  BrandingText "Vocaluxe Team 2013"
  
  InstallDirRegKey HKCU "Software\Vocaluxe" ""

  RequestExecutionLevel admin
  
  Var StartMenuFolder
  Var DirectXSetupError
  Var NetSetupError
  Var VCSetupError
  
  !define MUI_ICON "..\Output\Vocaluxe.ico"
  !define MUI_HEADERIMAGE
  !define MUI_HEADERIMAGE_RIGHT
  !define MUI_HEADERIMAGE_BITMAP "Graphics\Top.bmp"
  !define MUI_HEADERIMAGE_UNBITMAP "Graphics\Top.bmp"
  !define MUI_WELCOMEFINISHPAGE_BITMAP "Graphics\Side.bmp"
  !define MUI_WELCOMEFINISHPAGE_UNBITMAP "Graphics\Side.bmp"
  !define MUI_ABORTWARNING
  
  !define MUI_FINISHPAGE_LINK $(FINISH_TEXT) 
  !define MUI_FINISHPAGE_LINK_LOCATION "${PRODUCT_WEBSITE}" 
  !define MUI_FINISHPAGE_SHOWREADME $INSTDIR\Readme.txt 
  !define MUI_FINISHPAGE_SHOWREADME_TEXT Readme.txt 
  !define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
  
  ;Start Menu Folder Page Configuration
  !define MUI_STARTMENUPAGE_REGISTRY_ROOT "HKCU" 
  !define MUI_STARTMENUPAGE_REGISTRY_KEY "Software\Vocaluxe" 
  !define MUI_STARTMENUPAGE_REGISTRY_VALUENAME "Vocaluxe"
  
  !define MUI_LANGDLL_ALLLANGUAGES


  ;Remember the installer language
  !define MUI_LANGDLL_REGISTRY_ROOT "HKCU" 
  !define MUI_LANGDLL_REGISTRY_KEY "Software\Vocaluxe" 
  !define MUI_LANGDLL_REGISTRY_VALUENAME "Installer Language"

;--------------------------------
;Pages

  !insertmacro MUI_PAGE_WELCOME
  !insertmacro MUI_PAGE_LICENSE "..\Output\LICENSE.txt"
  !insertmacro MUI_PAGE_COMPONENTS
  !insertmacro MUI_PAGE_DIRECTORY
  
  !insertmacro MUI_PAGE_STARTMENU Vocaluxe $StartMenuFolder
  
  !insertmacro MUI_PAGE_INSTFILES
  !insertmacro MUI_PAGE_FINISH
  
  !insertmacro MUI_UNPAGE_CONFIRM
  !insertmacro MUI_UNPAGE_INSTFILES
  !insertmacro MUI_UNPAGE_FINISH

;--------------------------------
;Languages

  !insertmacro MUI_LANGUAGE "English" ;first language is the default language
  !insertmacro MUI_LANGUAGE "French"
  !insertmacro MUI_LANGUAGE "German"
  !insertmacro MUI_LANGUAGE "Spanish"
  !insertmacro MUI_LANGUAGE "Dutch"
  !insertmacro MUI_LANGUAGE "Turkish"

  !include "Languages\Dutch.nsh"
  !include "Languages\English.nsh"
  !include "Languages\French.nsh"
  !include "Languages\German.nsh"
  !include "Languages\Hungarian.nsh"
  !include "Languages\Spanish.nsh"
  !include "Languages\Turkish.nsh"
  
;Installer Sections

Section $(TITLE_MAIN) SecMain

  SectionIn RO
  SetOutPath "$INSTDIR"	
  
  File /r "..\Output\BackgroundMusic"
  File /r "..\Output\Cover"
  File /r "..\Output\Fonts"
  File /r "..\Output\Graphics"
  File /r "..\Output\Languages"
  File /r "..\Output\PartyModes"
  CreateDirectory $OUTDIR\Profiles
  File /oname=$OUTDIR\Profiles\guest1.xml "..\Output\Profiles\guest1.xml"
  File /oname=$OUTDIR\Profiles\guest2.xml "..\Output\Profiles\guest2.xml"
  File /oname=$OUTDIR\Profiles\guest3.xml "..\Output\Profiles\guest3.xml"
  File /r "..\Output\Sounds"
  File /r /x "*.mp4" "..\Output\Themes"
  File /r "..\Output\x64"
  File /r "..\Output\x86"
  File "..\Output\*.dll"
  File "..\Output\*.config"
  File "..\Output\*.exe"
  File "..\Output\*.ico"
  File "..\Output\*.txt"
  File "..\Output\CreditsRessourcesDB.sqlite"
  
  ;Set User-rights to needed files
  AccessControl::GrantOnFile "$INSTDIR" "(S-1-5-32-545)" "FullAccess"
  AccessControl::GrantOnFile "$INSTDIR\*" "(S-1-5-32-545)" "FullAccess"
  
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\DirectX" "Version"
  StrCpy $1 $0 4 3
  ${If} $1 < 9
    SetOutPath "$TEMP"
    File "Requirements\dxwebsetup.exe"
    DetailPrint $(LOG_dx_setup_start)
    ExecWait '"$TEMP\dxwebsetup.exe" /Q' $DirectXSetupError
    DetailPrint $(LOG_dx_setup_finish)
 
    Delete "$TEMP\dxwebsetup.exe"
 
    SetOutPath "$INSTDIR"
  ${EndIf}
    
  
  ${IfNot} ${HasDotNet4.0}
    SetOutPath "$TEMP"
    File "Requirements\dotNetFx40_Full_setup.exe"
    DetailPrint $(LOG_net_setup_start)
    ExecWait '"$TEMP\dotNetFx40_Full_setup.exe" /Q' $NetSetupError
    DetailPrint $(LOG_net_setup_finish)
 
    Delete "$TEMP\dotNetFx40_Full_setup.exe"
 
    SetOutPath "$INSTDIR"
  ${EndIf}
  
  SetOutPath "$TEMP"
  ${If} ${RunningX64}
    File "Requirements\vcredist_x64.exe"
    DetailPrint $(LOG_vc_setup_start)
    ExecWait '"$TEMP\vcredist_x64.exe" /Q /norestart' $VCSetupError
    DetailPrint $(LOG_vc_setup_finish)
 
    Delete "$TEMP\vcredist_x64.exe"
  ${Else}
    File "Requirements\vcredist_x86.exe"
    DetailPrint $(LOG_vc_setup_start)
    ExecWait '"$TEMP\vcredist_x86.exe" /Q /norestart' $VCSetupError
    DetailPrint $(LOG_vc_setup_finish)
 
    Delete "$TEMP\vcredist_x86.exe"  
  ${EndIf}
  SetOutPath "$INSTDIR"
  
  ;Store installation folder
  WriteRegStr HKCU "Software\Vocaluxe" "" $INSTDIR
  
  ;Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Vocaluxe
    
    ;Create shortcuts
    CreateDirectory "$SMPROGRAMS\$StartMenuFolder"
    CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
    ${If} ${RunningX64}
		CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Vocaluxe.lnk" "$INSTDIR\Vocaluxe_x64.exe"
	${Else}
		CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Vocaluxe.lnk" "$INSTDIR\Vocaluxe.exe"
	${EndIf}
  
  !insertmacro MUI_STARTMENU_WRITE_END
  
  	;; Registry for Windows Uninstall
	WriteRegStr HKLM "${UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
	WriteRegStr HKLM "${UNINST_KEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
	WriteRegStr HKLM "${UNINST_KEY}" "InstallLocation" $INSTDIR
	WriteRegStr HKLM "${UNINST_KEY}" "DisplayIcon" "$INSTDIR\Vocaluxe.exe,0"
	WriteRegStr HKLM "${UNINST_KEY}" "Publisher" "Vocaluxe Team"
	WriteRegStr HKLM "${UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
	WriteRegDWORD HKLM "${UNINST_KEY}" "NoModify" 1
	WriteRegDWORD HKLM "${UNINST_KEY}" "NoRepair" 1
	WriteRegStr HKLM "${UNINST_KEY}" "Comment" "${PRODUCT_NAME} ${PRODUCT_VERSION}"
	WriteUninstaller "$INSTDIR\Uninstall.exe" 

SectionEnd

Section $(TITLE_bg_videos) SecVideos

  SetOutPath "$INSTDIR\Themes\Ambient"

  File "..\Output\Themes\Ambient\*.mp4"
  
  SetOutPath "$INSTDIR"

SectionEnd

;--------------------------------
;Installer Functions

Function .onInit

  ;Default installation folder
  ${If} ${RunningX64}
	strCpy $INSTDIR "$PROGRAMFILES64\Vocaluxe"
  ${Else}
	strCpy $INSTDIR "$PROGRAMFILES32\Vocaluxe" 
  ${EndIf}
  	
  !insertmacro MUI_LANGDLL_DISPLAY 

FunctionEnd

;--------------------------------
;Descriptions

  ;Assign descriptions to sections
  !insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
    !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} $(DESC_main)
    !insertmacro MUI_DESCRIPTION_TEXT ${SecVideos} $(DESC_bg_videos)
  !insertmacro MUI_FUNCTION_DESCRIPTION_END

 
;--------------------------------
;Uninstaller Section

Section "Uninstall"

  Delete "$INSTDIR\*"
  RMDir /r "$INSTDIR\BackgroundMusic"
  RMDir /r "$INSTDIR\Cover"
  RMDir /r "$INSTDIR\Fonts"
  RMDir /r "$INSTDIR\Graphics"
  RMDir /r "$INSTDIR\Languages"
  RMDir /r "$INSTDIR\PartyModes"
  RMDir /r "$INSTDIR\Profiles"
  RMDir /r "$INSTDIR\Sounds"
  RMDir /r "$INSTDIR\Songs"
  RMDir /r "$INSTDIR\Themes"
  RMDir "$INSTDIR"

  DeleteRegKey /ifempty HKCU "Software\Vocaluxe"
  
  !insertmacro MUI_STARTMENU_GETFOLDER Vocaluxe $StartMenuFolder
    
  Delete "$SMPROGRAMS\$StartMenuFolder\Uninstall.lnk"
  Delete "$SMPROGRAMS\$StartMenuFolder\Vocaluxe.lnk"
  RMDir "$SMPROGRAMS\$StartMenuFolder"
  
  DeleteRegKey HKLM "${UNINST_KEY}"

SectionEnd

;--------------------------------
;Uninstaller Functions

Function un.onInit

  !insertmacro MUI_UNGETLANGUAGE

FunctionEnd