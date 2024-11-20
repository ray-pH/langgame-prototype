export type FuriganaData = {
    kanji: string;
    furigana: string;
}

export async function loadJapaneseFurigana(): Promise<Map<string, FuriganaData[]>> {
    try {
        const filepath = `./assets/furigana_ja.json`;
        const response = await fetch(filepath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const furiganaJson = await response.json();
        const furiganaMap = new Map<string, FuriganaData[]>();
        for (const wordData of furiganaJson) {
            const word = wordData[0] as string;
            const furiganaData: FuriganaData[] = wordData[1].map((arr: any) => ({
                kanji: arr[0] as string,
                furigana: arr[1] as string
            }));
            furiganaMap.set(word, furiganaData)
        }
        return furiganaMap;
    } catch (e) {
        console.error(e);
        return new Map();
    }
}

export function furiganaDataToHTML(furiganaData: FuriganaData[]): HTMLDivElement {
    const div = document.createElement('div');
    for (const data of furiganaData) {
        const ruby = document.createElement('ruby');
        ruby.appendChild(document.createTextNode(data.kanji));
        if (data.furigana.length > 0) {
            const rt = document.createElement('rt');
            rt.appendChild(document.createTextNode(data.furigana));
            ruby.appendChild(rt);
        }
        div.appendChild(ruby);
    }
    return div;
}