
// calculates number of dots in *row*-th row of total *rows* for given shape
const shapeFuncs = {
	"square":   (rows, row) => rows,
	"triangle": (rows, row) => row + 1,
	"triangle-upside-down": (rows, row) => rows - row,
	"rhombus":  (rows, row) => Math.min(row + 1, rows - row),
	"hex":      (rows, row) => Math.min(row + 1, rows - row) + 1,
	"hourglass":(rows, row) => Math.max(row + 1, rows - row),
};

class PatternLock {
	constructor(container, rows, shapeFunc, dummy=false) {
		this.container  = container;
		this.rows = rows;
		this.shapeFunc = shapeFunc;

		if (dummy) return;
		this.selected = []; // array of dots
		this._drawing  = false;
		this._attachEvents();

		this.resultSpan = document.getElementById('pattern-result');
		this.resultSpan.onclick = () => this.copyPatternResult();
	}

	_attachEvents() {
		this._downHandler = this.mouseDown.bind(this);
		this._moveHandler = this.mouseMove.bind(this);
		this._upHandler   = this.mouseUp.bind(this);
		this.container.addEventListener('mousedown', this._downHandler);
		this.container.addEventListener('mousemove', this._moveHandler);
		this.container.addEventListener('mouseup',   this._upHandler);
		// TODO support touch events
	}
	_detachEvents() {
		this.container.removeEventListener('mousedown', this._downHandler);
		this.container.removeEventListener('mousemove', this._moveHandler);
		this.container.removeEventListener('mouseup',   this._upHandler);
	}

	reset() {
		this.selected = []
		this._drawing = true;
		for (let dot of this.container.querySelectorAll('.dot-div')) {
			dot.classList.remove('selected')
		}
		const canvas = this.getCanvas();
		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		this.resultSpan.innerHTML = "";
		this.resultSpan.classList.remove('copied');
	}
	destroy() {
		this._detachEvents();
		this._reset();
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
		if (dot) {
			this.reset();
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
		// this._reset();
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

	_prepareDotsDiv(dummy) {
		let div = this.container.querySelector('.dynamic-dots');
		if (div == null) {
			let dummyClass = dummy ? "dummy-pattern" : "";
			this.container.innerHTML += `<div class="dynamic-dots ${dummyClass}"></div>`;
			return this._prepareDotsDiv();
		}
		div.innerHTML = `<div class="lock-row"></div>`.repeat(this.rows);
		return div;
	}
	makeGrid(dummy=false) {
		let row = 0;
		let div = this._prepareDotsDiv(dummy);
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
		if (!dummy) this.drawLines();
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
		if (first) {
			// resultsContainer.style.transition = "width 1s ease-out";
			resultsContainer.style.width = 'auto';
			return;
		}
		
		const currWidth = resultsContainer.offsetWidth;
		resultsContainer.style.width = currWidth + "px";
		resultsContainer.offsetWidth; // essential line? - forces a reflow
		// Let the browser calculate the new width
		resultsContainer.style.transition = "width 0.5s ease";
		resultsContainer.style.width = resultsContainer.scrollWidth - 20 + "px";
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
function createPatternLock(container, height, shapeFunc=shapeFuncs["square"], dummy=false) {
	var lock = new PatternLock(container, height, shapeFunc, dummy);
	lock.makeGrid(dummy);
}
addEventListener("DOMContentLoaded", (event) => {
	createPatternLock(document.querySelector('#pattern-table'), 3);
})
