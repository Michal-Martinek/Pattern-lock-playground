
function dot_clicked(idx) {
	console.log('Clicked dot:', idx)
}
function makeGrid(height=3, width=3) {
	let t = document.querySelector('#pattern-table');
	t.innerHTML = `<div class="lock-row"></div>`.repeat(height);
	let row = 0;
	t.childNodes.forEach(node => {
		for (let col = 0; col < width; col++) {
			let idx = width * row + col;
			node.innerHTML += `<div class="lock-cell" style="width: ${100 / width}%;">
				<div id="dot_${idx}" class="dot-div" onclick="dot_clicked(${idx})">
					<div></div>
				</div>
			</div>`;
		}
		row++;
	});
};
