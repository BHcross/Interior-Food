"use client";

import { useActionState } from "react";
import { createCategory, deleteCategory, type ActionResult } from "@/lib/actions/merchant";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ActionResult = {};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(createCategory, initialState);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <span
            key={category.id}
            className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-sm"
          >
            {category.name}
            <button
              type="button"
              onClick={() => deleteCategory(category.id)}
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remover ${category.name}`}
            >
              ×
            </button>
          </span>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma categoria ainda.</p>
        )}
      </div>

      <form action={formAction} className="flex gap-2">
        <Input name="name" placeholder="Nova categoria (ex: Lanches)" required />
        <Button type="submit" disabled={pending} variant="outline">
          Adicionar
        </Button>
      </form>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
