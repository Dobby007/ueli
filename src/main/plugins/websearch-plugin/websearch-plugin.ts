import { SearchResultItem } from "../../../common/search-result-item";
import { PluginType } from "../../plugin-type";
import { UserConfigOptions } from "../../../common/config/user-config-options";
import { WebSearchOptions } from "../../../common/config/websearch-options";
import { ExecutionPlugin } from "../../execution-plugin";
import { SearchResponseSchema, WebSearchEngine } from "./web-search-engine";
import { TranslationSet } from "../../../common/translation/translation-set";
import { defaultWebSearchIcon } from "../../../common/icon/default-icons";
import { isValidIcon } from "../../../common/icon/icon-helpers";
import { value } from "jsonpath";
import { PreviewResult } from "../../../common/preview-result";
import { IconType } from "../../../common/icon/icon-type";
import { Icon } from "../../../common/icon/icon";

export class WebSearchPlugin implements ExecutionPlugin {
    public readonly pluginType = PluginType.WebSearchPlugin;
    private config: WebSearchOptions;
    private translationSet: TranslationSet;
    private readonly urlExecutor: (url: string) => Promise<void>;
    private readonly suggestionResolver: (url: string) => Promise<any>;

    constructor(
        userConfig: WebSearchOptions,
        translationSet: TranslationSet,
        urlExecutor: (url: string) => Promise<void>,
        suggestionResolver: (url: string) => Promise<any>,
        private readonly previewResolver: (url: string) => Promise<any>,
    ) {
        this.config = userConfig;
        this.translationSet = translationSet;
        this.urlExecutor = urlExecutor;
        this.suggestionResolver = suggestionResolver;
    }

    public getSearchResults(userInput: string, fallback?: boolean): Promise<SearchResultItem[]> {
        return new Promise((resolve, reject) => {
            const webSearchEngines = this.config.webSearchEngines
                .filter((webSearchEngine) => {
                    return fallback
                        ? webSearchEngine.isFallback
                        : userInput.startsWith(webSearchEngine.prefix);
                })
                .sort((a, b) => {
                    if (a.priority > b.priority) {
                        return 1;
                    }
                    if (a.priority < b.priority) {
                        return -1;
                    }
                    return 0;
                });

            const suggestionWebSearchEngines = webSearchEngines.filter((webSearchEngine) => {
                return webSearchEngine.suggestionUrl !== undefined;
            });

            this.getSuggestions(suggestionWebSearchEngines, userInput)
                .then((suggestions) => {
                    for (const webSearchEngine of webSearchEngines) {
                        suggestions.unshift({
                            description: this.buildDescription(webSearchEngine, userInput),
                            executionArgument: this.buildExecutionArgument(webSearchEngine, userInput),
                            hideMainWindowAfterExecution: true,
                            icon: isValidIcon(webSearchEngine.icon) ? webSearchEngine.icon : defaultWebSearchIcon,
                            name: webSearchEngine.name,
                            originPluginType: this.pluginType,
                            searchable: [],
                            additionalProperties: {
                                websearchEngine: webSearchEngine
                            }
                        });
                    }

                    resolve(suggestions);
                })
                .catch((error) => reject(error));
        });
    }

    public isValidUserInput(userInput: string, fallback?: boolean): boolean {
        return userInput !== undefined
            && userInput.length > 0
            && this.userInputMatches(userInput, fallback);
    }

    public isPreviewSupported(): boolean {
        return true;
    }
    
    public preview(searchResultItem: SearchResultItem): Promise<PreviewResult | null> {
        return new Promise((resolve, reject) => {
            if (!searchResultItem.additionalProperties?.websearchEngine)
                return reject("No engine was passed in the event");

            const websearchEngine: WebSearchEngine = searchResultItem.additionalProperties?.websearchEngine;

            if (!websearchEngine.searchApiUrl)
                return reject("No Search API URL is set for the passed search engine");
                
            if (!websearchEngine.searchResponseSchema || !websearchEngine.searchResponseSchema?.itemsPath)
                return reject("JSON path to items array is not set for the passed search engine");

            if (searchResultItem.name) {
                const searchApiUrl = this.replaceQueryInUrl(searchResultItem.name, websearchEngine.searchApiUrl as string);
                
                this.previewResolver(searchApiUrl)
                    .then((response) => {
                        let items: any[] = value(response, websearchEngine.searchResponseSchema?.itemsPath as string);
                        const websearchEngineIcon = isValidIcon(websearchEngine.icon) ? websearchEngine.icon : defaultWebSearchIcon;

                        const searchResultItems = items.map(item => {
                            const schema = websearchEngine.searchResponseSchema as SearchResponseSchema;
                            return {
                                description: this.getValueBasedOnJsonPath(item, schema.description),
                                executionArgument: "",
                                hideMainWindowAfterExecution: true,
                                icon: this.getSearchResultItemIcon(item, schema, websearchEngineIcon),
                                name: this.getValueBasedOnJsonPath(item, schema.title),
                                originPluginType: this.pluginType,
                                searchable: []
                            } as SearchResultItem;
                        });

                        resolve({
                            newSearchResultItems: searchResultItems,
                            displayedText: this.buildDescription(websearchEngine, searchResultItem.name),
                            displayedIcon: websearchEngine.icon
                        } as PreviewResult);
                    })
                    .catch((error) => reject(error));
            } else {
                resolve(null);
            }

        });
    }

    public execute(searchResultItem: SearchResultItem): Promise<void> {
        return this.urlExecutor(searchResultItem.executionArgument);
    }

    public isEnabled() {
        return this.config.isEnabled;
    }

    public updateConfig(updatedConfig: UserConfigOptions, translationSet: TranslationSet): Promise<void> {
        return new Promise((resolve) => {
            this.config = updatedConfig.websearchOptions;
            this.translationSet = translationSet;
            resolve();
        });
    }

    private getSearchResultItemIcon(item: SearchResultItem, schema: SearchResponseSchema, defaultIcon: Icon) {
        const iconUrl: string = this.getValueBasedOnJsonPath(item, schema.icon);
        return iconUrl ? { type: IconType.URL, parameter: this.getValueBasedOnJsonPath(item, schema.icon) } : defaultIcon;
    }

    private getSearchTerm(webSearchEngine: WebSearchEngine, userInput: string, encode: boolean = true): string {
        let searchTerm = userInput.replace(new RegExp('^' + webSearchEngine.prefix + "\\s*"), "");

        if (webSearchEngine.encodeSearchTerm) {
            searchTerm = encodeURIComponent(searchTerm);
        }

        return searchTerm;
    }

    private buildDescription(webSearchEngine: WebSearchEngine, userInput: string): string {
        return this.translationSet.websearchDescription
            .replace("{{websearch_engine}}", webSearchEngine.name)
            .replace("{{search_term}}", this.getSearchTerm(webSearchEngine, userInput, false));
    }

    private buildExecutionArgument(webSearchEngine: WebSearchEngine, userInput: string): string {
        return this.replaceQueryInUrl(this.getSearchTerm(webSearchEngine, userInput), webSearchEngine.url);
    }

    private userInputMatches(userInput: string, fallback?: boolean): boolean {
        return this.config.webSearchEngines.some((websearchEngine) => {
            return fallback
                ? websearchEngine.isFallback
                : userInput.startsWith(websearchEngine.prefix);
        });
    }

    private getSuggestions(webSearchEngines: WebSearchEngine[], userInput: string): Promise<SearchResultItem[]> {
        return new Promise((resolve, reject) => {
            const promises = webSearchEngines.map((webSearchEngine) => this.getSuggestionsByWebSearchEngine(webSearchEngine, userInput));

            Promise.all(promises)
                .then((lists) => {
                    const result: SearchResultItem[] = [];

                    lists.forEach((list) => {
                        list.forEach((item) => result.push(item));
                    });

                    resolve(result);
                })
                .catch((error) => reject(error));
        });
    }

    private getSuggestionsByWebSearchEngine(websearchEngine: WebSearchEngine, userInput: string): Promise<SearchResultItem[]> {
        const searchTerm = this.getSearchTerm(websearchEngine, userInput);

        return new Promise((resolve, reject) => {
            if (websearchEngine.suggestionUrl && searchTerm) {
                const suggestionUrl = this.replaceQueryInUrl(searchTerm, websearchEngine.suggestionUrl);
                
                this.suggestionResolver(suggestionUrl)
                    .then((response) => {
                        let suggestions: string[];
                        if (websearchEngine.searchResponseSchema?.itemsPath)
                            suggestions = value(response, websearchEngine.searchResponseSchema?.itemsPath);
                        else
                            suggestions = response[1];

                        const searchResultItems = suggestions.map((suggestion): SearchResultItem => {
                            return {
                                description: this.buildDescription(websearchEngine, suggestion),
                                executionArgument: this.buildExecutionArgument(websearchEngine, suggestion),
                                hideMainWindowAfterExecution: true,
                                icon: isValidIcon(websearchEngine.icon) ? websearchEngine.icon : defaultWebSearchIcon,
                                name: suggestion,
                                originPluginType: this.pluginType,
                                searchable: [],
                                additionalProperties: {
                                    websearchEngine: websearchEngine
                                }
                            };
                        });

                        resolve(searchResultItems);
                    })
                    .catch((error) => reject(error));
            } else {
                resolve([]);
            }

        });
    }

    private getValueBasedOnJsonPath(obj: any, jsonPath?: string): string {
        return jsonPath ? value(obj, jsonPath) : "";
    }

    private replaceQueryInUrl(query: string, url: string): string {
        return url.replace(/{{query}}/g, query);
    }
}
