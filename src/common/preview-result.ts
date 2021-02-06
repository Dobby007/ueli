import { Icon } from "./icon/icon";
import { SearchResultItem } from "./search-result-item";

export interface PreviewResult {
    newSearchResultItems?: SearchResultItem[];
    displayedText: string;
    displayedIcon?: Icon;
}