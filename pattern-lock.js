
class PatternLock {
	/**
	 * @param {HTMLElement} container  The element that holds your dot grid
	 * @param {object} callbacks      Hooks: onStart, onUpdate, onComplete, onError
	 */
	constructor(container, cols, rows, callbacks = {}) {
		this.container  = container;
		this.cols = cols;
		this.rows = rows;

		this.onStart    = callbacks.onStart    || (() => {});
		this.onUpdate   = callbacks.onUpdate   || (() => {});
		this.onComplete = callbacks.onComplete || (() => {});
		this.onError    = callbacks.onError    || (() => {});

		this._selected = new Set();    // set of "r,c" strings
		this._drawing  = false;

		// Bind handlers
		this._downHandler = this._mouseDown.bind(this);
		this._moveHandler = this._mouseMove.bind(this);
		this._upHandler   = this._mouseUp.bind(this);

		this._attachEvents();
	}

	_attachEvents() {
		this.container.addEventListener('mousedown', this._downHandler);
		document.addEventListener('mousemove', this._moveHandler);
		document.addEventListener('mouseup',   this._upHandler);
		// (you could optionally support touch events as well)
	}

	_detachEvents() {
		this.container.removeEventListener('mousedown', this._downHandler);
		document.removeEventListener('mousemove', this._moveHandler);
		document.removeEventListener('mouseup',   this._upHandler);
	}

	_mouseDown(e) {
		console.log('mouse down:', e)
		const dotKey = this._hitTestDot(e.clientX, e.clientY);
		if (!dotKey) return;
		this._drawing = true;
		this._selected.add(dotKey);
		this.makeGrid()
		this.onStart(this._getPatternArray());
	}

	_mouseMove(e) {
		if (!this._drawing) return;
		const dotKey = this._hitTestDot(e.clientX, e.clientY);
		if (dotKey && !this._selected.has(dotKey)) {
			this._selected.add(dotKey);
			this.onUpdate(this._getPatternArray());
		}
	}

	_mouseUp(e) {
		if (!this._drawing) return;
		this._drawing = false;
		const attempt = this._getPatternArray();
		// if (this._isMatch(attempt)) {
		this.onComplete(attempt);
		// } else {
		// 	this.onError(attempt);
		// }
		// this._reset();
	}

	_getPatternArray() {
		// e.g. ["0,0","0,1","1,1"] → [[0,0],[0,1],[1,1]]
		return Array.from(this._selected).map(s => s.split(',').map(Number));
	}

	_isMatch(attempt) {
		if (attempt.length !== this.solution.length) return false;
		// simple element‑by‑element compare
		return attempt.every((pair, i) =>
			pair[0] === this.solution[i][0] && pair[1] === this.solution[i][1]
		);
	}

	_reset() {
		this._selected.clear();
		// also clear any visual highlights in the UI
	}

	_hitTestDot(x, y) {
		// Loop your grid of dots (you could cache their bounding boxes at init time)
		// If (x,y) is inside dot’s circle, return its “r,c” key; else null
		for (let dot of this.container.querySelectorAll('.dot-div')) {
			const rect = dot.getBoundingClientRect();
			const cx = rect.left + rect.width/2;
			const cy = rect.top  + rect.height/2;
			const radius = rect.width/2;
			if ((x-cx)**2 + (y-cy)**2 <= radius**2) {
				dot.classList.add('selected');
				return dot.getAttribute('row') + ',' + dot.getAttribute('col');
			}
		}
		return null;
	}

	destroy() {
		this._detachEvents();
		this._reset();
	}

	makeGrid() {
		let t = document.querySelector('#pattern-table');
		t.innerHTML = `<div class="lock-row"></div>`.repeat(this.rows);
		let row = 0;
		t.childNodes.forEach(node => {
			for (let col = 0; col < this.cols; col++) {
				let idx = this.cols * row + col;
				node.innerHTML += `<div class="lock-cell" style="width: ${100 / this.cols}%;">
					<div id="dot_${idx}" row="${row}" col="${col}" class="dot-div">
						<div></div>
					</div>
				</div>`;
			}
			row++;
		});
	};
};

function onStart(obj) {
	console.log('onStart:', obj)
}
function onUpdate(obj) {
	console.log('onUpdate:', obj)
}
function onComplete(obj) {
	console.log('onComplete:', obj)
}
function onError(obj) {
	console.log('onError:', obj)
}


addEventListener("DOMContentLoaded", (event) => {
	let lock = new PatternLock(document.querySelector('#pattern-table'), 3, 3,
		{
			onStart: onStart,
			onUpdate: onUpdate,
			onComplete: onComplete,
			onError: onError,
		}
	)
	lock.makeGrid();
})
