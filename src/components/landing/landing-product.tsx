import {
  FaEnvelopeOpenText,
  FaKey,
  FaListCheck,
  FaTableColumns,
} from "react-icons/fa6";

const BLOCKS = [
  {
    title: "Projectos em quadro",
    body: "Colunas, tarefas e subtarefas no mesmo sítio. Cada projecto tem o seu kanban, com dono e participantes.",
    icon: FaTableColumns,
  },
  {
    title: "Tarefas avulsas",
    body: "Para contas pessoais: a lista rápida do dia a dia, fora do quadro, com conclusão e recorrência.",
    icon: FaListCheck,
  },
  {
    title: "Convites por e-mail",
    body: "Chame colegas com um link. O convidado vê o projecto na secção certa, sem misturar com os próprios.",
    icon: FaEnvelopeOpenText,
  },
  {
    title: "API e chaves pessoais",
    body: "Integre rotinas com tokens de acesso. Cada conta gere as suas chaves, com tecto conforme o plano.",
    icon: FaKey,
  },
] as const;

/**
 * Blocos de produto da landing (projectos, to-do PF, convites, PAT).
 */
export function LandingProduct() {
  return (
    <section
      id="produto"
      className="scroll-mt-24 border-t border-app-border/60 bg-app-surface/30"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-app-text">
          O que entra no dia a dia
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-app-muted sm:text-base">
          Quatro peças que já usa no painel — agora com convites e tetos de plano.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {BLOCKS.map((block) => (
            <li
              key={block.title}
              className="rounded-2xl border border-app-border/70 bg-app-surface/70 p-5 shadow-sm backdrop-blur-xl"
            >
              <block.icon
                className="h-5 w-5 text-app-accent"
                aria-hidden
              />
              <h3 className="mt-3 text-base font-semibold text-app-text">
                {block.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-app-muted">
                {block.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
