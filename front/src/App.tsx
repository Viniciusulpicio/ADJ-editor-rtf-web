import React, { useState, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMCEEditor } from "tinymce";
import axios from "axios";

// A interface para o blobInfo permanece a mesma
interface BlobInfo {
  blob: () => Blob;
  filename: () => string;
}

export default function App() {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [initialValue] = useState(
    "<p>Comece a digitar e formate seu texto aqui!</p>"
  );
  const editorRef = useRef<TinyMCEEditor | null>(null);

  const handleSave = async () => {
      if (editorRef.current) {
        const htmlContent = editorRef.current.getContent();

        // ✨ ADICIONE ESTA LINHA AQUI ✨
        console.log("HTML SENDO ENVIADO PARA O BACK-END:", htmlContent);

        try {
          const res = await axios.post("http://localhost:3001/api/documents", {
            htmlContent: htmlContent,
          });
          console.log("Documento salvo! Path: " + res.data.filePath);
          alert("Documento salvo! Path: " + res.data.filePath);
        } catch (err: any) {
          console.error("Erro ao guardar o documento:", err);
          alert("Erro ao salvar documento. Veja console.");
        }
      }
    };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "50px auto",
        opacity: isEditorReady ? 1 : 0.5,
      }}
    >
      <h1>Editor de Documentos</h1>

      <Editor
        apiKey="5oplehaovgqxjjpyczs1j02jg64k4nzh8ef69nyffd9lpk2p" // Sua chave da API
        onInit={(_, editor) => {
          editorRef.current = editor;
          editor.setContent(initialValue);
          setIsEditorReady(true);
        }}
        init={{
          height: 500,
          menubar: true,
          plugins: [
            "advlist", "autolink", "lists", "link", "image", "charmap", "preview", "anchor",
            "searchreplace", "visualblocks", "code", "fullscreen", "insertdatetime", "media", "table", "help", "wordcount"
          ],
          toolbar:
            "undo redo | fontfamily fontsize | " +
            "bold italic underline strikethrough | forecolor backcolor | " +
            "link image media | alignleft aligncenter alignright alignjustify | " +
            "bullist numlist outdent indent | removeformat | help",
          language: "pt-BR",
          fontsize_formats:
            "8px 10px 12px 14px 16px 18px 20px 24px 28px 32px 36px 48px 60px 72px 96px",
          
          // --- AJUSTES DA IMAGEM ABAIXO ---
          image_caption: true,
          image_advtab: true,
          image_title: true,
          automatic_uploads: true,
          file_picker_types: "image",
          
          // ✨ ESTA É A MUDANÇA PRINCIPAL ✨
          // Converte a imagem para Base64 no navegador em vez de fazer upload.
          images_upload_handler: (blobInfo: BlobInfo) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              
              // Quando a leitura do arquivo terminar
              reader.onload = (e) => {
                try {
                  // e.target.result contém a string Base64
                  const base64String = (e.target?.result as string) || '';
                  resolve(base64String);
                } catch (error) {
                  reject("Erro ao converter imagem para Base64: " + error);
                }
              };

              // Em caso de erro na leitura
              reader.onerror = (error) => {
                reject("Erro na leitura do arquivo: " + error);
              };

              // Inicia a leitura do blob como uma URL de dados (Base64)
              reader.readAsDataURL(blobInfo.blob());
            }),

          content_style:
            "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
        }}
      />

      <button
        onClick={handleSave}
        disabled={!isEditorReady}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          cursor: isEditorReady ? "pointer" : "not-allowed",
        }}
      >
        Salvar Documento
      </button>
    </div>
  );
}