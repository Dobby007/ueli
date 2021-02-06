import axios from "axios";

export function getWebsearchPreview(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        axios.get(url)
            .then((response) => resolve(response.data))
            .catch((error) => reject(error));
    });
}