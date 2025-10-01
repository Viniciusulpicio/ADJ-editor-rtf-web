
# Editor RTF Web

O Editor RTF Web é uma aplicação que permite criar e editar documentos RTF (Rich Text Format) diretamente pelo navegador. O sistema converte HTML para RTF e vice-versa.

## Sobre o Projeto

- Formatação de texto (negrito, itálico, sublinhado, etc)  
- Títulos (H1-H6)  
- Listas ordenadas e não ordenadas  
- Imagens (convertidas para base64)  
- Tabelas  
- Citações e código  
- Caracteres especiais e acentuação

### Frontend

- Interface moderna e intuitiva  
- Editor WYSIWYG (TinyMCE)  
- Visualização de documentos existentes  
- Edição inline de documentos RTF  
- Upload de imagens com conversão automática  

### Backend

- API RESTful completa  
- Conversão HTML ↔ RTF  
- Armazenamento de documentos  
- Processamento de imagens  
- Listagem de documentos com metadados  

## Tecnologias Utilizadas

### Frontend

- React 18  
- TypeScript  
- TinyMCE (editor)  
- Axios (requisições HTTP)  

### Backend

- Node.js  
- Express  
- TypeScript  
- image-size (processamento de imagens)  
- html-entities (decode HTML)  


1. **Configurar API Key do TinyMCE**  
Edite o arquivo `.env`
```dotenv
  VITE_TINYMCE_API_KEY="SUA_CHAVE_API_AQUI"
```

## Estrutura

```
ADJ-editor-rtf-web/
├── server/                      # Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── constants.ts     # Configurações globais
│   │   ├── services/
│   │   │   ├── rtfConverter.ts  # HTML → RTF
│   │   │   ├── rtfParser.ts     # RTF → HTML
│   │   │   └── imageProcessor.ts # Processamento de imagens
│   │   ├── utils/
│   │   │   ├── textUtils.ts     # Utilidades de texto
│   │   │   └── htmlProcessor.ts # Processamento HTML
│   │   ├── routes/
│   │   │   ├── documentRoutes.ts # Rotas de documentos
│   │   │   └── uploadRoutes.ts   # Rotas de upload
│   │   ├── middleware/
│   │   │   └── uploadConfig.ts   # Config Multer
│   │   └── server.ts             # Servidor principal
│   ├── output/                   # Documentos RTF gerados
│   └── package.json
└── src/                         # Frontend
    ├── pages/
    │   ├── HomePage.tsx         # Tela inicial
    │   ├── WritePage.tsx        # Criar documento
    │   └── ReadPage.tsx         # Ler/Editar documento
    ├── App.tsx                  # App principal
    └── index.tsx
```

### Fluxo de Uso

- **Tela Inicial**: Escolha entre "Criar Documento" ou "Editar Documento"

- **Criar Documento**:  
  1. Digite o conteúdo no editor  
  2. Formate o texto usando a barra de ferramentas  
  3. Insira imagens (são convertidas automaticamente para base64)  
  4. Clique em "Salvar Documento"  
  5. O arquivo RTF será gerado em `server/output/`

- **Ler/Editar Documento**:  
  1. Selecione um documento da lista  
  2. O conteúdo será carregado no editor  
  3. Edite conforme necessário  
  4. Clique em "Salvar Alterações"  
  5. O arquivo RTF original será atualizado

## Integração em Seu Projeto

### Opção 1: Usar como Serviço Standalone
```typescript
import axios from 'axios';

// Criar documento
const response = await axios.post('http://localhost:3001/api/documents', {
  htmlContent: '<h1>Meu Documento</h1><p>Conteúdo...</p>'
});

// Ler documento
const doc = await axios.get('http://localhost:3001/api/documents/document_123.rtf');
console.log(doc.data.htmlContent);

// Atualizar documento
await axios.put('http://localhost:3001/api/documents/document_123.rtf', {
  htmlContent: '<h1>Atualizado</h1>'
});
```

### Opção 2: Integrar o Backend na sua API
```typescript
import { convertHtmlToRtf } from './services/rtfConverter';
import { readRtfFile, updateRtfFile } from './services/rtfParser';

const rtfContent = convertHtmlToRtf(htmlString);
const htmlContent = readRtfFile('./documento.rtf');
```

### Opção 3: Integrar o Frontend como Componente
```typescript
import WritePage from './pages/WritePage';

function MinhaAplicacao() {
  return (
    <div>
      <WritePage onBack={() => {}} />
    </div>
  );
}
```

## API Endpoints

- **POST /api/documents**: Cria um novo documento RTF
- **GET /api/documents**: Lista todos os documentos
- **GET /api/documents/:filename**: Lê um documento específico
- **PUT /api/documents/:filename**: Atualiza um documento existente
- **POST /api/upload-image**: Faz upload de uma imagem