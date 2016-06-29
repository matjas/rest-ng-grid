var gulp = require('gulp'),
    gulpsync = require('gulp-sync')(gulp),
    _ = require('lodash'),
    webserver = require('gulp-webserver'),
    gp_concat = require('gulp-concat'),
    del = require('del'),
    less = require('gulp-less'),
    karma = require('gulp-karma'),
    jshint = require('gulp-jshint'),
    sourcemaps = require('gulp-sourcemaps'),
    livereload = require('gulp-livereload'),
    spritesmith = require('gulp.spritesmith'),
    autoprefixer = require('gulp-autoprefixer'),
    cssmin = require('gulp-cssmin'),
    gulpIf = require('gulp-if'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify'),
    gutil = require('gulp-util'),
    filter = require('gulp-filter'),
    cache = require('gulp-cached'),
    ngHtml2Js = require("gulp-ng-html2js"),
    merge = require('merge-stream'),
    path = require('path'),
    size = require('gulp-size'),
    htmlmin = require('gulp-htmlmin'),
    protractor = require("gulp-protractor").protractor,
    webdriver_standalone = require("gulp-protractor").webdriver_standalone,
    webdriver_update = require("gulp-protractor").webdriver_update;

var CacheBuster = require('gulp-cachebust');
var cachebust = new CacheBuster();

// == PATH STRINGS ========
var basePaths = {
    src: 'src/',
    dest: 'dist/',
    test: 'test/'
};

var jsPath = ['src/js/**/*.js'],
    htmlPath = 'src/templates/*.html',
    cssPath = ['src/less/rest-ng-grid.less'],
    cssDemoPath = ['misc/demo/assets/styles/**/*.less'],
    cssWatchPath = 'src/less/**/*.less',
    cssDemoWatchPath = 'misc/demo/assets/styles/**/*.less',
    demoWatchPath = 'misc/demo/**/*.*'

// == ENVIRONMENT STRINGS ========
var isProduction = true;
var scssStyle = 'compressed';
var sourceMap = false;

if (gutil.env.dev === true) {
    scssStyle = 'expanded';
    sourceMap = true;
    isProduction = false;
}

var cachedTemplates = []

//gulp.task('copy:js', [], function () {
//  return gulp.src(['dist/*.js'])
//    .pipe(gulp.dest('misc/demo/assets'))
//});
gulp.task('copy:css', [], function () {
    return gulp.src(['dist/*.css'])
        .pipe(gulp.dest('misc/demo/assets'));
});
gulp.task('copy:map', [], function () {
    return gulp.src(['dist/*.map'])
        .pipe(gulp.dest('misc/demo/assets'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// cleans the build output
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('clean', function (cb) {
    del.sync(['dist/**']);
    cb();
});

gulp.task('build-app', function () {

    return gulp.src(['./src/js/rest-ng-grid-src.js', './src/tmp/*.js'])
        .pipe(gulpIf(sourceMap, sourcemaps.init({loadMaps: true})))
        .pipe(gp_concat('rest-ng-grid.js'))
        //.pipe(gulpIf(isProduction, cachebust.resources()))
        .pipe(gulpIf(sourceMap, sourcemaps.write('./')))
        .pipe(gulpIf(isProduction, uglify())).on('error', gutil.log)
        .pipe(gulp.dest('./dist/'))
        .pipe(gulp.dest('./misc/demo/assets'));

});

gulp.task('build-demo-app', function () {

    return gulp.src([
        './misc/demo/assets/directives/**/*.js',
        './misc/demo/assets/app.js',
        './misc/demo/assets/app-mockbackend.js',
        './misc/demo/assets/controllers/**/*.js',
        './misc/demo/assets/services/**/*.js'])
        //.pipe(gulpIf(sourceMap, sourcemaps.init({loadMaps: true})))
        .pipe(gp_concat('demo.js'))
        //.pipe(gulpIf(isProduction, cachebust.resources()))
        //.pipe(gulpIf(sourceMap, sourcemaps.write('./')))
        .pipe(gulpIf(isProduction, uglify())).on('error', gutil.log)
        .pipe(gulp.dest('./misc/demo/assets'));

});

gulp.task('html', function () {
    gulp.src(htmlPath)
        .pipe(isProduction ? htmlmin({collapseWhitespace: true}) : gutil.noop())
        .pipe(ngHtml2Js({
            moduleName: "restNgGrid"
        }))
        .pipe(gulpIf(isProduction, uglify())).on('error', gutil.log)
        .pipe(gp_concat("templates.js"))
        .pipe(gulp.dest('./src/tmp'));
});

// gulp.task('html', function () {
//   var tplFilterList = [],
//       tplFilter = filter(tplFilterList),
//       staticFilter = [ '**/*'],
//       cachedTplFilter = null;
//
//   for(var i=0; i < tplFilterList.length; i ++){
//     staticFilter.push("!"+ tplFilterList[i]);
//   }
//   for(var j=0; j < cachedTemplates.length; j ++){
//     staticFilter.push("!" + cachedTemplates[j]);
//   }
//   staticFilter = filter(staticFilter);
//   cachedTplFilter = filter(cachedTemplates);
//
//   return gulp.src(htmlPath)
//       .pipe(cache('html'))
//       .pipe(isProduction ? htmlmin({collapseWhitespace: true}) : gutil.noop())
//       //.pipe(tplFilter)
//       //.pipe(gulp.dest('dist/templates/'))
//       //.pipe(tplFilter.restore());
//       //.pipe(cachedTplFilter)
//       //.pipe(gulp.dest('tmp/cached_templates/'))
//       //.pipe(cachedTplFilter.restore())
//       //.pipe(staticFilter)
//       .pipe(gulp.dest('./misc/demo'))
//       .pipe(gulp.dest('./dist/'));
// });

gulp.task('cssDemo', function () {
    return gulp.src(cssDemoPath)
        .pipe(gulpIf(sourceMap, sourcemaps.init({loadMaps: true})))
        .pipe(less()).on('error', function (err) {
            new gutil.PluginError('CSS', err, {showStack: true});
        })
        //.pipe(gulpIf(isProduction, cachebust.resources()))
        .pipe(autoprefixer({
            browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
            cascade: false
        }))
        .pipe(isProduction ? cssmin() : gutil.noop())
        .pipe(gulpIf(sourceMap, sourcemaps.write('./')))
        .pipe(size())
        .pipe(gulp.dest('./misc/demo/assets/styles/'));
});
gulp.task('css', function () {
    return gulp.src(cssPath)
        .pipe(gulpIf(sourceMap, sourcemaps.init({loadMaps: true})))
        .pipe(less()).on('error', function (err) {
            new gutil.PluginError('CSS', err, {showStack: true});
        })
        //.pipe(gulpIf(isProduction, cachebust.resources()))
        .pipe(autoprefixer({
            browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
            cascade: false
        }))
        .pipe(isProduction ? cssmin() : gutil.noop())
        .pipe(gulpIf(sourceMap, sourcemaps.write('./')))
        .pipe(size())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('livereload:notify:html', gulpsync.sync(['html']), function () {
    return livereload.changed('*')
});
gulp.task('livereload:notify:js', gulpsync.sync(['build-app', 'copy:map', 'build-demo-app']), function () {
    return livereload.changed('*')
});
gulp.task('livereload:notify:css', gulpsync.sync(['css', 'copy:css', 'copy:map']), function () {
    return livereload.changed('*')
});
gulp.task('livereload:notify:cssDemo', gulpsync.sync(['cssDemo']), function () {
    return livereload.changed('*')
});
gulp.task('livereload:notify:demo', [], function () {
    return livereload.changed('*')
});

gulp.task('watch', ['build'], function () {
    livereload.listen();
    gulp.watch(jsPath, ['livereload:notify:js']).on('change', function (evt) {
        changeEvent(evt);
    });
    gulp.watch(htmlPath, ['livereload:notify:html']).on('change', function (evt) {
        changeEvent(evt);
    });
    gulp.watch(cssWatchPath, ['livereload:notify:css']).on('change', function (evt) {
        changeEvent(evt);
    });
    gulp.watch(cssDemoWatchPath, ['livereload:notify:cssDemo']).on('change', function (evt) {
        changeEvent(evt);
    });
    gulp.watch(demoWatchPath, ['livereload:notify:demo']).on('change', function (evt) {
        changeEvent(evt);
    });
});

/**
 * Unit tests
 */
var testFiles = [
    'node_modules/angular/angular.js',
    'node_modules/angular-resource/angular-resource.js',
    'node_modules/angular-mocks/angular-mocks.js',
    'node_modules/angular-ui-bootstrap/dist/ui-bootstrap.js',
    'dist/rest-ng-grid.js',
    'test/unit/karma-helpers.js',
    'test/unit/**/*spec.js'
];

gulp.task('test:unit', function () {
    return gulp.src(testFiles)
        .pipe(karma({
            configFile: 'karma-unit.conf.js',
            action: 'watch'
        }))
        .on('error', function (err) {
            // Make sure failed tests cause gulp to exit non-zero
            throw err;
        });
});

/**
 * E2E tests
 */

// Downloads the selenium webdriver
gulp.task('webdriver_update', webdriver_update);

// Start the standalone selenium server
// NOTE: This is not needed if you reference the
// seleniumServerJar in your protractor.conf.js
//gulp.task('webdriver_standalone', webdriver_standalone);

gulp.task('test:e2e', ['webdriver_update'], function () {
    gulp.src(["test/e2e/**/*spec.js"])
        .pipe(protractor({
            configFile: "protractor-e2e.conf.js",
            args: ['--baseUrl', 'http://localhost:63342']
        }))
        .on('error', function (e) {
            console.log(e, 'error');
            throw e
        })
});

/**
 * Helper function(s)
 */



function getNPMPackageIds() {
    // read package.json and get dependencies' package ids
    var packageManifest = {};
    try {
        packageManifest = require('./package.json');
    } catch (e) {
        // does not have a package.json manifest
    }
    return _.keys(packageManifest.dependencies) || [];

}

var changeEvent = function (evt) {
    gutil.log('File', gutil.colors.cyan(evt.path.replace(new RegExp('/.*(?=/' + basePaths.src + ')/'), '')), 'was', gutil.colors.magenta(evt.type));
};

//copy
gulp.task('copy', ['copy:css', 'copy:map'], function () {

});

/////////////////////////////////////////////////////////////////////////////////////
//
// full build (except sprites), applies cache busting to the main page css and js bundles
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('build', gulpsync.sync(['clean', 'css', 'cssDemo', 'build-app', 'build-demo-app', 'html', 'copy']));
