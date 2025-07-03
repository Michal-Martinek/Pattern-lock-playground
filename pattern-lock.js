
class PatternLock {
	constructor(container, cols, rows) {
		this.container  = container;
		this.cols = cols;
		this.rows = rows;

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

	makeGrid() {
		let t = document.querySelector('#pattern-table #dynamic-dots');
		t.innerHTML = `<div class="lock-row"></div>`.repeat(this.rows);
		let row = 0;
		t.childNodes.forEach(node => {
			for (let col = 0; col < this.cols; col++) {
				let idx = this.cols * row + col;
				node.innerHTML += `<div class="lock-cell segment-width">
					<div id="dot_${idx}" row="${row}" col="${col}" class="dot-div">
						<div></div>
					</div>
				</div>`;
			}
			row++;
		});
		t.innerHTML += `
		<style>
			.segment-width {
				width: ${100 / this.cols}%;
			}		
		</style>`;
		this.drawLines();
	};
	
	// drawing --------------------------------------
	getCanvas() {
		return document.getElementById("lines");
	}
	getDotFractPos(dot) {
		var containerRect = document.getElementById('dynamic-dots').getBoundingClientRect();
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
		console.log('currWidth', currWidth);
		resultsContainer.style.width = currWidth + "px";
		resultsContainer.offsetWidth; // essential line? - forces a reflow
		// Let the browser calculate the new width
		resultsContainer.style.transition = "width 0.5s ease";
		resultsContainer.style.width = resultsContainer.scrollWidth - 20 + "px";
	}
	copyPatternResult() {
		let text = this.resultSpan.textContent;
		console.log('Pattern copied:', text);
		navigator.clipboard.writeText(text);
		this.resultSpan.classList.add('copied');
		setTimeout(() => {
			this.resultSpan.classList.remove('copied');
		}, 2000);
	}
};

addEventListener("DOMContentLoaded", (event) => {
	let lock = new PatternLock(document.querySelector('#pattern-table'), 3, 3);
	lock.makeGrid();
})
