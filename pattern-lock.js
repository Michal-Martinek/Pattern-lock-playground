
// calculates number of dots in *row*-th row of total *rows* for given shape
const shapeFuncs = {
	"square":   (rows, row) => rows,
	"triangle": (rows, row) => row + 1,
	"triangle-upside-down": (rows, row) => rows - row,
	"rhombus":  (rows, row) => Math.min(row + 1, rows - row),
	"hex":      (rows, row) => Math.min(row + 1, rows - row) + 1,
	"hourglass":(rows, row) => Math.max(row + 1, rows - row),
};

function setCookie(name, val, duration=7) {
	Cookies.set(name, val, {expires: duration});
}
class PatternLock {
	constructor(container, rows, shapeFunc=shapeFuncs["square"], dummy=false) {
		this.container = container;
		this.dummy = dummy;
		this.init(rows, shapeFunc);
		if (this.dummy) return;
		
		this._attachEvents();
		this.resultSpan = document.getElementById('pattern-result');
		this.resultSpan.onclick = () => this.copyPatternResult();
	}
	init(rows, shapeFunc) {
		this.rows = rows;
		this.shapeFunc = shapeFunc;
		
		this.selected = []; // array of dots
		this._drawing  = false;
		this.makeGrid();
		this.resetGrid();
	}
	selectShape(selected) {
		const shapeName = selected.getAttribute('shape-func')
		const shapeFunc = shapeFuncs[shapeName];
		if (shapeFunc == this.shapeFunc) return;
		document.querySelectorAll('.shape').forEach((shape) => {
			shape.classList.remove('selected');
		})
		selected.classList.add('selected');
		this.init(this.rows, shapeFunc);
		setCookie('shape', shapeName);
	}
	setSize(rows) {
		if (rows != this.rows) {
			document.querySelector('#size-number').innerHTML = rows;
			this.init(rows, this.shapeFunc);
			setCookie('size', rows);
		}
	}
	changeSize(diff) {
		let rows = this.rows + diff;
		rows = Math.max(2, Math.min(7, rows));
		this.setSize(rows);
	}

	_attachEvents() {
		this._downHandler = this.mouseDown.bind(this);
		this._moveHandler = this.mouseMove.bind(this);
		this._upHandler   = this.mouseUp.bind(this);
		this.container.addEventListener('pointerdown', this._downHandler);
		this.container.addEventListener('pointermove', this._moveHandler);
		this.container.addEventListener('pointerup', this._upHandler);

		document.querySelectorAll('.shape').forEach((shape) => {
			shape.onclick = () => this.selectShape(shape);
		});
		document.querySelector('#size #minus').onclick = () => this.changeSize(-1);
		document.querySelector('#size #plus').onclick = () => this.changeSize(+1);
	}
	_detachEvents() {
		this.container.removeEventListener('pointerdown', this._downHandler);
		this.container.removeEventListener('pointermove', this._moveHandler);
		this.container.removeEventListener('pointerup',   this._upHandler);
	}

	resetGrid() {
		this._resetCanvas();
		this.selected = []
		this._drawing = false;
		for (let dot of this.container.querySelectorAll('.dot-div')) {
			dot.classList.remove('selected')
		}
	}
	_resetCanvas() {
		try {
			const canvas = this.getCanvas();
			const ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
		} catch {};
	}
	_resetResults() {
		if (results) {
			this.resultSpan.innerHTML = "";
			this.resultSpan.classList.remove('copied');
		}
	}

	// dot interface -----------------------------------------
	getDotDesc(dot) {
		const alphabet = "ABCDEFGIJKLMNOPQRSTUVWXYZ";
		return alphabet[dot.getAttribute('row')] + dot.getAttribute('col');
	}
	printDot(dot) {
		console.log(this.getDotDesc(dot));
	}
	printDots(dots) {
		if (!dots) dots = this.selected;
		console.log(dots.map(dot => this.getDotDesc(dot)));
	}

	selectDot(dot) {
		dot.classList.add('selected');
		this.selected.push(dot)
		this.drawLines();
	}
	isSelected(dot) {
		return dot.classList.contains('selected');
		// maybe selected.contains(dot)?
	}
	addDot(dot) {
		this.selectDot(dot);
		this.printDot(dot)
		this.addResult(this.getDotDesc(dot));
	}

	// events ----------------------------
	mouseDown(e) {
		let dot = this.getHitDot(e.clientX, e.clientY);
		this.resetGrid();
		this._drawing = dot != null;
		if (dot) {
			this._resetResults();
			this.addDot(dot);
		}
	}
	mouseMove(e) {
		if (!this._drawing) return;
		let dot = this.getHitDot(e.clientX, e.clientY);
		if (dot && !this.isSelected(dot)) {
			this.addDot(dot);
		}
	}
	mouseUp(e) {
		if (!this._drawing) return;
		this._drawing = false;
		this.printDots();
	}

	
	_getDotCenter(dot) {
		const rect = dot.getBoundingClientRect();
		const cx = rect.left + rect.width/2;
		const cy = rect.top  + rect.height/2;
		return [cx, cy];
	}
	getHitDot(x, y) {
		// Loop your grid of dots (you could cache their bounding boxes at init time)
		// If (x,y) is inside dot’s circle, return it; else null
		for (let dot of this.container.querySelectorAll('.dot-div')) {
			const [cx, cy] = this._getDotCenter(dot);
			const radius = dot.getBoundingClientRect().width/2;
			if ((x-cx)**2 + (y-cy)**2 <= radius**2) {
				return dot;
			}
		}
		return null;
	}

	_prepareDotsDiv() {
		let div = this.container.querySelector('.dynamic-dots');
		if (div == null) {
			let dummyClass = this.dummy ? "dummy-pattern" : "";
			this.container.innerHTML += `<div class="dynamic-dots ${dummyClass}"></div>`;
			return this._prepareDotsDiv();
		}
		div.innerHTML = `<div class="lock-row"></div>`.repeat(this.rows);
		return div;
	}
	makeGrid() {
		let row = 0;
		let div = this._prepareDotsDiv();
		div.childNodes.forEach(node => {
			let cols = this.shapeFunc(this.rows, row);
			for (let col = 0; col < cols; col++) {
				let idx = cols * row + col;
				node.innerHTML += `<div class="lock-cell" style="width: ${100 / this.rows}%;">
					<div row="${row}" col="${col}" class="dot-div dot_${idx}">
						<div></div>
					</div>
				</div>`;
			}
			row++;
		});
	};
	
	// drawing --------------------------------------
	getCanvas() {
		return document.getElementById("lines");
	}
	getDotFractPos(dot) {
		var containerRect = this.container.querySelector('.dynamic-dots').getBoundingClientRect();
		let dotR = dot.getBoundingClientRect();
		var offsetX = dotR.left + dotR.width / 2 - containerRect.left;
		var offsetY = dotR.top + dotR.height / 2 - containerRect.top;
		let scale = this.getCanvas().width / containerRect.width; // NOTE canvas buffer has fixed size, only the container stretches
		return [offsetX * scale, offsetY * scale];
	}
	drawLines() {
		if (this.dummy) return; 
		const ctx = this.getCanvas().getContext("2d");
		if (this.selected.length >= 2) {
			ctx.strokeStyle = "black";
			ctx.lineWidth = 4;
			ctx.beginPath();
			let pos = this.getDotFractPos(this.selected[this.selected.length - 2]);
			ctx.moveTo(...pos);
			pos = this.getDotFractPos(this.selected[this.selected.length - 1]);
			ctx.lineTo(...pos);
			ctx.stroke();
		}
	};

	addResult(str) {
		let resultsContainer = document.getElementById('results');
		let first = this.resultSpan.innerHTML.length == 0;
		let addContent = `<span class="dot-repr">${str}</span>`
		if (!first) {
			addContent = '<span class="colon">:</span>' + addContent;
		}
		this.resultSpan.innerHTML += addContent;
	}
	copyPatternResult() {
		let text = this.resultSpan.textContent;
		console.info('Pattern copied:', text);
		navigator.clipboard.writeText(text);
		this.resultSpan.classList.add('copied');
		setTimeout(() => {
			this.resultSpan.classList.remove('copied');
		}, 2000);
	}
};

function setAnimations(allowed) {
	if (allowed) {
		document.body.classList.remove('disable-animations');
		Cookies.remove('disable-animations');
	} else {
		document.body.classList.add('disable-animations');
		setCookie('disable-animations', true);
	}
}
function parseParams(lock) {
	const params = new URLSearchParams(window.location.search);
	
	const size = Number(params.get('size') || Cookies.get('size'));
	if (size) lock.setSize(size);
	
	const shape = params.get('shape') || Cookies.get('shape');
	if (shape && shapeFuncs[shape]) {
		console.log('selecting shape:', shape)
		const shapeE = document.querySelector(`div.shape[shape-func=${shape}]`);
		shapeE.onclick();
	}
	
	const isReducedMotion = window.matchMedia(`(prefers-reduced-motion: reduce)`) === true || window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;
	setAnimations(!isReducedMotion && Cookies.get('disable-animations') == undefined);
}
addEventListener("DOMContentLoaded", (event) => {
	let lock = new PatternLock(document.querySelector('#pattern-table'), 3);
	parseParams(lock);
});
