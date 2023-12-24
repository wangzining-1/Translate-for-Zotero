import { TranslateTask, TranslateTaskProcessor } from "../../utils/task";
import { getPref } from "../../utils/prefs";

const geminiTranslate = async function (
  apiURL: string,

  data: Required<TranslateTask>,
) {
  function transformContent(
    langFrom: string,
    langTo: string,
    sourceText: string,
  ) {
    return (getPref("gemini.prompt") as string)
      .replaceAll("${langFrom}", langFrom)
      .replaceAll("${langTo}", langTo)
      .replaceAll("${sourceText}", sourceText);
  }

  const xhr = await Zotero.HTTP.request("POST", apiURL+`?key=${data.secret}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: transformContent(data.langfrom, data.langto, data.raw)
        }]
      }]
    }),
    responseType: "text",
    requestObserver: (xmlhttp: XMLHttpRequest) => {
      let preLength = 0;
      let result = "";
      xmlhttp.onprogress = (e: any) => {
        // Only concatenate the new strings
        const newResponse = JSON.parse(e.target.response.slice(preLength));
        result = newResponse.candidates[0].content.parts[0].text
        // Clear timeouts caused by stream transfers
        if (e.target.timeout) {
          e.target.timeout = 0;
        }

        // Remove \n\n from the beginning of the data
        data.result = result.replace(/^\n\n/, "");
        preLength = e.target.response.length;

        if (data.type === "text") {
          addon.hooks.onReaderPopupRefresh();
          addon.hooks.onReaderTabPanelRefresh();
        }
      };
    },
  });
  if (xhr?.status !== 200) {
    throw `Request error: ${xhr?.status}`;
  }
  // data.result = xhr.response.choices[0].message.content.substr(2);
};

export const gemini = <TranslateTaskProcessor>async function (data) {
  const apiURL = getPref("gemini.endPoint") as string;

  return await geminiTranslate(apiURL, data);
};
