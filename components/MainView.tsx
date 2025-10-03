"use client";

import { useCallback, useRef, useState } from "react";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { BlockNoteEditor } from "@blocknote/core";
import dynamic from "next/dynamic";
import "@copilotkit/react-ui/styles.css";

import {
  EditorDocument,
  buildMarkdownForBlockType,
  createBlockFromMarkdownSnippet,
  ensureBlockIds,
  extractPlainTextFromBlock,
  serializeBlocksToMarkdown,
} from "../lib/document";

const Editor = dynamic(() => import("./Editor"), { ssr: false });

export default function MainView() {
  const [documentState, setDocumentState] = useState<EditorDocument>({
    blocks: [],
    markdown: "",
  });
  const editorRef = useRef<BlockNoteEditor<any, any, any> | null>(null);

  const setEditor = useCallback((editor: BlockNoteEditor<any, any, any>) => {
    editorRef.current = editor;
  }, []);

  const computeMarkdown = useCallback(
    (blocks: EditorDocument["blocks"]) => {
      const editor = editorRef.current;
      if (!editor) {
        return documentState.markdown;
      }
      return serializeBlocksToMarkdown(blocks, editor);
    },
    [documentState.markdown]
  );

  const applyBlocksUpdate = useCallback(
    (updater: (blocks: EditorDocument["blocks"]) => EditorDocument["blocks"]) => {
      setDocumentState((prev) => {
        const editor = editorRef.current;
        if (!editor) {
          return prev;
        }

        const updatedBlocks = ensureBlockIds(updater(prev.blocks));
        const markdown = serializeBlocksToMarkdown(updatedBlocks, editor);

        return {
          blocks: updatedBlocks,
          markdown,
        };
      });
    },
    []
  );

  useCopilotReadable({
    description: "Zawartość dokumentu edytora wraz z reprezentacją markdown",
    value: {
      blocks: documentState.blocks,
      markdown: documentState.markdown,
      metadata: {
        blockCount: documentState.blocks.length,
        blockIds: documentState.blocks.map((block) => block.id),
      },
    },
  });

  useCopilotAction({
    name: "insertBlock",
    description:
      "Wstawia nowy blok tekstu w dokumencie na określonej pozycji. Jeśli pozycja nie jest podana, dodaje na końcu.",
    parameters: [
      {
        name: "text",
        type: "string",
        description: "Treść tekstu do wstawienia",
        required: true,
      },
      {
        name: "type",
        type: "string",
        description: "Typ bloku: 'paragraph', 'heading' (domyślnie 'paragraph')",
        required: false,
      },
      {
        name: "position",
        type: "number",
        description:
          "Pozycja (indeks), na której wstawić blok. Jeśli nie podano, wstawi na końcu.",
        required: false,
      },
    ],
    handler: async ({ text, type = "paragraph", position }) => {
      const editor = editorRef.current;
      if (!editor) {
        throw new Error("Edytor nie jest jeszcze gotowy. Spróbuj ponownie, gdy pojawi się interfejs edytora.");
      }

      applyBlocksUpdate((prevBlocks) => {
        const newBlocks = [...prevBlocks];
        const markdownSnippet = buildMarkdownForBlockType(text, type);
        const newBlock = createBlockFromMarkdownSnippet(markdownSnippet, editor);

        if (position !== undefined && position >= 0 && position <= newBlocks.length) {
          newBlocks.splice(position, 0, newBlock);
        } else {
          newBlocks.push(newBlock);
        }

        return newBlocks;
      });

      return `Wstawiono blok "${text}" na pozycji ${position ?? documentState.blocks.length}`;
    },
  });

  useCopilotAction({
    name: "updateBlock",
    description:
      "Aktualizuje treść lub typ istniejącego bloku na podstawie jego pozycji (indeksu).",
    parameters: [
      {
        name: "position",
        type: "number",
        description: "Pozycja (indeks) bloku do zaktualizowania (0-bazowany)",
        required: true,
      },
      {
        name: "text",
        type: "string",
        description: "Nowa treść bloku",
        required: false,
      },
      {
        name: "type",
        type: "string",
        description: "Nowy typ bloku: 'paragraph', 'heading', itp.",
        required: false,
      },
    ],
    handler: async ({ position, text, type }) => {
      const editor = editorRef.current;
      if (!editor) {
        throw new Error("Edytor nie jest jeszcze gotowy. Spróbuj ponownie, gdy pojawi się interfejs edytora.");
      }

      applyBlocksUpdate((prevBlocks) => {
        if (position < 0 || position >= prevBlocks.length) {
          throw new Error(
            `Nieprawidłowa pozycja: ${position}. Dokument ma ${prevBlocks.length} bloków.`
          );
        }

        const newBlocks = [...prevBlocks];
        const targetBlock = { ...newBlocks[position] };

        if (text !== undefined || type !== undefined) {
          const baseText = text ?? extractPlainTextFromBlock(targetBlock);
          const markdownSnippet = buildMarkdownForBlockType(
            baseText,
            type ?? (targetBlock.type as string)
          );
          const updatedBlock = createBlockFromMarkdownSnippet(markdownSnippet, editor);
          updatedBlock.id = targetBlock.id;
          newBlocks[position] = updatedBlock;
        }

        return newBlocks;
      });

      return `Zaktualizowano blok na pozycji ${position}`;
    },
  });

  useCopilotAction({
    name: "deleteBlock",
    description: "Usuwa blok tekstu z dokumentu na podstawie jego pozycji (indeksu).",
    parameters: [
      {
        name: "position",
        type: "number",
        description: "Pozycja (indeks) bloku do usunięcia (0-bazowany)",
        required: true,
      },
    ],
    handler: async ({ position }) => {
      applyBlocksUpdate((prevBlocks) => {
        if (position < 0 || position >= prevBlocks.length) {
          throw new Error(
            `Nieprawidłowa pozycja: ${position}. Dokument ma ${prevBlocks.length} bloków.`
          );
        }

        const newBlocks = [...prevBlocks];
        newBlocks.splice(position, 1);
        return newBlocks;
      });

      return `Usunięto blok na pozycji ${position}`;
    },
  });

  useCopilotAction({
    name: "replaceAllContent",
    description: "Zastępuje całą zawartość dokumentu nowymi blokami tekstu.",
    parameters: [
      {
        name: "blocks",
        type: "object[]",
        description:
          "Tablica nowych bloków. Każdy blok powinien mieć 'text' i opcjonalnie 'type' (domyślnie 'paragraph')",
        required: true,
      },
    ],
    handler: async ({ blocks }) => {
      const editor = editorRef.current;
      if (!editor) {
        throw new Error("Edytor nie jest jeszcze gotowy. Spróbuj ponownie, gdy pojawi się interfejs edytora.");
      }

      const newBlocks = ensureBlockIds(
        blocks.map((b: any) =>
          createBlockFromMarkdownSnippet(buildMarkdownForBlockType(b.text || "", b.type), editor)
        )
      );

      const markdown = computeMarkdown(newBlocks);

      setDocumentState({
        blocks: newBlocks,
        markdown,
      });

      return `Zastąpiono zawartość dokumentu ${newBlocks.length} nowymi blokami`;
    },
  });

  const handleEditorChange = useCallback((doc: EditorDocument) => {
    setDocumentState({
      blocks: ensureBlockIds(doc.blocks),
      markdown: doc.markdown,
    });
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Editor document={documentState} onChange={handleEditorChange} onEditorReady={setEditor} />
      </div>

      <CopilotSidebar
        instructions={`Jesteś pomocnym asystentem edytora tekstu. Możesz pomóc użytkownikowi w edycji dokumentu poprzez:

1. **Dodawanie treści**: Użyj funkcji insertBlock aby wstawić nowy tekst
2. **Edycję istniejących bloków**: Użyj updateBlock aby zmienić treść lub formatowanie
3. **Usuwanie treści**: Użyj deleteBlock aby usunąć niepotrzebne fragmenty
4. **Przepisanie całości**: Użyj replaceAllContent aby stworzyć dokument od nowa

Zawsze informuj użytkownika o wykonanych zmianach. Pamiętaj, że bloki są numerowane od 0.`}
        labels={{
          title: "Asystent Edytora",
          initial: "Jak mogę pomóc w edycji dokumentu?",
        }}
        defaultOpen={true}
        clickOutsideToClose={false}
      />
    </div>
  );
}
