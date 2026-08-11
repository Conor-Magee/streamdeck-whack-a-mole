import streamDeck, {
    action,
    SingletonAction,
    type WillAppearEvent,
    type WillDisappearEvent,
    type KeyDownEvent,
    type KeyUpEvent
} from "@elgato/streamdeck";

import { setTimeout as delay } from "node:timers/promises";
import { gameState } from "../game-state";

type Settings = {};

type GlobalSettings = {
    highScore?: number;
};

@action({ UUID: "com.conor.whackamole.best" })
export class BestScore extends SingletonAction<Settings> {

    private visible = false;
    private pressStartedAt = 0;
    private showingResetMessage = false;

    override async onWillAppear(
        ev: WillAppearEvent<Settings>
    ): Promise<void> {

        if (!ev.action.isKey()) {
            return;
        }

        this.visible = true;

        // Load the saved high score.
        const settings =
            await streamDeck.settings.getGlobalSettings<GlobalSettings>();

        gameState.highScore = settings.highScore ?? 0;

        void this.updateDisplay(ev);
    }

    override async onWillDisappear(): Promise<void> {
        this.visible = false;
    }

    override async onKeyDown(
    ev: KeyDownEvent<Settings>
): Promise<void> {

    this.pressStartedAt = Date.now();
}

override async onKeyUp(
    ev: KeyUpEvent<Settings>
): Promise<void> {

    const heldFor = Date.now() - this.pressStartedAt;

    if (heldFor >= 5000 && !gameState.running) {

        gameState.highScore = 0;

        await streamDeck.settings.setGlobalSettings<GlobalSettings>({
            highScore: 0
        });

        if (ev.action.isKey()) {

            this.showingResetMessage = true;

            await ev.action.setTitle("\nXX");

            await delay(1500); // stays visible for 1.5 seconds

            this.showingResetMessage = false;

            await ev.action.setTitle("\n0");
        }
    }
}

    private async updateDisplay(
        ev: WillAppearEvent<Settings>
    ): Promise<void> {

        while (this.visible) {

            if (
                !gameState.running &&
                gameState.timeRemaining === 0 &&
                gameState.score > gameState.highScore
            ) {

                gameState.highScore = gameState.score;

                await streamDeck.settings.setGlobalSettings<GlobalSettings>({
                highScore: gameState.highScore
            });
        }

            if (
                ev.action.isKey() &&
                !this.showingResetMessage
            ) {
                await ev.action.setTitle(
                `\n${gameState.highScore}`
            );
                await ev.action.setImage("imgs/best.png")
            }

            await delay(100);
        }
    }
}