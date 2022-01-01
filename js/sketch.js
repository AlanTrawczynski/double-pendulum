
const canvasContainer = $('#canvasContainer')[0],
	rsButton = $('#runStopButton')[0],
	methodSelect = $("#methodSelect")[0];


let
	// true if canvas is executing
	running,
	// trace renderer
	trace,
	// translate
	tx, ty,
	// pendulum
	pendulum = new DoublePendulum(
		2,											// r1
		2.5,										// r2
		0.05,										// m1
		0.05,										// m2
		130 * (Math.PI / 180),	// a1
		-130 * (Math.PI / 180),	// a2
		9.8 / (60 ** 2) 				// g
	),

	// modes (0: line, else: dot)
	traceMode = 0,
	// colors
	backgroundColor,
	pendulumColor,
	traceColor,
	textColor,
	// weigths
	pendulumWeight = 0.1,
	traceWeight = 0.02,

	scaleFactor,

	// previous pendulum position
	x2prev = null,
	y2prev = null,

	// Tiempo inicial y máximo (RK4)
	t0 = 0,
	t = 60 * 10,
	// Particiones del tiempo
	n = 60 * 60 * 24,
	// Paso del tiempo (dt)
	h = (t - t0) / n;
;


function setColors() {
	backgroundColor = color(0);
	pendulumColor = color(150);
	// pendulumColor = color("hsl(0,0%, 40%)");
	traceColor = color('hsl(160, 100%, 50%)');
	textColor = pendulumColor;
}


// P5
// -----
function setup() {
	initInterface();

	const canvas = createCanvas();
	canvas.parent(canvasContainer);
	resizeCanvas(canvasContainer.clientWidth, canvasContainer.clientHeight);

	// frameRate(30);
	setColors();
	tx = width / 2;
	ty = height / 2;
	updateScaleFactor();

	// stop the execution
	running = false;
}


function initTrace() {
	trace = createGraphics(width, height);
	trace.translate(tx, ty);
	trace.scale(scaleFactor);
}



function draw() {
	background(backgroundColor);
	showFPS();
	image(trace, 0, 0);

	translate(tx, ty);
	scale(scaleFactor);
	if (running) {
		runPendulum();
		drawTrace(pendulum);
	}
	drawPendulum(pendulum);
}


function runPendulum() {
	switch (methodSelect.value) {
		case "RK4":
			pendulum.runRK4();
			break;
		case "FE":
			pendulum.runForwardEuler();
			break;
		case "BE":
			pendulum.runBackwardEuler();
			break;
	}
}


function drawTrace(p) {
	trace.stroke(traceColor);

	if (traceMode) {
		trace.circle(p.x2, p.y2, traceWeight);
	}
	else {
		if (x2prev !== null) {
			trace.strokeWeight(traceWeight);
			trace.line(x2prev, y2prev, p.x2, p.y2);
			fadeTrace(p.x2, p.y2, x2prev, y2prev);
		}

		x2prev = p.x2;
		y2prev = p.y2;
	}
}


function fadeTrace(x, y, xprev, yprev) {
	const delay = 500;	// ms

	setTimeout(() => {
		trace.stroke(backgroundColor);
		trace.strokeWeight(2 * traceWeight);
		trace.line(xprev, yprev, x, y);
	}, delay);
}


function drawPendulum(p) {
	strokeWeight(pendulumWeight);
	stroke(pendulumColor);
	fill(pendulumColor);

	// pendulum 1
	line(0, 0, p.x1, p.y1);
	circle(p.x1, p.y1, p.m1);
	// pendulum 2
	line(p.x1, p.y1, p.x2, p.y2);
	circle(p.x2, p.y2, p.m2);
}


function showFPS() {
	const padding = 10;

	stroke(textColor);
	fill(textColor);
	textAlign(RIGHT, TOP);
	text(`fps: ${round(frameRate())}`, 0, padding, width - padding, height);
}



// Events
// --------

function initInterface() {
	$('.slider').each(function () {
		const sliderType = this.id[0],
			valueContainer = $("#" + this.id.substring(0, 2) + "Value")[0],
			varName = this.name;

		switch (sliderType) {
			case 'r':
				initRadiusInput(this, valueContainer, varName);
				break;
			case 'a':
				initAngleInput(this, valueContainer, varName);
				break;
			case 'm':
				initMassInput(this, valueContainer, varName);
				break;
		}
	});

	addEventListeners();
}

function initRadiusInput(slider, valueContainer, varName) {
	slider.value = eval(`pendulum.${varName}`);
	valueContainer.innerHTML = slider.value;
}

function initAngleInput(slider, valueContainer, varName) {
	slider.value = degrees(eval(`pendulum.${varName}`));		// rad -> º
	valueContainer.innerHTML = slider.value;
}

function initMassInput(slider, valueContainer, varName) {
	slider.value = 1000 * eval(`pendulum.${varName}`);	// kg -> g
	valueContainer.innerHTML = slider.value;
}


function addEventListeners() {
	rsButton.addEventListener('click', toggleExec);
	resetButton.addEventListener('click', () => location.reload());
	$('.slider').on("input", controlSliderInput);
}

function controlSliderInput(e) {
	const slider = e.target,
		sliderType = slider.id[0],
		valueContainer = $("#" + slider.id.substring(0, 2) + "Value")[0],
		varName = slider.name;

	switch (sliderType) {
		case 'r':
			controlRadiusInput(slider, valueContainer, varName);
			break;
		case 'a':
			controlAngleInput(slider, valueContainer, varName);
			break;
		case 'm':
			controlMassInput(slider, valueContainer, varName);
			break;
	}
}

function controlRadiusInput(slider, valueContainer, varName) {
	valueContainer.innerHTML = slider.value;
	eval(`pendulum.${varName} = ${slider.value}`);
	updateScaleFactor();
}

function controlAngleInput(slider, valueContainer, varName) {
	valueContainer.innerHTML = slider.value;
	eval(`pendulum.${varName} = ${radians(slider.value)}`);
}

function controlMassInput(slider, valueContainer, varName) {
	valueContainer.innerHTML = slider.value;
	eval(`pendulum.${varName} = ${slider.value / 1000}`);
}


function updateScaleFactor() {
	scaleFactor = min(width, height) / (2.2 * (pendulum.r1 + pendulum.r2));
	initTrace();
}


function toggleExec() {
	running = !running;
	document.querySelectorAll('input').forEach((input) => input.disabled = !input.disabled);

	if (running) {
		UIkit.util.attr(rsButton, 'uk-icon', 'icon: stop; ratio: 2');
	} else {
		UIkit.util.attr(rsButton, 'uk-icon', 'icon: play; ratio: 2');
	}
}


function windowResized() {
	// resizeCanvas(canvasContainer.clientWidth, canvasContainer.clientHeight);
	// updateScaleFactor();
}


function keyPressed() {
	if (keyCode === 32) {		// spacebar
		toggleExec();
	}
}
