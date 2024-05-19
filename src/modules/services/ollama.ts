import { TranslateTask, TranslateTaskProcessor } from "../../utils/task";
import { getPref } from "../../utils/prefs";

const ollamaTranslate = async function (
    apiURL: string,
    model: string,
    temperature: number,
    data: Required<TranslateTask>,
) {
    function transformContent(
        langFrom: string,
        langTo: string,
        sourceText: string,
    ) {
        const langMap: { [key: string]: string } = {
            en: "English",
            "zh-CN": "Chinese",
            fr: "French",
            de: "German",
            es: "Spanish",
            it: "Italian",
            ja: "Japanese",
            ko: "Korean",
            ru: "Russian",
            pt: "Portuguese",
            "ar-SA": "Arabic",
            "hi-IN": "Hindi",
        };

        const fromLanguage = langMap[langFrom] || langFrom;
        const toLanguage = langMap[langTo] || langTo;

        return `Translate this into ${toLanguage}.\n\n${fromLanguage}:\n${sourceText}`;
    }

    const requestBody = {
        model: model,
        prompt: transformContent(data.langfrom, data.langto, data.raw),
        stream: false,
        temperature: temperature
    };

    ztoolkit.log("Request URL:", apiURL);
    ztoolkit.log("Request Headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.secret}`,
    });
    ztoolkit.log("Request Body:", JSON.stringify(requestBody, null, 2));

    const xhr = await Zotero.HTTP.request("POST", apiURL, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.secret}`,
        },
        body: JSON.stringify(requestBody),
        responseType: "json",
        timeout: 180000,
    });

    ztoolkit.log("Response Status:", xhr?.status);

    if (xhr?.status !== 200) {
        throw `Request error: ${xhr?.status}`;
    }

    ztoolkit.log("Response Body:", JSON.stringify(xhr.response, null, 2));

    const result = xhr.response.response.trim();
    data.result = result;
    ztoolkit.log("Translation Result:", result);
};

export const ollama = <TranslateTaskProcessor>async function (data) {
    const apiURL = getPref("ollama.endPoint") as string;
    const model = getPref("ollama.model") as string;
    const temperature = parseFloat(getPref("ollama.temperature") as string);

    return await ollamaTranslate(apiURL, model, temperature, data);
};
