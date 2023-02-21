import findTag from "../utils/findTag";

export default async function observerCallback(mutationsList: any[]) {
  for (const mutation of mutationsList) {
    if (
      mutation.type === "childList" &&
      mutation.removedNodes.length > 0 &&
      mutation.removedNodes[0].className === "editor-inner block-editor"
    ) {
      const uuid = mutation.target
        .closest('div[id^="ls-block"]')
        ?.getAttribute("blockid");

      const blk = await logseq.Editor.getBlock(uuid);
      const tag = findTag(blk!.content);

      if (
        tag !== -1 &&
        tag !== blk!.content &&
        logseq.settings!.savedTags[tag] &&
        Object.keys(blk!.properties!).length === 0
      ) {
        if (logseq.settings!.addTypeProperty)
          await logseq.Editor.upsertBlockProperty(uuid, "type", tag);

        if (
          logseq.settings!.autoParse &&
          blk!.content.includes("{") &&
          blk!.content.includes("}")
        ) {
          const regExp = /\{(.*?)\}/;
          const autoParseVars = regExp.exec(blk!.content.trim())![1].split(",");
          for (let i = 0; i < autoParseVars.length; i++) {
            await logseq.Editor.upsertBlockProperty(
              uuid,
              logseq.settings!.savedTags[tag][i],
              autoParseVars[i]
            );
          }
        } else {
          logseq.settings!.savedTags[tag].map(async (t: string) => {
            await logseq.Editor.upsertBlockProperty(uuid, t, "...");
          });
        }
      }
    }
  }
}
