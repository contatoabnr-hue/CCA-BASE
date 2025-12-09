# Pontos de Melhoria para o Projeto "Crônicas de Atlas"

Este documento descreve as principais melhorias arquitetônicas identificadas no projeto para aumentar sua escalabilidade, performance e manutenibilidade.

## 1. Refatorar Gerenciamento de Estado

**Problema:** Todo o estado da aplicação está centralizado no componente `App.tsx`, o que causa "prop-drilling" (passar propriedades por múltiplos níveis de componentes). Isso torna o código difícil de manter e escalar.

**Sugestão:**
- Adotar uma biblioteca de gerenciamento de estado global.
  - **Zustand:** É uma solução leve, moderna e com uma API simples, ideal para este projeto.
  - **Redux Toolkit:** Uma opção mais robusta e com mais ferramentas, caso a complexidade do estado cresça significativamente.
  - **React Context API com `useReducer`:** Uma solução nativa do React que pode ser suficiente se o estado não for excessivamente complexo.

**Plano de Ação:**
1. Escolher e instalar uma biblioteca de gerenciamento de estado (ex: `npm install zustand`).
2. Criar "stores" (ou "slices") para cada domínio de estado: `storyStore`, `newsStore`, `cityStore`, `authStore`.
3. Migrar a lógica de `useState` e os handlers (ex: `handleSaveNews`) de `App.tsx` para seus respectivos stores.
4. Substituir o "prop-drilling" pelo consumo direto do estado dos stores nos componentes que precisam dele.

---

## 2. Otimizar Manuseio de Imagens

**Problema:** As imagens (capas e blocos de conteúdo) são convertidas para Base64 e salvas diretamente nos documentos do Firestore (`EditorView.tsx`). Isso é ineficiente, caro e limitado pelo tamanho máximo de 1 MiB por documento.

**Sugestão:**
- Utilizar o **Firebase Storage** para armazenar os arquivos de imagem.

**Plano de Ação:**
1. Configurar o Firebase Storage no projeto.
2. Em `EditorView.tsx`, modificar a função `handleImageUpload`:
   - Em vez de converter para Base64, fazer o upload do arquivo de imagem para uma pasta no Firebase Storage (ex: `stories/{storyId}/cover.jpg`).
   - Após o upload, obter a URL pública da imagem.
3. Salvar apenas a **URL da imagem** no documento do Firestore, em vez da string Base64.
4. Atualizar os componentes que exibem as imagens para usar a URL do Firebase Storage.

---

## 3. Desacoplar o Componente `App.tsx` (Refatoração de Responsabilidades)

**Problema:** O componente `App.tsx` atualmente acumula diversas responsabilidades, agindo como um monólito que lida com roteamento, gerenciamento de estado local, busca de dados e renderização do layout principal. Essa sobrecarga dificulta a compreensão, manutenção, teste e escalabilidade do aplicativo.

**Sugestão:**
- Distribuir as responsabilidades de `App.tsx` entre componentes, hooks e serviços especializados, seguindo o princípio da responsabilidade única. Isso resultará em um código mais modular, legível e testável.

**Plano de Ação:**
1.  **Configurar um Sistema de Roteamento Declarativo:**
    *   Adicionar `react-router-dom` ao projeto (`npm install react-router-dom`).
    *   Reestruturar `App.tsx` para que sua principal responsabilidade seja configurar o roteador (`<BrowserRouter>`, `<Routes>`) e definir as rotas para as diferentes `Views` (e.g., `LoginView`, `DashboardView`, `EditorView`, `ReaderView`).
    *   Substituir a lógica de `useState` para controle de "páginas" e o `switch` condicional pela renderização de componentes de rota, permitindo URLs amigáveis (ex: `/story/ler/:storyId`).

2.  **Centralizar Gerenciamento de Estado Global:**
    *   Aproveitar a implementação do `Zustand` (ou a solução de gerenciamento de estado escolhida no item 1) para gerenciar o estado global da aplicação.
    *   Remover todo o `useState` e `useEffect` relacionados a dados e estado global de `App.tsx`, movendo-os para os respectivos *stores* (e.g., `authStore`, `storyStore`, `uiStore`). `App.tsx` deve apenas consumir o estado necessário para renderização de componentes de alto nível, se aplicável.

3.  **Isolar Lógica de Busca e Manipulação de Dados:**
    *   Criar hooks customizados (e.g., `useStories`, `useNews`, `useAuth`) para encapsular a lógica de interação com o Firestore (e.g., `onSnapshot`, `addDoc`, `updateDoc`).
    *   Esses hooks devem ser utilizados pelas `Views` e componentes que precisam dos dados, mantendo `App.tsx` livre dessa preocupação.

4.  **Estruturar o Layout da Aplicação:**
    *   Extrair elementos de layout persistentes, como a barra de navegação (`nav`) e a estrutura de contêiner principal, para um componente `Layout.tsx` (ou similar).
    *   O `App.tsx` ou o roteador se encarregará de renderizar este `Layout` uma única vez, e as rotas aninhadas (ou componentes filhos do `Layout`) preencherão o conteúdo dinâmico da aplicação.

**Benefícios Esperados:**
*   **Modularidade:** Componentes menores e com responsabilidades bem definidas.
*   **Manutenibilidade:** Código mais fácil de entender, depurar e modificar.
*   **Escalabilidade:** Novas funcionalidades e rotas podem ser adicionadas com menos impacto em componentes existentes.
*   **Testabilidade:** Componentes e hooks podem ser testados de forma isolada.
