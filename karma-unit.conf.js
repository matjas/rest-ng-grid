// Karma configuration

module.exports = function (config) {
    config.set({

        basePath: '.',

        frameworks: ['jasmine'],

        files: [
            'node_modules/angular/angular.js',
            'node_modules/angular-resource/angular-resource.js',
            'node_modules/angular-mocks/angular-mocks.js',
            'node_modules/angular-ui-bootstrap/dist/ui-bootstrap.js',
            'dist/rest-ng-grid.js',
            'test/unit/karma-helpers.js',
            'test/unit/**/*.spec.js',
            {pattern: 'templates/**/*.html', watched: false}
        ],

        preprocessors: {
            'dist/templates/**/*.html': 'ng-html2js'
        },
        ngHtml2JsPreprocessor: {
            moduleName: 'dir-templates'
        },
        exclude: [
            'dist/js/**/*.map',
            'dist/templates/**/*.html'
        ],

        reports: ['progress'],

        port: 9876,

        colors: true,

        // LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: config.LOG_INFO,
        autoWatch: true,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: [process.env.TRAVIS ? 'Firefox' : 'Chrome'],

        captureTimeout: 60000,

        plugins: [
            'karma-firefox-launcher',
            'karma-mocha',
            'karma-should',
            'karma-chrome-launcher',
            'karma-jasmine'
        ],

        singleRun: false
    });
};