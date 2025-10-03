"use client";

import { useEffect } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/ariakit";
import { Block } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/ariakit/style.css";

interface EditorProps {
  content: Block[];
  onChange: (blocks: Block[]) => void;
}

export default function Editor({ content, onChange }: EditorProps) {
  const editor = useCreateBlockNote({
    initialContent: content.length > 0 ? content : undefined,
  });

  // Synchronizacja zewnętrznych zmian (z akcji CopilotKit) do edytora
  useEffect(() => {
    if (content.length > 0) {
      const currentBlocks = editor.document;

      // Sprawdź czy treść się różni (uniknięcie pętli)
      const isDifferent = JSON.stringify(currentBlocks) !== JSON.stringify(content);

      if (isDifferent) {
        editor.replaceBlocks(editor.document, content);
      }
    }
  }, [content, editor]);

  return (
    <div className="h-full w-full flex flex-col">
      <BlockNoteView
        editor={editor}
        onChange={() => {
          const blocks = editor.document;
          onChange(blocks);
        }}
        className="flex-1 min-h-0"
      />
    </div>
  );
}
