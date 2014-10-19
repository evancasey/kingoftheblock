// render the desktop/mobile index pages
exports.index = function(req, res){

	var ua = req.header('user-agent');

  res.render('main');

};