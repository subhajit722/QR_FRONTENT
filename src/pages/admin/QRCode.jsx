
import { useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import "./QRCode.css";

const QRCodePage = () => {
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Change this to your deployed website URL later.
  const menuUrl = `${window.location.origin}/menu`;

  const generateQR = async () => {
    try {
      setLoading(true);
      setError("");

      const QRCode = await import("qrcode");

      const image = await QRCode.toDataURL(menuUrl, {
        width: 500,
        margin: 3,
        errorCorrectionLevel: "H",
        color: {
          dark: "#35251c",
          light: "#ffffff",
        },
      });

      setQrImage(image);
    } catch (err) {
      console.error("QR generation error:", err);
      setError("Unable to generate QR code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrImage) return;

    const link = document.createElement("a");
    link.href = qrImage;
    link.download = "restaurant-menu-qr.png";
    link.click();
  };

  const printQR = () => {
    if (!qrImage) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setError("Please allow pop-ups to print your QR code.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Restaurant Menu QR</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              text-align: center;
            }
            .card { padding: 35px; }
            h1 { font-size: 28px; }
            p { color: #666; }
            img { width: 300px; height: 300px; }
            @media print {
              body { min-height: auto; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Our Menu</h1>
            <p>Scan to explore our delicious food</p>
            <img src="${qrImage}" alt="Restaurant menu QR code" />
            <p>${menuUrl}</p>
          </div>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="qr-page">
      <div className="qr-page-header">
        <div>
          <span className="qr-eyebrow">RESTAURANT SETTINGS</span>
          <h1>QR Code Generator</h1>
          <p>Generate and print your restaurant's digital menu QR code.</p>
        </div>

        <div className="qr-header-icon">
          <QrCode2Icon />
        </div>
      </div>

      <div className="qr-content">
        <div className="qr-info">
          <h2>Your Digital Menu</h2>
          <p>
            Customers can scan this QR code with their phone camera
            to view your restaurant menu instantly.
          </p>

          <div className="qr-url-box">
            <span>MENU URL</span>
            <strong>{menuUrl}</strong>
          </div>

          <div className="qr-instructions">
            <h3>How it works</h3>
            <ol>
              <li>Generate your QR code.</li>
              <li>Download or print it.</li>
              <li>Place it on restaurant tables.</li>
              <li>Customers scan and view your menu.</li>
            </ol>
          </div>

          <Button
            variant="contained"
            onClick={generateQR}
            disabled={loading}
            className="qr-generate-button"
            startIcon={
              loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <QrCode2Icon />
              )
            }
          >
            {loading ? "Generating..." : "Generate QR Code"}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </div>

        <div className="qr-preview">
          <div className="qr-preview-card">
            <span className="qr-preview-label">SCAN TO VIEW MENU</span>

            {qrImage ? (
              <img
                src={qrImage}
                alt="Restaurant menu QR code"
                className="qr-image"
              />
            ) : (
              <div className="qr-placeholder">
                <QrCode2Icon />
                <p>Your QR code will appear here</p>
              </div>
            )}

            <h3>Explore Our Menu</h3>
            <p>Fresh food. Great taste. Beautiful moments.</p>
          </div>

          {qrImage && (
            <div className="qr-actions">
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={downloadQR}
              >
                Download PNG
              </Button>

              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={printQR}
              >
                Print QR
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;
