import { TranslateTask, TranslateTaskProcessor } from "../../utils/task";
import { getPref } from "../../utils/prefs";

const ollamaTranslate = async function (
    apiURL: string,
    model: string,
    data: Required<TranslateTask>,
) {
    function transformContent(
        langFrom: string,
        langTo: string,
        sourceText: string,
    ) {
        return (getPref("ollama.prompt") as string)
            .replaceAll("${langFrom}", langFrom)
            .replaceAll("${langTo}", langTo)
            .replaceAll("${sourceText}", sourceText);
    }

    const xhr = await Zotero.HTTP.request("POST", apiURL, {
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: model,
            prompt: transformContent(data.langfrom, data.langto, data.raw),
            stream: false,
        }),
        responseType: "json",
        timeout: 120000,  // 设置超时时间为120秒
    });

    if (xhr?.status !== 200) {
        throw `Request error: ${xhr?.status}`;
    }

    const result = xhr.response.response;
    data.result = result;
};

export const ollama = <TranslateTaskProcessor>async function (data) {
    const apiURL = getPref("ollama.endPoint") as string;
    const model = getPref("ollama.model") as string;

    return await ollamaTranslate(apiURL, model, data);
};
