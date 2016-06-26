exports.config = {
  //seleniumAddress: 'http://localhost:4444/wd/hub',

  capabilities: {
    'browserName': 'chrome',
    'chromeOptions': {
      'args': []
    }
  },
  // The address of a running selenium server.
  seleniumServerJar: 'node_modules/protractor/selenium/selenium-server-standalone-2.48.2.jar', // Make use you check the version in the folder
  //exclude: ['e2e/communication/drivers-spec.js', 'e2e/resources/user-spec.js', 'e2e/resources/media-spec.js', 'e2e/resources/media-type-spec.js'],
  specs: ['e2e/**/*spec.js'],

  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  },
  onPrepare: function () {
    // implicit and page load timeouts
    //browser.manage().timeouts().pageLoadTimeout(2000);
    //browser.manage().timeouts().implicitlyWait(2000);
    // for non-angular page
    //browser.ignoreSynchronization = true;
    //
    //// sign in before all tests
    //browser.get(loginPage);
    //element(by.name('user[email]')).sendKeys('email@email.com');
    //element(by.name('user[password]')).sendKeys('password');
    //element(by.name('commit')).click();
    //browser.waitForAngular();
    global.By = global.by;
    global.EC = protractor.ExpectedConditions;
    // define new locator
    By.addLocator('dataHook', function (hook, optParentElement, optRootSelector) {
      var using = optParentElement || document.querySelector(optRootSelector) || document;
      return using.querySelector('[data-hook=\'' + hook + '\']');
    });
  },

  baseUrl: 'http://localhost:63342/rest-ng-grid/misc/demo/index.html',
  chromeOnly: true,

  //getPageTimeout: 90000,
  allScriptsTimeout: 180000
};

