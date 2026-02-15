// src/components/tasks/NotesEditor.jsx
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Bold, Italic, Code, List, Minus, Heading1, Heading2, Eye, Pencil } from "lucide-react";
import DOMPurify from 'dompurify';
import { cn } from "@/lib/utils";

export default function NotesEditor({ value, onChange, placeholder = "Ajoutez des notes détaillées..." }) {
  const [content, setContent] = useState(value || '');
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setContent(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
  };

  const insertMarkdown = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = before + selectedText + after;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }

    // Repositionner le curseur
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const insertBulletPoint = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newContent = content.substring(0, start) + '\n• ' + content.substring(start);
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 3, start + 3);
    }, 0);
  };

  const renderPreview = (text) => {
    if (!text) return '';

    // Conversions Markdown simples
    let html = text
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-foreground mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-foreground mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-foreground mt-4 mb-2">$1</h1>')

      // Bold et Italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-muted-foreground">$1</em>')

      // Liens
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-400 hover:text-blue-300 underline">$1</a>')

      // Code inline
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm text-blue-400">$1</code>')

      // Lignes
      .replace(/---/g, '<hr class="border-border my-4" />')

      // Listes à puces
      .replace(/^• (.*)$/gm, '<li class="ml-4">• $1</li>')

      // Paragraphes (lignes vides)
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br />');

    // Ajouter les paragraphes
    if (html && !html.startsWith('<')) {
      html = '<p class="mb-3">' + html + '</p>';
    }

    // Nettoyer les balises vides
    html = html.replace(/<p class="mb-3"><\/p>/g, '');
    html = html.replace(/<p class="mb-3"><br \/><\/p>/g, '<p class="mb-3"></p>');

    return html;
  };

  const getWordCount = () => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  };

  const getCharCount = () => {
    return content.length;
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('**', '**')}
            title="Gras"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('*', '*')}
            title="Italique"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('`', '`')}
            title="Code"
          >
            <Code className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertBulletPoint}
            title="Liste à puces"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('---')}
            title="Ligne"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('# ', '')}
            title="Titre"
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('## ', '')}
            title="Sous-titre"
          >
            <Heading2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {getWordCount()} mots • {getCharCount()} caractères
          </span>
          <Button
            type="button"
            variant={isPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? (
              <>
                <Pencil className="w-4 h-4 mr-1" />
                Éditer
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Aperçu
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4 min-h-[200px]">
        {isPreview ? (
          <div
            className="prose prose-invert max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderPreview(content)) }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full h-full min-h-[200px] bg-transparent placeholder:text-muted-foreground resize-none focus:outline-none"
            style={{ fontFamily: 'inherit' }}
          />
        )}
      </div>

      {/* Aide markdown */}
      {!isPreview && (
        <div className="px-4 py-2 bg-muted/30 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Raccourcis :</strong> **gras** • *italique* • `code` • [lien](url) • • liste • # titre • --- ligne
          </p>
        </div>
      )}
    </div>
  );
}