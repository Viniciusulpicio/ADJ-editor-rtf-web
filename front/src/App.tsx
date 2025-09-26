// src/App.tsx
import { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import CustomEditor from "./ckeditor";
import axios from "axios";

export default function App() {
  const [data, setData] = useState("<p>Comece a digitar...</p>");

  const handleSave = async () => {
    try {
      const res = await axios.post("http://localhost:3001/api/documents", {
        htmlContent: data
      });
      alert("Documento salvo! Path: " + res.data.filePath);
    } catch (err) {
      console.error("Erro ao guardar o documento:", err);
      alert("Erro ao salvar documento. Veja console.");
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "50px auto" }}>
      <h1>Editor CKEditor</h1>
      <CKEditor
        // Use a sua classe de editor personalizada aqui
        editor={CustomEditor}
        data={data}
        onReady={editor => {
          console.log("Editor pronto!", editor);
        }}
        onChange={(event, editor) => setData(editor.getData())}
        config={{
          // O SimpleUploadAdapter agora existe e irá ler esta configuração!
          simpleUpload: {
            uploadUrl: "http://localhost:3001/api/upload-image"
          }
        }}
      />
      <button onClick={handleSave} style={{ marginTop: 20, padding: "10px 20px" }}>
        Salvar Documento
      </button>
    </div>
  );
}