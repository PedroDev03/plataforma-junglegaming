# Diretrizes de Estado, Roteamento e Comunicação Assíncrona

**Alvo:** Agentes de Inteligência Artificial e Desenvolvedores Frontend.
**Contexto:** Projeto React utilizando TanStack Router, TanStack Query, Axios e MSW.

Este documento dita as regras arquiteturais para o tráfego de dados, gerenciamento de estado (remoto e local), navegação e interações com a rede (mockada via MSW). A conformidade com estas regras garante tipagem ponta a ponta (end-to-end type safety) e resiliência a falhas.

## 1. Roteamento com TanStack Router

* **Type Safety em Primeiro Lugar:** Utilize a tipagem estrita de rotas provida pelo TanStack Router. Navegações (`Link` ou `useNavigate`) e parâmetros devem gerar erros de TypeScript se referenciarem rotas ou argumentos inexistentes.
* **URL como Single Source of Truth (SSOT):** O estado de filtros, ordenação e paginação (ex: na listagem de NFTs) **DEVE** residir na URL (Search Parameters). 
  * Valide e tipe os Search Params usando o recurso de `validateSearch` nas configurações da rota.
  * Nunca duplique o estado da URL em variáveis `useState`.
* **Guardiões de Rota (Auth Guards):** Proteja rotas sensíveis (Carrinho, Checkout, Perfil) utilizando o ciclo de vida do roteador (`beforeLoad`).
  * Se o usuário não estiver autenticado, intercepte a navegação, salve a intenção (URL de destino) e redirecione para a tela de login.
* **Integração com Query:** Utilize o `loader` das rotas para pré-buscar dados (prefetching) injetando a instância do `queryClient`, garantindo que a página já renderize com os dados em cache quando possível.

## 2. Gerenciamento de Estado Remoto (TanStack Query)

O `react-query` é a única ferramenta permitida para gerenciar estado assíncrono (dados da API).

* **Query Keys Factory:** Nunca utilize arrays soltos de strings para chaves. Centralize a criação de Query Keys em objetos Factory para evitar erros de digitação e facilitar a invalidação.
  * *Exemplo:* `queryKeys.nfts.list(filters)`, `queryKeys.nfts.detail(id)`.
* **Separação de Responsabilidades:** Componentes UI não devem invocar o Axios diretamente. Crie Custom Hooks (ex: `useGetNFTs`, `useCreateOrder`) que encapsulam o uso do `useQuery` e `useMutation`.
* **Tratamento de Estados:** Todo hook de query deve expor de forma clara e ser tratado na UI em seus diferentes estados: `isLoading`, `isError`, `isSuccess` e `isFetching` (para background updates).
* **Stale-While-Revalidate:** Mantenha a configuração padrão do TanStack Query, mas ajuste o `staleTime` adequadamente para recursos que não mudam com frequência, evitando requisições desnecessárias.

## 3. Mutações e Atualizações Otimistas

* **Feedback Imediato (Optimistic Updates):** Para ações de baixa latência e alta probabilidade de sucesso (ex: "Favoritar um NFT", "Adicionar item ao carrinho"), aplique Atualizações Otimistas.
  * **Obrigatório:** No hook da mutação, utilize `onMutate` para cancelar queries em andamento, fazer o snapshot do estado atual, e injetar o novo estado falso.
  * **Rollback:** Utilize a propriedade `onError` da mutação para restaurar o snapshot caso a requisição mockada falhe.
  * **Sincronização:** Utilize `onSettled` para invalidar a query e forçar um recarregamento da verdade do servidor (MSW).
* **Idempotência em Transações:** Em mutações críticas (ex: Finalizar Pedido no Checkout), gere uma **Chave de Idempotência** (`uuid` local) e envie no payload. O fluxo deve bloquear cliques duplos (desabilitando o botão baseado no `isPending`) e ser resiliente a timeouts.

## 4. Camada de Rede (Axios) e Contratos

* **Instância Centralizada:** Todo o tráfego HTTP deve passar por uma instância central do Axios (`api.ts`).
* **Interceptors:**
  * **Requisição:** Injete tokens de autenticação (se houver) na simulação de sessão.
  * **Resposta:** Intercepte globalmente erros `401 (Unauthorized)`. Ao capturar um 401, dispare a rotina de logout local, limpe o cache do `queryClient` (`clear()`) e redirecione para o login.
* **Contratos Estritos:** As respostas do Axios devem ser tipadas com Interfaces ou Types do TypeScript. Não utilize `any`. Se a API retornar um DTO diferente do modelo da aplicação, faça o parse/mapeamento na camada de requisição, não no componente visual.

## 5. Mocking e Resiliência (MSW)

* **Sem Fake Data na UI:** Componentes e Hooks não devem conter `setTimeout`, `Math.random` ou dados mockados hardcoded (mocking passivo). Toda a lógica de simulação pertence exclusivamente aos handlers do MSW.
* **Persistência de Estado Simulado:** Os handlers do MSW devem manter o estado da aplicação (ex: itens no carrinho, usuários cadastrados) em memória e, opcionalmente, em `localStorage/sessionStorage` para sobreviver a refreshes durante o desenvolvimento (já que não há backend real).
* **Caos e Resiliência:** Os cenários do MSW devem ser intencionalmente configurados para testar o frontend sob estresse:
  * Injete latência variável (ex: `delay(500)` a `delay(3000)`).
  * Simule falhas de rede (ex: `HttpResponse.error()`) aleatórias (ex: 5% das vezes) para garantir que a UI mostra feedback visual adequado (Toasts de erro, Fallbacks).
  * Simule sessões expiradas retornando erro `401`.