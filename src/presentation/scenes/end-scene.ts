import Phaser from "phaser";
import { Button } from "@presentation/ui/button";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

/** Estadísticas opcionales de la partida, pasadas desde GameScene. */
export interface EndSceneStats {
  turns: number;
  damageDealt: number;
  cardsPlayed: number;
}

/** Datos de inicio de la EndScene, recibidos vía scene.start(). */
export interface EndSceneData {
  winnerId: string | null;
  loserId: string | null;
  isDraw: boolean;
  stats?: EndSceneStats;
}

// ---------------------------------------------------------------------------
// Constantes de paleta (tokens del documento UI §2.1)
// ---------------------------------------------------------------------------

/** Fondo principal de todas las escenas. */
const BG_DEEP = 0x0d0b1e;
/** Color de superficie elevada (fondo del banner de resultado). */
const BG_SURFACE = 0x252240;
/** Texto primario. */
const TEXT_PRIMARY = "#F0EAD6";
/** Texto secundario. */
const TEXT_SECONDARY = "#9B96B0";
/** Acento dorado — Victoria. */
const ACCENT_GOLD = "#F5C842";
const ACCENT_GOLD_NUM = 0xf5c842;
/** Acento teal — Empate y botón "Jugar de nuevo". */
const ACCENT_TEAL = "#3ECFCF";
const ACCENT_TEAL_NUM = 0x3ecfcf;
/** Rojo feedback — Derrota. */
const FEEDBACK_DAMAGE = "#FF3B3B";
/** Superficie de fondo para botón secundario. */
const BG_SURFACE_NUM = 0x252240;

// ---------------------------------------------------------------------------
// EndScene
// ---------------------------------------------------------------------------

/**
 * Pantalla de resultado de la partida.
 *
 * Recibe datos de resultado vía `scene.start('EndScene', data: EndSceneData)`.
 * El playerId del jugador humano es siempre 'p1'.
 *
 * Referencia: docs/05-ui-design.md §3.5 EndScene.
 */
export class EndScene extends Phaser.Scene {
  // Datos del resultado de la partida
  private winnerId: string | null = null;
  private loserId: string | null = null;
  private isDraw: boolean = false;
  private stats: EndSceneStats | null = null;

  constructor() {
    super({ key: "EndScene" });
  }

  // ---------------------------------------------------------------------------
  // Ciclo de vida de Phaser
  // ---------------------------------------------------------------------------

  /**
   * Almacena los datos del resultado recibidos desde GameScene.
   */
  init(data: EndSceneData): void {
    this.winnerId = data.winnerId ?? null;
    this.loserId = data.loserId ?? null;
    this.isDraw = data.isDraw ?? false;
    this.stats = data.stats ?? null;
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Parar music-game si estuviese sonando al llegar a la pantalla de resultado.
    // EndScene no inicia ninguna pista nueva.
    const gameTrack1 = this.sound.get("music-game");
    if (gameTrack1?.isPlaying) gameTrack1.stop();
    const gameTrack2 = this.sound.get("music-game2");
    if (gameTrack2?.isPlaying) gameTrack2.stop();

    // 1. Fondo bg-deep con vignette
    this.drawBackground(width, height);

    // 2. Determinar resultado para el jugador humano (playerId siempre 'p1')
    const isVictory = !this.isDraw && this.winnerId === "p1";
    const isDefeat = !this.isDraw && this.loserId === "p1";

    // 3. Overlay oscuro solo en derrota (fade-in 1s)
    if (isDefeat) {
      this.createDefeatOverlay(width, height);
    }

    // 4. Partículas de victoria (solo si gana)
    if (isVictory) {
      this.createVictoryParticles(cx, cy, width, height);
    }

    // 5. Banner de resultado con animación de entrada
    const bannerLabel = isVictory ? "VICTORIA" : isDefeat ? "DERROTA" : "EMPATE";
    const bannerColor = isVictory ? ACCENT_GOLD : isDefeat ? FEEDBACK_DAMAGE : ACCENT_TEAL;
    this.createResultBanner(cx, cy - 120, bannerLabel, bannerColor);

    // 6. Estadísticas
    this.createStatsPanel(cx, cy + 60);

    // 7. Botones de navegación
    this.createNavigationButtons(cx, cy + 220);
  }

  // ---------------------------------------------------------------------------
  // Métodos privados de construcción visual
  // ---------------------------------------------------------------------------

  /**
   * Dibuja el fondo bg-deep con vignette oscuro en bordes usando Graphics.
   */
  private drawBackground(width: number, height: number): void {
    // Fondo: imagen bg-end si está cargada; si no, color sólido como fallback.
    if (this.textures.exists("bg-end")) {
      this.add.image(width / 2, height / 2, "bg-end").setDisplaySize(width, height);
    } else {
      const bg = this.add.graphics();
      bg.fillStyle(BG_DEEP, 1);
      bg.fillRect(0, 0, width, height);
    }

    // Vignette: gradiente radial simulado con elipses concéntricas oscuras
    const vignette = this.add.graphics();
    const vignetteSteps = 8;
    for (let i = vignetteSteps; i >= 1; i--) {
      const alpha = ((vignetteSteps - i) / vignetteSteps) * 0.55;
      const radiusX = (width / 2) * (i / vignetteSteps);
      const radiusY = (height / 2) * (i / vignetteSteps);
      vignette.fillStyle(0x000000, alpha);
      vignette.fillEllipse(width / 2, height / 2, radiusX * 2, radiusY * 2);
    }
    vignette.setDepth(1);
    vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  /**
   * Overlay oscuro semitransparente para la pantalla de derrota.
   * Aparece en fade-in de 1s (spec §3.5).
   */
  private createDefeatOverlay(width: number, height: number): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);
    overlay.setAlpha(0);
    overlay.setDepth(2);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 1000,
      ease: "Quad.easeIn",
    });
  }

  /**
   * Sistema de partículas doradas para la pantalla de victoria.
   * Explosión inicial 3s + loop suave continuo (spec §3.5).
   */
  private createVictoryParticles(cx: number, cy: number, width: number, _height: number): void {
    // Explosión inicial centrada (duración 3s)
    const explosionEmitter = this.add.particles(cx, cy - 100, "__DEFAULT", {
      speed: { min: 150, max: 500 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.15, end: 0 },
      color: [ACCENT_GOLD_NUM, 0xffffff, 0xffdd44, 0xffaa00],
      lifespan: { min: 800, max: 2000 },
      quantity: 5,
      gravityY: 120,
      duration: 3000,
    });
    explosionEmitter.setDepth(10);

    // Lluvia suave continua desde la parte superior
    const rainEmitter = this.add.particles(cx, 0, "__DEFAULT", {
      x: { min: 0, max: width },
      speedX: { min: -40, max: 40 },
      speedY: { min: 60, max: 180 },
      scale: { min: 0.04, max: 0.12 },
      color: [ACCENT_GOLD_NUM, 0xffdd44, 0xffffff],
      lifespan: { min: 2000, max: 4000 },
      quantity: 1,
      frequency: 80,
      gravityY: 30,
    });
    rainEmitter.setDepth(10);
    rainEmitter.setPosition(width / 2, 0);

    // Confeti de 8 colores (duración 3s cada emitter)
    const confettiColors = [
      0xf5c842, 0x3ecfcf, 0xff6b35, 0x7b4fdb, 0xe83e3e, 0x39d98a, 0xffffff, 0xff3b3b,
    ];
    confettiColors.forEach((color) => {
      const confetti = this.add.particles(cx, cy - 80, "__DEFAULT", {
        x: { min: -width / 2, max: width / 2 },
        speedX: { min: -100, max: 100 },
        speedY: { min: -200, max: -50 },
        scale: { start: 0.08, end: 0.03 },
        color: [color],
        lifespan: { min: 1500, max: 3500 },
        quantity: 1,
        frequency: 180,
        gravityY: 80,
        duration: 3000,
      });
      confetti.setDepth(10);
    });
  }

  /**
   * Crea el banner central con el texto de resultado.
   * Animación de entrada: fade-in + scale 0.8 → 1 en 0.6s ease-out (spec §3.5).
   */
  private createResultBanner(cx: number, cy: number, text: string, color: string): void {
    // Fondo del banner: 560×120px
    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(BG_SURFACE, 1);
    bannerBg.fillRoundedRect(cx - 280, cy - 60, 560, 120, 12);
    // Borde con el color del resultado
    const borderColorNum =
      color === ACCENT_GOLD ? ACCENT_GOLD_NUM : color === ACCENT_TEAL ? ACCENT_TEAL_NUM : 0xff3b3b;
    bannerBg.lineStyle(3, borderColorNum, 1);
    bannerBg.strokeRoundedRect(cx - 280, cy - 60, 560, 120, 12);
    bannerBg.setAlpha(0);
    bannerBg.setDepth(5);

    // Texto del resultado: Bangers 72px
    const bannerText = this.add.text(cx, cy, text, {
      fontFamily: "Bangers",
      fontSize: "72px",
      color: color,
      stroke: "rgba(0,0,0,0.8)",
      strokeThickness: 4,
    });
    bannerText.setOrigin(0.5, 0.5);
    bannerText.setAlpha(0);
    bannerText.setScale(0.8);
    bannerText.setDepth(6);

    // Animación de entrada: fade-in + scale 0.8 → 1 en 0.6s ease-out
    this.tweens.add({
      targets: [bannerBg, bannerText],
      alpha: 1,
      duration: 600,
      ease: "Quad.easeOut",
      delay: 200,
    });
    this.tweens.add({
      targets: bannerText,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: "Back.easeOut",
      delay: 200,
    });
  }

  /**
   * Crea el panel de estadísticas de la partida.
   * Si stats no está disponible, muestra placeholders '—' sin errores.
   */
  private createStatsPanel(cx: number, cy: number): void {
    const turns = this.stats?.turns ?? null;
    const damage = this.stats?.damageDealt ?? null;
    const cards = this.stats?.cardsPlayed ?? null;

    const placeholder = "—";

    // Fondo del panel
    const statsBg = this.add.graphics();
    statsBg.fillStyle(BG_SURFACE, 0.7);
    statsBg.fillRoundedRect(cx - 320, cy - 50, 640, 100, 8);
    statsBg.setDepth(5);

    const statsData: Array<{ label: string; value: string }> = [
      { label: "Turnos jugados", value: turns !== null ? String(turns) : placeholder },
      { label: "Daño infligido", value: damage !== null ? String(damage) : placeholder },
      { label: "Cartas jugadas", value: cards !== null ? String(cards) : placeholder },
    ];

    // 3 columnas uniformes
    const colPositions = [cx - 200, cx, cx + 200];

    statsData.forEach((stat, i) => {
      const x = colPositions[i];

      // Etiqueta en text-secondary
      this.add
        .text(x, cy - 20, stat.label, {
          fontFamily: "Nunito",
          fontSize: "14px",
          color: TEXT_SECONDARY,
        })
        .setOrigin(0.5, 0.5)
        .setDepth(6);

      // Valor en text-primary Bold
      this.add
        .text(x, cy + 18, stat.value, {
          fontFamily: "Nunito",
          fontSize: "22px",
          color: TEXT_PRIMARY,
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0.5)
        .setDepth(6);
    });
  }

  /**
   * Crea los botones de navegación:
   * - "Jugar de nuevo" (144×56px, accent-teal) → HeroSelectScene (fade 0.4s)
   * - "Volver al menú" (144×56px, bg-surface) → MenuScene (fade 0.4s)
   */
  private createNavigationButtons(cx: number, cy: number): void {
    new Button({
      scene: this,
      x: cx - 100,
      y: cy,
      width: 180,
      height: 72,
      label: "",
      texturePrefix: "jugardenuevo",
      backgroundColor: ACCENT_TEAL_NUM,
      textColor: "#0D0B1E",
      fontSize: "18px",
      fontFamily: "Bangers",
      onClick: () => {
        this.navigateTo("HeroSelectScene");
      },
    }).setDepth(7);

    new Button({
      scene: this,
      x: cx + 100,
      y: cy,
      width: 180,
      height: 72,
      label: "",
      texturePrefix: "volver",
      backgroundColor: BG_SURFACE_NUM,
      textColor: TEXT_PRIMARY,
      fontSize: "18px",
      fontFamily: "Bangers",
      onClick: () => {
        this.navigateTo("MenuScene");
      },
    }).setDepth(7);
  }

  /**
   * Fade-out de cámara en 0.4s y transición a la escena destino.
   */
  private navigateTo(sceneKey: string): void {
    this.cameras.main.fadeOut(400, 13, 11, 30);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(sceneKey);
    });
  }
}
