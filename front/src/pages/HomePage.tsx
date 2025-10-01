interface HomePageProps {
  onWrite: () => void;
  onRead: () => void;
}

export default function HomePage({ onWrite, onRead }: HomePageProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <h1 style={{ marginBottom: "40px", fontSize: "2.5rem", color: "#333" }}>
        Editor de Documentos RTF
      </h1>

      <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
        <button
          onClick={onWrite}
          style={{
            padding: "40px 60px",
            fontSize: "1.5rem",
            color: "black",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "all 0.3s",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 8px rgba(0,0,0,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
          }}
        >
           Criar Documento
        </button>

        <button
          onClick={onRead}
          style={{
            padding: "40px 60px",
            fontSize: "1.5rem",
            color: "black",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "all 0.3s",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 8px rgba(0,0,0,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
          }}
        >
          Editar documento
        </button>
      </div>
    </div>
  );
}