// "use client"; // Next.JS

import { AiEditor, AiEditorOptions } from 'aieditor';
import 'aieditor/dist/style.css';

import { HTMLAttributes, forwardRef, useEffect, useRef } from 'react';

type AIEditorProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (val: string) => void;
  options?: Omit<AiEditorOptions, 'element'>;
};

export default forwardRef<HTMLDivElement, AIEditorProps>(function AIEditor(
  {
    placeholder,
    defaultValue,
    value,
    onChange,
    options,
    ...props
  }: AIEditorProps,
  ref,
) {
  const divRef = useRef<HTMLDivElement>(null);
  const aiEditorRef = useRef<AiEditor | null>(null);

  useEffect(() => {
    if (!divRef.current) return;

    if (!aiEditorRef.current) {
      const aiEditor = new AiEditor({
        element: divRef.current,
        placeholder: placeholder,
        content: defaultValue,
        contentFormat: 'html', // 明确指定格式
        theme: 'dark',
        editorProps: {
          attributes: {
            class: 'aie-prosemirror',
          },
        },
        toolbarKeys: [
          'heading',
          'font-size',
          '|',
          'bold',
          'italic',
          'underline',
          '|',
          'highlight',
          'font-color',
          '|',
          'bullet-list',
          'ordered-list',
          'link',
        ],
        onChange: (ed) => {
          if (typeof onChange === 'function') {
            onChange(ed.getHtml());
          }
        },
        ...options,
      });

      aiEditorRef.current = aiEditor;
    }

    return () => {
      if (aiEditorRef.current) {
        aiEditorRef.current.destroy();
        aiEditorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(divRef.current);
      } else {
        ref.current = divRef.current;
      }
    }
  }, [ref]);

  useEffect(() => {
    if (aiEditorRef.current && value !== aiEditorRef.current.getMarkdown()) {
      aiEditorRef.current.setContent(value || '', 'html');
    }
  }, [value]);

  return <div ref={divRef} {...props} />;
});
