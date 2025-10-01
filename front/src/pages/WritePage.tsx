import  { useState, useRef } from "react";
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
  const editorRef = useRef<TinyMCEEditor | null>(null);

  const handleSave = async () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.getContent();

      try {
        const res = await axios.post("http://localhost:3001/api/documents", {
          htmlContent: htmlContent,
        });
        console.log("Documento salvo! Path: " + res.data.filePath);
        alert("Documento salvo com sucesso!\n" + res.data.filename);
      } catch (err: any) {
        console.error("Erro ao guardar o documento:", err);
        alert("Erro ao salvar documento. Veja console.");
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
            backgroundColor: "#757575",
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
          backgroundColor: isEditorReady ? "#4CAF50" : "#cccccc",
          color: "white",
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