import { Router, Request, Response } from "express";
import { upload } from "../middleware/uploadConfig";
import { PORT } from "../config/constants";

const router = Router();

router.post("/upload-image", upload.single("upload"), (req: Request, res: Response) => {
  if (!req.file) {
    console.error("[ERRO] Upload sem arquivo");
    return res.status(400).json({ error: "Nenhuma imagem recebida." });
  }

  const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  console.log(`[INFO] Imagem salva: ${req.file.filename}`);
  res.status(200).json({ url: imageUrl });
});

export default router;