"use client";

import { useState } from "react";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { Block } from "@blocknote/core";
import dynamic from "next/dynamic";
import "@copilotkit/react-ui/styles.css";

const Editor = dynamic(() => import("./Editor"), { ssr: false });

export default function MainView() {
  // Stan dokumentu
  const [content, setContent] = useState<Block[]>([]);

  // Udostępnianie treści dokumentu asystentowi
  useCopilotReadable({
    description: "Zawartość dokumentu edytora - wszystkie bloki tekstu",
    value: content,
  });

  // Akcja: Wstawianie nowego bloku tekstu
  useCopilotAction({
    name: "insertBlock",
    description: "Wstawia nowy blok tekstu w dokumencie na określonej pozycji. Jeśli pozycja nie jest podana, dodaje na końcu.",
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
        description: "Pozycja (indeks), na której wstawić blok. Jeśli nie podano, wstawi na końcu.",
        required: false,
      },
    ],
    handler: async ({ text, type = "paragraph", position }) => {
      const newBlock: Block = {
        id: crypto.randomUUID(),
        type: type as any,
        content: text,
        children: [],
      };

      setContent((prevContent) => {
        const newContent = [...prevContent];
        if (position !== undefined && position >= 0 && position <= newContent.length) {
          newContent.splice(position, 0, newBlock);
        } else {
          newContent.push(newBlock);
        }
        return newContent;
      });

      return `Wstawiono blok "${text}" na pozycji ${position ?? content.length}`;
    },
  });

  // Akcja: Edycja istniejącego bloku
  useCopilotAction({
    name: "updateBlock",
    description: "Aktualizuje treść lub typ istniejącego bloku na podstawie jego pozycji (indeksu).",
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
      setContent((prevContent) => {
        if (position < 0 || position >= prevContent.length) {
          throw new Error(`Nieprawidłowa pozycja: ${position}. Dokument ma ${prevContent.length} bloków.`);
        }

        const newContent = [...prevContent];
        const block = { ...newContent[position] };

        if (text !== undefined) {
          block.content = text;
        }
        if (type !== undefined) {
          block.type = type as any;
        }

        newContent[position] = block;
        return newContent;
      });

      return `Zaktualizowano blok na pozycji ${position}`;
    },
  });

  // Akcja: Usuwanie bloku
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
      setContent((prevContent) => {
        if (position < 0 || position >= prevContent.length) {
          throw new Error(`Nieprawidłowa pozycja: ${position}. Dokument ma ${prevContent.length} bloków.`);
        }

        const newContent = [...prevContent];
        newContent.splice(position, 1);
        return newContent;
      });

      return `Usunięto blok na pozycji ${position}`;
    },
  });

  // Akcja: Zastąpienie całej zawartości dokumentu
  useCopilotAction({
    name: "replaceAllContent",
    description: "Zastępuje całą zawartość dokumentu nowymi blokami tekstu.",
    parameters: [
      {
        name: "blocks",
        type: "object[]",
        description: "Tablica nowych bloków. Każdy blok powinien mieć 'text' i opcjonalnie 'type' (domyślnie 'paragraph')",
        required: true,
      },
    ],
    handler: async ({ blocks }) => {
      const newBlocks: Block[] = blocks.map((b: any) => ({
        id: crypto.randomUUID(),
        type: (b.type || "paragraph") as any,
        content: b.text || "",
        children: [],
      }));

      setContent(newBlocks);
      return `Zastąpiono zawartość dokumentu ${newBlocks.length} nowymi blokami`;
    },
  });

  const handleEditorChange = (blocks: Block[]) => {
    setContent(blocks);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Edytor na pełny ekran */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Editor content={content} onChange={handleEditorChange} />
      </div>

      {/* Asystent CopilotKit w sidebarze */}
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
