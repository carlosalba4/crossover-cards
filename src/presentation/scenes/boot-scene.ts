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
  private _progressBar!: ProgressBar;
  private _percentText!: Phaser.GameObjects.Text;

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
    this.loadCardAssets();
    this.loadUIAssets();
    this.loadBoardAndEffects();
    this.loadData();
    this.loadBackgrounds();
    // Los ficheros de audio ya existen en assets/audio/; se cargan con
    // this.load.audio (los errores de decodificación se registran de forma no
    // bloqueante mediante el handler 'loaderror' definido arriba).
    this.loadAudio();

    // Los eventos del loader deben registrarse en preload() — el loader ya ha
    // terminado cuando create() se ejecuta y los callbacks no se invocan
    this.load.on("progress", (value: number) => {
      if (this._progressBar) this._progressBar.update(value);
      if (this._percentText) this._percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on("complete", () => {
      this.onLoadComplete();
    });
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
    this._progressBar = new ProgressBar({
      scene: this,
      x: cx,
      y: cy + 60,
      width: 520,
    });

    // Texto de porcentaje debajo de la barra
    this._percentText = this.add
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
    // Héroes
    this.load.image("hero-el-lich", "assets/characters/hero-el-lich.png");
    this.load.image("hero-axel-blaze", "assets/characters/hero-axel-blaze.png");

    // Personajes mazo El Lich
    this.load.image("pops_card", "assets/characters/pops_card.png");
    this.load.image("darwin_card", "assets/characters/darwin_card.png");
    this.load.image("chowder_card", "assets/characters/chowder_card.png");
    this.load.image("patricio_card", "assets/characters/patricio_card.png");
    this.load.image("rigby_card", "assets/characters/rigby_card.png");
    this.load.image("jake_card", "assets/characters/jake_card.png");
    this.load.image("superbocata_card", "assets/characters/superbocata_card.png");
    this.load.image("cangreburger_card", "assets/characters/cangreburger_card.png");
    this.load.image("el_poder_card", "assets/characters/el_poder_card.png");
    this.load.image("demon_sword_card", "assets/characters/demon_sword_card.png");

    // Personajes mazo Axel Blaze
    this.load.image("goku_card", "assets/characters/goku_card.png");
    this.load.image("marceline_card", "assets/characters/marceline_card.png");
    this.load.image("fantasma_chocala_card", "assets/characters/fantasma_chocala_card.png");
    this.load.image("diamantino_card", "assets/characters/diamantino_card.png");
    this.load.image("chumchum_card", "assets/characters/chumchum_card.png");
    this.load.image("agallas_card", "assets/characters/agallas_card.png");
    this.load.image("pedo_poderoso_card", "assets/characters/pedo_poderoso_card.png");
    this.load.image(
      "linterna_minimizadora_card",
      "assets/characters/linterna_minimizadora_card.png",
    );
    this.load.image("bola_dragon_card", "assets/characters/bola_dragon_card.png");
    this.load.image("omnitrix_card", "assets/characters/omnitrix_card.png");
  }

  /** Carga los archivos JSON de datos del juego. */
  private loadData(): void {
    this.load.json("data-cards", "assets/data/cards.json");
    this.load.json("data-decks", "assets/data/decks.json");
    this.load.json("data-heroes", "assets/data/heroes.json");
  }

  /** Carga los marcos de carta por rareza y el reverso. */
  private loadCardAssets(): void {
    this.load.image("frame-common", "assets/cards/frames/frame-common.png");
    this.load.image("frame-rare", "assets/cards/frames/frame-rare.png");
    this.load.image("frame-epic", "assets/cards/frames/frame-epic.png");
    this.load.image("frame-legendary", "assets/cards/frames/frame-legendary.png");
    this.load.image("card-back", "assets/cards/backs/card-back.png");
  }

  /** Carga los iconos del HUD, botones y elementos de HUD (logo, reloj). */
  private loadUIAssets(): void {
    // Iconos del HUD (assets/ui/icons/)
    const icons = [
      "icon-attack",
      "icon-health",
      "icon-nostalgia",
      "icon-momentum",
      "icon-deck",
      "icon-shield",
      "icon-crossover",
      "icon-end-turn",
      "icon-hand",
      "icon-quest",
      "icon-settings",
      "icon-zone",
    ];
    for (const key of icons) {
      this.load.image(key, `assets/ui/icons/${key}.png`);
    }

    // Botones (assets/ui/buttons/)
    const buttons = ["button-default", "button-hover", "button-pressed", "button-disabled"];
    for (const key of buttons) {
      this.load.image(key, `assets/ui/buttons/${key}.png`);
    }

    // Elementos de HUD (assets/ui/hud/)
    this.load.image("logo", "assets/ui/hud/logo.png");
    this.load.image("nostalgia-clock", "assets/ui/hud/nostalgia-clock.png");
  }

  /** Carga los fondos de zona del tablero y los sprites de efectos. */
  private loadBoardAndEffects(): void {
    const zones = ["zone-chaotic", "zone-combat", "zone-magic", "zone-mysterious"];
    for (const key of zones) {
      this.load.image(key, `assets/board/zones/${key}.png`);
    }

    const effects = ["effect-death", "effect-impact", "effect-particles", "effect-summon"];
    for (const key of effects) {
      this.load.image(key, `assets/effects/${key}.png`);
    }
  }

  /** Carga los fondos de las escenas. */
  private loadBackgrounds(): void {
    this.load.image("bg-boot", "assets/backgrounds/bg-boot.png");
    this.load.image("bg-menu", "assets/backgrounds/bg-menu.png");
    this.load.image("bg-hero-select", "assets/backgrounds/bg-hero-select.png");
    this.load.image("bg-game", "assets/backgrounds/bg-game.png");
    this.load.image("bg-end", "assets/backgrounds/bg-end.png");
  }

  /** Carga la música de fondo y los efectos de sonido. */
  private loadAudio(): void {
    this.load.audio("music-menu", "assets/audio/music/music-menu.mp3");
    this.load.audio("music-game", "assets/audio/music/music-game.mp3");

    const sfx = [
      "sfx-attack",
      "sfx-card-flip",
      "sfx-card-play",
      "sfx-defeat",
      "sfx-end-turn",
      "sfx-victory",
    ];
    for (const key of sfx) {
      this.load.audio(key, `assets/audio/sfx/${key}.mp3`);
    }
  }
}
