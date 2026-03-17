import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

export interface ContentBlock {
  id: string;
  content: string;
}

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const addBlock = () => {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      content: '',
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, content: string) => {
    onChange(
      blocks.map((block) =>
        block.id === id ? { ...block, content } : block
      )
    );
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((block) => block.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= blocks.length) return;

    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    onChange(newBlocks);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-charcoal">
            Conteúdo
          </h3>
          <p className="text-sm text-muted-foreground">
            {blocks.length} {blocks.length === 1 ? 'bloco' : 'blocos'}
          </p>
        </div>
        <Button
          onClick={addBlock}
          variant="outline"
          size="sm"
          className="border-vermelho text-vermelho hover:bg-vermelho hover:text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Bloco
        </Button>
      </div>

      {blocks.length === 0 ? (
        <Card className="bg-beige-light/50 border-beige-medium border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Nenhum bloco adicionado ainda.
            </p>
            <Button
              onClick={addBlock}
              variant="outline"
              size="sm"
              className="border-vermelho text-vermelho hover:bg-vermelho hover:text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Primeiro Bloco
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <Card
              key={block.id}
              className="bg-white border-beige-medium overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-beige-light/50 border-b border-beige-medium">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground flex-1">
                  Bloco {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveBlock(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveBlock(index, 'down')}
                    disabled={index === blocks.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeBlock(block.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <Textarea
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, e.target.value)}
                  placeholder="Escreve o conteúdo deste bloco..."
                  className="min-h-[100px] resize-y border-beige-medium"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
