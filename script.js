"use strict";
console.clear();

const ballcode = "mb52sdi";
const startbal = 250;
const cutoff = 1.5;
const extras = 2;
const version = "v5.1.3"
const ballc = "#fc3";

const width = 620;
const height = 534;

class Note {
    constructor(note) {
        this.synth = new Tone.PolySynth().toDestination();
        this.synth.set({ volume: -6 });
        this.note = note;
    }

    play() {
        return this.synth.triggerAttackRelease(this.note, "32n", Tone.context.currentTime);
    }
}

const multipliers = [
    35, 
    25, 
    15, 
    10, 
    5, 
    3, 
    2, 
    0.5, 
    0.25, 
    0.5, 
    2, 
    3, 
    5, 
    10, 
    15, 
    25, 
    35
];

multipliers.forEach((m, i) => (document.getElementById(`note-${i}`).innerHTML = m));

const notes = ["C#5","C5","B5","A#5","A5","G#4","G4","F#4","F4","F#4","G4","G#4","A5","A#5","B5","C5","C#5"].map((note) => new Note(note));

let balls
const ballsEl = document.getElementById("balls");

if (localStorage.getItem(ballcode) === null) {
    localStorage.setItem(ballcode, startbal);
    balls = startbal;
} else {
    balls = parseInt(localStorage.getItem(ballcode));
}

const clickSynth = new Tone.NoiseSynth({ volume: -26 }).toDestination();

const dropButton = document.getElementById("drop-button");
const autoDropCheckbox = document.getElementById("checkbox");
let autoDropEnabled = false;
let autoDroppingInterval = null;

function notify(text, duration, level) {
    const bar = document.getElementById("notf");
    const title = document.getElementById("nott");

    title.innerHTML = text;
    bar.style.left = "3%";

    if (level == 3) {
        document.getElementById("esound").play();
    }

    setTimeout(() => {
        bar.style.left = "-20%";
    }, duration * 1000);
}

dropButton.addEventListener("click", () => {
    if (autoDropEnabled && autoDroppingInterval) {
        dropButton.innerHTML = "Start";
        clearInterval(autoDroppingInterval);
        autoDroppingInterval = null;
    } else if (autoDropEnabled && !autoDroppingInterval) {
        dropButton.innerHTML = "Stop";
        dropABall();
        autoDroppingInterval = setInterval(dropABall, 250);
    } else if (!autoDropEnabled) {
        dropABall();
    }
});

autoDropCheckbox.addEventListener("input", (e) => {
    autoDropEnabled = e.target.checked;
    if (autoDropEnabled) {
        dropButton.innerHTML = "Start";
    } else {
        dropButton.innerHTML = "Drop";
    }
    if (autoDroppingInterval) {
        clearInterval(autoDroppingInterval);
        autoDroppingInterval = null;
    }
});

const BALL_RAD = 7;
function dropABall() {
    if (balls >= document.getElementById("sjasd").value * cutoff && document.getElementById("sjasd").value < 1) {
        balls -= document.getElementById("sjasd").value * cutoff;
    }
    if (balls >= document.getElementById("sjasd").value * cutoff) {
        for (let i = 0; i < document.getElementById("sjasd").value; i++ && document.getElementById("sjasd").value > 1) {
            balls -= document.getElementById("sjasd").value * cutoff;
            const dropLeft = width / 2 - GAP;
            const dropRight = width / 2 + GAP;
            const dropWidth = dropRight - dropLeft;
            const x = Math.random() * dropWidth + dropLeft;
            const y = -PEG_RAD;
            const ball = Bodies.circle(x, y, BALL_RAD, {
                label: "Ball",
                restitution: 0.6,
                render: {
                    fillStyle: ballc
                }
            });
            clickSynth.triggerAttackRelease("32n", Tone.context.currentTime);
            Composite.add(engine.world, [ball]);
        }
    } else {
        let c = Math.floor(Math.random() * 3);
        if (c === 0) {
            notify("Your bet is too much!", 3.15, 3);
        } else if (c === 1) {
            notify("Try lower numbers.", 3.15, 3);
        } else if (c === 2) {
            notify(`You don't have ${document.getElementById("sjasd").value * cutoff}$!`, 3.15, 3);
        }
    }
}

const Engine = Matter.Engine, Events = Matter.Events, Render = Matter.Render, Runner = Matter.Runner, Bodies = Matter.Bodies, Composite = Matter.Composite;

const engine = Engine.create({
    gravity: {
        scale: 0.0007
    }
});

const canvas = document.getElementById("canvas");
const render = Render.create({
    canvas,
    engine,
    options: {
        width,
        height,
        wireframes: false
    }
});

const GAP = 32;
const PEG_RAD = 1;
const pegs = [];
for (let r = 0; r < 16; r++) {
    const pegsInRow = r + 3;
    for (let c = 0; c < pegsInRow; c++) {
        const x = width / 2 + (c - (pegsInRow - 1) / 2) * GAP;
        const y = GAP + r * GAP;
        const peg = Bodies.circle(x, y, PEG_RAD, {
            isStatic: true,
            label: "Peg",
            render: {
                fillStyle: "#fff"
            }
        });
        pegs.push(peg);
    }
}
Composite.add(engine.world, pegs);

const pegAnims = new Array(pegs.length).fill(null);

const ground = Bodies.rectangle(width / 2, height + 22, width * 2, 40, {
    isStatic: true,
    label: "Ground"
});
Composite.add(engine.world, [ground]);

function checkCollision(event, label1, label2, callback) {
    event.pairs.forEach(({ bodyA, bodyB }) => {
        let body1, body2;
        if (bodyA.label === label1 && bodyB.label === label2) {
            body1 = bodyA;
            body2 = bodyB;
        } else if (bodyA.label === label2 && bodyB.label === label1) {
            body1 = bodyB;
            body2 = bodyA;
        }
        if (body1 && body2) {
            callback(body1, body2);
        }
    });
}

Matter.Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach(({ bodyA, bodyB }) => {
        checkCollision(event, "Ball", "Ground", (ballToRemove) => {
            Matter.Composite.remove(engine.world, ballToRemove);
            const index = Math.floor((ballToRemove.position.x - width / 2) / GAP + 17 / 2);
            if (index >= 0 && index < 17) {
                const ballsWon = multipliers[index];
                balls = balls + Math.floor(ballsWon * extras);
                if (balls < 0) {
                    balls = 0;
                }
                const el = document.getElementById(`note-${index}`);
                if (el.dataset.pressed !== "true") {
                    const note = notes[index];
                    note.play();
                    el.dataset.pressed = true;
                    setTimeout(() => {
                        el.dataset.pressed = false;
                    }, 500);
                }
            }
        });
        checkCollision(event, "Peg", "Ball", (pegToAnimate) => {
            const index = pegs.findIndex((peg) => peg === pegToAnimate);
            if (index === -1) {
                throw new Error("Could not find peg in pegs array even though we registered an ball hitting this peg");
            }
            if (!pegAnims[index]) {
                pegAnims[index] = new Date().getTime();
            }
        });
    });
});

Render.run(render);

const ctx = canvas.getContext("2d");
function run() {
    const now = new Date().getTime();
    pegAnims.forEach((anim, index) => {
        if (!anim)
            return;
        const delta = now - anim;
        if (delta > 1200) {
            pegAnims[index] = null;
            return;
        }
        const peg = pegs[index];
        if (!peg)
            throw new Error("Unknown peg at index " + index);
        const pct = delta / 1200;
        const expandProgression = 1 - Math.abs(pct * 2 - 1);
        const expandRadius = expandProgression * 12;
        ctx.fillStyle = "#fff2";
        ctx.beginPath();
        ctx.arc(peg.position.x, peg.position.y, expandRadius, 0, 2 * Math.PI);
        ctx.fill();
    });
    Engine.update(engine, 1000 / 60);
    if (document.getElementById("sjasd").value < 0) {
        document.getElementById("sjasd").value = 0;
    }

    localStorage.setItem(ballcode, balls);
    ballsEl.innerHTML = parseInt(localStorage.getItem(ballcode)) + "$";
    requestAnimationFrame(run);
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("version").innerHTML = version;
    run();
})