"use client";

import { useState } from "react";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const FAQS = {
  cliente: [
    {
      q: "Como faço um pedido?",
      a: "Escolha uma loja na página inicial, monte o carrinho e finalize informando o endereço de entrega e a forma de pagamento.",
    },
    {
      q: "Quais formas de pagamento existem?",
      a: "Dinheiro ou Pix, combinado direto com o entregador ou a loja no momento da entrega. Ainda não há pagamento pelo site.",
    },
    {
      q: "Como acompanho meu pedido?",
      a: "Na página do pedido (em \"Meus pedidos\") o status atualiza sozinho, e quando o entregador sai pra entrega você consegue ver a localização dele no mapa em tempo real.",
    },
    {
      q: "O que é o código de confirmação de entrega?",
      a: "É um código de 4 dígitos que aparece assim que você faz o pedido. Guarde ele: quando o entregador chegar, informe o código pra confirmar que recebeu de verdade. Isso existe pra evitar que marquem um pedido como entregue sem você ter recebido.",
    },
    {
      q: "Posso falar com a loja ou o entregador?",
      a: "Sim, dentro da página do pedido tem um chat direto com a loja e, depois que um entregador aceitar, com ele também.",
    },
  ],
  lojista: [
    {
      q: "Como cadastro minha loja?",
      a: "Crie uma conta escolhendo \"Lojista\" no cadastro. Depois, em \"Minha loja\", preencha nome, cidade, endereço, taxa de entrega e a localização no mapa.",
    },
    {
      q: "Como escolho quem faz as entregas?",
      a: "Em \"Minha loja\" você escolhe entre \"entregadores do app\" (seus pedidos ficam disponíveis pra qualquer entregador cadastrado aceitar) ou \"entregador próprio\" (você mesmo controla quando o pedido saiu e foi entregue).",
    },
    {
      q: "Como cadastro o cardápio?",
      a: "Em \"Cardápio\", crie categorias e depois os produtos, com nome, descrição, preço e foto.",
    },
    {
      q: "Como recebo e gerencio pedidos?",
      a: "Em \"Pedidos\", cada pedido novo aparece com os itens e o endereço. Você vai avançando o status (confirmado, em preparo, saiu para entrega). A confirmação final de entrega é feita pelo entregador (com código) ou pelo cliente — a loja não marca como entregue diretamente, isso evita golpes.",
    },
  ],
  entregador: [
    {
      q: "Como me cadastro como entregador?",
      a: "Crie uma conta escolhendo \"Entregador\" no cadastro.",
    },
    {
      q: "Como funcionam as entregas disponíveis?",
      a: "Em \"Entregas\", a seção \"Entregas disponíveis\" mostra pedidos prontos de lojas que usam entregadores do app. Aceite a que quiser — ela vira sua e some da lista dos outros.",
    },
    {
      q: "Como confirmo que entreguei o pedido?",
      a: "Peça ao cliente o código de 4 dígitos que aparece na tela de pedido dele e digite em \"Minhas entregas\". Sem o código certo, o pedido não é marcado como entregue — isso te protege e protege o cliente.",
    },
    {
      q: "Preciso compartilhar minha localização?",
      a: "Sim, enquanto tiver uma entrega em rota, seu app compartilha sua localização pra loja e o cliente acompanharem no mapa.",
    },
  ],
};

const TAB_LABEL = {
  cliente: "Cliente",
  lojista: "Lojista",
  entregador: "Entregador",
} as const;

export default function AjudaPage() {
  const [tab, setTab] = useState<keyof typeof FAQS>("cliente");

  return (
    <div>
      <div className="border-b border-border/70 bg-gradient-to-b from-accent/50 via-accent/15 to-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:py-20">
          <h1 className="mb-2 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Central de ajuda
          </h1>
          <p className="max-w-md text-base text-muted-foreground sm:text-lg">
            Respostas rápidas pra dúvidas comuns de clientes, lojas e entregadores.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:py-16">
        <Tabs value={tab} onValueChange={(v) => setTab(v as keyof typeof FAQS)} className="mb-8">
          <TabsList>
            <TabsTrigger value="cliente">{TAB_LABEL.cliente}</TabsTrigger>
            <TabsTrigger value="lojista">{TAB_LABEL.lojista}</TabsTrigger>
            <TabsTrigger value="entregador">{TAB_LABEL.entregador}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-6">
          {FAQS[tab].map((item) => (
            <div key={item.q} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
              <h2 className="mb-1.5 font-medium">{item.q}</h2>
              <p className="text-sm text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed py-10 text-center">
          <LifeBuoy className="size-7 text-muted-foreground" />
          <p className="text-muted-foreground">Não achou o que precisava?</p>
          <Button render={<Link href="/suporte" />} nativeButton={false}>
            Falar com o suporte
          </Button>
        </div>
      </div>
    </div>
  );
}
