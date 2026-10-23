# Diretrizes de Interface e Design System (UI/UX)
**Alvo:** Agentes de Inteligência Artificial e Desenvolvedores Frontend.
**Contexto:** Projeto React utilizando TypeScript, Tailwind CSS e shadcn/ui.

Este documento estabelece as regras estritas e os padrões de qualidade que DEVEM ser seguidos durante a criação, refatoração ou manutenção de componentes visuais neste projeto. A violação destas regras compromete a integridade da arquitetura.

## 1. Filosofia Arquitetural
- **Reutilização e Composição:** Priorize a criação de componentes pequenos, focados e reutilizáveis (Design Atômico). Nunca duplique lógica visual.
- **Fidelidade Visual:** A interface gerada deve corresponder estritamente ao layout definido no Figma. Espaçamentos, tipografia e paleta de cores devem utilizar os tokens do Tailwind configurados no `tailwind.config.js`.
- **Single Source of Truth:** O `shadcn/ui` é a nossa biblioteca base. Não crie componentes do zero (como Modais, Dropdowns ou Selects) se o `shadcn/ui` já fornecer uma primitiva baseada no Radix UI.

## 2. Regras de Utilização do shadcn/ui
- **Instalação via CLI:** Todos os componentes base devem ser instalados através da CLI do shadcn (`npx shadcn@latest add [componente]`).
- **Isolamento:** Os componentes do shadcn residem na pasta `src/components/ui/`. **Não altere** a estrutura interna desses componentes a menos que seja estritamente necessário para alinhar com o Design System global.
- **Variantes:** Utilize o `cva` (Class Variance Authority) embutido no shadcn para criar variações de botões, badges e cards, mantendo o código limpo.

## 3. Diretrizes Estritas de Tailwind CSS
- **Mobile-First:** Toda estilização deve adotar a abordagem mobile-first. Aplique estilos base para telas pequenas e utilize os prefixos `sm:`, `md:`, `lg:`, `xl:` para breakpoints maiores.
- **Proibição de Valores Arbitrários:** Evite ao máximo o uso de valores arbitrários (ex: `w-[327px]`, `bg-[#ff0000]`). Utilize os tokens do tema (`w-full`, `max-w-sm`, `bg-primary`, `text-muted-foreground`). Caso um valor específico se repita, ele deve ser adicionado ao `tailwind.config.js`.
- **Merge de Classes:** Sempre utilize o utilitário `cn` (clsx + tailwind-merge) fornecido pelo setup do shadcn para permitir a sobrescrita segura de classes via props.

## 4. Acessibilidade (A11y) - MANDATÓRIO
A interface deve ser acessível a todos os usuários, atendendo aos padrões WCAG 2.1 AA.
- **Semântica HTML:** Utilize as tags corretas (`<button>` para ações, `<a>` para navegação, `<article>`, `<nav>`, `<aside>`).
- **Navegação por Teclado:** Todo elemento interativo deve ser acessível via `Tab`. Os estados de foco devem ser visíveis (utilize `focus-visible:ring` do Tailwind).
- **ARIA e Leitores de Tela:** 
  - Utilize `aria-label` ou `aria-labelledby` em elementos visuais sem texto descritivo (ex: botões de ícone).
  - Garanta que formulários tenham `aria-invalid` e mensagens de erro conectadas via `aria-describedby`.
- **Focus Management:** Modais (Dialogs) e Drawers devem reter o foco (Focus Trap) enquanto estiverem abertos e retornar o foco ao elemento acionador ao serem fechados (o Radix UI do shadcn cuida disso por padrão, não o desative).
- **Preferência de Movimento:** Respeite a preferência do usuário com `motion-reduce`. Evite animações bruscas para usuários com sensibilidade.

## 5. Responsividade e Layout
- O layout deve ser fluido e testado nas resoluções mínimas de **390px (Mobile)**, **768px (Tablet)** e **1440px (Desktop)**.
- Previna quebras de layout devido a textos longos utilizando `truncate`, `break-words` ou limitando a largura.
- Não permita overflow horizontal (`overflow-x-hidden` no `body` ou contêineres principais).

## 6. Estado, Carregamento e Feedback
- **Skeletons:** Utilize o componente `<Skeleton />` do shadcn para indicar carregamento de dados. Mantenha as proporções reais do conteúdo para evitar Cumulative Layout Shift (CLS).
- **Feedback Transparente:** Toda ação assíncrona (mutations) deve apresentar um estado de carregamento claro (ex: spinner no botão, desabilitando a ação para evitar cliques duplos).
- **Toasts/Alertas:** Falhas em APIs ou sucessos em operações cruciais devem disparar notificações utilizando o componente `Toast` ou `Sonner` do shadcn.

---

## 7. Comandos de Setup e Importação de Skills (Base UI)
Para inicializar o arsenal de componentes de UI essenciais e prepará-los na pasta correta (`src/components/ui`), execute os seguintes comandos no terminal raiz do projeto.

**1. Inicialização do shadcn (se ainda não estiver configurado):**
```bash
npx shadcn@latest init
```

**2. Download das "Skills" Essenciais (Componentes vitais para formulários, navegação e feedback):**
```bash
# Componentes de Layout e Ação
npx shadcn@latest add button card separator skeleton badge

# Componentes de Formulário (Fundamentais para acessibilidade)
npx shadcn@latest add form input label select textarea checkbox radio-group switch

# Componentes de Feedback e Interação
npx shadcn@latest add dialog toast sonner dropdown-menu tooltip alert alert-dialog

# Componentes de Navegação
npx shadcn@latest add sheet tabs navigation-menu avatar
```

**Nota para o Agente:** Ao necessitar de um novo componente, verifique a [documentação do shadcn/ui](https://ui.shadcn.com/) primeiro e adicione via CLI antes de tentar construí-lo do zero.