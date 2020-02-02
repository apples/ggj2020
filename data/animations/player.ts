import { AnimationSchema } from "../../src/engine/engineinterfaces";
import { SequenceTypes } from "../../src/engine/enums";

export const playerAnim: AnimationSchema = {
    [SequenceTypes.walk]: [
        {
            ticks: 0,
            texture: "./data/textures/ship2.png",
            nextFrame: 0
       },
    ],
    [SequenceTypes.attack]: [
        {
            ticks: 0,
            texture: "./data/textures/ship2Blue.png",
            nextFrame: 0
       },
    ],
}