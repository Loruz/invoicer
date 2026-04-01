import { Font } from "@react-pdf/renderer";
import { join } from "path";

// Register TTF fonts with full Latin Extended support (Lithuanian: ą, č, ę, ė, į, š, ų, ū, ž).
// Must use static TTF files — woff2/variable fonts crash fontkit in @react-pdf/renderer.

const fontsDir = join(process.cwd(), "public", "fonts");

Font.register({
  family: "Inter",
  fonts: [
    { src: join(fontsDir, "inter-400.ttf"), fontWeight: 400 },
    { src: join(fontsDir, "inter-700.ttf"), fontWeight: 700 },
  ],
});

Font.register({
  family: "Noto Serif",
  fonts: [
    { src: join(fontsDir, "noto-serif-400.ttf"), fontWeight: 400 },
    { src: join(fontsDir, "noto-serif-700.ttf"), fontWeight: 700 },
  ],
});

Font.register({
  family: "Roboto Mono",
  fonts: [
    { src: join(fontsDir, "roboto-mono-400.ttf"), fontWeight: 400 },
    { src: join(fontsDir, "roboto-mono-700.ttf"), fontWeight: 700 },
  ],
});

Font.registerHyphenationCallback((word) => [word]);
