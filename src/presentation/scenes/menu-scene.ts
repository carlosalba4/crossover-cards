import Phaser from "phaser";

import { Button } from "@presentation/ui/button";
import { Modal } from "@presentation/ui/modal";

// ---------------------------------------------------------------------------
// Constantes de diseño (tokens — docs/05-ui-design.md §2.1 y §3.2)
// ---------------------------------------------------------------------------

const COLOR_BG_DEEP = 0x0d0b1e;
const COLOR_BG_CARD = 0x1a1730;
const COLOR_BG_SURFACE = 0x252240;
const COLOR_ACCENT_TEAL = 0x3ecfcf;
const COLOR_ACCENT_GOLD = 0xf5c842;
const COLOR_ACCENT_GOLD_STR = "#F5C842";
const COLOR_TEXT_SECONDARY = "#9B96B0";
const COLOR_TEXT_BG_DEEP = "#0D0B1E";

const GAME_VERSION = "v1.0.0";
const PARTICLE_COUNT = 30;
const PARTICLE_MIN_SIZE = 2;
const PARTICLE_MAX_SIZE = 4;
const PARTICLE_SPEED_MIN = 10;
const PARTICLE_SPEED_MAX = 20;

// ---------------------------------------------------------------------------
// Tipo interno para partículas manuales
// ---------------------------------------------------------------------------

interface FloatingParticle {
  gfx: Phaser.GameObjects.Graphics;
  vx: number;
  vy: number;
  radius: number;
}

// ---------------------------------------------------------------------------
// Clase MenuScene
// ---------------------------------------------------------------------------

/**
 * Menú principal de Crossover Cards.
 *
 * Muestra el logo, partículas doradas flotantes y tres botones:
 * "Nueva Partida" → HeroSelectScene, "Cómo Jugar" → Modal, "Créditos" → Modal.
 *
 * Referencia de diseño: docs/05-ui-design.md §3.2.
 */
export class MenuScene extends Phaser.Scene {
  private particles: FloatingParticle[] = [];

  constructor() {
    super({ key: "MenuScene" });
  }

  // -------------------------------------------------------------------------
  // create — setup completo de la pantalla
  // -------------------------------------------------------------------------

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.createBackground(cx, cy, width, height);
    this.createParticles(width, height);
    this.createLogo(cx, cy);
    this.createButtons(cx, cy);
    this.createVersionText(height);

    // Arrancar música de menú (no la reinicia si ya está sonando).
    this.ensureMusic("music-menu");
  }

  // -------------------------------------------------------------------------
  // update — mover partículas frame a frame
  // -------------------------------------------------------------------------

  override update(): void {
    const { width, height } = this.scale;

    for (const p of this.particles) {
      const x = p.gfx.x + p.vx;
      const y = p.gfx.y + p.vy;

      // Rebote suave en los bordes
      p.gfx.x = x < 0 || x > width ? p.gfx.x - p.vx : x;
      p.gfx.y = y < 0 || y > height ? p.gfx.y - p.vy : y;

      if (x < 0 || x > width) p.vx = -p.vx;
      if (y < 0 || y > height) p.vy = -p.vy;

      // Redibujar el círculo en la nueva posición relativa al objeto
      p.gfx.clear();
      p.gfx.fillStyle(COLOR_ACCENT_GOLD, 1);
      p.gfx.fillCircle(0, 0, p.radius);
    }
  }

  // -------------------------------------------------------------------------
  // Métodos privados de construcción
  // -------------------------------------------------------------------------

  /** Crea el fondo con imagen o fallback rect + gradiente radial. */
  private createBackground(cx: number, cy: number, width: number, height: number): void {
    if (this.textures.exists("bg-menu")) {
      this.add.image(cx, cy, "bg-menu").setDisplaySize(width, height);
    } else {
      this.add.rectangle(cx, cy, width, height, COLOR_BG_DEEP);
    }

    // Gradiente radial sutil: centro más claro (bg-card) → bordes oscuros (bg-deep)
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(COLOR_BG_CARD, COLOR_BG_CARD, COLOR_BG_DEEP, COLOR_BG_DEEP, 0.35);
    gradient.fillRect(0, 0, width, height);
  }

  /**
   * Crea 30 partículas doradas flotantes implementadas como Graphics
   * individuales con velocidades aleatorias (Phaser 4 — sin Particles API).
   */
  private createParticles(width: number, height: number): void {
    this.particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = PARTICLE_MIN_SIZE + Math.random() * (PARTICLE_MAX_SIZE - PARTICLE_MIN_SIZE);
      const gfx = this.add.graphics();
      gfx.fillStyle(COLOR_ACCENT_GOLD, 0.6 + Math.random() * 0.4);
      gfx.fillCircle(0, 0, radius);
      gfx.x = Math.random() * width;
      gfx.y = Math.random() * height;

      const speed = PARTICLE_SPEED_MIN + Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN);
      const angle = Math.random() * Math.PI * 2;
      // Convertir velocidad px/s → px/frame (Phaser corre a ~60 fps)
      const vx = (Math.cos(angle) * speed) / 60;
      const vy = (Math.sin(angle) * speed) / 60;

      this.particles.push({ gfx, vx, vy, radius });
    }
  }

  /**
   * Muestra el logo del juego. Si el sprite "logo" está cargado, lo usa como
   * título visual centrado en la parte superior; en caso contrario, recurre al
   * título tipográfico "CROSSOVER / CARDS" con sombra.
   */
  private createLogo(cx: number, cy: number): void {
    if (this.textures.exists("logo")) {
      const logo = this.add.image(cx, cy - 160, "logo").setOrigin(0.5);

      // Escalar el logo para que ocupe un ancho razonable sin deformarse,
      // limitando también la altura para no invadir los botones.
      const maxWidth = 520;
      const maxHeight = 260;
      const scale = Math.min(maxWidth / logo.width, maxHeight / logo.height, 1);
      logo.setScale(scale);
      return;
    }

    this.add
      .text(cx, cy - 200, "CROSSOVER", {
        fontFamily: "Bangers, system-ui",
        fontSize: "64px",
        color: COLOR_ACCENT_GOLD_STR,
        shadow: {
          color: "#7a6400",
          offsetX: 3,
          offsetY: 3,
          blur: 8,
          fill: true,
        },
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 130, "CARDS", {
        fontFamily: "Bangers, system-ui",
        fontSize: "48px",
        color: COLOR_ACCENT_GOLD_STR,
        shadow: {
          color: "#7a6400",
          offsetX: 3,
          offsetY: 3,
          blur: 8,
          fill: true,
        },
      })
      .setOrigin(0.5);
  }

  /**
   * Crea los tres botones del menú apilados verticalmente.
   * Separación entre botones: 24px (height 56 + gap 24 = 80px por botón).
   */
  private createButtons(cx: number, cy: number): void {
    const BTN_W = 320;
    const BTN_H = 110;
    const BTN_GAP = 18;
    const startY = cy + 20;

    // Botón 1 — Nueva Partida (accent-teal)
    new Button({
      scene: this,
      x: cx,
      y: startY,
      width: BTN_W,
      height: BTN_H,
      label: "",
      backgroundColor: COLOR_ACCENT_TEAL,
      textColor: COLOR_TEXT_BG_DEEP,
      fontSize: "28px",
      onClick: () => {
        this.startGame();
      },
    });

    // Botón 2 — Cómo Jugar (bg-surface)
    new Button({
      scene: this,
      x: cx,
      y: startY + BTN_H + BTN_GAP,
      width: BTN_W,
      height: BTN_H,
      label: "",
      texturePrefix: "instrucciones",
      backgroundColor: COLOR_BG_SURFACE,
      textColor: "#F0EAD6",
      fontSize: "20px",
      fontFamily: "Nunito, system-ui",
      onClick: () => {
        this.showHowToPlay();
      },
    });

    // Botón 3 — Créditos (bg-surface)
    new Button({
      scene: this,
      x: cx,
      y: startY + (BTN_H + BTN_GAP) * 2,
      width: BTN_W,
      height: BTN_H,
      label: "",
      texturePrefix: "creditos",
      backgroundColor: COLOR_BG_SURFACE,
      textColor: "#F0EAD6",
      fontSize: "20px",
      fontFamily: "Nunito, system-ui",
      onClick: () => {
        this.showCredits();
      },
    });
  }

  /** Texto de versión en esquina inferior izquierda. */
  private createVersionText(height: number): void {
    this.add
      .text(20, height - 20, GAME_VERSION, {
        fontFamily: "Nunito, system-ui",
        fontSize: "12px",
        color: COLOR_TEXT_SECONDARY,
      })
      .setOrigin(0, 1);
  }

  // -------------------------------------------------------------------------
  // Acciones de los botones
  // -------------------------------------------------------------------------

  /** Transición con fadeOut a HeroSelectScene. */
  private startGame(): void {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("HeroSelectScene");
    });
  }

  /** Muestra el modal con instrucciones de juego. */
  private showHowToPlay(): void {
    Modal.show(this, {
      title: "Cómo Jugar",
      body: "1. Elige un héroe.\n2. Juega cartas gastando Nostalgia.\n3. Ataca con tus Personajes.\n4. Reduce la vida del rival a 0.\n\nUsa el sistema de Momentum cuando tu vida baje de 15.",
    });
  }

  /** Muestra el modal de créditos del proyecto. */
  private showCredits(): void {
    Modal.show(this, {
      title: "Créditos",
      body: "Crossover Cards v1.0.0\n\nDesarrollo: Equipo (2 personas)\nAsignatura: IA y Big Data\n\nSprites: respectivos propietarios\n(CN, Nickelodeon, Toei, Level-5)\nUso exclusivamente académico.",
    });
  }

  // -------------------------------------------------------------------------
  // Música
  // -------------------------------------------------------------------------

  /**
   * Arranca la pista indicada si no está ya reproduciéndose.
   * No detiene ninguna otra pista (la continuidad de music-menu entre
   * MenuScene y HeroSelectScene se obtiene al no reiniciarla).
   */
  private ensureMusic(key: "music-menu" | "music-game"): void {
    const existing = this.sound.get(key);
    if (existing?.isPlaying) return;
    this.sound.play(key, { loop: true, volume: 0.3 });
  }
}
