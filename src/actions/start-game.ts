import {
    action,
    type KeyDownEvent,
    SingletonAction,
    type WillAppearEvent,
    type WillDisappearEvent
} from "@elgato/streamdeck";

import { setTimeout as delay } from "node:timers/promises";
import { gameState } from "../game-state";

type Settings = {};

@action({ UUID: "com.conor.whackamole.start" })
export class StartGame extends SingletonAction<Settings> {

    private visible = false;

    override async onWillAppear(
    ev: WillAppearEvent<Settings>
    ): Promise<void> {

    if (!ev.action.isKey()) {
        return;
    }

    this.visible = true;

    await ev.action.setTitle("");
    await ev.action.setImage("imgs/start.png");

    void this.updateDisplay(ev);
}

    override async onWillDisappear(): Promise<void> {
        this.visible = false;
    }

    override async onKeyDown(
        ev: KeyDownEvent<Settings>
    ): Promise<void> {

        // Ignore presses while a game is already running.
        if (gameState.running) {
            return;
        }

        gameState.score = 0;
        gameState.timeRemaining = 30;
        gameState.running = true;
        gameState.combo = 0;

    }

    private async updateDisplay(
    ev: WillAppearEvent<Settings>
): Promise<void> {

    while (this.visible) {

        if (ev.action.isKey()) {

            await ev.action.setTitle("");

            if (gameState.running) {
                await ev.action.setImage("imgs/go.png");
            } else {
                await ev.action.setImage("imgs/start.png");
            }
        }

        await delay(100);
    }
}
}