'use strict';

const canvasContainer = $('#canvasContainer'),
	rsButton = $('#runStopButton'),
	resetButton = $('#resetButton'),
	solverSelect = $("#solverSelect"),
	fpsDisplay = $("#fpsDisplay"),
	pendulumVisibilitySwitch = $("#pendulumVisibilitySwitch"),
	newPendulumButton = $("#newPendulumButton");

let
	// true if canvas is running
	running,
	// fade is applied if true
	fade = false,
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
	pendulums = {},
	// gravity	
	g = 9.8 / (60 ** 2),
	// colors
	backgroundColor,
	pendulumColor,
	traceColors,
	textColor,
	// fps
	currentFPS = 60;


function initColors() {
	backgroundColor = color(0);
	textColor = color(150);
	pendulumColor = color(150);

	const hue = round(random() * 360);
	traceColors = Array.from({ length: maxPendulums }, (_, i) => color(`hsl(${round((hue + (360 / maxPendulums) * i) % 360)}, 100%, 50%)`));
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
	addEventListeners();

	const canvas = createCanvas();
	canvas.parent(canvasContainer[0]);
	resizeCanvas(canvasContainer.width(), canvasContainer.height());

	imageMode(CENTER);
	updateScaleFactor();

	// stop the execution
	running = false;
}


function createPendulum(r1, r2, m1, m2, a1, a2) {
	const p = Object.keys(pendulums).length === 0 ?
		new DoublePendulum(2, 2.5, 0.05, 0.05, 130 * (Math.PI / 180), -130 * (Math.PI / 180), g, false) : DoublePendulum.fromPendulum(pendulums[0]),
		n = [...Array(maxPendulums).keys()].filter(k => !Object.keys(pendulums).includes('' + k))[0];

	p.traceColor = traceColors.pop();
	pendulums[n] = p;
	createPendulumSidebar(p, n);

	if (Object.keys(pendulums).length === maxPendulums) {
		newPendulumButton.hide();
	}
}


function initTrace() {
	if (trace !== undefined) {
		trace.remove();
	}
	trace = createGraphics(width, height);
	trace.translate(tx, ty);
	trace.scale(scaleFactor);
}


function draw() {
	const showPendulum = pendulumVisibilitySwitch.find(".uk-active").text() == 'Visible';

	background(backgroundColor);
	updateFPS();
	translate(tx, ty);
	image(trace, 0, 0);

	if (running) {
		if (speed <= 30) {
			push();
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
	for (const p of Object.values(pendulums)) {
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

	for (const p of Object.values(pendulums)) {
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
	const traceWeight = 1.3 / scaleFactor;
	trace.strokeWeight(traceWeight);

	for (const p of Object.values(pendulums)) {
		if (p.x2prev !== undefined) {
			trace.stroke(p.traceColor);
			trace.line(p.x2prev, p.y2prev, p.x2, p.y2);

			if (fade) {
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
	const fps = frameRate();

	if (abs(fps - currentFPS) > 5) {
		currentFPS = round(fps, 1);
		fpsDisplay.text(currentFPS);
	}
}





// Events
// --------

function addEventListeners() {
	rsButton.click(toggleExec);
	resetButton.click(resetPendulums);
	newPendulumButton.click(createPendulum);
	$("#fadeOff").click(_ => { fade = false });
	$("#fadeOn").click(_ => {
		fade = true;
		clearTrace();
	});

	$("body").on("input", ".slider", controlSliderInput);
	$("body").on("input", ".input-value", controlValueInput);
	$("body").on("click", ".delete-pendulum", deletePendulum);

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
		[svalue, value] = filterNumberInput(valueContainer.value);

	valueContainer.value = svalue;
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
			eval(`${varName} = ${value}`);
	}
}

function filterNumberInput(s) {
	const negative = s[0] === "-";
	let svalue = s.replace(/[^\d\.]/g, "");
	const dotIndex = svalue.indexOf(".");
	svalue = svalue.replace(/\./g, "");

	if (dotIndex !== -1) {
		svalue = svalue.slice(0, dotIndex) + "." + svalue.slice(dotIndex);
	}
	let value = svalue !== "." ? Number(svalue) : 0;

	if (negative) {
		svalue = "-" + svalue;
		value = -value;
	}
	return [svalue, value];
}


function deletePendulum(e) {
	const i = e.target.dataset.p,
		p = pendulums[i];

	traceColors.push(p.traceColor);
	delete pendulums[i];
	$(`#p${i}Sidebar`).remove();
	$(`#p${i}Icon`).remove();
	newPendulumButton.show();
}


function updateScaleFactor() {
	updateTranslate();
	scaleFactor = min(width, height) / max(Object.values(pendulums).map(p => (2.2 * (p.r1 + p.r2))));
	initTrace();
}

function updateTranslate() {
	tx = width / 2;
	ty = height / 2;
}


function toggleExec() {
	running = !running;
	$('.disable-when-running').each((_, input) => {
		input.disabled = !input.disabled;
	});

	if (running) {
		UIkit.util.attr(rsButton, 'uk-icon', 'icon: stop; ratio: 2');
		newPendulumButton.hide();
	} else {
		UIkit.util.attr(rsButton, 'uk-icon', 'icon: play; ratio: 2');
		if (Object.keys(pendulums).length !== maxPendulums) {
			newPendulumButton.show();
		}
	}
}


function resetPendulums() {
	for (const [i, p] of Object.entries(pendulums)) {
		const r1 = filterNumberInput($(`#r1Value-${i}`).val())[1],
			r2 = filterNumberInput($(`#r2Value-${i}`).val())[1],
			m1 = filterNumberInput($(`#m1Value-${i}`).val())[1],
			m2 = filterNumberInput($(`#m2Value-${i}`).val())[1],
			a1 = filterNumberInput($(`#a1Value-${i}`).val())[1],
			a2 = filterNumberInput($(`#a2Value-${i}`).val())[1];

		p.reset(r1, r2, m1 / 1000, m2 / 1000, radians(a1), radians(a2));
	}

	clearTrace();
	if (running) {
		toggleExec();
	}
}

function clearTrace() {
	trace.background(backgroundColor);
	for (const p of Object.values(pendulums)) {
		delete p.x2prev, p.y2prev;
	}
}


function windowResized() {
	resizeCanvas(canvasContainer.width(), canvasContainer.height());
	updateScaleFactor();
}


function keyPressed() {
	switch (keyCode) {
		case 32:	// spacebar
			toggleExec();
			break;
		case 82:	// R
			resetPendulums();
			break;
	}
}





// HTML
// --------

function createPendulumSidebar(p, n) {
	const vars = [{ name: "Radius", initial: "r", min: 1, max: 10, step: 0.1, unit: "m" },
	{ name: "Angle", initial: "a", min: -180, max: 180, step: 1, unit: "°" },
	{ name: "Mass", initial: "m", min: 10, max: 1000, step: 1, unit: "g" }];

	let html = `
		<div id="p${n}Sidebar" class="sidebar" uk-offcanvas="mode: push">
			<div class="pendulum-settings uk-offcanvas-bar">`

	for (const [i, v] of vars.entries()) {
		for (let j = 1; j <= 2; j++) {
			const varRep = v.initial + j,
				inputId = `${varRep}Value-${n}`,
				sliderId = `${varRep}Slider-${n}`,
				inputName = `${varRep}-${n}`;

			let value = p[varRep];
			if (v.initial === 'a') {
				value = degrees(value);
			} else if (v.initial === 'm') {
				value *= 1000;
			}

			html += `
				<div class="slider-container">
					<div class="slider-label">
						<label for="${inputName}">${v.name} ${j}</label>
						<div class="uk-inline">
							<span class="uk-form-icon uk-form-icon-flip">${v.unit}</span>
							<input class="input-value uk-input uk-form-small disable-when-running" id="${inputId}" value=${value} name="${inputName}" type="text" autocomplete="off">
						</div>
					</div>
					<input class="slider uk-range disable-when-running" id="${sliderId}" name="${inputName}" type="range" value=${value} min=${v.min} max=${v.max} step=${v.step}>
				</div>`
		}
		html += n === 0 && i === vars.length - 1 ?
			"" : `<hr>`
	}

	if (n > 0) {
		html += `<button class="uk-button uk-button-danger delete-pendulum disable-when-running" data-p=${n}>Delete pendulum</button>`
	}
	html += `
			</div>
		</div>`

	$("body").append(html);
	createPendulumIcon(p, n);
}


function createPendulumIcon(p, n) {
	const html = `<a class="sidebar-icon" id="p${n}Icon" uk-icon="icon: social; ratio: 1.5" uk-toggle="target: #p${n}Sidebar"></a>`;

	$("#controlIcons").append(html);
	const elem = $(`#p${n}Icon`);

	elem.css("border-left", `2px solid ${p.traceColor.toString()}`);
	elem.css("padding-left", parseInt(elem.css("padding-left")) - 2);
}
