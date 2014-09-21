document.addEventListener('DOMContentLoaded', function () {
	var el = document.querySelector('button');
	if (el != null) {
		el.addEventListener('click', function() {
			var msg = 'Please be patient while your grab bag is being generated...'
			document.querySelector('#flash').textContent = msg;
		});
	}
});