
class PatternLock {
	constructor(container, cols, rows) {
		this.container  = container;
		this.cols = cols;
		this.rows = rows;

		this.selected = []; // array of dots
		this._drawing  = false;
		this._attachEvents();
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
		for (let dot of this.container.querySelectorAll('.dot-div')) {
			dot.classList.remove('selected')
		}
	}
	destroy() {
		this._detachEvents();
		this._reset();
	}

	// dot interface -----------------------------------------
	getDotDesc(dot) {
		return dot.getAttribute('row') + ':' + dot.getAttribute('col');
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
	}
	isSelected(dot) {
		return dot.classList.contains('selected');
		// maybe selected.contains(dot)?
	}

	// events ----------------------------
	mouseDown(e) {
		let dot = this.getHitDot(e.clientX, e.clientY);
		if (dot) {
			this.reset();
			this._drawing = true;
			this.selectDot(dot);
			this.printDot(dot)
		}
	}
	mouseMove(e) {
		if (!this._drawing) return;
		let dot = this.getHitDot(e.clientX, e.clientY);
		if (dot && !this.isSelected(dot)) {
			this.selectDot(dot);
			this.printDot(dot)

			// let line = document.createElement('div');
			// line.classList.add('line');
			// line.classList.add('segment-width');
			// line.style.left = center[0];
			// line.style.top = center[1] - 4;

			// this.container.appendChild(line);

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
		let t = document.querySelector('#pattern-table');
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
		// <div id="lines" style="width: 100%;"></div>`;
	};
};

addEventListener("DOMContentLoaded", (event) => {
	let lock = new PatternLock(document.querySelector('#pattern-table'), 3, 3);
	lock.makeGrid();
})
