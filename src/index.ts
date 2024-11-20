import { Game, LANGUAGE } from "./game.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const optionContainerDiv = document.getElementById("option-container") as HTMLDivElement;
const ctx = canvas.getContext("2d")!;
const languageSelectContainer = document.getElementById("language-select-container") as HTMLDivElement;

function main() {
    populateLanguageSelect();
    let lang = new URL(window.location.href).searchParams.get("lang") ?? "";
    if (!Object.values(LANGUAGE).includes(lang as LANGUAGE)) {
        lang = LANGUAGE.EN;
    }
    
    const game = new Game(canvas, optionContainerDiv, lang as LANGUAGE);
    const img = new Image();
    img.src = "./assets/image.svg";
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        game.init();
    }
}

const languageCaption = {
    [LANGUAGE.EN]: "English",
    [LANGUAGE.JA]: "日本語",
}
function populateLanguageSelect() {
    if (languageSelectContainer == null) return;
    languageSelectContainer.innerHTML = "";
    for (const language of Object.values(LANGUAGE)) {
        const caption = languageCaption[language];
        const button = document.createElement("button");
        button.classList.add("header-button");
        button.textContent = caption;
        // on click, go to the same page with the language as a query parameter
        button.onclick = () => {
            const url = new URL(window.location.href);
            console.log(url);
            url.searchParams.set("lang", language);
            window.location.href = url.toString();
        }
        languageSelectContainer.appendChild(button);
    }
}

main();