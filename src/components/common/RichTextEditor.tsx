// "use client"; // Next.JS

import { AiEditor, AiEditorOptions } from 'aieditor';
import 'aieditor/dist/style.css';
import { HTMLAttributes, forwardRef, useEffect, useRef, useState } from 'react';

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
  const [isComposing, setIsComposing] = useState(false); // 👈 新增状态

  useEffect(() => {
    if (!divRef.current) return;

    if (!aiEditorRef.current) {
      const aiEditor = new AiEditor({
        element: divRef.current,
        placeholder,
        content: defaultValue ?? '',
        contentFormat: 'html',
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
          // ✅ 关键：IME 输入中不触发 onChange
          if (!isComposing && typeof onChange === 'function') {
            onChange(ed.getHtml());
          }
        },
        ...options,
      });

      aiEditorRef.current = aiEditor;

      // 👇 监听 IME 事件（必须绑定到编辑器内部的 contentEditable 元素）
      const editableElement = divRef.current.querySelector(
        '[contenteditable="true"]',
      );
      if (editableElement) {
        editableElement.addEventListener('compositionstart', () => {
          setIsComposing(true);
        });
        editableElement.addEventListener('compositionend', () => {
          setIsComposing(false);
          // IME 结束后，立即触发一次 onChange
          if (typeof onChange === 'function' && aiEditorRef.current) {
            onChange(aiEditorRef.current.getHtml());
          }
        });
      }
    }

    return () => {
      if (aiEditorRef.current) {
        aiEditorRef.current.destroy();
        aiEditorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 处理 ref 转发
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(divRef.current);
      } else {
        ref.current = divRef.current;
      }
    }
  }, [ref]);

  // 同步外部 value（但跳过 IME 期间）
  useEffect(() => {
    if (aiEditorRef.current && !isComposing) {
      const currentHtml = aiEditorRef.current.getHtml();
      if (value !== currentHtml) {
        aiEditorRef.current.setContent(value || '', 'html');
      }
    }
  }, [value, isComposing]); // 👈 依赖 isComposing

  return <div ref={divRef} {...props} />;
});
