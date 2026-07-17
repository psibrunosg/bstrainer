import type { WorkoutSession } from "@bstrainer/domain";
import { sessionTonnage } from "@bstrainer/engine";

/**
 * Renderiza um card de resumo do treino via Canvas 2D nativo — sem lib de
 * imagem, ponytail: canvas cobre isso em ~60 linhas, uma dependência extra
 * não se paga aqui.
 */
export function renderShareCard(session: WorkoutSession, prCount: number): Blob | Promise<Blob> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Fundo — tokens de docs/DESIGN.md
  ctx.fillStyle = "#f8f4ed";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#c2d0c8";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  ctx.fillStyle = "#63807a";
  ctx.font = "600 28px Inter, sans-serif";
  ctx.fillText("BSTRAINER · TREINO CONCLUÍDO", 80, 140);

  const durationMin = Math.max(
    1,
    Math.round(
      (Date.parse(session.finishedAt ?? session.startedAt) -
        Date.parse(session.startedAt)) /
        60_000,
    ),
  );
  const totalSets = session.exercises.reduce((acc, e) => acc + e.sets.length, 0);
  const tonnage = Math.round(sessionTonnage(session));

  if (prCount > 0) {
    ctx.fillStyle = "#a8c84d";
    ctx.font = "italic 700 44px Georgia, serif";
    ctx.fillText(
      `${prCount} novo${prCount > 1 ? "s" : ""} recorde${prCount > 1 ? "s" : ""}`,
      80,
      220,
    );
  }

  const stats: [string, string][] = [
    [String(durationMin), "MINUTOS"],
    [`${tonnage}`, "KG TOTAL"],
    [String(totalSets), "SÉRIES"],
  ];
  const colWidth = (width - 160) / stats.length;
  stats.forEach(([value, label], i) => {
    const x = 80 + i * colWidth;
    ctx.fillStyle = "#174b48";
    ctx.font = "700 96px Georgia, serif";
    ctx.fillText(value, x, 420);
    ctx.fillStyle = "#63807a";
    ctx.font = "600 22px Inter, sans-serif";
    ctx.fillText(label, x, 460);
  });

  ctx.strokeStyle = "#c2d0c8";
  ctx.beginPath();
  ctx.moveTo(80, 520);
  ctx.lineTo(width - 80, 520);
  ctx.stroke();

  ctx.fillStyle = "#174b48";
  ctx.font = "600 30px Inter, sans-serif";
  let y = 590;
  for (const ex of session.exercises.slice(0, 10)) {
    ctx.fillText(`${ex.sets.length}× série${ex.sets.length > 1 ? "s" : ""}`, 80, y);
    y += 52;
  }

  ctx.fillStyle = "#63807a";
  ctx.font = "500 22px Inter, sans-serif";
  ctx.fillText(
    new Date(session.startedAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    80,
    height - 80,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Falha ao gerar imagem."));
    }, "image/png");
  });
}

export async function shareOrDownloadCard(session: WorkoutSession, prCount: number) {
  const blob = await renderShareCard(session, prCount);
  const file = new File([blob], "bstrainer-treino.png", { type: "image/png" });

  if (
    typeof navigator !== "undefined" &&
    "share" in navigator &&
    navigator.canShare?.({ files: [file] })
  ) {
    await navigator.share({ files: [file], title: "Meu treino" });
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bstrainer-treino.png";
  a.click();
  URL.revokeObjectURL(url);
}
