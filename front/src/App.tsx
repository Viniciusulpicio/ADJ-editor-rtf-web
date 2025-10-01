import React, { useState } from "react";
import HomePage from "./pages/HomePage";
import WritePage from "./pages/WritePage";
import ReadPage from "./pages/ReadPage";

type Page = "home" | "write" | "read";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  const navigateToWrite = () => {
    setCurrentPage("write");
    setSelectedDocument(null);
  };

  const navigateToRead = () => {
    setCurrentPage("read");
    setSelectedDocument(null);
  };

  const navigateToHome = () => {
    setCurrentPage("home");
    setSelectedDocument(null);
  };

  const openDocument = (filename: string) => {
    setSelectedDocument(filename);
    setCurrentPage("read");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
    <style>
      {`
        /* Remove botão de promoção */
        .tox .tox-promotion-button {
          display: none !important;
        }

        /* Remove branding da barra de status */
        .tox .tox-statusbar__branding {
          display: none !important;
        }
      `}
    </style>

      {currentPage === "home" && (
        <HomePage onWrite={navigateToWrite} onRead={navigateToRead} />
      )}
      {currentPage === "write" && <WritePage onBack={navigateToHome} />}
      {currentPage === "read" && (
        <ReadPage
          onBack={navigateToHome}
          selectedDocument={selectedDocument}
          onSelectDocument={openDocument}
        />
      )}
    </div>
  );

}