import { useState, useRef, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMCEEditor } from "tinymce";
import axios from "axios";

interface WritePageProps {
  onBack: () => void;
}

export default function WritePage({ onBack }: WritePageProps) {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [initialValue] = useState(
    "<p>Comece a digitar e formate seu texto aqui!</p>"
  );
  const [filename, setFilename] = useState("");
  const [nextLocation, setNextLocation] = useState<string>("");
  const editorRef = useRef<TinyMCEEditor | null>(null);

  useEffect(() => {
    loadNextLocation();
  }, []);

  const loadNextLocation = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/stats");
      const stats = res.data;
      
      if (stats.books.length === 0) {
        setNextLocation("Livro-1, Página 1");
      } else {
        const lastBook = stats.books[stats.books.length - 1];
        if (lastBook.isFull) {
          const nextBookNum = stats.books.length + 1;
          setNextLocation(`Livro-${nextBookNum}, Página 1`);
        } else {
          setNextLocation(`${lastBook.bookName}, Página ${lastBook.pageCount + 1}`);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar próxima localização:", err);
      setNextLocation("Livro-1, Página 1");
    }
  };

  const handlePrint = () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Imprimir Documento</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
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
    if (editorRef.current) {
      if (!filename.trim()) {
        alert("Por favor, insira um nome para o arquivo!");
        return;
      }

      const htmlContent = editorRef.current.getContent();

      try {
        const res = await axios.post("http://localhost:3001/api/documents", {
          htmlContent: htmlContent,
          filename: filename.trim(),
        });
        
        console.log("Documento salvo! Path: " + res.data.filePath);
        
        const shouldPrint = window.confirm(
          `Documento salvo com sucesso!\n\n` +
          `Localização: ${res.data.bookName}, Página ${res.data.pageNumber}\n` +
          `Arquivo: ${res.data.filename}\n\n` +
          `Deseja imprimir agora?`
        );
        
        if (shouldPrint) {
          handlePrint();
        }
        
        onBack();
      } catch (err: any) {
        console.error("Erro ao guardar o documento:", err);
        if (err.response?.status === 409) {
          alert(err.response.data.error);
        } else {
          alert("Erro ao salvar documento. Veja console.");
        }
      }
    }
  };

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
          onClick={onBack}
          style={{
            padding: "10px 20px",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          ← Voltar
        </button>
        <h1>Criar Novo Documento</h1>
        <div style={{ width: "100px" }}></div>
      </div>

      {nextLocation && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#f0f0f0",
            borderRadius: "5px",
          }}
        >
          <strong>Localização Física Automática</strong>
          <p style={{ margin: "5px 0 0 0" }}>
            Este documento será arquivado em: <strong>{nextLocation}</strong>
          </p>
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="filename"
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Nome do Arquivo:
        </label>
        <input
          id="filename"
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="Nome do arquivo (sem extensão)"
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
      </div>

      <div style={{ opacity: isEditorReady ? 1 : 0.5 }}>
        <Editor
          apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
          onInit={(_, editor) => {
            editorRef.current = editor;
            editor.setContent(initialValue);
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
          border: "none",
          borderRadius: "5px",
          cursor: isEditorReady ? "pointer" : "not-allowed",
          fontSize: "16px",
        }}
      >
        Salvar Documento
      </button>
    </div>
  );
}