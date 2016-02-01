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
    templateCache = require('gulp-angular-templatecache'),
    merge = require('merge-stream'),
    path = require('path'),
    size = require('gulp-size'),
    htmlmin = require('gulp-htmlmin'),
    ngAnnotate = require('browserify-ngannotate'),
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
    cssPath = 'src/less/rest-ng-grid.less',
    cssWatchPath = 'src/less/**/*.less',
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

gulp.task('copy:js', [], function () {
  return gulp.src(['dist/*.js'])
    .pipe(gulp.dest('misc/demo/assets'))
});
gulp.task('copy:css', [], function () {
  return gulp.src(['dist/*.css'])
    .pipe(gulp.dest('misc/demo/assets'));
});
gulp.task('copy:html', [], function () {
  return gulp.src(['src/templates/*.html'])
    .pipe(gulp.dest('misc/demo'));
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

  return gulp.src(['./src/js/rest-ng-grid-src.js'])
    .pipe(gulpIf(sourceMap, sourcemaps.init({loadMaps: true})))
    .pipe(gp_concat('rest-ng-grid.js'))
    //.pipe(gulpIf(isProduction, cachebust.resources()))
    .pipe(gulpIf(sourceMap, sourcemaps.write('./')))
    .pipe(gulpIf(isProduction, uglify())).on('error', gutil.log)
    .pipe(gulp.dest('./dist/'));

});

gulp.task('html', function () {
  var tplFilterList = [ ],
      tplFilter = filter(tplFilterList),
      staticFilter = [ '**/*'],
      cachedTplFilter = null;

  for(var i=0; i < tplFilterList.length; i ++){
    staticFilter.push("!"+ tplFilterList[i]);
  }
  for(var j=0; j < cachedTemplates.length; j ++){
    staticFilter.push("!" + cachedTemplates[j]);
  }
  staticFilter = filter(staticFilter);
  cachedTplFilter = filter(cachedTemplates);

  return gulp.src(htmlPath)
      .pipe(cache('html'))
      .pipe(isProduction ? htmlmin({collapseWhitespace: true}) : gutil.noop())
      //.pipe(tplFilter)
      //.pipe(gulp.dest('dist/templates/'))
      //.pipe(tplFilter.restore());
      //.pipe(cachedTplFilter)
      //.pipe(gulp.dest('tmp/cached_templates/'))
      //.pipe(cachedTplFilter.restore())
      .pipe(staticFilter)
      .pipe(gulp.dest('dist/'));
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
      .pipe(gulp.dest('dist/'));
});

gulp.task('livereload:notify:html', gulpsync.sync(['html', 'copy:html']), function () {
  return livereload.changed('*')
});
gulp.task('livereload:notify:js', gulpsync.sync(['build-app', 'copy:js', 'copy:map']), function () {
  return livereload.changed('*')
});
gulp.task('livereload:notify:css', gulpsync.sync(['css', 'copy:css', 'copy:map']), function () {
  return livereload.changed('*')
});
gulp.task('livereload:notify:demo', ['build'], function () {
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
  gulp.watch(demoWatchPath, ['livereload:notify:demo']).on('change', function (evt) {
    changeEvent(evt);
  });
});

/**
 * Unit tests
 */
var testFiles = [
  'dist/rest-ng-grid.js',
  'test/unit/karma-helpers.coffee',
  'app/js/lib/angular-mocks/angular-mocks.js',
  'test/unit/**/*spec.coffee'
];

gulp.task('test:unit', function() {
  return gulp.src(testFiles)
      .pipe(karma({
        configFile: 'test/karma-unit.conf.js',
        action: 'watch'
      }))
      .on('error', function(err) {
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

gulp.task('test:e2e', ['webdriver_update'], function() {
  gulp.src(["test/e2e/**/*spec.js", "test/e2e/**/*spec.coffee"])
      .pipe(protractor({
        configFile: "test/protractor-e2e.conf.js",
        args: ['--baseUrl', 'http://localhost:9264']
      }))
      .on('error', function(e) { throw e })
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
gulp.task('copy', ['copy:html', 'copy:css', 'copy:js', 'copy:map'], function (){

});

/////////////////////////////////////////////////////////////////////////////////////
//
// full build (except sprites), applies cache busting to the main page css and js bundles
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('build', gulpsync.sync(['clean', 'css', 'build-app', 'html', 'copy']), function () {
  return gulp.src('./src/*.svm')
      .pipe(cachebust.references())
      .pipe(gulp.dest('dist'));
});
