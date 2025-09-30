import React, { useState, useRef, useEffect } from "react";
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
      const res = await axios.get(
        `http://localhost:3001/api/documents/${filename}`
      );
      setHtmlContent(res.data.htmlContent);
      setCurrentDocument(filename);
      if (editorRef.current) {
        editorRef.current.setContent(res.data.htmlContent);
      }
    } catch (err) {
      console.error("Erro ao carregar documento:", err);
      alert("Erro ao carregar documento");
    }
  };

  const handleSave = async () => {
    if (!currentDocument || !editorRef.current) return;

    const updatedHtml = editorRef.current.getContent();

    try {
      await axios.put(
        `http://localhost:3001/api/documents/${currentDocument}`,
        {
          htmlContent: updatedHtml,
        }
      );
      alert("Documento atualizado com sucesso!");
      loadDocuments();
    } catch (err) {
      console.error("Erro ao atualizar documento:", err);
      alert("Erro ao atualizar documento");
    }
  };

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
              backgroundColor: "#757575",
              color: "white",
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {documents.map((doc) => (
              <div
                key={doc.filename}
                onClick={() => onSelectDocument(doc.filename)}
                style={{
                  backgroundColor: "white",
                  padding: "20px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "all 0.3s",
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
                <h3 style={{ marginBottom: "10px", color: "#333" }}>
                  📄 {doc.filename}
                </h3>
                <p style={{ fontSize: "14px", color: "#666", margin: "5px 0" }}>
                  Tamanho: {(doc.size / 1024).toFixed(2)} KB
                </p>
                <p style={{ fontSize: "14px", color: "#666", margin: "5px 0" }}>
                  Modificado: {new Date(doc.modifiedAt).toLocaleString("pt-BR")}
                </p>
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
          onClick={() => setCurrentDocument(null)}
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

      <div style={{ opacity: isEditorReady ? 1 : 0.5 }}>
        <Editor
          apiKey="5oplehaovgqxjjpyczs1j02jg64k4nzh8ef69nyffd9lpk2p"
          onInit={(_, editor) => {
            editorRef.current = editor;
            editor.setContent(htmlContent);
            setIsEditorReady(true);
          }}
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

      <button
        onClick={handleSave}
        disabled={!isEditorReady}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          backgroundColor: isEditorReady ? "#4CAF50" : "#cccccc",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: isEditorReady ? "pointer" : "not-allowed",
          fontSize: "16px",
        }}
      >
        Salvar Alterações
      </button>
    </div>
  );
}