import { loadJapaneseFurigana, FuriganaData, furiganaDataToHTML } from "./lang_utils.js";

const DEBUG = false
const FURIGANA_LOCAL_STORAGE_KEY = 'furiganaEnabled';
export enum LANGUAGE {
    EN = "en",
    JA = "ja",
}
const CLOUDINARY_EN_URL = 'https://res.cloudinary.com/dnkit8npf/image/upload/v1732122102'
const CLOUDINARY_JA_URL = 'https://res.cloudinary.com/dnkit8npf/image/upload/v1732122190'

function getRandomItems<T>(arr: T[], n: number): T[] {
    // Copy the array to avoid modifying the original
    const shuffled = arr.slice();
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Return the first n items
    return shuffled.slice(0, n);
}


export class Game {
    
    offscreenCanvas: HTMLCanvasElement;
    offscreenCtx: CanvasRenderingContext2D;
    maskImage: HTMLImageElement = new Image();
    canvas: HTMLCanvasElement;
    optionContainerDiv: HTMLDivElement;
    wordToDOMElementMap: Map<string, HTMLElement> = new Map();
    wordList: string[] = [];
    activeWord: string = '';
    wordToMaskMap: Map<string, HTMLImageElement> = new Map();
    
    langWordlist: string[] = [];
    furiganaMap: Map<string, FuriganaData[]> = new Map();
    isFuriganaEnabled: boolean = false;
    
    constructor(canvas: HTMLCanvasElement, optionContainerDiv: HTMLDivElement, public lang: LANGUAGE) {
        this.canvas = canvas;
        this.optionContainerDiv = optionContainerDiv;
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = canvas.width;
        this.offscreenCanvas.height = canvas.height;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!;
    }
    
    async init() {
        this.initEventListeners();
        await this.loadWordlist(this.lang);
        if (this.lang == LANGUAGE.JA) {
            this.furiganaMap = await loadJapaneseFurigana();
            this.isFuriganaEnabled = Boolean(localStorage.getItem(FURIGANA_LOCAL_STORAGE_KEY));
        }
        this.initOptions();
        this.rerender();
    }
    
    async loadWordlist(lang: LANGUAGE) {
        try {
            const filepath = `./assets/wordlist_${lang}.json`;
            const response = await fetch(filepath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.langWordlist = await response.json();
        } catch (error) {
            console.error("Error fetching the JSON file:", error);
        }
    }
    
    initEventListeners() {
        this.canvas.onclick = (e) => {
            e.preventDefault()
            const rect = this.canvas.getBoundingClientRect(); // CSS size
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            const isCorrect = this.isMouseClickActivePart(x, y);
            console.log('Clicked at:', x, y, 'isCorrect:', isCorrect);
            if (isCorrect) {
                this.showPopup(this.activeWord, e, true);
                this.removeOption(this.activeWord)
                this.changeActive('');
            } else {
                this.showPopup('X', e, false);
            }
        };
    }
    
    resetOptions() {
        this.wordList = [];
    }
    addOption(word: string) {
        this.wordList.push(word);
        this.addOptionDOM(word);
    }
    removeOption(word: string) {
        this.wordList.splice(this.wordList.indexOf(word), 1);
        this.removeOptionDOM(word);
    }
    initOptions() {
        this.wordList = getRandomItems(this.langWordlist, 10);
        this.preloadMask(this.wordList);
    }
    
    changeActive(word: string) {
        this.activeWord = word;
        this.changeActiveMask(word);
        this.setActiveOptionDOM(word);
    }
    
    preloadMask(wordList: string[]) {
        wordList.forEach(word => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.wordToMaskMap.set(word, img);
                console.log('Loaded mask:', word);
            }
            img.onerror = () => {
                console.error('Failed to load image:', word);
            };
            img.src = this.getImageURL(word);
        });
    }
    
    getImageURL(word: string) {
        if (DEBUG)  return `./masks/${this.lang}/${word}.png`;
        switch (this.lang) {
            case LANGUAGE.EN: return `${CLOUDINARY_EN_URL}/${word}.png`;
            case LANGUAGE.JA: return `${CLOUDINARY_JA_URL}/${word}.png`;
            default: return `./masks/${this.lang}/${word}.png`;
        }
    }
    
    changeActiveMask(word: string) {
        if (word == '') return;
        if (!this.wordToMaskMap.has(word)) {
            alert(`Error loading data for ${word}`)
            return;
        }
        const mask = this.wordToMaskMap.get(word)!;
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
        this.offscreenCtx.drawImage(mask, 0, 0);
    }
    
    isMouseClickActivePart(x: number, y: number) {
        const imgData = this.offscreenCtx.getImageData(x, y, 1, 1).data;
        return imgData[0] === 255;
    }
    
    rerender() {
        this.renderOptionsDOM();
        this.renderSettingsDOM();
    }
    renderOptionsDOM() {
        this.optionContainerDiv.innerHTML = '';
        for (const word of this.wordList) {
            this.addOptionDOM(word)
        }
    }
    setActiveOptionDOM(word: string) {
        for (const child of this.optionContainerDiv.children) {
            child.classList.remove('active');
        }
        const activeElement = this.wordToDOMElementMap.get(word);
        if (activeElement) {
            activeElement.classList.add('active');
        }
    }
    removeOptionDOM(word: string) {
        const element = this.wordToDOMElementMap.get(word);
        if (element) {
            element.classList.add('removing');
            element.onanimationend = () => {
                element.remove();
            };
        }
        this.wordToDOMElementMap.delete(word);
    }
    addOptionDOM(word: string) {
        const optionDiv = document.createElement('div');
        optionDiv.classList.add('option');
        
        if (this.lang == LANGUAGE.JA && this.isFuriganaEnabled) {
            const furiganaData = this.furiganaMap.get(word);
            if (furiganaData) {
                const optionInnerDiv = furiganaDataToHTML(furiganaData)
                optionDiv.appendChild(optionInnerDiv);
            } else {
                optionDiv.innerText = word;
            }
        } else {
            optionDiv.innerText = word;
        }
        
        this.optionContainerDiv.appendChild(optionDiv);
        this.wordToDOMElementMap.set(word, optionDiv);
        
        optionDiv.onclick = () => {
            this.changeActive(word);
        };
    }
    renderSettingsDOM() {
        const settingsDiv = document.getElementById('settings-container');
        if (!settingsDiv) return;
        settingsDiv.innerHTML = '';
        if (this.lang == LANGUAGE.JA) {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = this.isFuriganaEnabled;
            label.append(checkbox, '振り仮名 (Enable Furigana)');
            settingsDiv.appendChild(label);
            
            checkbox.onchange = () => {
                this.isFuriganaEnabled = checkbox.checked;
                localStorage.setItem(FURIGANA_LOCAL_STORAGE_KEY, String(this.isFuriganaEnabled));
                this.rerender();
            };
        }
    }
    showPopup(word: string, event: MouseEvent, isCorrect: boolean) {
        const optionDiv = this.wordToDOMElementMap.get(word);
        const innerHTML = optionDiv ? optionDiv.innerHTML : word;
        const popupDiv = document.createElement('div');
        document.body.appendChild(popupDiv);
        popupDiv.classList.add('popup');
        if (!isCorrect) popupDiv.classList.add('false');
        popupDiv.style.left = `${event.pageX}px`; 
        popupDiv.style.top = `${event.pageY}px`;
        popupDiv.innerHTML = innerHTML;
        requestAnimationFrame(() => {
            popupDiv.classList.add('show');
        });
        setTimeout(() => {
            popupDiv.classList.remove('show');
            // popupDiv.remove();
        }, 2000)
    }
}