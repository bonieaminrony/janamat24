import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3,
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Minus,
  Code,
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toBanglaNumber } from '@/lib/bangla-utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "বিস্তারিত সংবাদ এখানে লিখুন..."
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageOpen, setImageOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeOpen, setYoutubeOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline font-bold',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-3xl my-8 shadow-2xl mx-auto block',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-3xl my-8 shadow-2xl mx-auto block overflow-hidden',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html === '<p></p>') {
        onChange('');
      } else {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-slate prose-lg max-w-none min-h-[400px] p-8 lg:p-12 focus:outline-none font-medium text-slate-800 dark:text-slate-200 leading-relaxed selection:bg-indigo-100 dark:selection:bg-indigo-900',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== undefined) {
      const currentContent = editor.getHTML();
      if (value !== currentContent) {
        const isEmptyValue = value === '' || value === '<p></p>';
        const isEmptyContent = currentContent === '' || currentContent === '<p></p>';
        if (!(isEmptyValue && isEmptyContent)) {
          editor.commands.setContent(value, { emitUpdate: false });
        }
      }
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setLinkUrl('');
    setLinkOpen(false);
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl('');
    setImageOpen(false);
  }, [editor, imageUrl]);

  const addYoutubeVideo = useCallback(() => {
    if (!editor || !youtubeUrl) return;
    editor.commands.setYoutubeVideo({ src: youtubeUrl });
    setYoutubeUrl('');
    setYoutubeOpen(false);
  }, [editor, youtubeUrl]);

  if (!editor) {
    return <div className="min-h-[450px] bg-slate-50 dark:bg-slate-900 animate-pulse rounded-[3rem] border border-slate-100 dark:border-slate-800" />;
  }

  const charCount = editor.getText().length;

  return (
    <div className="group bg-white dark:bg-slate-900/50 rounded-[3rem] border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/30 dark:hover:shadow-slate-950/30">
      {/* Premium Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-20 overflow-x-auto overflow-y-hidden custom-scrollbar-hide whitespace-nowrap scroll-smooth px-6">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <Button type="button" variant={editor.isActive('bold') ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl" onClick={() => editor.chain().focus().toggleBold().run()} title="বোল্ড">
              <Bold className="h-4 w-4" />
            </Button>
            <Button type="button" variant={editor.isActive('italic') ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl" onClick={() => editor.chain().focus().toggleItalic().run()} title="ইটালিক">
              <Italic className="h-4 w-4" />
            </Button>
            <Button type="button" variant={editor.isActive('code') ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl" onClick={() => editor.chain().focus().toggleCode().run()} title="কোড">
              <Code className="h-4 w-4" />
            </Button>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <Button type="button" variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="হেডিং ১">
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button type="button" variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="হেডিং ২">
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button type="button" variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="হেডিং ৩">
              <Heading3 className="h-4 w-4" />
            </Button>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <Button type="button" variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl" onClick={() => editor.chain().focus().toggleBulletList().run()} title="বুলেট লিস্ট">
              <List className="h-4 w-4" />
            </Button>
            <Button type="button" variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl" onClick={() => editor.chain().focus().toggleOrderedList().run()} title="নম্বর লিস্ট">
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button type="button" variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl" onClick={() => editor.chain().focus().toggleBlockquote().run()} title="উদ্ধৃতি">
              <Quote className="h-4 w-4" />
            </Button>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <Popover open={linkOpen} onOpenChange={setLinkOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant={editor.isActive('link') ? 'secondary' : 'ghost'} size="icon" className="h-10 w-10 rounded-xl" title="লিংক">
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-6 rounded-[2rem] border-slate-100 shadow-2xl">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">লিংক এড্রেস</p>
                  <div className="flex flex-col gap-3">
                    <Input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900" />
                    <Button type="button" onClick={setLink} className="w-full h-12 rounded-xl bg-slate-900 dark:bg-primary">যোগ করুন</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Popover open={imageOpen} onOpenChange={setImageOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl" title="ছবি">
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-6 rounded-[2rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ছবির URL</p>
                  <div className="flex flex-col gap-3">
                    <Input placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white" />
                    <Button type="button" onClick={addImage} className="w-full h-12 rounded-xl bg-slate-900">ছবি আনুন</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={youtubeOpen} onOpenChange={setYoutubeOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl" title="ইউটিউব">
                  <YoutubeIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-6 rounded-[2rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ইউটিউব লিংক</p>
                  <div className="flex flex-col gap-3">
                    <Input placeholder="https://youtube.com/..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white" />
                    <Button type="button" onClick={addYoutubeVideo} className="w-full h-12 rounded-xl bg-slate-900">ভিডিও যোগ করুন</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
        </div>

        <div className="flex items-center gap-1 ml-auto">
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="আনডু">
              <Undo className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="রিডু">
              <Redo className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* Editor content */}
      <div className="bg-white dark:bg-transparent">
        <EditorContent editor={editor} className="tiptap-editor" />
      </div>
      
      {/* Character count */}
      <div className="px-8 py-4 border-t border-slate-50 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/30 dark:bg-slate-950/30 flex justify-between items-center">
        <span>{toBanglaNumber(charCount)} অক্ষর লিখা হয়েছে</span>
      </div>
    </div>
  );
}
