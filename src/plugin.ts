import streamDeck from "@elgato/streamdeck";

import { IncrementCounter } from "./actions/increment-counter";
import { StartGame } from "./actions/start-game";
import { ScoreDisplay } from "./actions/score";
import { TimerDisplay } from "./actions/timer";
import { BestScore } from "./actions/best-score";

streamDeck.logger.setLevel("trace");

streamDeck.actions.registerAction(new IncrementCounter());
streamDeck.actions.registerAction(new StartGame());
streamDeck.actions.registerAction(new ScoreDisplay());
streamDeck.actions.registerAction(new TimerDisplay());
streamDeck.actions.registerAction(new BestScore());

streamDeck.connect();