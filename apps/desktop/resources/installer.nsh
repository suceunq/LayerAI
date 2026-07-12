; Custom LayerAI installer pages - see electron-builder's "Custom NSIS script" docs.
; Gives the Welcome and Finish pages distinct illustrated sidebars (installerSidebar.bmp /
; installerFinishSidebar.bmp) with a short print-related joke baked into each image, instead of
; the plain default Modern UI wizard graphics.

!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Bienvenue dans LayerAI"
  !define MUI_WELCOMEPAGE_TEXT "L'assistant IA qui prepare vos impressions 3D pour Prusa, Bambu Lab et Creality.$\r$\n$\r$\nCliquez sur Suivant pour continuer."
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customFinishPage
  !undef MUI_WELCOMEFINISHPAGE_BITMAP
  !define MUI_WELCOMEFINISHPAGE_BITMAP "${BUILD_RESOURCES_DIR}\installerFinishSidebar.bmp"
  !define MUI_FINISHPAGE_TITLE "LayerAI est installe !"
  !define MUI_FINISHPAGE_TEXT "Importez votre premier modele et laissez l'IA regler les parametres a votre place."

  !ifndef HIDE_RUN_AFTER_FINISH
    Function StartApp
      ${if} ${isUpdated}
        StrCpy $1 "--updated"
      ${else}
        StrCpy $1 ""
      ${endif}
      ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
    FunctionEnd

    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !endif

  !insertmacro MUI_PAGE_FINISH
!macroend
