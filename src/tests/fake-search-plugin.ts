import { SearchPlugin } from "../main/search-plugin";
import { PluginType } from "../main/plugin-type";
import { SearchResultItem } from "../common/search-result-item";
import { UserConfigOptions } from "../common/config/user-config-options";
import { TranslationSet } from "../common/translation/translation-set";
import { PreviewResult } from "../common/preview-result";

export class FakeSearchPlugin implements SearchPlugin {
    public pluginType: PluginType;
    private readonly items: SearchResultItem[];
    private readonly enabled: boolean;
    private indexRefreshCount: number;

    constructor(pluginType: PluginType, items: SearchResultItem[], enabled: boolean) {
        this.pluginType = pluginType;
        this.items = items;
        this.enabled = enabled;
        this.indexRefreshCount = 0;
    }

    public getAll(): Promise<SearchResultItem[]> {
        return new Promise((resolve) => {
            resolve(this.items);
        });
    }

    public refreshIndex(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.indexRefreshCount++;
            resolve();
        });
    }

    public clearCache(): Promise<void> {
        return new Promise((resolve, reject) => {
            reject("Method not implemented.");
        });
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public isPreviewSupported(): boolean {
        return false;
    }
    
    public preview(searchResultItem: SearchResultItem): Promise<PreviewResult | null> {
        return Promise.resolve(null);
    }

    public execute(searchResultItem: SearchResultItem, privileged: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            reject("Method not implemented.");
        });
    }

    public updateConfig(updatedConfig: UserConfigOptions, translationSet: TranslationSet): Promise<void> {
        return new Promise((resolve, reject) => {
            reject("Method not implemented.");
        });
    }

    public getIndexRefreshCount() {
        return this.indexRefreshCount;
    }
}
