/** Liest ein Foto ein und verkleinert es auf höchstens `max` px Kantenlänge. */
export async function bildEinlesen(file: File, max = 1024, qualitaet = 0.88): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const bild = new Image();
    await new Promise<void>((ok, fehler) => {
      bild.onload = () => ok();
      bild.onerror = () => fehler(new Error('Bild konnte nicht gelesen werden'));
      bild.src = url;
    });
    const k = Math.min(1, max / Math.max(bild.naturalWidth, bild.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bild.naturalWidth * k));
    canvas.height = Math.max(1, Math.round(bild.naturalHeight * k));
    canvas.getContext('2d')!.drawImage(bild, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', qualitaet);
  } finally {
    URL.revokeObjectURL(url);
  }
}
