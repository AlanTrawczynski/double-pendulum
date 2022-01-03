
const canvasContainer = $('#canvasContainer'),
	rsButton = $('#runStopButton')[0],
	methodSelect = $("#methodSelect"),
	fpsDisplay = $("#fpsDisplay"),
	fadeSwitch = $("#fadeSwitch"),
	pendulumVisibilitySwitch = $("#pendulumVisibilitySwitch");

let
	// true if canvas is running
	running,
	// execution speed
	speed = 1,
	// trace renderer
	trace,
	// interface size
	scaleFactor,
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
	// pendulum previous position
	x2prev = null,
	y2prev = null,
	// colors
	backgroundColor,
	pendulumColor,
	traceColor,
	textColor,
	// fps
	currentFPS = 60,
	accumulatorFPS = 0;


function setColors() {
	backgroundColor = color(0);
	pendulumColor = color(150);
	traceColor = color('hsl(160, 100%, 50%)');
	textColor = pendulumColor;
}


// P5
// -----
function setup() {
	initInterface();

	const canvas = createCanvas();
	canvas.parent(canvasContainer[0]);
	resizeCanvas(canvasContainer.width(), canvasContainer.height());

	imageMode(CENTER);
	setColors();
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
	const showPendulum = pendulumVisibilitySwitch.find(".uk-active").text() == 'Visible';

	background(backgroundColor);
	updateFPS();
	translate(tx, ty);
	push();
	image(trace, 0, 0);

	if (running) {		
		if (speed <= 30) {
			// slow execution
			for (let i = 0; i < speed; i++) {
				background(backgroundColor);
				pop(); push();
				image(trace, 0, 0);
				scale(scaleFactor);

				runPendulum();
				if (showPendulum) {
					drawPendulum(pendulum);
				}
				drawTrace(pendulum);
			}
		} else {
			// fast execution
			for (let i = 0; i < speed; i++) {
				runPendulum();
				drawTrace(pendulum);
			}
		}
	} else {
		scale(scaleFactor);
		if (showPendulum) {
			drawPendulum(pendulum);
		}
	}
}


function runPendulum() {
	switch (methodSelect.val()) {
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


function drawPendulum(p) {
	const pendulumWeight = 8 / scaleFactor;
	strokeWeight(pendulumWeight);
	stroke(pendulumColor);
	fill(pendulumColor);

	// pendulum 1
	line(0, 0, p.x1, p.y1);
	circle(p.x1, p.y1, log(p.m1 + 1) * 0.4);
	// pendulum 2
	line(p.x1, p.y1, p.x2, p.y2);
	circle(p.x2, p.y2, log(p.m2 + 1) * 0.4);
}


function drawTrace(p) {
	const traceWeight = 1.3 / scaleFactor;
	trace.strokeWeight(traceWeight);
	trace.stroke(traceColor);

	if (x2prev !== null) {
		trace.line(x2prev, y2prev, p.x2, p.y2);

		if (fadeSwitch.find(".uk-active").text() == 'On') {
			fadeTrace(p.x2, p.y2, x2prev, y2prev, traceWeight);
		}
	}

	x2prev = p.x2;
	y2prev = p.y2;
}

function fadeTrace(x, y, xprev, yprev, traceWeight) {
	const delay = 500 / speed;	// ms

	setTimeout(() => {
		trace.stroke(backgroundColor);
		trace.strokeWeight(2 * traceWeight);
		trace.line(xprev, yprev, x, y);
	}, delay);
}


function updateFPS() {
	accumulatorFPS += frameRate();
	if (frameCount % 10 == 0) {
		currentFPS = round(accumulatorFPS / 10);
		accumulatorFPS = 0;
	}
	fpsDisplay.text(currentFPS);
}



// Events
// --------

function initInterface() {
	$('.slider').each(function () {
		const varName = this.name,
			varType = varName[0],
			valueContainer = $("#" + this.name + "Value");

		switch (varType) {
			case 'r':
				this.value = eval(`pendulum.${varName}`);
				valueContainer.html(this.value);
				break;
			case 'a':
				this.value = degrees(eval(`pendulum.${varName}`));	// rad -> º
				valueContainer.html(this.value);
				break;
			case 'm':
				this.value = 1000 * eval(`pendulum.${varName}`);	// kg -> g
				valueContainer.html(this.value);
				break;
			default:
				this.value = eval(varName);
				valueContainer.val(this.value);
		}
		// valueContainer.html(this.value);
	});

	addEventListeners();
}


function addEventListeners() {
	rsButton.addEventListener('click', toggleExec);
	resetButton.addEventListener('click', () => location.reload());
	$('.slider').on("input", controlSliderInput);
	$('.input-value').on("input", controlValueInput);
}

function controlSliderInput(e) {
	const slider = e.target,
		varName = slider.name,
		varType = varName[0],
		valueContainer = $("#" + varName + "Value");

	switch (varType) {
		case 'r':
			valueContainer.html(this.value);
			eval(`pendulum.${varName} = ${slider.value}`);
			updateScaleFactor();
			break;
		case 'a':
			valueContainer.html(this.value);
			eval(`pendulum.${varName} = ${radians(slider.value)}`);		// º -> rad
			break;
		case 'm':
			valueContainer.html(this.value);
			eval(`pendulum.${varName} = ${slider.value / 1000}`);		// g -> kg
			break;
		default:
			valueContainer.val(this.value);
			eval(`${varName} = ${slider.value}`);
	}
}

// comprobar si no entra en bucle cuando se modifica slider
function controlValueInput(e) {
	const valueContainer = e.target,
		varName = valueContainer.name,
		varType = varName[0],
		slider = $("#" + varName + "Slider");

	switch (varType) {
		case 'r':
			slider.val(valueContainer.innerHTML)
			eval(`pendulum.${varName} = ${slider.value}`);
			updateScaleFactor();
			break;
		case 'a':
			slider.val(valueContainer.innerHTML)
			eval(`pendulum.${varName} = ${radians(slider.value)}`);		// º -> rad
			break;
		case 'm':
			slider.val(valueContainer.innerHTML)
			eval(`pendulum.${varName} = ${slider.value / 1000}`);		// g -> kg
			break;
		default:
			// sacar a funsion 
			const dotIndex = valueContainer.value.indexOf(".");
			let value = valueContainer.value.replace(/\D+/g, "");
			if (dotIndex !== -1) {
				value = value.slice(0, dotIndex) + "." + value.slice(dotIndex);
			}

			valueContainer.value = value;
			slider.val(value);
			eval(`${varName} = ${+value}`);
	}
}


function updateScaleFactor() {
	updateTranslate();
	scaleFactor = min(width, height) / (2.2 * (pendulum.r1 + pendulum.r2));
	initTrace();
}

function updateTranslate() {
	tx = width / 2;
	ty = height / 2;
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
	resizeCanvas(canvasContainer.width(), canvasContainer.height());
	updateScaleFactor();
}


function keyPressed() {
	if (keyCode === 32) {		// spacebar
		toggleExec();
	}
}
