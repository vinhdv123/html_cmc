(function($) {
    'use strict';

    function getVideoId(url) {
        if ('false' === url) return false;
        var result = /(?:\?v=|\/embed\/|\.be\/)([-a-z0-9_]+)/i.exec(url) || /^([-a-z0-9_]+)$/i.exec(url);

        return result ? result[1] : false;
    }

    function onPlayerReady(event) {
        if ($(event.target).closest('.cmc-slider').hasClass('in')) {
            event.target.playVideo();
        }
    }

    var isBuilder = $('html').hasClass('is-builder');

    /* get youtube id */
    if (!isBuilder) {
        /* google iframe */
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        var players = [];

        /* google iframe api init function */
        window.onYouTubeIframeAPIReady = function() {
            var ytp = ytp || {};
            ytp.YTAPIReady || (ytp.YTAPIReady = !0,
                jQuery(document).trigger("YTAPIReady"));

            $('.video-slide').each(function(i) {
                $('.video-container').eq(i).append('<div id ="cmc-video-' + i + '" class="cmc-background-video" data-video-num="' + i + '"></div>')
                    .append('<div class="item-overlay"></div>');
                $(this).attr('data-video-num', i);

                if ($(this).attr('data-video-url').indexOf('vimeo.com') !== -1) {
                    var options = {
                        id: $(this).attr('data-video-url'),
                        width: '100%',
                        height: '100%',
                        loop: true
                    };

                    var player = new Vimeo.Player('cmc-video-' + i, options);

                    player.playVideo = Vimeo.play;
                } else {
                    var player = new YT.Player('cmc-video-' + i, {
                        height: '100%',
                        width: '100%',
                        videoId: getVideoId($(this).attr('data-video-url')),
                        events: {
                            'onReady': onPlayerReady
                        },
                        playerVars: {
                            rel: 0
                        }
                    });
                }

                players.push(player);
            });
        };
    }

    function updateMasonry(event){
        var $section = $(event.target);
        if (typeof $.fn.masonry !== 'undefined') {
            $section.outerFind('.cmc-gallery').each(function() {
                var $msnr = $(this).find('.cmc-gallery-row').masonry({
                    itemSelector: '.cmc-gallery-item:not(.cmc-gallery-item__hided)',
                    percentPosition: true,
                    horizontalOrder: true
                });
                // reload masonry (need for adding new or re-sort items)
                $msnr.masonry('reloadItems');
                $msnr.on('filter', function() {
                    $msnr.masonry('reloadItems');
                    $msnr.masonry('layout');
                    // update parallax backgrounds
                    $(window).trigger('update.parallax');
                }.bind(this, $msnr));
                // layout Masonry after each image loads
                $msnr.imagesLoaded().progress(function() {
                    $msnr.masonry('layout');
                });
            });
        }
    };

    /* Masonry Grid */
    $(document).on('add.cards', function(event) {
        var $section = $(event.target),
            allItem = $section.find('.cmc-gallery-filter-all');
        var filterList = [];
        $section.on('click', '.cmc-gallery-filter li > .btn', function(e) {
            e.preventDefault();
            var $li = $(this).closest('li');

            $li.parent().find('a').removeClass('active');
            $(this).addClass('active');

            var $mas = $li.closest('section').find('.cmc-gallery-row');
            var filter = $(this).html().trim();

            $section.find('.cmc-gallery-item').each(function(i, el) {
                var $elem = $(this);
                var tagsAttr = $elem.attr('data-tags');
                var tags = tagsAttr.split(',');

                var tagsTrimmed = tags.map(function(el) {
                    return el.trim();
                });

                if ($.inArray(filter, tagsTrimmed) === -1 && !$li.hasClass('cmc-gallery-filter-all')) {
                    $elem.addClass('cmc-gallery-item__hided');

                    setTimeout(function() {
                        $elem.css('left', '300px');
                    }, 200);
                } else {
                    $elem.removeClass('cmc-gallery-item__hided');
                }
            });

            setTimeout(function() {
                $mas.closest('.cmc-gallery-row').trigger('filter');
            }, 50);
        });
    })
    $(document).on('add.cards changeParameter.cards changeButtonColor.cards', function(event) {
        var $section = $(event.target),
            allItem = $section.find('.cmc-gallery-filter-all');
        var filterList = [];

        $section.find('.cmc-gallery-item').each(function(el) {
            var tagsAttr = ($(this).attr('data-tags') || "").trim();
            var tagsList = tagsAttr.split(',');

            tagsList.map(function(el) {
                var tag = el.trim();

                if ($.inArray(tag, filterList) === -1)
                    filterList.push(tag);
            });
        });

        if ($section.find('.cmc-gallery-filter').length > 0 && $(event.target).find('.cmc-gallery-filter').hasClass('gallery-filter-active') && !$(event.target).find('.cmc-gallery-filter').hasClass('cmc-shop-filter')) {
            var filterHtml = '';

            var classAttr = allItem.find('a').attr('class') || '';
            classAttr = classAttr.replace(/(^|\s)active(\s|$)/, ' ').trim();

            $section.find('.cmc-gallery-filter ul li:not(li:eq(0))').remove();

            filterList.map(function(el) {
                filterHtml += '<li><a class="' + classAttr + '" href>' + el + '</a></li>';
            });
            $section.find('.cmc-gallery-filter ul').append(filterHtml);

        } else {
            $section.find('.cmc-gallery-item__hided').removeClass('cmc-gallery-item__hided');
            $section.find('.cmc-gallery-row').trigger('filter');
        }

        updateMasonry(event);
    });

    $(document).on('change.cards', function(event) {
        updateMasonry(event);
    });

    $('.cmc-gallery-item').on('click', 'a', function(e) {
        e.stopPropagation();
    });

    var timeout;
    var timeout2;

    function fitLBtimeout() {
        clearTimeout(timeout);
        timeout = setTimeout(fitLightbox, 50);
    }

    /* Lightbox Fit */
    function fitLightbox() {
        var $lightbox = $('.cmc-gallery .modal');
        if (!$lightbox.length) {
            return;
        }

        var windowPadding = 0;
        var bottomPadding = 10;
        var wndW = $(window).width() - windowPadding * 2;
        var wndH = $(window).height() - windowPadding * 2;

        $lightbox.each(function() {
            var setWidth, setTop;
            var $modalDialog = $(this).find('.modal-dialog');
            var $currentImg = $modalDialog.find('.carousel-item.active > img');

            if ($modalDialog.find('.carousel-item.prev > img, .carousel-item.next > img').length) {
                $currentImg = $modalDialog.find('.carousel-item.prev > img, .carousel-item.next > img').eq(0);
            }

            var lbW = $currentImg[0].naturalWidth;
            var lbH = $currentImg[0].naturalHeight;

            // height change
            if (wndW / wndH > lbW / lbH) {
                var needH = wndH - bottomPadding * 2;
                setWidth = needH * lbW / lbH;
            } else { // width change
                setWidth = wndW - bottomPadding * 2;
            }
            // check for maw width
            setWidth = setWidth >= lbW ? lbW : setWidth;

            // set top to vertical center
            setTop = (wndH - setWidth * lbH / lbW) / 2;

            $modalDialog.css({
                width: parseInt(setWidth),
                top: setTop + windowPadding
            });
        });
    }

    /* pause/start video on different events and fit lightbox */
    var $window = $(document).find('.cmc-gallery');

    $window.on('show.bs.modal', function(e) {
        clearTimeout(timeout2);

        var timeout2 = setTimeout(function() {
            var index = $(e.relatedTarget).parent().index();
            var slide = $(e.target).find('.carousel-item').eq(index).find('.cmc-background-video');
            $(e.target).find('.carousel-item .cmc-background-video');
            if (slide.length > 0) {
                var player = players[+slide.attr('data-video-num')];
                player.playVideo ? player.playVideo() : player.play();
            }
        }, 500);

        fitLBtimeout();
    });

    $window.on('slide.bs.carousel', function(e) {
        var ytv = $(e.target).find('.carousel-item.active .cmc-background-video');
        if (ytv.length > 0) {
            var player = players[+ytv.attr('data-video-num')];
            player.pauseVideo ? player.pauseVideo() : player.pause();
        }
    });

    $(window).on('resize load', fitLBtimeout);

    $window.on('slid.bs.carousel', function(e) {
        var ytv = $(e.target).find('.carousel-item.active .cmc-background-video');

        if (ytv.length > 0) {
            var player = players[+ytv.attr('data-video-num')];
            player.playVideo ? player.playVideo() : player.play();
        }

        fitLBtimeout();
    });

    $window.on('hide.bs.modal', function(e) {
        players.map(function(player, i) {
            player.pauseVideo ? player.pauseVideo() : player.pause();
        });
    });
}(jQuery));
