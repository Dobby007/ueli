export enum IpcChannels {
    search = "search",
    searchResponse = "search-response",
    execute = "execute",
    preview = "preview",
    activatePreviewMode = "activatePreviewMode",
    autoComplete = "autocomplete",
    autoCompleteResponse = "autocomplete-response",
    openSearchResultLocation = "open-search-result-location",
    executionFinished = "execution-finished",
    mainWindowHasBeenHidden = "main-window-has-been-hidden",
    mainWindowHasBeenShown = "main-window-has-been-shown",
    mainWindowHideRequested = "main-window-hide-requested",
    userInputUpdated = "user-input-updated",
    refreshIndexesStarted = "refresh-indexes-started",
    refreshIndexesCompleted = "refresh-indexes-completed",
    reloadApp = "reload-app",
    openSettingsWindow = "open-settings-window",
    configUpdated = "config-updated",
    appearanceOptionsUpdated = "user-styles-updated",
    generalOptionsUpdated = "general-options-updated",
    languageUpdated = "language-updated",
    colorThemeOptionsUpdated = "color-theme-updated",
    ueliCommandExecuted = "ueli-command-executed",
    folderPathRequested = "folder-path-requested",
    folderPathResult = "folder-path-result",
    folderAndFilePathsRequested = "folder-and-file-paths-requested",
    folderAndFilePathsResult = "folder-and-file-paths-result",
    filePathRequested = "file-path-requested",
    filePathResult = "file-path-result",
    favoritesRequested = "favorites-requested",
    favoritesReponse = "favorites-response",
    clearExecutionLogConfirmed = "clear-execution-log-confirmed",
    openDebugLogRequested = "open-debug-log-requested",
    openTempFolderRequested = "open-temp-folder-requested",
    notification = "notification",
    selectInputHistoryItem = "select-input-history-item",
    checkForUpdate = " check-for-update",
    checkForUpdateResponse = "check-for-update-response",
    downloadUpdate = "download-update",
}
