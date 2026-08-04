const canvas = document.getElementById("certificateCanvas");
const ctx = canvas.getContext("2d");
const templateImage = document.getElementById("certificateTemplate");

const A4_LANDSCAPE = {
  pxWidth: 3508,
  pxHeight: 2480,
  ptWidth: 841.89,
  ptHeight: 595.28,
};

const fields = {
  delegateName: document.getElementById("delegateName"),
  portfolio: document.getElementById("portfolio"),
  committee: document.getElementById("committee"),
};

const downloadPng = document.getElementById("downloadPng");
const downloadPdf = document.getElementById("downloadPdf");

function value(id, fallback = "") {
  return fields[id].value.trim() || fallback;
}

function fitText(targetCtx, text, maxWidth, initialSize, fontFamily, weight = "700") {
  let size = initialSize;
  do {
    targetCtx.font = `${weight} ${size}px ${fontFamily}`;
    if (targetCtx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  } while (size > 22);
  return size;
}

function drawPlaceholder(targetCanvas = canvas, targetCtx = ctx) {
  targetCtx.fillStyle = "#ffffff";
  targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
  targetCtx.fillStyle = "#475569";
  targetCtx.font = "700 36px Arial, sans-serif";
  targetCtx.textAlign = "center";
  targetCtx.textBaseline = "middle";
  targetCtx.fillText("Certificate template loading", targetCanvas.width / 2, targetCanvas.height / 2);
}

function drawTemplate(targetCanvas = canvas, targetCtx = ctx) {
  if (!templateImage.complete || !templateImage.naturalWidth) {
    drawPlaceholder(targetCanvas, targetCtx);
    return;
  }

  targetCtx.fillStyle = "#ffffff";
  targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

  const imageRatio = templateImage.naturalWidth / templateImage.naturalHeight;
  const canvasRatio = targetCanvas.width / targetCanvas.height;
  let drawWidth = targetCanvas.width;
  let drawHeight = targetCanvas.height;
  let x = 0;
  let y = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = targetCanvas.width / imageRatio;
    y = (targetCanvas.height - drawHeight) / 2;
  } else {
    drawWidth = targetCanvas.height * imageRatio;
    x = (targetCanvas.width - drawWidth) / 2;
  }

  targetCtx.drawImage(templateImage, x, y, drawWidth, drawHeight);
}

function drawCertificate(targetCanvas = canvas, targetCtx = ctx) {
  drawTemplate(targetCanvas, targetCtx);

  const ratioX = targetCanvas.width / canvas.width;
  const ratioY = targetCanvas.height / canvas.height;
  const ratio = Math.min(ratioX, ratioY);
  const scale = 0.92;
  const name = value("delegateName", "Delegate Name");
  const portfolio = value("portfolio", "Portfolio");
  const committee = value("committee", "Committee");

  targetCtx.textAlign = "center";
  targetCtx.textBaseline = "alphabetic";
  targetCtx.fillStyle = "#1d2633";

  const nameLine = { x: 1297, y: 595, width: 418 };
  const portfolioLine = { x: 1141, y: 675, width: 360 };
  const committeeLine = { x: 1545, y: 675, width: 317 };

  const nameSize = fitText(targetCtx, name, nameLine.width * ratioX, 42 * scale * ratio, "Georgia, serif", "600");
  targetCtx.font = `600 ${nameSize}px Georgia, serif`;
  targetCtx.fillText(name, nameLine.x * ratioX, (nameLine.y - 7) * ratioY);

  const portfolioSize = fitText(targetCtx, portfolio, portfolioLine.width * ratioX, 38 * scale * ratio, "Georgia, serif", "600");
  targetCtx.font = `600 ${portfolioSize}px Georgia, serif`;
  targetCtx.fillText(portfolio, portfolioLine.x * ratioX, (portfolioLine.y - 7) * ratioY);

  const committeeSize = fitText(targetCtx, committee, committeeLine.width * ratioX, 38 * scale * ratio, "Georgia, serif", "600");
  targetCtx.font = `600 ${committeeSize}px Georgia, serif`;
  targetCtx.fillText(committee, committeeLine.x * ratioX, (committeeLine.y - 7) * ratioY);
}

function createExportCanvas() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = A4_LANDSCAPE.pxWidth;
  exportCanvas.height = A4_LANDSCAPE.pxHeight;
  const exportCtx = exportCanvas.getContext("2d");
  drawCertificate(exportCanvas, exportCtx);
  return exportCanvas;
}

function fileBaseName() {
  return value("delegateName", "delegate").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "delegate";
}

function dataUrlToBytes(dataUrl) {
  const binary = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function buildPdf(imageBytes) {
  const encoder = new TextEncoder();
  const contentStream = `q\n${A4_LANDSCAPE.ptWidth} 0 0 ${A4_LANDSCAPE.ptHeight} 0 0 cm\n/Im0 Do\nQ\n`;
  const objects = [
    [encoder.encode("<< /Type /Catalog /Pages 2 0 R >>")],
    [encoder.encode("<< /Type /Pages /Kids [3 0 R] /Count 1 >>")],
    [encoder.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_LANDSCAPE.ptWidth} ${A4_LANDSCAPE.ptHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`)],
    [encoder.encode(`<< /Type /XObject /Subtype /Image /Width ${A4_LANDSCAPE.pxWidth} /Height ${A4_LANDSCAPE.pxHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`), imageBytes, encoder.encode("\nendstream")],
    [encoder.encode(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream`)],
  ];

  const chunks = [encoder.encode("%PDF-1.4\n")];
  const offsets = [];
  let length = chunks[0].length;

  objects.forEach((objectChunks, index) => {
    const header = encoder.encode(`${index + 1} 0 obj\n`);
    chunks.push(header);
    offsets.push(length);
    length += header.length;
    objectChunks.forEach((chunk) => {
      chunks.push(chunk);
      length += chunk.length;
    });
    const footer = encoder.encode("\nendobj\n");
    chunks.push(footer);
    length += footer.length;
  });

  const xrefOffset = length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(encoder.encode(xref));
  return new Blob(chunks, { type: "application/pdf" });
}

function downloadCertificatePng() {
  const exportCanvas = createExportCanvas();
  const imageBytes = dataUrlToBytes(exportCanvas.toDataURL("image/png"));
  const blob = new Blob([imageBytes], { type: "image/png" });
  downloadBlob(blob, `${fileBaseName()}-certificate-a4-landscape.png`);
}

function downloadCertificatePdf() {
  const exportCanvas = createExportCanvas();
  const imageBytes = dataUrlToBytes(exportCanvas.toDataURL("image/jpeg", 0.95));
  downloadBlob(buildPdf(imageBytes), `${fileBaseName()}-certificate-a4-landscape.pdf`);
}

Object.values(fields).forEach((field) => {
  field.addEventListener("input", () => drawCertificate());
});

downloadPng.addEventListener("click", downloadCertificatePng);
downloadPdf.addEventListener("click", downloadCertificatePdf);

templateImage.addEventListener("load", () => {
  drawCertificate();
});

templateImage.addEventListener("error", () => {
  drawCertificate();
});

drawCertificate();
