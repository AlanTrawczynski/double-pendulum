
const canvasContainer = document.getElementById('canvasContainer');

let
	// true if canvas is executing
	running,
	// trace renderer
	trace,
	// Translate
	tx, ty,

	// Radius (portion of window size)
	r1 = 120,
	r2 = 150,
	// Mass
	m1 = 10,
	m2 = 10,
	// Angle
	a1 = 90 * (Math.PI / 180),
	a2 = 120 * (Math.PI / 180),
	// Velocity
	v1 = 0,
	v2 = 0,
	// Gravityy
	g = 1,

	// Modes (0: line, else: dot)
	traceMode = 0,
	// Colors
	backgroundColor,
	pendulumColor,
	traceColor,
	// Weigths
	pendulumWeight = 3,
	traceWeight = 2,

	// Previous pendulum 2 position
	x2prev = null,
	y2prev = null;


function setColors() {
	backgroundColor = color(0);
	pendulumColor = color(150);
	traceColor = color('hsl(160, 100%, 50%)');
}


// P5
// -----
function setup() {
	const canvas = createCanvas(canvasContainer.clientWidth, canvasContainer.clientHeight);
	canvas.parent(canvasContainer);

	setColors();
	tx = width / 2;
	ty = height / 3;

	// init trace renderer
	trace = createGraphics(width, height);
	trace.translate(tx, ty); // translates (0,0) position

	// stop the execution
	running = true;
	toggleExec();
}


function draw() {
	background(backgroundColor);
	image(trace, 0, 0);
	translate(tx, ty); // translates (0,0) position

	// show (0, 0)
	strokeWeight(1);	// line weight
	stroke('red');	// line color
	fill('red');	// fill color
	circle(0, 0, 15);
	text('(0,0)', 10, -10);

	// calculate acceleration
	let num1 = -g * (2 * m1 + m2) * sin(a1),
	num2 = -m2 * g * sin(a1 - 2 * a2),
	num3 = -2 * sin(a1 - a2) * m2,
	num4 = v2 * v2 * r2 + v1 * v1 * r1 * cos(a1 - a2),
	den = r1 * (2 * m1 + m2 - m2 * cos(2 * a1 - 2 * a2)),
	acc1 = (num1 + num2 + num3 * num4) / den;

	num1 = 2 * sin(a1 - a2);
	num2 = v1 * v1 * r1 * (m1 + m2);
	num3 = g * (m1 + m2) * cos(a1);
	num4 = v2 * v2 * r2 * m2 * cos(a1 - a2);
	den = r2 * (2 * m1 + m2 - m2 * cos(2 * a1 - 2 * a2));
	let acc2 = (num1 * (num2 + num3 + num4)) / den

	// update velocity
	v1 += acc1;
	v2 += acc2;
	// update angle
	a1 += v1;
	a2 += v2;

  // calculate position
	x1 = r1 * sin(a1);
	y1 = r1 * cos(a1);
	x2 = x1 + r2 * sin(a2);
	y2 = y1 + r2 * cos(a2);

	// show pendulums
	strokeWeight(pendulumWeight);
	stroke(pendulumColor);
	fill(pendulumColor);
	// pendulum 1
	line(0, 0, x1, y1);
	circle(x1, y1, m1);
	// pendulum 2
	line(x1, y1, x2, y2);
	circle(x2, y2, m2);

	// show trace
	trace.stroke(traceColor);

	if (traceMode) {
		trace.circle(x2, y2, traceWeight);
	} else {
		if (x2prev !== null) {
			trace.strokeWeight(traceWeight);
			trace.line(x2prev, y2prev, x2, y2);
		}
		x2prev = x2;
		y2prev = y2;
	}

}



// Events
// --------

function windowResized() {
	// resizeCanvas(canvasContainer.clientWidth, canvasContainer.clientHeight);
	// tx = width / 2;
	// ty = height / 3;
}

function keyPressed() {
	switch (keyCode) {
		case 32:	// Spacebar
			toggleExec();
			break;
	}
}

function toggleExec() {
	if (running) {
		noLoop();
	} else {
		loop();
	}
	running = !running;
}
