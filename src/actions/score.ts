import {
    action,
    SingletonAction,
    type WillAppearEvent,
    type WillDisappearEvent
} from "@elgato/streamdeck";

import { setTimeout as delay } from "node:timers/promises";
import { gameState } from "../game-state";

type Settings = {};

@action({ UUID: "com.conor.whackamole.score" })
export class ScoreDisplay extends SingletonAction<Settings> {

    private visible = false;

    override async onWillAppear(
        ev: WillAppearEvent<Settings>
    ): Promise<void> {

        if (!ev.action.isKey()) {
            return;
        }

        this.visible = true;

        void this.updateScore(ev);
    }

    override async onWillDisappear(): Promise<void> {
        this.visible = false;
    }

    private async updateScore(
        ev: WillAppearEvent<Settings>
    ): Promise<void> {

        while (this.visible) {

            if (ev.action.isKey()) {
                await ev.action.setTitle(`\n${gameState.score}`);
                await ev.action.setImage("imgs/score.png");
            }

            await delay(100);
        }
    }
}