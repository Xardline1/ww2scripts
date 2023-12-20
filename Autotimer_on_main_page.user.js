// ==UserScript==
// @name         Autotimer_on_main_page
// @namespace    http://tampermonkey.net/
// @version      0.8
// @description  Auto update timers on Main Page
// @updateURL https://github.com/Xardline1/ww2scripts/raw/main/Autotimer_on_main_page.user.js
// @downloadURL https://github.com/Xardline1/ww2scripts/raw/main/Autotimer_on_main_page.user.js
// @author       Xardline
// @match        https://ww1.ru/auctions*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function updateElementStyle() {
        var contentWrapElement = document.querySelector('.b-filter-lot__content-wrap');

        if (contentWrapElement) {
            if (window.matchMedia('(min-width: 671px) and (max-width: 950px)').matches) {
                contentWrapElement.style.position = 'relative';
            }
        }
    }

    updateElementStyle();

    function updateAuctionTime() {
        // Поиск всех элементов с временем до завершения на странице аукционов
        var timeLeftElements = document.querySelectorAll('.b-filter-lot__content-vendor span');

        timeLeftElements.forEach(function(timeLeftElement) {
            var currentTimeLeft = timeLeftElement.innerText.trim();
            var match;

                // формат минут и секунд
            match = currentTimeLeft.match(/(\d+)\s+мин\.\s+(\d+)\s+сек\./);
            if (match) {
                var minutes = parseInt(match[1]);
                var seconds = parseInt(match[2]);

                if (seconds > 0) {
                    seconds--;
                } else if (minutes > 0) {
                    minutes--;
                    seconds = 59;
                }

                var newTimeLeft = minutes + ' мин. ' + seconds + ' сек.';

                timeLeftElement.innerHTML = '<span style="color:#ff0000">До завершения - ' + newTimeLeft + '</span>';
            } else {
                // другие форматы
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
        });
    }

    setInterval(updateAuctionTime, 1000);
})();
