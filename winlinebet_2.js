/// <reference path="Interfaces/WorkerInterface.js" />
/// <reference path="jq.js" />

var myScope = new Object();
(function() {
    'use strict';
    var current = 0;
    var maxError = 10;

    worker.SetCallBacks(window.console.log, getStakeInfo, setStakeSumm, doStake, checkCuponLoading, checkStakeStatus);

    setInterval(closePopUp, 500);

    document.addEventListener('DOMContentLoaded',
        function() {
            console.log('Начали');
            if (worker.IsShowStake) {
                //showStakeAsync();
                setTimeout(showStake, 1000);
            } else {
                loginRu();
            }

        });


    let loginTry = 0;

    function loginAction() {
        try {
            loginTry++;
            if (typeof (window.jQuery) !== typeof (Function)) {
                worker.Helper.WriteLine('jq не загружен');
                throw -1;
            }

            jQuery.expr[":"].Contains = jQuery.expr.createPseudo(function(arg) {
                return function(elem) {
                    return jQuery(elem)
                        .text()
                        .toUpperCase()
                        .indexOf(arg.toUpperCase()) >=
                        0;
                };
            });


            updateBalanceAndLogin();
            if (worker.Islogin) {

                return;
            }


            if (loginTry > 5) {
                worker.Helper.WriteLine('Прошло 5 попыток. Проверьте логин и пароль и попробуйте еще раз.');
                return;
            }

            var usLogin = document.querySelectorAll('input[data-ng-model="user.login"]')[0];
            usLogin.value = worker.Login;
            angular.element(usLogin).triggerHandler('input');

            var usPasswrod = document.querySelectorAll('input[data-ng-model="user.password"]')[0];
            usPasswrod.value = worker.Password;
            angular.element(usPasswrod).triggerHandler('input');
            document.querySelectorAll('button.login__btn')[0].click();

            throw "вбили данные";

        } catch (e) {
            current++;
            if (current >= maxError) {
                console.log('CheckInit: return');
                return;
            }
            setTimeout(loginAction, 1000);
        }
    }

    async function loginRu() {
        let isLoadJq = await asyncCallbackLong(() => {
            if (typeof (Function) === typeof (window.jQuery))
                return true;
            return false;
        },200,100);

        if (!isLoadJq) {
            worker.Helper.WriteLine('Jq так и не загружен');
            worker.Islogin = false;
            worker.JSLogined();
            return;
        }

        let isLoadLiveLine = await asyncCallbackHot(() => {
            return document.querySelectorAll('div.statistic__wrapper').length!==0;
        });

        if (!isLoadLiveLine) {
            worker.Helper.WriteLine('Линия так и не загружена');
            worker.Islogin = false;
            worker.JSLogined();
            return;
        }
        let isLoadApp = await asyncCallbackHot(() => {
            if (window.apiWlb && window.apiWlb.client)
                return true;
            return false;
        });

        if (!isLoadApp) {
            worker.Helper.WriteLine('Приложение так и не загружено');
            worker.Islogin = false;
            worker.JSLogined();
            return;
        }

        let isLoadUserBlock = await asyncCallbackHot(() => {
            let loginButton = document.querySelector('a.logout__btn.logout__btn_enter');
            let usedDiv = document.querySelector('div.login');
            if (isInView(loginButton) || isInView(usedDiv)) {
                return true;
            }
            return false;

        });

        if (!isLoadUserBlock) {
            worker.Helper.WriteLine('Блок пользователя так и не показался');
            worker.Islogin = false;
            worker.JSLogined();
            return;
        }

        worker.Islogin = checkLogin();
        if (worker.Islogin) {
            let isLoadBalance = await asyncCallbackHot(() => {
                if (apiWlb.client.user.balance && apiWlb.client.user.balance.payed)
                    return true;
                return false;
            });
            
            updateBalanceAndLogin();
            return;
        }

        let isLoadLoginButton = await asyncCallbackHot(() => {
            let loginButton = document.querySelector('a.logout__btn.logout__btn_enter');
            return isInView(loginButton);
        });

        if (!isLoadLoginButton) {
            worker.Helper.WriteLine('Кнопка входа так и не появилась');
            worker.Islogin = false;
            worker.JSLogined();
            return;
        }

        document.querySelector('a.logout__btn.logout__btn_enter').click();

        let isLoadLoginForm = await asyncCallbackHot(() => {
            return isInView(document.querySelector('input[name="login"]'));
        });

        if (!isLoadLoginForm) {
            worker.Helper.WriteLine('Поле логина так и не появилась');
            worker.Islogin = false;
            worker.JSLogined();
            return;
        }
        let loginInput = document.querySelector('input[name="login"]');
        let passwordInput = document.querySelector('input[name="passw"]');

        loginInput.value = worker.Login;
        fireEvent(loginInput,'input');

        passwordInput.value = worker.Password;
        fireEvent(passwordInput, 'input');

        document.querySelector('button.logout__btn.logout__btn_enter').click();

        let isLogined = await asyncCallbackHot(() => {
            return isInView(document.querySelector('div.login__info'));
        });

        if (!isLogined) {
            worker.Helper.WriteLine('Авторизация, так и не прошла');
            worker.Islogin = false;
            worker.JSLogined();
            return;
        }

        updateBalanceAndLogin();
    }

    let isClosedFreebet = false;

    function closePopUp() {
        if (isClosedFreebet) {
            clearInterval(closePopUp);
            return;
        }
        if (!isInView(document.querySelector('img.pop-up-freebet'))) {
            return;
        }
        console.log('банер фребет обноружен');

        if (document.querySelector('div.cdk-overlay-container') &&
            isInView(document.querySelector('div.cdk-overlay-container'))) {
            if (document.querySelector('div.cdk-overlay-container').children[0])
                document.querySelector('div.cdk-overlay-container').children[0].click();
        }
    }

    function showStake() {
        setTimeout(function() {
                console.log('there is 0');
                scrollDown();
            },
            1500);
    }

    async function showStakeAsync() {
        let isLoadJq = await asyncCallbackLong(() => {
            if (typeof (Function) === typeof (window.jQuery))
                return true;
            return false;
        }, 200, 100);

        jQuery.expr[':'].Contains = jQuery.expr.createPseudo(function (arg) {
            return function (elem) {
                return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
            };
        });


        if (!isLoadJq) {
            throw 'Jq так и не загружен';
        }

        let isLoadLiveLine = await asyncCallbackHot(() => {
            return window.document.querySelectorAll('div[data-ng-click="addBet(col)"]').length !== 0;
        });

        if (!isLoadLiveLine) {
            throw 'Линия так и не загружена';
        }
        let dt = unescape(worker.BetId).split('_');
        console.log(unescape(worker.BetId));

        let header = null;
        let isFindingHeader = await asyncCallbackHot(() => {
            header = $(":contains('" + dt[0] + "')[data-ng-bind*='market.name']").get()[0];
            return isInView(header);
        });
        console.log(header);

        if (!isFindingHeader) {
            throw 'Header не найден';
        }

        let title = '::col.text';
        let title2 = '::col.text';
        let d = 2;

        if (d === 2 && dt[1] === '' && (dt[2].substring(0, 2) === 'м ' || dt[2].substring(0, 2) === 'б ')) {
            dt = [dt[0], dt[2].split(' ')[1], (dt[2].substring(0, 2) === 'м ' ? 'Меньше' : (dt[2].substring(0, 2) === 'б ' ? 'Больше' : dt[2]))];
        }
        if (dt.length !== 3) {
            throw new 'Данные для открытия не корректны';
        }

        if (dt[1] !== '') {
            let a2 = null;
            let a3 = null;
            let isFinding = await asyncCallbackHot(() => {
                a2 = $(header).find(":contains('" + dt[1] + "')[data-ng-bind *= '" + title + "']");
                if (a2.length !== 0) {
                    return true;
                }

                a3 = $(header).find(":contains('" + dt[2].replace('-', '−') + "')[data-ng-bind *= '" + title2 + "']");
                if (a3.length !== 0) {
                    a3.get()[0].parentNode.click();
                    return true;

                }
                return false;
            });

            console.log(a2);

            if (!isFinding)
                throw new 'не нашли ставку';
        } else {
            let element = null;
            let isFindingElement = await asyncCallbackHot(() => {
                element = $(header).find(":contains('" + dt[2].replace('-', '−') + "')[data-ng-bind *= '" + title2 + "']");
                if (element.length !== 0)
                    return true;
                return false;
            });

            if (!element || !isFindingElement) {
                throw new 'не нашли ставку';
            }

            element.get()[0].parentNode.click();
        }
    }

    var currentNode = null;


    function fireEvent(element, event) {
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent(event, true, true);
        element.dispatchEvent(evt);
    }


    function scrollDown() {
        closePopUp();
        var sel = window.unescape(worker.BetId).split('_');
        console.dir(sel);
        if (jQuery("[data-ng-bind*='market.name']").length !== 0) {
            console.log('there is 2');
            window.scrollBy(0, 300);
            setTimeout(function() {
                    var a = $(":contains('" + sel[0] + "')[data-ng-bind*='market.name']");
                    console.log(a);
                    if (a.length !== 0) {
                        a[0].parentNode.scrollIntoView();
                        doBet();
                    } else {
                        scrollDown();
                    }
                },
                400);
        } else {
            setTimeout(function() {
                    scrollDown();
                },
                400);
        }
    }


    function doBet() {
        closePopUp();
        var betDataArray = window.unescape(worker.BetId).split('_');
        var betDataGroupTitle = betDataArray[0]; //Заголовок группы
        var betDataType = betDataArray[1]; //Больше/меньше
        var betDataCoef = betDataArray[2]; //Кэф и б/м - текст

        var a1 = $(":contains('" + betDataGroupTitle + "')[data-ng-bind*='market.name']").get()[0];
        console.log('a1=');
        console.log(a1);
        var betGroupe = a1.parentNode.parentNode;
        var title = '::col.text';
        var title2 = '::col.text';


        var err = 1;
        if (betDataArray.length === 3) {
            var a3;
            if (betDataType !== '') {
                //Если фора или тотал
                var a2 = $(betGroupe).find(":contains('" + betDataType + "')[data-ng-bind *= '" + title + "']");
                if (a2.length !== 0) {
                    for (var c = 0; c < a2.length; c++) {
                        console.log(a2.get()[c]);

                        var h2 = a2.get()[c].parentNode.parentNode.parentNode;
                        a3 = $(h2).find(":contains('" +
                            betDataCoef.replace('-', '−') +
                            "')[data-ng-bind *= '" +
                            title2 +
                            "']");
                        console.log(a3);
                        if (a3.length !== 0) {
                            console.log('1');
                            currentNode = a3.get()[0].parentNode;
                            if (currentNode.classList.contains('locked')) {
                                closePopUp();
                                worker.JSStop();
                                return;
                            }
                            console.dir(currentNode.classList);
                            err = 0;
                            break;
                        }
                    }
                } else {
                    closePopUp();
                    worker.JSStop();
                }
            } else {
                console.log('betDataType????'); //когда это происходит?
                a3 = $(betGroupe)
                    .find(":contains('" + betDataCoef.replace('-', '−') + "')[data-ng-bind *= '" + title2 + "']");
                console.log(a3);
                if (a3.length !== 0) {
                    console.log('1');
                    a3.get()[0].parentNode.click();
                    err = 0;
                }
            }
        }


        if (err === 1) {

            current++;
            if (current >= maxError) {
                worker.JSFail();
            } else {
                setTimeout(function() {
                        doBet();
                    },
                    1000);
            }

        } else {
            setTimeout(function() {
                    if (angular.element(document.querySelectorAll('div[data-coupon]')[0]).scope()) {
                        var scope = angular.element(document.querySelectorAll('div[data-coupon]')[0]).scope();
                        scope.$apply(function() { scope.coupon.page = "main" });
                    }

                    if (angular.element(document.querySelectorAll('[data-translate="coupon.ORDINAR"]')[0]).scope())
                        angular.element(document.querySelectorAll('[data-translate="coupon.ORDINAR"]')[0]).scope()
                            .setTab(0);

                    if (angular.element(document.querySelectorAll('[data-translate="coupon.CLEAN"]')[0]).scope())
                        angular.element(document.querySelectorAll('[data-translate="coupon.CLEAN"]')[0]).scope()
                            .betDelete();

                    currentNode.click();

                    document.querySelectorAll("div.coupon-tabs")[0].scrollIntoView();

                    //Нажимаем, что бы макс успел отрисоваться
                    if (angular.element(document.querySelectorAll("button.coupon-bet__btn.ng-scope")[0]).scope())
                        angular.element(document.querySelectorAll("button.coupon-bet__btn.ng-scope")[0]).scope()
                            .setMax();

                    setTimeout(function() {
                            if (getStakeCount() === 1) {


                                updateBalanceAndLogin();
                                worker.JSStop();
                            } else {
                                worker.Helper.WriteLine('Купон не раскрылся!');
                                doBet();
                            }

                        },
                        1000);
                },
                1500);
        }
    }

    /**
     * Получает баланс на сайте.
     * @return {number} Баланс
     */
    function getbalance() {
        try {
            return parseFloat(apiWlb.client.user.balance.payed);
        } catch (e) {
            console.log('Ошибка парсинга баланса: ' + e);
            return -1;
        }
    }

    /**
     * Оповещает .Net о статусе баланса. Учитывает авторизацию
     */
    function updateBalance() {
        if (checkLogin()) {
            try {
                var balance = getbalance();
                var tryCount = 0;
                while (tryCount < 100 && balance === -1) {
                    balance = getbalance();
                    if (balance !== -1)
                        break;
                    balance = getbalance();
                    tryCount++;
                    console.log('попытка баланса ' + tryCount);
                }
                worker.JSBalanceChange(balance);
            } catch (ex) {
                worker.Helper.WriteLine('Balance not parse: ' + ex);
                worker.JSBalanceChange(-2);
            }
        } else {
            console.log('Нет авторизации!');
            worker.JSBalanceChange(-2);
        }
    }

    /**
     * Оповещает .Net о балансе и авторизации
     */
    function updateBalanceAndLogin() {
        worker.Islogin = checkLogin();
        worker.Helper.WriteLine('Статус авторизации: ' + worker.Islogin);
        worker.JSLogined();
        updateBalance();
    }

    /**
     * Проверяет авторизацию на сайте
     * @return {boolean} Статус авторизации
     */
    function checkLogin() {
        try {
            if (window.apiWlb && window.apiWlb.client && window.apiWlb.client.user)
                return true;
            return false;
        } catch (e) {
            return false;
        }
    }


    /**
     * Выполняет методы по сбору информации. Всю необходимую информацию записывает в объект {worker.StakeInfo}.
     * Возвращает JSON.stringify(worker.StakeInfo);
     * @return {string} Всю необходимую информацию записывает в объект {worker.StakeInfo}.
     */
    function getStakeInfo() {
        worker.Helper.WriteLine(`getStakeInfo from ${worker.BookmakerName}`);
        if (!worker.StakeInfo) {
            console.log('StakeInfo==null. Error');
        }
        worker.StakeInfo.Auth = checkLogin();
        worker.StakeInfo.StakeCount = getStakeCount();

        worker.StakeInfo.Balance = getbalance();
        worker.StakeInfo.MinSumm = parseFloat(getMinimalStake());
        worker.StakeInfo.MaxSumm = parseFloat(getMaxStake());
        worker.StakeInfo.Summ = getSummFromStake();

        if (worker.StakeInfo.StakeCount === 1) {
            worker.StakeInfo.IsEnebled = checkStakeEnebled();
            worker.StakeInfo.Coef = getCoefFromCupon();

            worker.StakeInfo.Parametr = getParametrFromCupon();
        }

        console.dir(worker.StakeInfo);
        return JSON.stringify(worker.StakeInfo);
    }

    /**
     * Получает актуальный кэф в купоне
     * @return {number} актуальный кэф в купоне
     */
    function getParametrFromCupon() {
        try {
            var dt = angular.element(document.querySelectorAll('div[data-coupon-bet="bet"]')[0]).scope().bet.Free;
            console.log('Free= ' + dt);
            var a = dt.split(' ');
            return parseFloat(a[a.length - 1]);
        } catch (e) {
            return -6666;
        }
    }

    /**
     * Получает актуальный кэф в купоне
     * @return {number} актуальный кэф в купоне
     */
    function getCoefFromCupon() {
        try {
            return parseFloat(angular.element(document.querySelectorAll('div[data-coupon-bet="bet"]')[0]).scope().bet
                .V);
        } catch (e) {
            return 0;
        }
    }

    /**
     * Проверяет, доступна ли ставка в куопне
     * @return {boolean} доступна ли ставка в куопне
     */
    function checkStakeEnebled() {
        try {
            //3 - недоступно
            //0 - доступна
            return angular.element(document.querySelectorAll('div[data-coupon-bet="bet"]')[0]).scope().bet.state === 0;
        } catch (e) {
            console.log('error parse Enebled ' + e);
            return false;
        }
    }

    /**
     * Получает текущую сумму в купоне
     * @return {number} текущую сумму в купоне
     */
    function getSummFromStake() {
        try {
            return parseFloat(angular.element(document.querySelectorAll('div[data-coupon-bet="bet"]')[0]).scope().bet
                .suma);
        } catch (e) {
            console.log('Error parse summ ' + e);
            return NaN;
        }
    }

    /**
     * Получает максимальное значение по ставке
     * @return {number} максимальное значение по ставке
     */
    function getMaxStake() {
        try {
            if (angular.element(document.querySelectorAll("button.coupon-bet__btn.ng-scope")[0]).scope())
                angular.element(document.querySelectorAll("button.coupon-bet__btn.ng-scope")[0]).scope().setMax();
            var max = document.querySelector('.coupon-bet__summ.ng-binding.ng-scope').innerText.replace(' ', '')
                .replace(' ', '');
            return parseFloat(max);
        } catch (e) {
            console.log('errorParseMax' + e);
            return NaN;
        }
    }

    /**
     * Получает размер минимальной ставки в зависимости от валюты
     * @return {number}  размер минимальной ставки в зависимости от валюты
     */
    function getMinimalStake() {
        try {
            if (angular.element(document.querySelectorAll('[data-translate="lgnf.BALANCE_SC"]')[0]).scope().user
                .currency ===
                1)
                return 50;
            return 1; //Для остальных валют
        } catch (e) {
            return 1;
        }
    }

    /**
     * Получает количество ставко в купоне
     * @return {number} Число ставок
     */
    function getStakeCount() {
        return document.querySelectorAll('div[data-coupon-bet="bet"]').length;
    }


    /**
     * Установить сумму в купон
     * True - Если все прошло успешно
     * @param  {number} sumStake Сумма ставки
     * @return {boolean} True - Если все прошло успешно
     */
    function setStakeSumm(sumStake) {
        try {
            $("input[data-ng-model='bet.suma']").get()[0].value = parseFloat(sumStake);
            fireEvent($("input[data-ng-model='bet.suma']").get()[0], 'input');
            fireEvent($("input[data-ng-model='bet.suma']").get()[0], 'blur');
            return true;
        } catch (ex) {
            console.log('Bet not set: ' + ex);
            return false;
        }
        //Необходимо учитывать, что некоторые сайты не принимают float
    }

    var checkCounter = 0;
    var reloginTry = 0;

    /**
    * Возращает true - если нажали на кнопку "Поставить"
    * @return {boolean} true - если нажали на кнопку "Поставить"
    */
    function doStake() {
        if (!checkLogin() && reloginTry === 0) {
            worker.Helper.WriteLine('Нет авторизации. Авторизуемся');
            loginAction();
            reloginTry = 1;
            return false;
        }
        if (document.querySelectorAll('img.pop-up-freebet')[0]) {
            if (!document.querySelectorAll('img.pop-up-freebet')[0].previousSibling) {
                worker.Helper.WriteLine('Нет кнопки зарытия бесплатной ставки!');
            }
            worker.Helper.WriteLine('Закрываем окно бесплатной ставки!');
            document.querySelectorAll('img.pop-up-freebet')[0].previousSibling.click();
            return false;
        }

        let changeButtonOk = document.querySelector('[data-ng-show="buttonOk"]');
        if (changeButtonOk) {
            let textChangeCoef = document.querySelector('div[data-translate="coupon.MESSAGES.14.TEXT"]');
            if (isInView(textChangeCoef)) {
                worker.Helper.WriteLine('Окно:Кэф поменялся');
                worker.Helper.WriteLine(textChangeCoef.innerText.trim());
                changeButtonOk.click();
                return false;
            }

            //Окно с изменениями
            if (document.querySelector('[data-ng-show="buttonCancel"]'))
                document.querySelector('[data-ng-show="buttonCancel"]').click();
            return false;
        }

        if (!checkStakeEnebled()) {
            worker.Helper.WriteLine('Ставка не доступна!');
            return false;
        }
        if (getStakeCount() !== 1) {
            worker.Helper.WriteLine('Ставок дожно быть 1, а по факту: ' + getStakeCount());
            return false;
        }
        var currentCoef = getCoefFromCupon();
        if (worker.StakeInfo.Coef !== currentCoef) {
            worker.Helper.WriteLine('Коэф поменялся с прошлого раза');
            worker.Helper.WriteLine('Был: ' + worker.StakeInfo.Coef + ' а стал: ' + currentCoef);
            return false;
        }
        var currentParametr = getParametrFromCupon();
        if (!isNaN(currentParametr) &&
            !isNaN(worker.StakeInfo.Parametr) &&
            worker.StakeInfo.Parametr !== currentParametr) {
            worker.Helper.WriteLine('Параметр поменялся с прошлого раза');
            worker.Helper.WriteLine('Был: ' + worker.StakeInfo.Parametr + ' а стал: ' + currentParametr);
            return false;
        }
        var currentSumm = getSummFromStake();
        if (currentSumm < getMinimalStake()) {
            worker.Helper.WriteLine('Сумма в купоне меньше минимальной!');
            return false;
        }

        if (Number.isNaN(currentSumm)) {
            worker.Helper.WriteLine('Текущая сумма не определена!');
            return false;
        }
        if (currentSumm === 0) {
            worker.Helper.WriteLine('Текущая сумма=0');
            return false;
        }
        if (!document.querySelectorAll('a.button__block')[0]) {
            worker.Helper.WriteLine('Нет кнопки ставки!');
            return false;
        }
        checkCounter = 0;
        document.querySelectorAll('a.button__block')[0].click();
        return true;
        /*
        * Обязательно проверяем:
        * 1) Была ли кнопка "принять изменения". Если она есть, необходимо ее нажать и вернуть false
        * 2) Доступна ли ставка
        * 3) Есть ли в купоне ровно 1 ставка
        * Если что-то мешает нажать на эту кнопку, записать это в логи с worker.Helper.WriteLine
        */
    }


    /**
     * Проверка. Ставка ставится? проверяется после @see {doStake()}
     * true - если ставка все еще принимается
     * @return {boolean}  Ставка ставится?
     */
    function checkCuponLoading() {
        var rez = document.querySelector('div.coupon-total__control') !== null &&
            document.querySelector('div.coupon-total__control').getBoundingClientRect().width !== 0;
        if (checkCounter < 2) {
            rez = true;
            checkCounter++;
        }

        worker.Helper.WriteLine("Ставка еще ставиться? " + rez);
        return rez;

        //coupon-total__control

        //Статус дублируем в worker.Helper.WriteLine('Ставка еще ставиться? ' + currentCuppon.kind);
    }

    /**
     * Проверка. Ставка принята?
     * @return {boolean} Ставка принята?
     */
    function checkStakeStatus() {
        if (document.querySelector('[data-ng-show="buttonCancel"]') &&
            document.querySelector('[data-ng-show="buttonCancel"]').getBoundingClientRect().width !== 0) {
            worker.Helper.WriteLine('Окно с изменениями!');
            return false;
        }
        var rez = ($('h1:contains("Купон обработан")').length === 1 ||
            $('h1:contains("Купон принят")').length === 1);
        worker.Helper.WriteLine('Ставка принята: ' + rez);
        return rez;
        //Купон обработан
        //Купон принят  coupon.MESSAGES.22.TITLE
    }

    myScope.updateBalanceAndLogin = updateBalanceAndLogin;
    myScope.checkLogin = checkLogin;
    myScope.ShowStake = showStake;


    async function sleep(msec) { return new Promise(resolve => setTimeout(resolve, msec)); }
    async function asyncCallback(callbackBoolean) { var tryCounter = 0; while (tryCounter < 10) { if (callbackBoolean()) { return true; } tryCounter++; await sleep(1000); } return false; }
    async function asyncCallbackLong(callbackBoolean, sleepTime, tryCount) { var tryCounter = 0; while (tryCounter < tryCount) { if (callbackBoolean()) { return true; } tryCounter++; await sleep(sleepTime); } return false; }
    async function asyncCallbackHot(callbackBoolean) { return await asyncCallbackLong(callbackBoolean, 200, 50); }
    function isInView(element) { if (!element) return false;
        if (!element.getBoundingClientRect()) return false; return element.getBoundingClientRect().width !== 0; }

})();


