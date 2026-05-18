import Phaser from "phaser";

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: "BootScene" });
    }

    create(): void {
        const { width, height } = this.scale;

        this.add
            .text(width / 2, height / 2 - 40, "Cartas Turnos IA", {
                fontFamily: "system-ui",
                fontSize: "48px",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.add
            .text(width / 2, height / 2 + 20, "Proyecto inicializado correctamente", {
                fontFamily: "system-ui",
                fontSize: "20px",
                color: "#a0a0c0",
            })
            .setOrigin(0.5);

        this.add
            .text(width / 2, height / 2 + 60, "Fase actual: Análisis de Requisitos", {
                fontFamily: "system-ui",
                fontSize: "16px",
                color: "#6a6a8a",
            })
            .setOrigin(0.5);
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: "game-container",
    backgroundColor: "#1a1a2e",
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
    },
    scene: [BootScene],
};

new Phaser.Game(config);