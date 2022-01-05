'use strict';

const canvasContainer = $('#canvasContainer'),
	rsButton = $('#runStopButton'),
	resetButton = $('#resetButton'),
	solverSelect = $("#solverSelect"),
	fpsDisplay = $("#fpsDisplay"),
	fadeSwitch = $("#fadeSwitch"),
	pendulumVisibilitySwitch = $("#pendulumVisibilitySwitch"),
	newPendulumButton = $("#newPendulumButton");

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
	// max number of pendulums
	maxPendulums = 7,
	// pendulums
	pendulums = [],
	// gravity	
	g = 9.8 / (60 ** 2),
	// colors
	backgroundColor,
	pendulumColor,
	traceColors,
	textColor,
	// fps
	currentFPS = 60,
	accumulatorFPS = 0;


function initColors() {
	backgroundColor = color(0);
	textColor = color(150);
	pendulumColor = color(150);

	const hue = round(random() * 360);
	traceColors = Array.from({ length: maxPendulums }, (_, i) => color(`hsl(${round((hue + (360 / maxPendulums) * i) % 360)}, 100%, 50%)`));
}


function createPendulum(r1, r2, m1, m2, a1, a2) {
	const p = pendulums.length === 0 ?
		new DoublePendulum(2, 2.5, 0.05, 0.05, 130 * (Math.PI / 180), -130 * (Math.PI / 180), g, false) : DoublePendulum.fromPendulum(pendulums[0]);

	p.traceColor = traceColors.pop();
	pendulums.push(p);
	createPendulumSidebar();
	createPendulumIcon(p);
	updateInterface();

	if (pendulums.length === maxPendulums) {
		newPendulumButton.hide();
	}
}

function createPendulumSidebar() {
	const n = pendulums.length - 1,
		vars = [{ name: "Radius", min: 1, max: 10, step: 0.1, unit: "m" },
		{ name: "Angle", min: -180, max: 180, step: 1, unit: "°" },
		{ name: "Mass", min: 10, max: 1000, step: 1, unit: "g" }];

	let html = `
		<div id="p${n}Sidebar" class="sidebar" uk-offcanvas="mode: push">
			<div class="pendulum-settings uk-offcanvas-bar">`


	for (const [i, v] of vars.entries()) {
		for (let j = 1; j <= 2; j++) {
			const v0 = v.name[0].toLowerCase(),
				inputId = `${v0}${j}Value-${n}`,
				sliderId = `${v0}${j}Slider-${n}`,
				name = `${v0}${j}-${n}`;

			html += `
				<div class="slider-container">
					<div class="slider-label">
						<label for="${name}">${v.name} ${j}</label>
						<div class="uk-inline">
							<span class="uk-form-icon uk-form-icon-flip">${v.unit}</span>
							<input class="input-value uk-input uk-form-small" id="${inputId}" name="${name}" type="text" autocomplete="off">
						</div>
					</div>
					<input class="slider uk-range" id="${sliderId}" name="${name}" type="range" min=${v.min} max=${v.max} step=${v.step}>
				</div>`
		}
		html += i === vars.length - 1 ? "" : `<hr>`
	}
	html += `
			</div>
		</div>`

	$("body").append(html);
}

function createPendulumIcon(p) {
	const n = pendulums.length - 1,
		html = `<a class="sidebar-icon" id="p${n}Icon" uk-icon="icon: social; ratio: 1.5" uk-toggle="target: #p${n}Sidebar"></a>`;

	$("#controlIcons").append(html);
	const elem = $(`#p${n}Icon`);

	elem.css("border-left", `2px solid ${p.traceColor.toString()}`);
	elem.css("padding-left", parseInt(elem.css("padding-left")) - 2);
}





// P5
// -----
function setup() {
	initColors();
	createPendulum(2,
		2.5,
		0.05,
		0.05,
		130 * (Math.PI / 180),
		-130 * (Math.PI / 180)
	);
	updateInterface();
	addEventListeners();

	const canvas = createCanvas();
	canvas.parent(canvasContainer[0]);
	resizeCanvas(canvasContainer.width(), canvasContainer.height());

	imageMode(CENTER);
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
				runPendulums();
				if (showPendulum) {
					drawPendulum();
				}
				drawTraces();
			}
		} else {
			// fast execution
			for (let i = 0; i < speed; i++) {
				runPendulums();
				drawTraces();
			}
		}
	} else {
		scale(scaleFactor);
		if (showPendulum) {
			drawPendulum();
		}
	}
}


function runPendulums() {
	for (const p of pendulums) {
		switch (solverSelect.val()) {
			case "RK4":
				p.runRK4();
				break;
			case "FE":
				p.runForwardEuler();
				break;
			case "BE":
				p.runBackwardEuler();
				break;
		}
	}
}


function drawPendulum() {
	const pendulumWeight = 8 / scaleFactor;
	strokeWeight(pendulumWeight);

	for (const p of pendulums) {
		stroke(pendulumColor);
		fill(pendulumColor);
		// pendulum 1

		line(0, 0, p.x1, p.y1);
		circle(p.x1, p.y1, log(p.m1 + 1) * 0.4);

		// pendulum 2
		line(p.x1, p.y1, p.x2, p.y2);
		stroke(p.traceColor);
		fill(p.traceColor);
		circle(p.x2, p.y2, log(p.m2 + 1) * 0.4);
	}
}


function drawTraces() {
	const traceWeight = 1.3 / scaleFactor,
		fadeOn = fadeSwitch.find(".uk-active").text() == 'On';
	trace.strokeWeight(traceWeight);

	for (const p of pendulums) {
		trace.stroke(p.traceColor);

		if (p.x2prev !== undefined) {
			trace.line(p.x2prev, p.y2prev, p.x2, p.y2);

			if (fadeOn) {
				fadeTrace(p.x2, p.y2, p.x2prev, p.y2prev, traceWeight);
			}
		}

		p.x2prev = p.x2;
		p.y2prev = p.y2;
	}
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

function updateInterface() {
	$('.slider').each(function () {
		const [varName, p] = this.name.split("-"),
			varType = varName[0],
			pstring = p !== undefined ? "-" + p : "",
			valueContainer = $(`#${varName}Value${pstring}`);

		switch (varType) {
			case 'r':
				this.value = eval(`pendulums[${p}].${varName}`);
				break;
			case 'a':
				this.value = degrees(eval(`pendulums[${p}].${varName}`));	// rad -> º
				break;
			case 'm':
				this.value = 1000 * eval(`pendulums[${p}].${varName}`);	// kg -> g
				break;
			default:
				this.value = eval(varName);
		}
		valueContainer.val(this.value);
	});
}


function addEventListeners() {
	rsButton.click(toggleExec);
	resetButton.click(() => location.reload());
	newPendulumButton.click(createPendulum);
	$("body").on("input", ".slider", controlSliderInput);
	$("body").on("input", ".input-value", controlValueInput);

	$("body").on('show', '.sidebar', function (e) {
		const name = e.target.id.split("S")[0];
		$(`#${name}Icon`).addClass("active");
	});
	$("body").on('hide', '.sidebar', function (e) {
		const name = e.target.id.split("S")[0];
		$(`#${name}Icon`).removeClass("active");
	});
}


function controlSliderInput(e) {
	const slider = e.target,
		[varName, p] = slider.name.split("-"),
		varType = varName[0],
		pstring = p !== undefined ? "-" + p : "",
		valueContainer = $(`#${varName}Value${pstring}`);

	valueContainer.val(slider.value);

	switch (varType) {
		case 'r':
			eval(`pendulums[${p}].${varName} = ${slider.value}`);
			updateScaleFactor();
			break;
		case 'a':
			eval(`pendulums[${p}].${varName} = ${radians(slider.value)}`);		// º -> rad
			break;
		case 'm':
			eval(`pendulums[${p}].${varName} = ${slider.value / 1000}`);		// g -> kg
			break;
		default:
			eval(`${varName} = ${slider.value}`);
	}
}


function controlValueInput(e) {
	const valueContainer = e.target,
		[varName, p] = valueContainer.name.split("-"),
		varType = varName[0],
		pstring = p !== undefined ? "-" + p : "",
		slider = $(`#${varName}Slider${pstring}`),
		svalue = filterNumberInput(valueContainer.value);

	valueContainer.value = svalue;
	const value = +svalue;
	slider.val(value);

	switch (varType) {
		case 'r':
			eval(`pendulums[${p}].${varName} = ${value}`);
			updateScaleFactor();
			break;
		case 'a':
			eval(`pendulums[${p}].${varName} = ${radians(value)}`);		// º -> rad
			break;
		case 'm':
			eval(`pendulums[${p}].${varName} = ${value / 1000}`);		// g -> kg
			break;
		default:
			eval(`${varName} = ${+value}`);
	}
}

function filterNumberInput(s) {
	const dotIndex = s.indexOf(".");
	let value = s.replace(/\D+/g, "");
	if (dotIndex !== -1) {
		value = value.slice(0, dotIndex) + "." + value.slice(dotIndex);
	}
	return value;
}


function updateScaleFactor() {
	updateTranslate();
	scaleFactor = min(width, height) / max(pendulums.map(p => (2.2 * (p.r1 + p.r2))));
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
