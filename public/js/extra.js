
$(document).ready(function(){
	var deviceH = $(window).height();
	$('.remoteVideo').css('height', (deviceH - 5)+'px');
	$('.dir-div').css('top', (deviceH - 250)+'px');
}); 