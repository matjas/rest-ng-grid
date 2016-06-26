describe('Index test', function () {
    'use strict';
    var getDataEl = element(By.dataHook('getData')),
        groupGridEl = element(By.dataHook('groupGrid'));

    beforeEach(function () {
        browser.get('/misc/demo/index.html');
        browser.waitForAngular();

        if (getDataEl)
            getDataEl.click();
    });


    it('should find rest-ng-grid directive', function () {
        expect(groupGridEl.isPresent()).toBe(true);
    });

});