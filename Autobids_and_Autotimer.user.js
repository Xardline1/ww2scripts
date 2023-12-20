// ==UserScript==
// @name         Autobids and Autotimer
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  Auto bids on auction ww2 and auto update the timer
// @author       Xardline
// @match        https://ww1.ru/item/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var audioFiles = {
        '5min': 'https://ww2.pw/waterimg/p_26183315_321.mp3',
        '1min': 'https://ww2.pw/waterimg/p_26183322_358.mp3',
        '30sec': 'https://ww2.pw/waterimg/p_26183329_391.mp3',
        '10sec': 'https://ww2.pw/waterimg/p_26183814_784.mp3',
        '0sec': 'https://ww2.pw/waterimg/p_26183334_412.mp3'
    };

    var soundPlayed = {
        '0sec': false
    };

    // стиляшка
    var styleTag = document.createElement('style');
    styleTag.type = 'text/css';
    styleTag.innerHTML = `
        #auto-bid-modal-wrapper {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            transition: opacity 0.3s ease;
            opacity: 0;
        }

        #auto-bid-modal {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            padding: 20px;
            border: 1px solid #ccc;
            z-index: 10000;
            overflow-y: auto;
            max-height: 90%;
        }

        #auto-bid-modal button:hover {
            background-color: #2567ad;
        }

        #auto-bid-modal button:focus {
            background-color: #1b5089;
            box-shadow: 0px 0px 8px 2px rgba(0, 0, 0, .5);
        }

        #auto-bid-modal button {
            padding: 1px 10px;
            border-radius: 4px;
            background-color: #367bc5;
            color: #fff;
            border: none;
            font-family: 'Cuprum', sans-serif;
            font-size: 18px;
            font-weight: 700;
            transition: background-color .3s ease;
            cursor: pointer;
            margin-right: 10px;
        }

        #auto-bid-modal p {
            font-size: 18px;
            text-decoration: overline;
        }

        input#firstBid, input#secondBid {
            margin-bottom: 1rem;
            border-radius: 5px;
            border: 0.1px solid #000;
            padding-right: 25px;
            position: relative;
        }

        .tooltip-icon {
            position: relative;
            display: inline;
            top: 50%;
            left: 10.5rem;
            transform: translateY(-50%);
            font-size: 16px;
            cursor: pointer;
            z-index: 1;
        }

        .tooltip {
            position: absolute;
            top: 53%;
            left: 68%;
            transform: translateY(-50%);
            padding: 5px;
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 5px;
            display: none;
            opacity: 1;
        }

        .tooltip::before {
            content: "";
            position: absolute;
            top: 50%;
            right: 100%;
            margin-top: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: transparent transparent transparent #fff;
        }

        div#lotContainer {
            margin-bottom: 0.5rem;
        }

        #auto-bid-modal-wrapper {
            transition: opacity 0.3s ease;
        }

        #messageContainer {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            padding: 20px;
            border: 1px solid #ccc;
            z-index: 10000;
            transition: opacity 0.3s;
            opacity: 0;
        }

        #messageContainer.show {
            opacity: 1;
        }

        #auto-bid-widget {
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: #fff;
            padding: 10px;
            border: 1px solid #ccc;
            cursor: pointer;
            z-index: 1;
        }

        #auto-bid-widget .widget-text {
            color: #073f7d;
            text-decoration: underline;
        }

        .lot-input-wrapper {
            margin: 0.5rem 0;
        }

        .lot-input-wrapper hr {
            margin: 0.5rem 0;
        }

        .lot-input-wrapper p {
            font-size: 18px;
            text-decoration: overline;
        }

        .lot-input-wrapper label {
            display: block;
        }

        .lot-input-wrapper input[type="text"],
        .lot-input-wrapper input[type="time"] {
            margin: 0rem 0 1rem 0.5rem;
            border-radius: 5px;
            border: 0.1px solid #000;
            padding-left: 10px;
            padding-right: 10px;
            position: relative;
        }

        .lot-input-wrapper button {
            margin-top: 1rem;
        }
    `;
    document.head.appendChild(styleTag);

    function createLotInput(index) {
        var lotWrapper = document.createElement('div');
        lotWrapper.classList.add('lot-input-wrapper');
        lotWrapper.id = 'lot-wrapper-' + index;

        var separator = document.createElement('hr');
        lotWrapper.appendChild(separator);

        var mainLotLabel = document.createElement('p');
        mainLotLabel.textContent = 'Следующий лот №' + index + ':';
        lotWrapper.appendChild(mainLotLabel);

        function createInput(type, id, labelText, placeholderText, changeHandler) {
            var label = document.createElement('label');
            label.for = id;
            label.textContent = labelText;

            var input = document.createElement('input');
            input.type = type;
            input.id = id;
            input.placeholder = placeholderText;
            input.addEventListener('change', changeHandler);

            label.appendChild(input);
            lotWrapper.appendChild(label);

            return input;
        }

        var lotInput = createInput('text', 'lot-' + index, 'Ссылка лота ' + index + ':', 'https://ww1.ru/...', function() {
            localStorage.setItem('lot-' + index, lotInput.value);
        });

        var timeInput = createInput('time', 'time-' + index, 'Аукцион ' + index + ' завершается в:', '00:00', function() {
            console.log('Time Input Value:', timeInput.value);
            localStorage.setItem('time-' + index, timeInput.value);
        });

        var firstBidInput = createInput('text', 'firstBid-' + index, 'Первая ставка:', 'Пример: 1000', function() {
            localStorage.setItem('firstBid-' + index, firstBidInput.value);
        });

        var secondBidInput = createInput('text', 'secondBid-' + index, 'Вторая ставка:', 'Пример: 3500', function() {
            localStorage.setItem('secondBid-' + index, secondBidInput.value);
        });

        var removeButton = document.createElement('button');
        removeButton.textContent = 'Удалить лот ' + index;
        removeButton.addEventListener('click', function() {
            var wrapperToRemove = document.getElementById('lot-wrapper-' + index);
            wrapperToRemove.parentNode.removeChild(wrapperToRemove);
            localStorage.removeItem('lot-' + index);
        });

        lotWrapper.appendChild(removeButton);

        return lotWrapper;
    }

    function createModal() {
        var modalWrapper = document.createElement('div');
        modalWrapper.id = 'auto-bid-modal-wrapper';
        document.body.appendChild(modalWrapper);

        // анимация модалки 1
        modalWrapper.addEventListener('click', function (event) {
            if (event.target === modalWrapper) {

                if (modalWrapper.style.opacity === '1') {
                    modalWrapper.style.opacity = '0';
                    setTimeout(function () {
                        modalWrapper.style.display = 'none';
                    }, 300);
                } else {
                    modalWrapper.style.opacity = '1';

                    setTimeout(function () {
                        modalWrapper.style.display = 'block';
                    }, 10);
                }
            }
        });

        var modal = document.createElement('div');
        modal.id = 'auto-bid-modal';
        document.body.appendChild(modal);

        modal.innerHTML = `
            <h2>Настройка автоставок</h2>
            <p>Основной лот:</p>
            <label for="firstBid">
                Первая ставка:
                <div class="tooltip-icon" id="firstBidTooltipIcon" tooltip="Устанавливается на 15-ой секунде аукциона">?</div>
                <div class="tooltip" id="firstBidTooltip">Устанавливается на 15-ой секунде аукциона</div>
            </label>
            <input type="text" id="firstBid" value="${localStorage.getItem('firstBid') || ''}" placeholder="Пример: 1000">
            <br>
            <label for="secondBid">
                Вторая ставка:
                <div class="tooltip-icon" id="secondBidTooltipIcon" tooltip="Устанавливается на 3-ей секунде аукциона">?</div>
                <div class="tooltip" id="secondBidTooltip">Устанавливается на 3-ей секунде аукциона</div>
            </label>
            <input type="text" id="secondBid" value="${localStorage.getItem('secondBid') || ''}" placeholder="Пример: 3500">
            <br>
            <button id="saveBids">Сохранить ставки</button>
            <button id="clearBids">Очистить ставки</button>
            <button id="closeModal">Свернуть</button>
            <div id="lotContainer"></div> <!-- Контейнер для лотов -->
            <button id="addLot">Добавить еще</button>
        `;

        modalWrapper.appendChild(modal);
        document.body.appendChild(modalWrapper);

        var lotContainer = document.getElementById('lotContainer');
        var addLotButton = document.getElementById('addLot');
        var addLotListenerAdded = localStorage.getItem('addLotListenerAdded') === 'true';

        function addLotClickHandler() {
            var index = document.querySelectorAll('.lot-input-wrapper').length + 1;
            var newLotInput = createLotInput(index);
            newLotInput.classList.add('lot-input-wrapper');
            lotContainer.appendChild(newLotInput);

            if (!addLotListenerAdded) {
                addLotButton.removeEventListener('click', addLotClickHandler);
                addLotListenerAdded = true;
                localStorage.setItem('addLotListenerAdded', 'true');
            }
        }

        if (!addLotListenerAdded) {
            addLotButton.addEventListener('click', addLotClickHandler);
        }

        document.getElementById('auto-bid-widget').addEventListener('click', function() {
            var modalWrapper = document.getElementById('auto-bid-modal-wrapper');

            // анимация модалки 2
            if (modalWrapper.style.display === 'block') {
                return;
            }

            modalWrapper.style.display = 'block';

            setTimeout(function() {
                modalWrapper.style.opacity = '1';
            }, 10);

            loadSavedLots();
        });

        document.getElementById('closeModal').addEventListener('click', function() {
            var modalWrapper = document.getElementById('auto-bid-modal-wrapper');
            modalWrapper.style.opacity = '0';
            setTimeout(function () {
                modalWrapper.style.display = 'none';
            }, 300);
        });

        document.getElementById('saveBids').addEventListener('click', function () {
            var firstBidInput = document.getElementById('firstBid');
            var secondBidInput = document.getElementById('secondBid');
            var firstBid = firstBidInput.value;
            var secondBid = secondBidInput.value;

            var messageContainer = document.createElement('div');
            messageContainer.id = 'messageContainer';
            document.body.appendChild(messageContainer);

            function showMessage(message) {
                messageContainer.innerHTML = message;

                setTimeout(function () {
                    messageContainer.classList.add('show');
                }, 10);

                setTimeout(function () {
                    messageContainer.classList.remove('show');
                }, 2000);
            }

            if (firstBid && secondBid) {
                localStorage.setItem('firstBid', firstBid);
                localStorage.setItem('secondBid', secondBid);
                localStorage.setItem('firstBidPlaced', 'false');
                localStorage.setItem('secondBidPlaced', 'false');

                firstBidInput.placeholder = firstBid;
                secondBidInput.placeholder = secondBid;

                firstBidInput.value = '';
                secondBidInput.value = '';

                showMessage('Ставки успешно сохранены. Страница будет перезагружена.');

                setTimeout(function () {
                    location.reload();
                }, 2100);

            } else {
                showMessage('Вы не ввели суммы ставок. Попробуйте снова.');

                setTimeout(function () {
                }, 2000);
            }
        });

        document.getElementById('clearBids').addEventListener('click', function() {
            localStorage.removeItem('firstBid');
            localStorage.removeItem('secondBid');
            localStorage.removeItem('firstBidPlaced');
            localStorage.removeItem('secondBidPlaced');

            // чистка значений осн.лота
            var firstBidInput = document.getElementById('firstBid');
            var secondBidInput = document.getElementById('secondBid');
            firstBidInput.placeholder = 'Пример: 1000';
            secondBidInput.placeholder = 'Пример: 3500';

            var messageContainer = document.createElement('div');
            messageContainer.id = 'messageContainer';
            document.body.appendChild(messageContainer);

            function showMessage(message) {
                messageContainer.innerHTML = message;

                setTimeout(function () {
                    messageContainer.classList.add('show');
                }, 10);

                setTimeout(function () {
                    messageContainer.classList.remove('show');
                }, 2000);
            }

            // чистка инфы доп.лотов
            var lotInputs = document.querySelectorAll('.lot-input-wrapper input');
            lotInputs.forEach(function (input, index) {
                localStorage.removeItem('lot-' + (index + 1));
                localStorage.removeItem('time-' + (index + 1));
                localStorage.removeItem('firstBid-' + (index + 1));
                localStorage.removeItem('secondBid-' + (index + 1));

                if (input.id.startsWith('lot-')) {
                    input.placeholder = 'https://ww1.ru/...';
                } else if (input.id.startsWith('time-')) {
                    input.value = '00:00';
                } else if (input.id.startsWith('firstBid-')) {
                    input.placeholder = 'Пример: 1000';
                } else if (input.id.startsWith('secondBid-')) {
                    input.placeholder = 'Пример: 3500';
                }
            });

            showMessage('Ставки успешно очищены! Страница будет перезагружена.');

            setTimeout(function () {
                location.reload();
            }, 2100);
        });

        document.getElementById('firstBidTooltipIcon').addEventListener('mouseenter', function() {
            document.getElementById('firstBidTooltip').style.display = 'block';
        });

        document.getElementById('firstBidTooltipIcon').addEventListener('mouseleave', function() {
            document.getElementById('firstBidTooltip').style.display = 'none';
        });

        document.getElementById('secondBidTooltipIcon').addEventListener('mouseenter', function() {
            document.getElementById('secondBidTooltip').style.display = 'block';
        });

        document.getElementById('secondBidTooltipIcon').addEventListener('mouseleave', function() {
            document.getElementById('secondBidTooltip').style.display = 'none';
        });

        var buttonsContainer = document.createElement('div');
        buttonsContainer.style.marginTop = '1rem';

        buttonsContainer.appendChild(document.getElementById('saveBids'));
        buttonsContainer.appendChild(document.getElementById('clearBids'));
        buttonsContainer.appendChild(document.getElementById('closeModal'));

        modal.appendChild(buttonsContainer);

        lotContainer.parentNode.insertBefore(addLotButton, lotContainer.nextSibling);

        addLotButton.addEventListener('click', function() {
            var index = document.querySelectorAll('.lot-input-wrapper').length + 1;
            console.log('Лот сохранен в:', index);

            var newLotInput = createLotInput(index);
            newLotInput.classList.add('lot-input-wrapper');
            lotContainer.appendChild(newLotInput);

            saveLot(index);
        });
      loadSavedLots();
    }

    function placeBid(bidValue) {
        var bidInput = document.getElementById('user-rate');
        var submitButton = document.getElementById('bind-rate');

        bidInput.value = bidValue;

        submitButton.click();
    }

    function appendLotToContainer(index) {
        var lotContainer = document.getElementById('lotContainer');
        var newLotInput = createLotInput(index);
        newLotInput.classList.add('lot-input-wrapper');
        lotContainer.appendChild(newLotInput);
    }

    function checkAndReplaceLots() {
        console.log('Функция checkAndReplaceLots запущена!');

        localStorage.removeItem('firstBid');
        localStorage.removeItem('secondBid');

        for (var i = 1; i <= 30; i++) {
            var lotKey = 'lot-' + i;
            var timeKey = 'time-' + i;
            var firstLotBid = 'firstBid-' + i;
            var secondLotBid = 'secondBid-' + i;

            var lotData = localStorage.getItem(lotKey);
            var timeData = localStorage.getItem(timeKey);
            var firstLotBidData = localStorage.getItem(firstLotBid);
            var secondLotBidData = localStorage.getItem(secondLotBid);

            if (lotData && timeData) {
                console.log('Найден лот для замены! Индекс:', i);

                function getMoscowTime() {
                    var now = new Date();
                    var moscowTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
                    return moscowTime;
                }

                var currentTime = getMoscowTime().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                var targetTime = timeData;
                console.log('Текущее время:', currentTime, 'Целевое время:', targetTime);

                var currentDateTime = new Date('1970-01-01T' + currentTime + ':00Z');
                var targetDateTime = new Date('1970-01-01T' + targetTime + ':00Z');

                var timeDifference = (targetDateTime - currentDateTime) / (1000 * 60);
                console.log('Проверка лота:', i, 'Разница во времени:', timeDifference);

                if (timeDifference < 30) {
                    console.log('Найден лот для замены! Индекс:', i);

                    var targetLotLink = lotData;
                    var targetFirstLotBid = firstLotBidData;
                    var targetSecondLotBid = secondLotBidData;
                    console.log('Перед заменой лота:', 'firstBid:', localStorage.getItem('firstBid'), 'secondBid:', localStorage.getItem('secondBid'));

                    localStorage.setItem('firstBid', firstLotBidData);
                    localStorage.setItem('secondBid', secondLotBidData);
                    window.location.href = targetLotLink;
                    console.log('After replacing lot:', 'firstBid:', localStorage.getItem('firstBid'), 'secondBid:', localStorage.getItem('secondBid'));

                    localStorage.removeItem(lotKey);
                    localStorage.removeItem(timeKey);
                    localStorage.removeItem('firstBidPlaced');
                    localStorage.removeItem('secondBidPlaced');

                    // переименовка след.лотов
                    for (var j = i + 1; j <= 30; j++) {
                        var nextLotKey = 'lot-' + j;
                        var nextTimeKey = 'time-' + j;
                        var nextFirstBidKey = 'firstBid-' + j;
                        var nextSecondBidKey = 'secondBid-' + j;

                        if (localStorage.getItem(nextLotKey)) {
                            console.log('Renaming the next lot:', j);

                            var nextLotData = JSON.parse(localStorage.getItem(nextLotKey));
                            localStorage.setItem('lot-' + (j - 1), JSON.stringify(nextLotData));
                            localStorage.removeItem(nextLotKey);

                            var nextTimeData = localStorage.getItem(nextTimeKey);
                            localStorage.setItem('time-' + (j - 1), nextTimeData);
                            localStorage.removeItem(nextTimeKey);

                            var nextFirstBidData = localStorage.getItem(nextFirstBidKey);
                            localStorage.setItem('firstBid-' + (j - 1), nextFirstBidData);
                            localStorage.removeItem(nextFirstBidKey);

                            var nextSecondBidData = localStorage.getItem(nextSecondBidKey);
                            localStorage.setItem('secondBid-' + (j - 1), nextSecondBidData);
                            localStorage.removeItem(nextSecondBidKey);
                        }
                    }
                    console.log('Replacement completed successfully.');

                    break;
                }
            }

            // проверка 30 мин каждую 1 мин
            if (i === 30) {
                console.log('No lot found to replace. Scheduling the next check in 1 minute.');
                setTimeout(checkAndReplaceLots, 60000);
            }
        }
    }

    function autoPlaceBids() {

        function checkSoldTitle() {
            // проверка продажи
            var soldTitleElement = document.querySelector('.b-auction__sold-title');
                if (soldTitleElement) {
                    var secondBidPlaced = localStorage.getItem('secondBidPlaced');
                    if (secondBidPlaced === 'true') {
                        checkAndReplaceLots();
                    }
                    clearInterval(intervalId);
                }
            }

            // проверка наличия элемента .b-auction__sold-title перед запуском
            var soldTitleElement = document.querySelector('.b-auction__sold-title');
            if (soldTitleElement) {
                checkAndReplaceLots();
            }

        var firstBid = localStorage.getItem('firstBid');
        var secondBid = localStorage.getItem('secondBid');
        var firstBidPlaced = localStorage.getItem('firstBidPlaced');
        var secondBidPlaced = localStorage.getItem('secondBidPlaced');

        if (firstBid && secondBid && firstBidPlaced === 'false' && secondBidPlaced === 'false') {
            var intervalId = setInterval(function() {
                var timeLeftElement = document.querySelector('.b-auction__time-left span');
                if (timeLeftElement) {
                    var currentTimeLeft = timeLeftElement.innerText.trim();
                    var match = currentTimeLeft.match(/(\d+)\s+мин\.\s+(\d+)\s+сек\./);

                    if (match) {
                        var minutes = parseInt(match[1]);
                        var seconds = parseInt(match[2]);

                        if (minutes === 0 && seconds <= 9) {
                            placeBid(firstBid);
                            localStorage.setItem('firstBidPlaced', 'true');
                            clearInterval(intervalId);
                        } else if (minutes === 0 && seconds <= 15) {
                            // клки по строке ставки на 15 сек
                            document.getElementById('user-rate').click();
                        }
                    }
                }
            }, 1000);

        // апдейт сохранялки
        document.getElementById('saveBids').addEventListener('click', function () {
            var firstBidInput = document.getElementById('firstBid');
            var secondBidInput = document.getElementById('secondBid');
            var firstBid = firstBidInput.value;
            var secondBid = secondBidInput.value;

            var messageContainer = document.createElement('div');
            messageContainer.id = 'messageContainer';
            document.body.appendChild(messageContainer);

            function showMessage(message) {
                messageContainer.innerHTML = message;

                setTimeout(function () {
                    messageContainer.classList.add('show');
                }, 10);

                setTimeout(function () {
                    messageContainer.classList.remove('show');
                }, 2000);
            }

            if (firstBid && secondBid) {
                localStorage.setItem('firstBid', firstBid);
                localStorage.setItem('secondBid', secondBid);
                localStorage.setItem('firstBidPlaced', 'false');
                localStorage.setItem('secondBidPlaced', 'false');

                firstBidInput.placeholder = firstBid;
                secondBidInput.placeholder = secondBid;
                firstBidInput.value = '';
                secondBidInput.value = '';

                showMessage('Ставки успешно сохранены. Страница будет перезагружена.');

                setTimeout(function () {
                    location.reload();
                }, 2100);
            } else {
                showMessage('Вы не ввели суммы ставок. Попробуйте снова.');
            }
        });
        } else if (firstBidPlaced === 'true' && secondBidPlaced === 'false') {
            clearInterval(intervalId);
            intervalId = setInterval(function() {

                var timeLeftElement = document.querySelector('.b-auction__time-left span');

                if (timeLeftElement) {
                    var currentTimeLeft = timeLeftElement.innerText.trim();
                    var match = currentTimeLeft.match(/(\d+)\s+мин\.\s+(\d+)\s+сек\./);

                    if (match) {
                        var minutes = parseInt(match[1]);
                        var seconds = parseInt(match[2]);

                        if (minutes === 0 && seconds <= 2) {
                            placeBid(secondBid);
                            localStorage.setItem('secondBidPlaced', 'true');
                            clearInterval(intervalId);

                        } else if (minutes === 0 && seconds <= 5) {
                            // клик по строке на 5 сек
                            document.getElementById('user-rate').click();
                        }
                    }
                }
            }, 1000);
        }
    }

    function saveLot(index) {
        var lotInput = document.getElementById(`lot-${index}`);
        var timeInput = document.getElementById(`time-${index}`);
        var firstBidInput = document.getElementById(`firstBid-${index}`);
        var secondBidInput = document.getElementById(`secondBid-${index}`);
        var urlPattern = /^https:\/\/ww1\.ru\/item\/.*/;
        var numberPattern = /^\d+$/;
        // пустышки
        var lotValue = lotInput.value.trim();
        var timeValue = timeInput.value;
        var firstBidValue = firstBidInput.value.trim();
        var secondBidValue = secondBidInput.value.trim();

        // проверка на любое поле
        if (urlPattern.test(lotValue) || lotValue === "") {
            // Check if firstBidValue and secondBidValue are valid numbers
            if (numberPattern.test(firstBidValue) && numberPattern.test(secondBidValue)) {
                // Store data as a valid JSON string
                localStorage.setItem(`lot-${index}`, JSON.stringify({
                    link: lotValue,
                    firstBid: firstBidValue,
                    secondBid: secondBidValue
                }));
                localStorage.setItem(`time-${index}`, timeValue);
            }
        }
    }
    function loadSavedLots() {
        // очистка перед лоадом
        var lotContainer = document.getElementById('lotContainer');
        lotContainer.innerHTML = '';
        // макс индех лотов с стораже
        var maxIndex = 0;

        for (var i = 1; i <= localStorage.length; i++) {
            var key = localStorage.key(i - 1);

            if (key && key.startsWith('lot-')) {
                var index = parseInt(key.split('-')[1]);
                maxIndex = Math.max(maxIndex, index);
            }
        }

        // загрузка от 1 до макс индеха
        for (var i = 1; i <= maxIndex; i++) {

            (function(index) {
                var savedLink = localStorage.getItem(`lot-${index}`);
                var savedTime = localStorage.getItem(`time-${index}`);
                var savedFirstBid = localStorage.getItem(`firstBid-${index}`);
                var savedSecondBid = localStorage.getItem(`secondBid-${index}`);

                if (savedLink) {
                    createAndAppendLot(savedLink, index, savedFirstBid, savedSecondBid, savedTime);
                }
            })(i);
        }
    }
    function createAndAppendLot(savedLink, index, savedFirstBid, savedSecondBid, savedTime) {
        var lotContainer = document.getElementById('lotContainer');
        var newLotInput = createLotInput(index);
        newLotInput.classList.add('lot-input-wrapper');
        // апдейт
        newLotInput.querySelector(`input[id^="lot-"]`).value = savedLink || '';
        newLotInput.querySelector(`input[id^="time-"]`).value = savedTime || '';
        newLotInput.querySelector(`input[id^="firstBid-"]`).value = savedFirstBid || '';
        newLotInput.querySelector(`input[id^="secondBid-"]`).value = savedSecondBid || '';
        // добавить лот в конт
        lotContainer.appendChild(newLotInput);
    }

    var widget = document.createElement('div');
    widget.id = 'auto-bid-widget';
    widget.classList.add('widget-container');
    widget.innerHTML = '<span class="widget-text">Настроить автоставки</span>';
    document.body.appendChild(widget);
    createModal();
    autoPlaceBids();

    function updateAuctionTime() {
      var timeLeftElement = document.querySelector('.b-auction__time-left span');

      if (timeLeftElement) {
          var currentTimeLeft = timeLeftElement.innerText.trim();
          var match;

          match = currentTimeLeft.match(/(\d+)\s+мин\.\s+(\d+)\s+сек\./);
          if (match) {
              var minutes = parseInt(match[1]);
              var seconds = parseInt(match[2]);

              if (minutes === 5 && seconds === 0) {
                  playSound(audioFiles['5min'], 0.5, '5min');
              } else if (minutes === 1 && seconds === 0) {
                  playSound(audioFiles['1min'], 0.5, '1min');
              } else if (minutes === 0 && seconds === 30) {
                  playSound(audioFiles['30sec'], 0.75, '30sec');
              } else if (minutes === 0 && seconds === 10) {
                  playSound(audioFiles['10sec'], 1, '10sec');
              } else if (minutes === 0 && seconds === 0) {
                  playSound(audioFiles['0sec'], 1, '0sec');
              }

              if (seconds > 0) {
                  seconds--;
              } else if (minutes > 0) {
                  minutes--;
                  seconds = 59;
              }

              var newTimeLeft = minutes + ' мин. ' + seconds + ' сек.';
              timeLeftElement.innerHTML = '<span style="color:#ff0000">' + newTimeLeft + '</span>';
          } else {
                match = currentTimeLeft.match(/(\d+)\s+д\.\s+(\d+)\s+ч\./);
                if (match) {
                    setTimeout(function () {
                      location.reload();
                    }, 3600000);
                } else {
                  match = currentTimeLeft.match(/(\d+)\s+ч\.\s+(\d+)\s+м\./);
                  if (match) {
                    setTimeout(function () {
                      location.reload();
                    }, 300000);
                  }
                }
          }
      }
    }

        function playSound(file, volume, key) {

        if (!soundPlayed[key]) {
            var audio = new Audio();
            audio.src = file;
            audio.volume = volume;
            audio.play().then(function() {
                soundPlayed[key] = true;
            }).catch(function(error) {
                console.error('Ошибка воспроизведения звука:', error);
            });
        }
    }

    setInterval(updateAuctionTime, 1000);
})();
