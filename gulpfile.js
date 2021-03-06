var gulp	= require("gulp");
var tinyLr	= require("tiny-lr");
var static	= require("node-static");
var http	= require("http");
var plugins	= require("gulp-load-plugins")();

var lrServer = tinyLr();

gulp.task("buildBrowser", function () {
	gulp.src(["src/wrapper/head.js", "src/lib/*.js", "src/*.js", "src/wrapper/tail.js"])
		.pipe(plugins.preprocess({context: { ENV: "browser"}}))
		.pipe(plugins.concat("asteroid.js"))
		.pipe(gulp.dest("dist/"))
		.pipe(plugins.uglify())
		.pipe(plugins.rename("asteroid.min.js"))
		.pipe(gulp.dest("dist/"))
		.pipe(plugins.livereload(lrServer));
});

gulp.task("buildNode", function () {
	gulp.src(["src/wrapper/head.js", "src/lib/*.js", "src/*.js", "src/wrapper/tail.js"])
		.pipe(plugins.preprocess({context: { ENV: "node"}}))
		.pipe(plugins.concat("node.asteroid.js"))
		.pipe(gulp.dest("dist/"));
});

gulp.task("buildTests", function () {
	gulp.src("test/unit/**/*.unit.js")
		.pipe(plugins.concat("asteroid.unit.js"))
		.pipe(gulp.dest("test/"))
		.pipe(plugins.livereload(lrServer));
});

gulp.task("demo", function () {
	http.createServer(function (req, res) {
		var stServer = new static.Server("./demo", {cache: false});
		req.on("end", function () {
			stServer.serve(req, res);
		});
		req.resume();
	}).listen(8080);
	gulp.watch("src/**/*.js", ["buildBrowser"]);
});

gulp.task("dev", function () {
	http.createServer(function (req, res) {
		var stServer = new static.Server("./test", {cache: false});
		req.on("end", function () {
			stServer.serve(req, res);
		});
		req.resume();
	}).listen(8080);
	lrServer.listen(35729);
	gulp.watch("src/**/*.js", ["buildBrowser"]);
	gulp.watch("test/unit/**/*.unit.js", ["buildTests"]);
});

gulp.task("test-browser", function () {
	dvServer.listen(8080);
	var options = {
		url: "http://localhost:8080"
	};
	gulp.src("./test/index.html")
		.pipe(plugins.open("", options));
});

gulp.task("default", function () {
	console.log("");
	console.log("Usage: gulp [TASK]");
	console.log("");
	console.log("Available tasks:");
	console.log("  buildBrowser     build the sources into dist/asteroid.js and dist/asteroid.min.js");
	console.log("  buildNode        build the sources into dist/node.asteroid.js and dist/node.asteroid.min.js");
	console.log("  demo	            sets up a demo server");
	console.log("  dev              init dev environment with automatic test running");
	console.log("  test-node        run tests with mocha");
	console.log("  test-browser     run tests in the browser");	
	console.log("");
});
