import Phaser from "phaser";

import { ProgressBar } from "@presentation/ui/progress-bar";

// ---------------------------------------------------------------------------
// Constantes de diseño (tokens de la paleta — docs/05-ui-design.md §2.1)
// ---------------------------------------------------------------------------

const COLOR_BG_DEEP = 0x0d0b1e;
const COLOR_ACCENT_GOLD = "#F5C842";
const COLOR_TEXT_SECONDARY = "#9B96B0";
const COLOR_TEXT_PRIMARY = "#F0EAD6";

/** Número de clics en el logo para activar el easter egg. */
const EASTER_EGG_CLICKS = 3;
/** Versión del juego mostrada en la pantalla de carga. */
const GAME_VERSION = "v1.0.0";

// ---------------------------------------------------------------------------
// Clase BootScene
// ---------------------------------------------------------------------------

/**
 * Escena de carga inicial de Crossover Cards.
 *
 * Responsabilidades:
 * - Cargar TODOS los assets del juego (imágenes, JSONs, audio).
 * - Mostrar la UI de carga: logo, barra de progreso, porcentaje.
 * - Gestionar el easter egg del logo (3 clics → rotación 360°).
 * - Transicionar a MenuScene al completar la carga.
 *
 * Referencia de diseño: docs/05-ui-design.md §3.1 (BootScene).
 * Convenciones: .agent/skills/phaser-patterns/SKILL.md.
 */
export class BootScene extends Phaser.Scene {
  /** Contador privado de clics sobre el logo (easter egg). */
  private _easterClicks = 0;

  constructor() {
    super({ key: "BootScene" });
  }

  // -------------------------------------------------------------------------
  // preload — carga de assets
  // -------------------------------------------------------------------------

  preload(): void {
    // Escuchar errores de carga de forma silenciosa (Phaser ya los maneja
    // internamente; solo registramos en consola para depuración)
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.warn(`[BootScene] Asset no encontrado: ${file.src}`);
    });

    this.loadCharacters();
    this.loadData();
    this.loadAudio();
    this.loadBackgrounds();
  }

  // -------------------------------------------------------------------------
  // create — UI de la pantalla de carga
  // -------------------------------------------------------------------------

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Fondo sólido (bg-deep)
    this.add.rectangle(cx, cy, width, height, COLOR_BG_DEEP);

    // Logo — "CROSSOVER"
    const logoText = this.add
      .text(cx, cy - 180, "CROSSOVER", {
        fontFamily: "Bangers, system-ui",
        fontSize: "72px",
        color: COLOR_ACCENT_GOLD,
      })
      .setOrigin(0.5);

    // Logo — "CARDS"
    this.add
      .text(cx, cy - 110, "CARDS", {
        fontFamily: "Bangers, system-ui",
        fontSize: "48px",
        color: COLOR_ACCENT_GOLD,
      })
      .setOrigin(0.5);

    // Texto de estado de carga
    this.add
      .text(cx, cy + 20, "Cargando assets...", {
        fontFamily: "Nunito, system-ui",
        fontSize: "18px",
        color: COLOR_TEXT_SECONDARY,
      })
      .setOrigin(0.5);

    // Barra de progreso (IMPL-045) — 520px de ancho, spec §3.1
    const progressBar = new ProgressBar({
      scene: this,
      x: cx,
      y: cy + 60,
      width: 520,
    });

    // Texto de porcentaje debajo de la barra
    const percentText = this.add
      .text(cx, cy + 86, "0%", {
        fontFamily: "Nunito, system-ui",
        fontSize: "16px",
        color: COLOR_TEXT_PRIMARY,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Versión — esquina inferior izquierda
    this.add.text(20, height - 20, GAME_VERSION, {
      fontFamily: "Nunito, system-ui",
      fontSize: "12px",
      color: COLOR_TEXT_SECONDARY,
    });

    // Copyright — esquina inferior derecha
    const copyright = this.add.text(0, height - 20, "© 2026 Equipo", {
      fontFamily: "Nunito, system-ui",
      fontSize: "12px",
      color: COLOR_TEXT_SECONDARY,
    });
    copyright.setX(width - copyright.width - 20);

    // --- Eventos del loader ---
    this.load.on("progress", (value: number) => {
      progressBar.update(value);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on("complete", () => {
      this.onLoadComplete();
    });

    // --- Easter egg: zona interactiva sobre el logo (400×120px) ---
    this.setupEasterEgg(logoText, cx, cy - 145);
  }

  // -------------------------------------------------------------------------
  // Transición a MenuScene
  // -------------------------------------------------------------------------

  private onLoadComplete(): void {
    this.time.delayedCall(300, () => {
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("MenuScene");
      });
    });
  }

  // -------------------------------------------------------------------------
  // Easter egg — 3 clics sobre el logo → rotación 360°
  // -------------------------------------------------------------------------

  /**
   * Crea una zona interactiva invisible sobre el logo.
   * Al acumular EASTER_EGG_CLICKS clics, anima el logo con una rotación
   * completa y resetea el contador.
   */
  private setupEasterEgg(logoText: Phaser.GameObjects.Text, cx: number, cy: number): void {
    const zone = this.add.zone(cx, cy, 400, 120).setInteractive({ useHandCursor: true });

    zone.on("pointerup", () => {
      this._easterClicks += 1;

      if (this._easterClicks >= EASTER_EGG_CLICKS) {
        this._easterClicks = 0;
        this.tweens.add({
          targets: logoText,
          angle: 360,
          duration: 600,
          ease: "Sine.easeInOut",
          onComplete: () => {
            // Resetear el ángulo sin animación para el siguiente ciclo
            logoText.setAngle(0);
          },
        });
      }
    });
  }

  // -------------------------------------------------------------------------
  // Loaders privados (organizados por tipo de asset)
  // -------------------------------------------------------------------------

  /** Carga los 22 sprites de personajes y héroes. */
  private loadCharacters(): void {
    this.load.image("hero-el-lich", "assets/characters/hero-el-lich.png");
    this.load.image("hero-axel-blaze", "assets/characters/hero-axel-blaze.png");
    this.load.image("card-pops-el-gentil", "assets/characters/pops-el-gentil.png");
    this.load.image("card-darwin-watterson", "assets/characters/darwin-watterson.png");
    this.load.image("card-chowder", "assets/characters/chowder.png");
    this.load.image("card-patricio-estrella", "assets/characters/patricio-estrella.png");
    this.load.image("card-rigby", "assets/characters/rigby.png");
    this.load.image("card-jake-el-perro", "assets/characters/jake-el-perro.png");
    this.load.image("card-goku", "assets/characters/goku.png");
    this.load.image("card-marceline", "assets/characters/marceline.png");
    this.load.image("card-fantasma-chocala", "assets/characters/fantasma-chocala.png");
    this.load.image("card-diamantino", "assets/characters/diamantino.png");
    this.load.image("card-chum-chum", "assets/characters/chum-chum.png");
    this.load.image(
      "card-agallas-el-perro-cobarde",
      "assets/characters/agallas-el-perro-cobarde.png",
    );
    this.load.image("card-superbocata", "assets/characters/superbocata.png");
    this.load.image("card-cangreburger", "assets/characters/cangreburger.png");
    this.load.image("card-el-poder", "assets/characters/el-poder.png");
    this.load.image("card-espada-sangre-demonio", "assets/characters/espada-sangre-demonio.png");
    this.load.image("card-pedo-poderoso", "assets/characters/pedo-poderoso.png");
    this.load.image("card-linterna-minimizadora", "assets/characters/linterna-minimizadora.png");
    this.load.image("card-bola-de-dragon", "assets/characters/bola-de-dragon.png");
    this.load.image("card-omnitrix", "assets/characters/omnitrix.png");
  }

  /** Carga los archivos JSON de datos del juego. */
  private loadData(): void {
    this.load.json("data-cards", "assets/data/cards.json");
    this.load.json("data-decks", "assets/data/decks.json");
    this.load.json("data-heroes", "assets/data/heroes.json");
  }

  /** Registra los assets de audio (puede fallar silenciosamente). */
  private loadAudio(): void {
    this.load.audio("music-menu", "assets/audio/music-menu.mp3");
    this.load.audio("sfx-card-play", "assets/audio/sfx-card-play.mp3");
  }

  /** Registra las imágenes de fondo de las escenas. */
  private loadBackgrounds(): void {
    this.load.image("bg-menu", "assets/bg-menu.png");
    this.load.image("bg-hero-select", "assets/bg-hero-select.png");
  }
}
