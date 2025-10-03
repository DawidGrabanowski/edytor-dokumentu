import { Block, BlockNoteEditor, blocksToMarkdown, markdownToBlocks } from "@blocknote/core";

export type EditorBlock = Block<any, any, any>;

export interface EditorDocument {
  blocks: EditorBlock[];
  markdown: string;
}

const getDocumentRef = () => {
  if (typeof document === "undefined") {
    return undefined;
  }
  return document;
};

export const ensureBlockIds = (blocks: EditorBlock[]): EditorBlock[] => {
  return blocks.map((block) => ({
    ...block,
    id: block.id ?? crypto.randomUUID(),
    children: block.children ? ensureBlockIds(block.children as EditorBlock[]) : [],
  }));
};

export const serializeBlocksToMarkdown = (
  blocks: EditorBlock[],
  editor: BlockNoteEditor<any, any, any>
): string => {
  return blocksToMarkdown(blocks, editor.schema, editor, {
    document: getDocumentRef(),
  });
};

export const parseMarkdownToBlocks = (
  markdown: string,
  editor: BlockNoteEditor<any, any, any>
): EditorBlock[] => {
  if (!markdown.trim()) {
    return [];
  }

  const parsed = markdownToBlocks(markdown, editor.schema) as EditorBlock[];
  return ensureBlockIds(parsed);
};

export const extractPlainTextFromBlock = (block: EditorBlock): string => {
  const collectText = (currentBlock: EditorBlock): string => {
    const inlineContent = Array.isArray(currentBlock.content)
      ? (currentBlock.content as any[])
      : [];

    const inlineText = inlineContent
      .map((inline) => {
        if (!inline) {
          return "";
        }

        if (inline.type === "text" || typeof inline.text === "string") {
          return inline.text || "";
        }

        if (Array.isArray(inline.children)) {
          return inline.children.map((child: any) => child.text || "").join("");
        }

        return "";
      })
      .join("");

    const childrenText = Array.isArray(currentBlock.children)
      ? (currentBlock.children as EditorBlock[]).map(collectText).join("\n")
      : "";

    return [inlineText, childrenText].filter(Boolean).join("\n").trim();
  };

  return collectText(block);
};

export const createBlockFromMarkdownSnippet = (
  markdown: string,
  editor: BlockNoteEditor<any, any, any>
): EditorBlock => {
  const [firstBlock] = parseMarkdownToBlocks(markdown, editor);

  if (firstBlock) {
    return firstBlock;
  }

  return {
    id: crypto.randomUUID(),
    type: "paragraph",
    props: {},
    content: [
      {
        type: "text",
        text: markdown,
      } as any,
    ],
    children: [],
  } as EditorBlock;
};

export const buildMarkdownForBlockType = (text: string, type?: string) => {
  switch (type) {
    case "heading":
    case "heading1":
    case "heading_1":
      return `# ${text}`;
    case "heading2":
    case "heading_2":
      return `## ${text}`;
    case "heading3":
    case "heading_3":
      return `### ${text}`;
    case "quote":
      return `> ${text}`;
    case "code":
    case "codeblock":
    case "code_block":
      return "```\n" + text + "\n```";
    case "numbered_list":
    case "numberedList":
    case "ordered_list":
      return `1. ${text}`;
    case "bullet_list":
    case "bulletList":
    case "unordered_list":
      return `- ${text}`;
    default:
      return text;
  }
};
