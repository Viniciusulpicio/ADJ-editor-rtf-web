import { useState, useRef, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMCEEditor } from "tinymce";
import axios from "axios";

interface ReadPageProps {
  onBack: () => void;
  selectedDocument: string | null;
  onSelectDocument: (filename: string) => void;
}

interface Document {
  filename: string;
  filePath: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  bookName: string;
  pageNumber: number;
}

interface BookGroup {
  bookName: string;
  documents: Document[];
}

export default function ReadPage({
  onBack,
  selectedDocument,
  onSelectDocument,
}: ReadPageProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDocument, setCurrentDocument] = useState<string | null>(
    selectedDocument
  );
  const [htmlContent, setHtmlContent] = useState("");
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string>("all");
  const [currentDocInfo, setCurrentDocInfo] = useState<Document | null>(null);
  const editorRef = useRef<TinyMCEEditor | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocument) {
      loadDocument(selectedDocument);
    }
  }, [selectedDocument]);

  const loadDocuments = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/documents");
      console.log("[DEBUG] Documentos carregados:", res.data);
      setDocuments(res.data.documents);
      setLoading(false);
    } catch (err) {
      console.error("Erro ao carregar documentos:", err);
      alert("Erro ao carregar lista de documentos");
      setLoading(false);
    }
  };

  const loadDocument = async (filename: string) => {
    try {
      console.log("[DEBUG] Carregando documento:", filename);
      const res = await axios.get(
        `http://localhost:3001/api/documents/${filename}`
      );

      if (!res.data.htmlContent || res.data.htmlContent.trim() === "") {
        console.error("HTML vazio recebido da API!");
        alert("Documento vazio ou erro ao carregar conteúdo");
        return;
      }

      setHtmlContent(res.data.htmlContent);
      setCurrentDocument(filename);
      
      const docInfo = documents.find(d => d.filename === filename);
      if (docInfo) {
        setCurrentDocInfo(docInfo);
      } else {
        setCurrentDocInfo({
          filename: res.data.filename,
          bookName: res.data.bookName,
          pageNumber: res.data.pageNumber,
          filePath: res.data.filePath,
          size: 0,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        });
      }

      if (editorRef.current) {
        console.log("Definindo conteúdo no editor...");
        editorRef.current.setContent(res.data.htmlContent);
        console.log("✓ Conteúdo definido no editor");
      } else {
        console.log("Editor ainda não está pronto");
      }
    } catch (err) {
      console.error("Erro ao carregar documento:", err);
      if (axios.isAxiosError(err)) {
        console.error("Resposta do erro:", err.response?.data);
        console.error("Status:", err.response?.status);
      }
      alert("Erro ao carregar documento");
    }
  };

  const handlePrint = () => {
    if (editorRef.current && currentDocInfo) {
      const content = editorRef.current.getContent();
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${currentDocument}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .document-header {
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              .document-header h2 {
                margin: 0 0 10px 0;
              }
              .document-info {
                font-size: 12px;
                color: #666;
              }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="document-header">
              <h2>${currentDocument}</h2>
              <div class="document-info">
                <strong>Localização:</strong> ${currentDocInfo.bookName}, Página ${currentDocInfo.pageNumber}
              </div>
            </div>
            ${content}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleSave = async () => {
    if (!currentDocument || !editorRef.current) return;

    const updatedHtml = editorRef.current.getContent();
    console.log("[DEBUG] Salvando documento:", currentDocument);

    try {
      await axios.put(
        `http://localhost:3001/api/documents/${currentDocument}`,
        {
          htmlContent: updatedHtml,
        }
      );
      
      const shouldPrint = window.confirm(
        "Documento atualizado com sucesso!\n\nDeseja imprimir a versão atualizada?"
      );
      
      if (shouldPrint) {
        handlePrint();
      }
      
      loadDocuments();
    } catch (err) {
      console.error("Erro ao atualizar documento:", err);
      alert("Erro ao atualizar documento");
    }
  };

  const handleDelete = async (filename: string) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o documento "${filename}"?\nEsta ação não pode ser desfeita.`
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:3001/api/documents/${filename}`);
      alert("Documento excluído com sucesso!");
      loadDocuments();
      if (currentDocument === filename) {
        setCurrentDocument(null);
        setCurrentDocInfo(null);
      }
    } catch (err) {
      console.error("Erro ao excluir documento:", err);
      alert("Erro ao excluir documento");
    }
  };

  const groupedDocuments = (): BookGroup[] => {
    const groups = new Map<string, Document[]>();

    documents.forEach((doc) => {
      const book = doc.bookName || "Sem Livro";
      if (!groups.has(book)) {
        groups.set(book, []);
      }
      groups.get(book)!.push(doc);
    });

    groups.forEach((docs) => {
      docs.sort((a, b) => a.pageNumber - b.pageNumber);
    });

    return Array.from(groups.entries())
      .map(([bookName, documents]) => ({
        bookName,
        documents,
      }))
      .sort((a, b) => a.bookName.localeCompare(b.bookName));
  };

  const filteredBooks = (): BookGroup[] => {
    const allBooks = groupedDocuments();
    if (selectedBook === "all") {
      return allBooks;
    }
    return allBooks.filter((book) => book.bookName === selectedBook);
  };

  const allBooks = groupedDocuments();
  const bookNames = allBooks.map((b) => b.bookName);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Carregando documentos...</h2>
      </div>
    );
  }

  if (!currentDocument) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <button
            onClick={onBack}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            ← Voltar
          </button>
          <h1>Selecione um Documento</h1>
          <div style={{ width: "100px" }}></div>
        </div>

        {bookNames.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              Filtrar por Livro:
            </label>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              style={{
                padding: "10px",
                fontSize: "16px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                minWidth: "250px",
              }}
            >
              <option value="all">Todos os Livros ({documents.length})</option>
              {bookNames.map((bookName) => (
                <option key={bookName} value={bookName}>
                  {bookName} (
                  {allBooks.find((b) => b.bookName === bookName)?.documents.length})
                </option>
              ))}
            </select>
          </div>
        )}

        {documents.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              backgroundColor: "white",
              borderRadius: "10px",
            }}
          >
            <h2>Nenhum documento encontrado</h2>
            <p>Crie um novo documento primeiro!</p>
          </div>
        ) : (
          <div>
            {filteredBooks().map((bookGroup) => (
              <div key={bookGroup.bookName} style={{ marginBottom: "40px" }}>
                <h2
                  style={{
                    fontSize: "24px",
                    marginBottom: "15px",
                    color: "#333",
                    borderBottom: "2px solid #333",
                    paddingBottom: "10px",
                  }}
                >
                  {bookGroup.bookName}
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {bookGroup.documents.map((doc) => (
                    <div
                      key={doc.filename}
                      style={{
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "10px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        transition: "all 0.3s",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 4px 8px rgba(0,0,0,0.15)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 2px 4px rgba(0,0,0,0.1)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          backgroundColor: "#f0f0f0",
                          color: "#333",
                          padding: "5px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Página {doc.pageNumber}
                      </div>

                      <div
                        onClick={() => onSelectDocument(doc.filename)}
                        style={{ cursor: "pointer" }}
                      >
                        <h3
                          style={{
                            marginBottom: "10px",
                            marginTop: "25px",
                            color: "#333",
                          }}
                        >
                          {doc.filename}
                        </h3>
                        <p                        >
                          Tamanho: {(doc.size / 1024).toFixed(2)} KB
                        </p>
                        <p>
                          Modificado:{" "}
                          {new Date(doc.modifiedAt).toLocaleString("pt-BR")}
                        </p>
                      </div>

                      <div
                        style={{
                          marginTop: "15px",
                          display: "flex",
                          gap: "10px",
                        }}
                      >
                        <button
                          onClick={() => onSelectDocument(doc.filename)}
                          style={{
                            flex: 1,
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(doc.filename)}
                          style={{
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => {
            setCurrentDocument(null);
            setCurrentDocInfo(null);
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: "#757575",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          ← Voltar à Lista
        </button>
        <h1>Editando: {currentDocument}</h1>
        <div style={{ width: "100px" }}></div>
      </div>

      {currentDocInfo && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#f0f0f0",
            borderRadius: "5px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <strong>Localização Física:</strong>{" "}
            {currentDocInfo.bookName}, Página {currentDocInfo.pageNumber}
          </div>
          <button
            onClick={handlePrint}
            disabled={!isEditorReady}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "5px",
              cursor: isEditorReady ? "pointer" : "not-allowed",
              fontSize: "14px",
            }}
          >
            Imprimir
          </button>
        </div>
      )}

      <div style={{ opacity: isEditorReady ? 1 : 0.5 }}>
        <Editor
          apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
          onInit={(_, editor) => {
            console.log("Editor inicializado");
            editorRef.current = editor;
            if (htmlContent) {
              editor.setContent(htmlContent);
            }
            setIsEditorReady(true);
          }}
          initialValue={htmlContent}
          init={{
            height: 500,
            menubar: true,
            plugins: [
              "advlist",
              "autolink",
              "lists",
              "link",
              "image",
              "charmap",
              "preview",
              "anchor",
              "searchreplace",
              "visualblocks",
              "code",
              "fullscreen",
              "insertdatetime",
              "media",
              "table",
              "help",
              "wordcount",
            ],
            toolbar:
              "undo redo | fontfamily fontsize | " +
              "bold italic underline strikethrough | forecolor backcolor | " +
              "link image media | alignleft aligncenter alignright alignjustify | " +
              "bullist numlist outdent indent | removeformat | help",
            language: "pt-BR",
            fontsize_formats:
              "8px 10px 12px 14px 16px 18px 20px 24px 28px 32px 36px 48px 60px 72px 96px",
            image_caption: true,
            image_advtab: true,
            image_title: true,
            automatic_uploads: true,
            file_picker_types: "image",
            images_upload_handler: (blobInfo: any) =>
              new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  try {
                    const base64String = (e.target?.result as string) || "";
                    resolve(base64String);
                  } catch (error) {
                    reject("Erro ao converter imagem para Base64: " + error);
                  }
                };
                reader.onerror = (error) => {
                  reject("Erro na leitura do arquivo: " + error);
                };
                reader.readAsDataURL(blobInfo.blob());
              }),
            content_style:
              "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
          }}
        />
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: "10px" }}>
        <button
          onClick={handleSave}
          disabled={!isEditorReady}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: isEditorReady ? "pointer" : "not-allowed",
            fontSize: "16px",
            flex: 1,
          }}
        >
          Salvar Alterações
        </button>
        <button
          onClick={handlePrint}
          disabled={!isEditorReady}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: isEditorReady ? "pointer" : "not-allowed",
            fontSize: "16px",
          }}
        >
          Imprimir
        </button>
      </div>
    </div>
  );
}