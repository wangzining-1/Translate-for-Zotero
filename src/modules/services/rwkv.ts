import { TranslateTask, TranslateTaskProcessor } from "../../utils/task";
import { getPref } from "../../utils/prefs";

const rwkvTranslate = async function (
    apiURL: string,
    model: string,
    temperature: number,
    data: Required<TranslateTask>,
) {
    function transformContent(
        langFrom: string,
        langTo: string,
        prefix: string,
        sourceText: string,
    ) {
        const langMap: { [key: string]: string } = {
            en: "English",
            "zh-CN": "Simplified Chinese",
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

        return (getPref(`${prefix}.prompt`) as string)
            .replaceAll("${langFrom}", fromLanguage)
            .replaceAll("${langTo}", toLanguage)
            .replaceAll("${sourceText}", sourceText);
    }

    const requestBody = {
        model: model,
        rate: 0.1,
        tau: 0.1,
        top_p: 0.3,
        max_tokens: 500,
        stop: ["\n\n"],
        presencePenalty: 0,
        frequencyPenalty: 1,
        prompt: transformContent(data.langfrom, data.langto, 'rwkv', data.raw),
        stream: false
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

    const result = xhr.response.choices[0].text.trim().split('\n\n')[0];
    data.result = result;
    ztoolkit.log("Translation Result:", result);
};

export const rwkv = <TranslateTaskProcessor>async function (data) {
    const apiURL = getPref("rwkv.endPoint") as string;
    const model = getPref("rwkv.model") as string;
    const temperature = parseFloat(getPref("rwkv.temperature") as string);

    return await rwkvTranslate(apiURL, model, temperature, data);
};
