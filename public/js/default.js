document.addEventListener('DOMContentLoaded', function () {
	var el = document.querySelector('button');
	if (el != null) {
		el.addEventListener('click', function() {
			var sillyMsgs = [
				'I hope you have your credit card ready...',
				'This will be the grab bag to end all grab bags...',
				'Fingers crossed you get something good...',
				'Return shipping is always free, but you won\'t need it...'
			];
			var silly = sillyMsgs[Math.floor(Math.random() * sillyMsgs.length)];
			var msg = 'Your grab bag is being generated! ' + silly;
			document.querySelector('#flash').textContent = msg;
		});
	}
});