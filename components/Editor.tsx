"use client";

import { useEffect, useMemo } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/ariakit";
import { BlockNoteEditor } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/ariakit/style.css";

import { EditorDocument, serializeBlocksToMarkdown } from "../lib/document";

interface EditorProps {
  document: EditorDocument;
  onChange: (doc: EditorDocument) => void;
  onEditorReady?: (editor: BlockNoteEditor<any, any, any>) => void;
}

export default function Editor({ document, onChange, onEditorReady }: EditorProps) {
  const initialContent = useMemo(() => {
    if (document.blocks.length === 0) {
      return undefined;
    }
    return document.blocks;
  }, [document.blocks]);

  const editor = useCreateBlockNote({
    initialContent,
  });

  useEffect(() => {
    if (onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    const currentBlocks = editor.document;
    const incomingBlocks = document.blocks;

    if (incomingBlocks.length === 0) {
      if (currentBlocks.length > 0) {
        editor.replaceBlocks(currentBlocks, incomingBlocks);
      }
      return;
    }

    const isDifferent = JSON.stringify(currentBlocks) !== JSON.stringify(incomingBlocks);

    if (isDifferent) {
      editor.replaceBlocks(editor.document, incomingBlocks);
    }
  }, [document.blocks, editor]);

  return (
    <div className="h-full w-full flex flex-col">
      <BlockNoteView
        editor={editor}
        onChange={() => {
          const blocks = editor.document;
          const markdown = serializeBlocksToMarkdown(blocks, editor);
          onChange({
            blocks,
            markdown,
          });
        }}
        className="flex-1 min-h-0"
      />
    </div>
  );
}
