import {
    action,
    SingletonAction,
    type WillAppearEvent,
    type WillDisappearEvent
} from "@elgato/streamdeck";

import { setTimeout as delay } from "node:timers/promises";
import { gameState } from "../game-state";

type Settings = {};

@action({ UUID: "com.conor.whackamole.timer" })
export class TimerDisplay extends SingletonAction<Settings> {

    private visible = false;
    private countdownRunning = false;

    override async onWillAppear(
        ev: WillAppearEvent<Settings>
    ): Promise<void> {

        if (!ev.action.isKey()) {
            return;
        }

        this.visible = true;

        void this.updateDisplay(ev);

        if (!this.countdownRunning) {
            this.countdownRunning = true;
            void this.runCountdown();
        }
    }

    override async onWillDisappear(): Promise<void> {
        this.visible = false;
    }

    private async updateDisplay(
        ev: WillAppearEvent<Settings>
    ): Promise<void> {

        while (this.visible) {

            if (ev.action.isKey()) {
                await ev.action.setTitle(
                    `\n${gameState.timeRemaining}`
                
                );
                await ev.action.setImage("imgs/time.png")
            }

            await delay(100);
        }
    }

    private async runCountdown(): Promise<void> {

        while (true) {

            if (!gameState.running) {
                await delay(100);
                continue;
            }

            await delay(1000);

            // The game may have been stopped while waiting.
            if (!gameState.running) {
                continue;
            }

            gameState.timeRemaining--;

            if (gameState.timeRemaining <= 0) {
                gameState.timeRemaining = 0;
                gameState.running = false;
            }
        }
    }
}