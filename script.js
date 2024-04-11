const settings = {
    version: "v11.2.7",
    title: "Plinko"
}

const dataset = "xV1&ku1ml:%";
const startbal = 350;
const cutoff = 1.5;
const extras = 5;
const version = settings.version;
const title = `${settings.title} - ${settings.version}`;
const ballc = "#fc3";

let money = localStorage.getItem(dataset);

let clamp = {
    bet: 1,
    cur: "~",
    diff: "?",
    currency: "USD",
    curreny_location: "en-US"
}

const width = 720;
const height = 500;

const input = document.getElementById("sjasd");
const diff = document.getElementById("conver");

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
    5,
    3,
    2,
    1.5,
    1.25,
    1,
    0.75,
    0.5,
    0.25,
    0.5,
    0.75,
    1,
    1.25,
    1.5,
    2,
    3,
    5
];

for (let index = 0; index < multipliers.length; index++) {
    let element = multipliers[index];
    element -= 0.25;
    multipliers[index] = element;
}

multipliers.forEach((m, i) => (document.getElementById(`note-${i}`).innerHTML = m));

const notes = ["C#5","C5","B5","A#5","A5","G#4","G4","F#4","F4","F#4","G4","G#4","A5","A#5","B5","C5","C#5"].map((note) => new Note(note));

let balls
const ballsEl = document.getElementById("balls");

const Engine = Matter.Engine, Events = Matter.Events, Render = Matter.Render, Runner = Matter.Runner, Bodies = Matter.Bodies, Composite = Matter.Composite;

const engine = Engine.create({
    gravity: {
        scale: 0.0007
    }
});

function areBallsLeft() {
    const ballsInWorld = engine.world.bodies.filter(body => body.label === "Ball");
    return ballsInWorld.length > 0;
}

if (localStorage.getItem(dataset) === null) {
    localStorage.setItem(dataset, startbal);
    balls = startbal;
} else {
    balls = parseInt(localStorage.getItem(dataset));
}

const clickSynth = new Tone.NoiseSynth({ volume: -26 }).toDestination();

const dropButton = document.getElementById("drop-button");
const autoDropCheckbox = document.getElementById("checkbox");
let autoDropEnabled = false;
let autoDroppingInterval = null;

function notify(text = String, duration = Number, level = Number) {
    const bar = document.getElementById("notf");
    const title = document.getElementById("nott");

    title.innerHTML = text;
    bar.style.left = "3%";

    setTimeout(() => {
        if (level == 3) {
            document.getElementById("esound").play();
        }
    }, 125);

    setTimeout(() => {
        bar.style.left = "-20%";
    }, (duration * 1000) - 125);
}

dropButton.addEventListener("click", () => {
    if (autoDropEnabled && autoDroppingInterval) {
        dropButton.innerHTML = "Start";
        input.disabled = false;
        clearInterval(autoDroppingInterval);
        autoDroppingInterval = null;
    } else if (autoDropEnabled && !autoDroppingInterval) {
        dropButton.innerHTML = "Stop";
        input.disabled = true;
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
    clamp.bet = input.value;
    if (balls >= input.value * cutoff && input.value < 1) {
        balls -= input.value * cutoff;
    }
    if (balls >= input.value * cutoff) {
        balls -= input.value * cutoff;
        const dropLeft = width / 2 - GAP;
        const dropRight = width / 2 + GAP;
        const dropWidth = dropRight - dropLeft;
        const x = Math.random() * dropWidth + dropLeft;
        const y = -PEG_RAD;
        const ball = Bodies.circle(x, y, BALL_RAD, {
            label: "Ball",
            restitution: 0.4,
            render: {
                fillStyle: ballc
            }
        });
        clickSynth.triggerAttackRelease("32n", Tone.context.currentTime);
        Composite.add(engine.world, [ball]);
    } else {
        let c = Math.floor(Math.random() * 3);
        if (c === 0) {
            notify("Your bet is too much!", 3.15, 3);
        } else if (c === 1) {
            notify("Try lower numbers.", 3.15, 3);
        } else if (c === 2) {
            notify(`You don't have at least ${input.value * cutoff}$!`, 3.15, 3);
        }
    }
}

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
                if (input.value === 1) {
                    balls = (balls + (ballsWon * extras));
                } else {
                    balls = balls + (clamp.bet * ballsWon);
                }
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
    if (input.value < 0) {
        input.value = 0;
    }
    if (balls < 0) {
        balls = 0;
    }
    if (areBallsLeft()) {
        input.disabled = true;
    } else {
        input.disabled = false;
    }
    if (money < localStorage.getItem(dataset)) {
        clamp.cur = "+";
        diff.style.color = "#0f3";
    } else if (money > localStorage.getItem(dataset)) {
        clamp.cur = "-";
        diff.style.color = "#fe2b01";
    }
    if (clamp.diff == "0" && clamp.cur == "-") {
        clamp.diff = "0";
        clamp.cur = "";
        diff.style.color = "#fff";
    }

    clamp.diff = (money - localStorage.getItem(dataset)).toString().replace("-", "");
    let profit_money = clamp.cur + clamp.diff;
    let profit_format = new Intl.NumberFormat(clamp.curreny_location, {
        style: 'currency',
        currency: clamp.currency
    }).format(profit_money);
    let money_format = new Intl.NumberFormat(clamp.curreny_location, {
        style: 'currency',
        currency: clamp.currency
    }).format(localStorage.getItem(dataset));
    diff.innerHTML = "Profit: " + profit_format;
    localStorage.setItem(dataset, balls);
    ballsEl.innerHTML = money_format;
    requestAnimationFrame(run);
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("version").innerHTML = version;
    document.title = title;
    run();
})
