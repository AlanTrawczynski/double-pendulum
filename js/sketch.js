
const canvasContainer = $('#canvasContainer')[0],
	rsButton = $('#toggleExecButton')[0];


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
		80 * (Math.PI / 180),		// a1
		80 * (Math.PI / 180),		// a2
		9.8 / (60 ** 2) 				// g
	),

	// modes (0: line, else: dot)
	traceMode = 0,
	// colors
	backgroundColor,
	pendulumColor,
	traceColor,
	// weigths
	pendulumWeight = 0.1,
	traceWeight = 0.1,

	scaleFactor,

	// previous pendulum position
	x2prev = null,
	y2prev = null
  // Runge Kutta 4
  // Tiempo inicial y máximo
  t0 = 0,
  t = 60*10,
  // Particiones del tiempo
  n = 60*60*24,
  // Paso del tiempo (dt)
  h = (t-t0)/n;
  ;


function setColors() {
	backgroundColor = color(0);
	pendulumColor = color(150);
	traceColor = color('hsl(160, 100%, 50%)');
}


// P5
// -----
function setup() {
	initInterface();

	const canvas = createCanvas();
	canvas.parent(canvasContainer);
	resizeCanvas(canvasContainer.clientWidth, canvasContainer.clientHeight);
	scaleFactor = min(width, height) / (2 * (pendulum.r1 + pendulum.r2));

	// frameRate(30);
	setColors();
	tx = width / 2;
	ty = height / 2;
	initTrace();
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
	image(trace, 0, 0);
	translate(tx, ty);
	scale(scaleFactor);

	if (running) {
		// pendulum.runForwardEuler();
    runRK4();
		drawTrace(pendulum);
	}
	drawPendulum(pendulum);
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
		}
		x2prev = p.x2;
		y2prev = p.y2;
	}
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

// Funtion to execute RK4 model
function runRK4(){
  pendulum.runRK4(t0)
  // console.log(`t0 = ${t0}`)
  // time update
  t0 = t0+h;
  
}


// Events
// --------

function initInterface() {
	$('.slider').each(function () {
		this.value = eval(`pendulum.${this.name}`);
		$(`#${this.name}Value`).text(this.value);
	});

	addEventListeners();
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
	scaleFactor = min(width, height) / (2 * (pendulum.r1 + pendulum.r2));
	initTrace();
}


function toggleExec() {
	running = !running;
	disableInputs();
}


function disableInputs() {
	document.querySelectorAll('input').forEach((input) => input.disabled = true);
}

