import streamDeck,{
	action,
	type KeyDownEvent,
	SingletonAction,
	type WillAppearEvent,
	type WillDisappearEvent
} from "@elgato/streamdeck";

import { gameState } from "../game-state";
import { setTimeout as delay } from "node:timers/promises";

type Settings = {};

@action({ UUID: "com.conor.whackamole.increment" })
export class IncrementCounter extends SingletonAction<Settings> {

	private holes = new Map<string, any>();
	private activeMoleId: string | null = null;
	private lastMoleId: string | null = null;
	private demoStarted = false;
	private moleWasHit = false;
	private isGoldenMole = false;

	private readonly GOLDEN_MOLE_CHANCE = 0.07;
	private readonly GOLDEN_MOLE_BONUS = 5;

	private isBomb = false;

	private getBombChance(): number {

    if (gameState.score >= 40) {
        return 0.18; // 18%
    }

    if (gameState.score >= 30) {
        return 0.15; // 15%
    }

    if (gameState.score >= 20) {
        return 0.12; // 12%
    }

    if (gameState.score >= 10) {
        return 0.10; // 10%
    }

    return 0.06; // 6%
}
	private readonly BOMB_PENALTY = 3;

	private isTimeMole = false;

	private readonly TIME_MOLE_CHANCE = 0.03;
	private readonly TIME_MOLE_BONUS = 3;

	private getComboMultiplier(): number {

    if (gameState.combo >= 10) {
        return 3;
    }

    if (gameState.combo >= 5) {
        return 2;
    }

    return 1;
}

	override async onWillAppear(
		ev: WillAppearEvent<Settings>
	): Promise<void> {

		if (!ev.action.isKey()) {
			return;
		}

		this.holes.set(ev.action.id, ev.action);

		await ev.action.setTitle("");
		await ev.action.setImage("imgs/hole.png");

		streamDeck.logger.info(`Hole appeared: ${ev.action.id}`);
		streamDeck.logger.info(`Visible holes: ${this.holes.size}`);

		if (!this.demoStarted) {
			this.demoStarted = true;

			await delay(1500);

			void this.runDemo();
		}
	}

	override async onWillDisappear(
    ev: WillDisappearEvent<Settings>
): Promise<void> {

    this.holes.delete(ev.action.id);

    // If we've left the Whack-a-Mole folder, stop the game.
    if (this.holes.size === 0) {
        gameState.running = false;
        gameState.score = 0;
        this.activeMoleId = null;
    	}	
	}

	override async onKeyDown(
		ev: KeyDownEvent<Settings>
	): Promise<void> {

		if (ev.action.id !== this.activeMoleId) {
    return;
}

this.moleWasHit = true;
this.activeMoleId = null;

if (this.isBomb) {

    gameState.score -= this.BOMB_PENALTY;

    if (gameState.score < 0) {
        gameState.score = 0;
    }

    gameState.combo = 0;

    await ev.action.setTitle("BOOM!\n-3");
    await ev.action.setImage("imgs/bomb-hit.png");

    await delay(250);

} 

	else {

    gameState.combo++;

    const multiplier = this.getComboMultiplier();

    if (this.isGoldenMole) {

        const points =
            this.GOLDEN_MOLE_BONUS * multiplier;

        gameState.score += points;

        await ev.action.setTitle(`+${points}\nX${multiplier}`);
        await ev.action.setImage("imgs/golden-hit.png");

        await delay(180);

    } else if(this.isTimeMole) {

    gameState.combo++;
    gameState.timeRemaining += this.TIME_MOLE_BONUS;

    await ev.action.setTitle("+3 SEC!");
    await ev.action.setImage("imgs/time-hit.png");

    await delay(180);
	} else {

        const points = 1 * multiplier;

        gameState.score += points;

        await ev.action.setTitle(`+${points}\nX${multiplier}`);
        await ev.action.setImage("imgs/hit.png");

        await delay(120);
    }
}

await ev.action.setTitle("");
await ev.action.setImage("imgs/hole.png");
	}

	private getMoleSpeed(): number {

	if (
        gameState.running &&
        gameState.timeRemaining <= 5
    ) {
        return 225;
    }

    if (gameState.combo >= 30) {
		return 275;
	}
	
	else if (gameState.score >= 30) {
        return 325;
    }

    else if (gameState.score >= 20) {
        return 475;
    }

    else if (gameState.score >= 15) {
        return 575;
    }

    else if (gameState.score >= 10) {
        return 700;
    }

    else if (gameState.score >= 5) {
        return 850;
    }

    return 1000;
}

	private async runDemo(): Promise<void> {

		while (true) {

			if (!gameState.running) {

    		if (this.activeMoleId) {
        	const activeMole = this.holes.get(this.activeMoleId);

        	if (activeMole?.isKey()) {
            await activeMole.setImage("imgs/hole.png");
        }

        this.activeMoleId = null;
    }

    await delay(100);
    continue;
}

			const holes = [...this.holes.values()]
				.filter(hole => hole.isKey());

			if (holes.length === 0) {
				await delay(500);
				continue;
			}

			if (this.activeMoleId) {
				const previous = this.holes.get(this.activeMoleId);

				if (previous?.isKey()) {
					await previous.setImage("imgs/hole.png");
				}
			}

			const possibleHoles = holes.filter(
    		hole => hole.id !== this.lastMoleId
			);

			const randomIndex =
    		Math.floor(Math.random() * possibleHoles.length);

			const mole = possibleHoles[randomIndex];

			this.lastMoleId = mole.id;
			// Decide what type of spawn this is
			const roll = Math.random();

			const bombChance = this.getBombChance();

			this.isBomb =
    		roll < bombChance;

			this.isGoldenMole =
    		!this.isBomb &&
    		roll <
        	bombChance +
        	this.GOLDEN_MOLE_CHANCE;

			this.isTimeMole =
    		!this.isBomb &&
    		!this.isGoldenMole &&
    		roll <
        	bombChance +
        	this.GOLDEN_MOLE_CHANCE +
        	this.TIME_MOLE_CHANCE;

// Reset BEFORE displaying the new mole
			this.moleWasHit = false;
			this.activeMoleId = mole.id;

			if (this.isBomb) {

    await mole.setImage("imgs/bomb.png");

} else if (this.isGoldenMole && gameState.combo >= 10) {

    await mole.setImage("imgs/fire-golden-mole.png");

} else if (this.isTimeMole && gameState.combo >= 10) {

    await mole.setImage("imgs/fire-time-mole.png");

} else if (this.isGoldenMole) {

    await mole.setImage("imgs/golden-mole.png");

} else if (this.isTimeMole) {

    await mole.setImage("imgs/time-mole.png");

} else if (gameState.combo >= 10) {

    await mole.setImage("imgs/fire-mole.png");

} else {

    await mole.setImage("imgs/mole.png");
}

			let displayTime = this.getMoleSpeed();

			if (this.isGoldenMole) {
    			displayTime += 150;
			}

			if (this.isBomb) {
    			displayTime += 100;
			}

			if (this.isTimeMole) {
				displayTime += 150;
			}
			const checkInterval = 10;

			let elapsed = 0;

			while (
    			elapsed < displayTime &&
    			!this.moleWasHit &&
    			gameState.running
			) {
    		await delay(checkInterval);
    		elapsed += checkInterval;
			}
			// Mole timed out without being hit
			if (
    			gameState.running &&
    			!this.moleWasHit &&
				!this.isBomb
			) {
    			gameState.combo = 0;
			}
		}
	}
}