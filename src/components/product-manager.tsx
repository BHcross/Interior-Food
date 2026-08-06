"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  saveProduct,
  deleteProduct,
  toggleProductAvailability,
} from "@/lib/actions/merchant";
import type { Category, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const NO_CATEGORY = "none";

export function ProductManager({
  merchantId,
  categories,
  products,
}: {
  merchantId: string;
  categories: Category[];
  products: Product[];
}) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button onClick={openNew} className="w-fit" />}>
          Novo produto
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          <ProductForm
            merchantId={merchantId}
            categories={categories}
            product={editing}
            onSaved={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((product) => (
            <Card key={product.id} className="shadow-sm">
              <CardContent className="flex items-center gap-4 py-3">
                {product.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {product.price.toFixed(2)}
                  </p>
                </div>
                <Badge variant={product.available ? "default" : "secondary"}>
                  {product.available ? "Disponível" : "Pausado"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleProductAvailability(product.id, !product.available)}
                >
                  {product.available ? "Pausar" : "Ativar"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(product)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteProduct(product.id)}
                >
                  Excluir
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductForm({
  merchantId,
  categories,
  product,
  onSaved,
}: {
  merchantId: string;
  categories: Category[];
  product: Product | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? NO_CATEGORY);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const path = `${merchantId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file);

    if (uploadError) {
      toast.error("Não foi possível enviar a imagem.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const result = await saveProduct({
      id: product?.id,
      name,
      description,
      price: Number(price),
      categoryId: categoryId === NO_CATEGORY ? null : categoryId,
      imageUrl,
    });

    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="p-name">Nome</Label>
        <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="p-desc">Descrição</Label>
        <Textarea
          id="p-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="p-price">Preço (R$)</Label>
        <Input
          id="p-price"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Categoria</Label>
        <Select
          value={categoryId ?? NO_CATEGORY}
          onValueChange={(value) => setCategoryId(value ?? NO_CATEGORY)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sem categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_CATEGORY}>Sem categoria</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="p-image">Foto</Label>
        <Input id="p-image" type="file" accept="image/*" onChange={handleImageChange} />
        {uploading && <p className="text-sm text-muted-foreground">Enviando imagem...</p>}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Prévia"
            width={80}
            height={80}
            className="h-20 w-20 rounded object-cover"
          />
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={saving || uploading}>
        {saving ? "Salvando..." : "Salvar produto"}
      </Button>
    </form>
  );
}
