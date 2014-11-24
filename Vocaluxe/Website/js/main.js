﻿/// <reference path="../index.html" />
/// <reference path="../index.html" />
(function () {
    var imageLoader;
    var externalServices;
    var translator;
    var pageHandler;
    var sessionHandler;
	var playerComunication;

    var initMain = function () {
        if (document.location.protocol == "file:") {
            if (typeof (window.deviceAndJqmLoaded) == "undefined") {
                window.deviceAndJqmLoaded = $.Deferred();
            }
            window.deviceAndJqmLoaded.done(function () {
                preStart();
            });
        } else {
            $(document).ready(function () {
                translator = new Translator();
                preStart();
            });
        }
    };

    function preStart() {
        translator.translationLoaded.done(function () {
            translator.translate();

            sessionHandler = new SessionHandler();
            imageLoader = new ImageLoader();
            externalServices = new ExternalServices();
            pageHandler = new PageHandler();
			playerComunication = new PlayerComunication();

            pageHandler.init();
        });
        translator.initTranslation();
    }

    function request(data, message) {
        if ((typeof message) == "undefined" || message == null) {
            message = "Loading...";
        }

        if ((typeof data.timeout) == "undefined") {
            data.timeout = 10000; //10 sec. timeout
        }

        if (message != "noOverlay") {
            var message2 = message;
            if (i18n.t) {
                message2 = i18n.t(message2);
            }
            $('div[data-role="content"]').wrap('<div class="overlay" />');
            $.mobile.loading('show', {
                text: message2,
                textVisible: true
            });
        }

        if (!data["headers"]) {
            data["headers"] = {};
        }

        if (message == "external") {
            message = "Loading (external)...";
            if (i18n.t) {
                message = i18n.t(message) || message;
            }
        } else {
            data["headers"]["session"] = sessionHandler.sessionId;
            data.url = sessionHandler.serverBaseAddress + data.url;
        }

        return $.ajax(data).always(function (result) {
            if (message != "noOverlay") {
                $.mobile.loading('hide');
                $('div[data-role="content"]').unwrap();
            }
        }).fail(function (result) {
            if (result.statusText.indexOf("No session") != -1) {
                sessionHandler.logout();
                return;
            }
            if (message != "noOverlay") {
                var msg = result.statusText.length <= 20 ? result.statusText : "Error...";
                if (msg == "error" && result.readyState == 0) {
                    msg = "No connection";
                }
                showError(msg);
            }
        });
    }

    function showError(message) {
        if (!message) {
            message = "Error...";
        }

        if (i18n.t) {
            message = i18n.t(message) || message;
        }

        $('div[data-role="content"]').wrap('<div class="overlay" />');
        $.mobile.loading('show', {
            text: message,
            textVisible: true
        });
        $('.ui-loader').find('span').removeClass('ui-icon-loading').addClass('ui-custom-errorIcon');

        setTimeout(function () {
            $.mobile.loading('hide');
            $('div[data-role="content"]').unwrap();
            $('.ui-loader').find('span').removeClass('ui-custom-errorIcon').addClass('ui-icon-loading');
        }, 1000);
    }

    function ImageLoader() {
        var cachedImages = {};

        this.delayedImageLoad = function (elem, id, fail) {
            if (elem && id) {
                if (cachedImages[id]) {
                    elem.src = cachedImages[id].base64Data;
                    return;
                }

                elem.src = "";
                $(elem).addClass("imageLoaderImg");
                request({
                    url: "delayedImage?id=" + id
                }).done(function (result) {
                    $(elem).removeClass("imageLoaderImg");
                    elem.src = result.base64Data;
                    cachedImages[id] = result;
                }).fail(function () {
                    $(elem).removeClass("imageLoaderImg");
                    if (fail) {
                        elem.src = fail;
                    }
                });
            }
        };

        this.addImage = function (img, base64Image, defaultImg) {
            if (base64Image && (base64Image.base64Data || base64Image.imageId)) {
                if (base64Image.base64Data) {
                    $(img).prop("src", base64Image.base64Data);
                } else {
                    imageLoader.delayedImageLoad(img, base64Image.imageId, defaultImg);
                }
            } else {
                $(img).prop("src", defaultImg);
            }
        };
    }

    function ExternalServices() {
        var popupVideoHeight = 390;
        var popupVideoWidth = 640;

        var init = function () {
            initVideoPopup();
        };

        var initVideoPopup = function () {

            function scale(width, height, padding, border) {
                var scrWidth = $(window).width() - 30,
                    scrHeight = $(window).height() - 30,
                    ifrPadding = 2 * padding,
                    ifrBorder = 2 * border,
                    ifrWidth = width + ifrPadding + ifrBorder,
                    ifrHeight = height + ifrPadding + ifrBorder,
                    h, w;

                if (ifrWidth < scrWidth && ifrHeight < scrHeight) {
                    w = ifrWidth;
                    h = ifrHeight;
                } else if ((ifrWidth / scrWidth) > (ifrHeight / scrHeight)) {
                    w = scrWidth;
                    h = (scrWidth / ifrWidth) * ifrHeight;
                } else {
                    h = scrHeight;
                    w = (scrHeight / ifrHeight) * ifrWidth;
                }

                return {
                    'width': w - (ifrPadding + ifrBorder),
                    'height': h - (ifrPadding + ifrBorder)
                };
            }

            $("#popupVideo").find("a").click(function () {
                $("#popupVideo").popup("close");
                $("#popupVideo").popup("close"); //Sometimes twice??
            });

            $("#popupVideo iframe")
                .attr("width", 0)
                .attr("height", 0);

            $("#popupVideo").on({
                popupbeforeposition: function () {
                    var size = scale(popupVideoWidth, popupVideoHeight, 15, 1),
                        w = size.width,
                        h = size.height;

                    $("#popupVideo iframe")
                        .attr("width", w)
                        .attr("height", h);
                },
                popupafterclose: function () {
                    $("#popupVideo iframe")
                        .attr("width", 0)
                        .attr("height", 0)
                        .attr("src", "");
                }
            });
        };

        this.showYoutube = function (artist, title) {
            request({
                url: "http://gdata.youtube.com/feeds/api/videos/-/Music?max-results=1&alt=json&format=5&q=" + artist + " " + title,
                dataType: "json",
            }, "external")
                .done(function (result) {
                    if (result && result.feed && result.feed.entry && result.feed.entry.length > 0) {
                        var vidId = result.feed.entry[0].id.$t.replace("http://gdata.youtube.com/feeds/api/videos/", "");
                        popupVideoHeight = 390;
                        popupVideoWidth = 640;

                        $("#popupVideo iframe").attr("src", "http://www.youtube.com/embed/" + vidId + "?&autoplay=1&rel=0&showinfo=0&disablekb=1&autohide=1");
                        $("#popupVideo").popup("open");
                    }
                });
        };

        this.showSpotify = function (artist, title) {
            request({
                url: "http://ws.spotify.com/search/1/track.json?q=" + title + "+artist:" + artist,
                dataType: "json",
            }, "external")
                .done(function (result) {
                    if (result && result.tracks && result.tracks.length > 0) {
                        var spotId = result.tracks[0].href;
                        popupVideoHeight = 80;
                        popupVideoWidth = 300;

                        $("#popupVideo iframe").attr("src", "https://embed.spotify.com/?uri=" + spotId);
                        $("#popupVideo").popup("open");
                    }
                });
        };

        this.showWikipedia = function (artist) {
            popupVideoHeight = 800;
            popupVideoWidth = 600;

            $("#popupVideo iframe").attr("src", "http://m.wikipedia.org/wiki/Special:Search/" + artist);
            $("#popupVideo").popup("open");
        };

        init();
    }

    function Translator() {
        this.translationLoaded = $.Deferred();
        var translationLoaded = this.translationLoaded;

        this.initTranslation = function () {
            $.i18n.init({
                resGetPath: 'locales/__lng__.json',
                supportedLngs: ['en', 'de', 'fr', 'sv', 'cs'],
                fallbackLng: 'en',
                keyseparator: '::',
                nsseparator: ':::'
            }).done(function () {
                translationLoaded.resolve();
            });
        };

        this.translate = function () {
            //repair broken buttons on the first page (get broken while translating)
            var repairButtons = function () {
                $($('#discoverConnect')[0].childNodes).wrap('<span class="ui-btn-inner"><span class="ui-btn-text"> </span></span>');
                $($('#discoverReadQr')[0].childNodes).wrap('<span class="ui-btn-inner"><span class="ui-btn-text"> </span></span>');
            };
            $('body').i18n();
            repairButtons();
        };
    }

    function PageHandler() {
        var loginPageHandler;
        var discoverPageHandler;
        var mainPageHandler;
        var keyboardPageHandler;
        var userPageHandler;
        var songPageHandler;
        var playlistPageHandler;

        var t = this;

        this.customSelectPlaylistSongCallback = null;
        this.profileIdRequest = -1;
        this.songIdRequest = -1;

        this.init = function () {
            replaceTransitionHandler();
            loginPageHandler = new LoginPageHandler();
            discoverPageHandler = new DiscoverPageHandler();
            mainPageHandler = new MainPageHandler();
            keyboardPageHandler = new KeyboardPageHandler();
            userPageHandler = new UserPageHandler();
            songPageHandler = new SongPageHandler();
            playlistPageHandler = new PlaylistPageHandler();
        };

        this.reset = function () {
            t.customSelectPlaylistSongCallback = null;
            t.profileIdRequest = -1;
            t.songIdRequest = -1;
        };

        var replaceTransitionHandler = function () {
            //Thx to http://stackoverflow.com/a/14096311
            var oldDefaultTransitionHandler = $.mobile.defaultTransitionHandler;

            $.mobile.defaultTransitionHandler = function (name, reverse, $to, $from) {
                var promise = $to.data('promise');
                if (promise) {
                    $to.removeData('promise');
                    /*$('div[data-role="content"]').wrap('<div class="overlay" />');
                $.mobile.loading('show', {
                    text: 'Loading data...',
                    textVisible: true
                });*/
                    return promise.then(function () {
                        /*$.mobile.loading('hide');
                    $('div[data-role="content"]').unwrap();*/
                        return oldDefaultTransitionHandler(name, reverse, $to, $from);
                    });
                }
                return oldDefaultTransitionHandler(name, reverse, $to, $from);
            };
        };

        var DiscoverPageHandler = function () {
            var init = function () {
                //pageLoadHandler for discover
                $(document).on('pagebeforeshow', '#discover', pagebeforeshowDiscover);

                initDiscoverPageHandler();
            };

            var initDiscoverPageHandler = function () {
                var keyPressed = function (e) {
                    if (e.which == 13) {
                        $('#discoverConnect').click();
                    }
                };

                $('#discoverServerAddress').keypress(keyPressed);

                function handleAddress(address) {
                    if (address != null && address != "") {
                        if (address.indexOf("http") != 0) {
                            address = "http://" + address;
                        }
                        if (address.slice(-1) != '/') {
                            address = address + '/';
                        }
                        sessionHandler.serverBaseAddress = "";
                        request({
                            url: address + "isServerOnline",
                            timeout: 10000
                        }, "Checking...")
                            .done(function () {
                                sessionHandler.serverBaseAddress = address;
                                window.localStorage.setItem("VocaluxeServerAddress", address);
                                $.mobile.changePage("#login", { transition: "slidefade" });
                            })
                            .fail(function () {
                                $('#discoverServerAddress').prop("value", "");
                                if (document.location.protocol == "file:"
                                    && typeof window.BarcodeScanner != "undefined") {
                                    $('#discoverReadQr').show();
                                }
                            });
                    }
                }

                $('#discoverConnect').click(function () {
                    handleAddress($('#discoverServerAddress').prop("value"));
                });

                try {
                    window.BarcodeScanner = cordova.require("cordova/plugin/BarcodeScanner");
                } catch (e) {
                }

                $('#discoverReadQr').hide().click(function () {
                    window.BarcodeScanner.scan(
                        function (result) {
                            handleAddress(result.text);
                        },
                        function () {
                            showError("Scan faild");
                        }
                    );
                });

                //Fire pageLoadHandler for discover (first page shown after start)
                setTimeout(function () {
                    pagebeforeshowDiscover();
                    $(this).removeData('promise');
                }, 1);
            };

            var pagebeforeshowDiscover = function () {
                if (document.location.protocol == "file:") {
                    if (window.localStorage) {
                        var address = window.localStorage.getItem("VocaluxeServerAddress");
                        if (address != null) {
                            sessionHandler.serverBaseAddress = "";
                            var prom = request({
                                url: address + "isServerOnline",
                                timeout: 10000
                            }, "Checking...").done(function () {
                                sessionHandler.serverBaseAddress = address;
                                window.localStorage.setItem("VocaluxeServerAddress", address);
                                $.mobile.changePage("#login", { transition: "none" });
                            }).fail(function () {
                                if (typeof window.BarcodeScanner != "undefined") {
                                    $('#discoverReadQr').show();
                                }
                            });
                            $(this).data('promise', prom);
                            return;
                        }
                        if (typeof window.BarcodeScanner != "undefined") {
                            $('#discoverReadQr').show();
                        }
                    }
                } else {
                    $('#discoverReadQr').hide();
                    $.mobile.changePage("#login", { transition: "none" });
                }
            };

            init();
        };

        var LoginPageHandler = function () {
            var init = function () {
                //pageLoadHandler for login
                $(document).on('pagebeforeshow', '#login', pagebeforeshowLogin);

                initLoginPageHandler();
            };

            var pagebeforeshowLogin = function () {
                if (window.localStorage) {
                    var value = window.localStorage.getItem("VocaluxeSessionKey");
                    if (value != null && value != "") {
                        sessionHandler.sessionId = value;
                    }
                }

                if (sessionHandler.sessionId != "") {
                    if (sessionHandler.ownProfileId != -1) {
                        $.mobile.changePage("#main", { transition: "slidefade" });
                    } else {
                        request({
                            url: "getOwnProfileId",
                            headers: { "session": sessionHandler.sessionId }
                        }, 'Login...').done(function (result) {
                            sessionHandler.ownProfileId = result;
                            $.mobile.changePage("#main", { transition: "slidefade" });
                        });
                    }
                }
            };

            var initLoginPageHandler = function () {
                var keyPressed = function (e) {
                    if (e.which == 13) {
                        $('#loginButton').click();
                    }
                };

                $('#loginName').keypress(keyPressed);
                $('#loginPassword').keypress(keyPressed);

                $('#loginButton').click(function () {
                    var username = $('#loginName').prop("value");
                    var password = $('#loginPassword').prop("value");

                    request({
                        url: "login?username=" + username + "&password=" + password
                    }).done(function (result) {
                        sessionHandler.sessionId = result;
                        if (window.localStorage) {
                            window.localStorage.setItem("VocaluxeSessionKey", sessionHandler.sessionId);
                        }
                        request({
                            url: "getOwnProfileId",
                            headers: { "session": sessionHandler.sessionId }
                        }, 'Login...').done(function (result2) {
                            sessionHandler.ownProfileId = result2;
                            $.mobile.changePage("#main", { transition: "slidefade" });
                        });
                    });
                });

                $('#registerButton').click(function () {
                    sessionHandler.ownProfileId = -1;
                    pageHandler.profileIdRequest = -1;
                    $.mobile.changePage("#displayProfile", { transition: "slidefade" });
                });
            };

            init();
        };

        var MainPageHandler = function () {
            var init = function () {
                //pageLoadHandler for main
                $(document).on('pagebeforeshow', '#main', pagebeforeshowMain);

                initMainPageHandler();
            };

            var pagebeforeshowMain = function () {
                request({
                    url: "hasUserRight?right=" + 2
                }).done(function (result) {
                    if (result) {
                        $('#mainPageTakePhotoLink').parent().parent().parent().show();
                    } else {
                        $('#mainPageTakePhotoLink').parent().parent().parent().hide();
                    }
                });

                request({
                    url: "hasUserRight?right=" + 8
                }).done(function (result) {
                    if (result) {
                        $('#mainPageKeyboard').parent().parent().parent().show();
                    } else {
                        $('#mainPageKeyboard').parent().parent().parent().hide();
                    }
                });

                request({
                    url: "hasUserRight?right=" + 4
                }).done(function (result) {
                    if (result) {
                        $('#mainPageSelectProfile').parent().parent().parent().show();
                    } else {
                        $('#mainPageSelectProfile').parent().parent().parent().hide();
                    }
                });
            };

            var initMainPageHandler = function () {
                $('#yourProfileLink').click(function () {
                    pageHandler.profileIdRequest = sessionHandler.ownProfileId;
                    $.mobile.changePage("#displayProfile", { transition: "slidefade" });
                });

                $('#currentSongLink').click(function () {
                    request({
                        url: "getCurrentSongId",
                        headers: { "session": sessionHandler.sessionId }
                    }, 'Getting current song...').done(function (result) {
                        pageHandler.songIdRequest = parseInt(result);
                        $.mobile.changePage("#displaySong", { transition: "slidefade" });
                    });
                });

                function uploadImg(imgData) {
                    request({
                        url: "sendPhoto",
                        contentType: "application/json;charset=utf-8",
                        type: "POST",
                        data: JSON.stringify({ Photo: { base64Data: imgData } })
                    }, 'Uploading photo...');
                }

                $('#mainPageTakePhotoLink').click(function () {
                    if ($('#captureContainer').length > 0) {
                        $('#captureContainer').remove();
                    }

                    if (document.location.protocol == "file:"
                        && typeof (navigator) != 'undefined'
                        && typeof (navigator.camera) != 'undefined'
                        && typeof (navigator.camera.getPicture) != 'undefined') {
                        navigator.camera.getPicture(function (imageData) {
                            uploadImg("data:image/jpeg;base64," + imageData);
                        }, function () {
                            //Fail - do nothing
                        }, {
                            destinationType: navigator.camera.DestinationType.DATA_URL,
                            allowEdit: true,
                            correctOrientation: true,
                            saveToPhotoAlbum: true,
                            quality: 100
                        });

                    } else {
                        $(document.body).append('<div id="captureContainer" style="height: 0px;width:0px; overflow:hidden;"> <input type="file" accept="image/*" id="capture" capture="camera"> </div>');

                        $('#capture').change(function (eventData) {
                            if (eventData && eventData.target && eventData.target.files && eventData.target.files.length == 1) {
                                var file = eventData.target.files[0];
                                var reader = new FileReader();

                                reader.onloadend = function (e) {
                                    uploadImg(e.target.result);
                                    $('#capture').remove();
                                };

                                reader.readAsDataURL(file);
                            }
                        });

                        $('#capture').click();
                    }
                });

                $('#mainPageLogoutLink').click(function () {
                    sessionHandler.logout();
                });
            };

            init();
        };

        var KeyboardPageHandler = function () {
            var init = function () {
                initKeyboardPageHandler();
            };

            var initKeyboardPageHandler = function () {
                $('#keyboardButtonUp').click(function () {
                    request({
                        url: "sendKeyEvent?key=up"
                    });
                });

                $('#keyboardButtonDown').click(function () {
                    request({
                        url: "sendKeyEvent?key=down"
                    });
                });

                $('#keyboardButtonLeft').click(function () {
                    request({
                        url: "sendKeyEvent?key=left"
                    });
                });

                $('#keyboardButtonRight').click(function () {
                    request({
                        url: "sendKeyEvent?key=right"
                    });
                });

                $('#keyboardButtonEscape').click(function () {
                    request({
                        url: "sendKeyEvent?key=escape"
                    });
                });

                $('#keyboardButtonTab').click(function () {
                    request({
                        url: "sendKeyEvent?key=tab"
                    });
                });

                $('#keyboardButtonReturn').click(function () {
                    request({
                        url: "sendKeyEvent?key=return"
                    });
                });

                $('#keyboardButtonBackspace').click(function () {
                    request({
                        url: "sendKeyEvent?key=backspace"
                    });
                });

                $("#keyboardAutoSend").change(function () {
                    if ($('#keyboardAutoSend').is(':checked')) {
                        $('#keyboardButtonSend').hide();
                    } else {
                        $('#keyboardButtonSend').show();
                    }
                });

                $('#keyboardButtonSend').click(function () {
                    sendKeyboardText();
                });

                $('#keyboardButtonKeys').keyup(function (e) {
                    if (!$('#keyboardAutoSend').is(':checked') && e.keyCode != 13) {
                        return;
                    }
                    sendKeyboardText();
                });

                function sendKeyboardText() {
                    var text = $('#keyboardButtonKeys')[0].value;

                    if (text.length <= 0) {
                        return;
                    }

                    $('#keyboardButtonKeys')[0].value = "";
                    $('#keyboardButtonKeys').first().focus();

                    /* if ($('#keyboardButtonFunct').is(':checked')) {
                         $('#keyboardButtonKeys')[0].value = text.splice(1) + $('#keyboardButtonKeys')[0].value;
                         var numericElements = /^[0-9][0-9]?/.exec(text.charAt(0));
                         if (parseInt(numericElements)) {
                         request({
                                 url: "sendKeyEvent?key=F" + numericElements
                         });
                     }
                         $("#keyboardButtonFunct").attr("checked", false).checkboxradio("refresh");
                     }*/

                    request({
                        contentType: "application/json;charset=utf-8",
                        type: "GET",
                        url: "sendKeyStringEvent?keyString=" + text
                            + "&shift=" + $('#keyboardButtonShift').is(':checked')
                            + "&alt=" + $('#keyboardButtonAlt').is(':checked')
                            + "&ctrl=" + $('#keyboardButtonCtrl').is(':checked')

                    }).fail(function () {
                        $('#keyboardButtonKeys')[0].value = text + $('#keyboardButtonKeys')[0].value;
                    });
                }
            };

            init();
        };

        var UserPageHandler = function () {
            var init = function () {
                //pageLoadHandler for displayProfile
                $(document).on('pagebeforeshow', '#displayProfile', pagebeforeshowDisplayProfile);

                //pageLoadHandler for selectProfile
                $(document).on('pagebeforeshow', '#selectProfile', pagebeforeshowSelectProfile);

                //pageLoadHandler for selectUserAdmin
                $(document).on('pagebeforeshow', '#selectUserAdmin', pagebeforeshowSelectUserAdmin);

                //pageLoadHandler for displayUserAdmin
                $(document).on('pagebeforeshow', '#displayUserAdmin', pagebeforeshowDisplayUserAdmin);
            };

            var pagebeforeshowDisplayProfile = function () {
                if (pageHandler.profileIdRequest >= 0) {
                    var promise = request({
                        url: "getProfile?profileId=" + pageHandler.profileIdRequest
                    }).done(function (result) {
                        handleDisplayProfileData(result);

                        $('#playerSaveButton').click(function () {
                            var dataToUpload = {};

                            dataToUpload["ProfileId"] = pageHandler.profileIdRequest;
                            dataToUpload["PlayerName"] = $('#playerName').prop("value");
                            dataToUpload["Type"] = $('#playerType').prop("value");
                            dataToUpload["Difficulty"] = $('#playerDifficulty').prop("value");
                            dataToUpload["Avatar"] = $('#playerAvatar').data("changed") ? { "base64Data": $('#playerAvatar').prop("src") } : null;

                            var pass = $('#playerPassword').prop("value");
                            if (pass != "***__oldPassword__***") {
                                if (pass == "") {
                                    dataToUpload["Password"] = "***__CLEAR_PASSWORD__***";
                                } else {
                                    dataToUpload["Password"] = pass;
                                }
                            } else {
                                dataToUpload["Password"] = null;
                            }

                            request({
                                url: "sendProfile",
                                contentType: "application/json;charset=utf-8",
                                type: "POST",
                                data: JSON.stringify(dataToUpload),
                            }, "Uploading profile...").done(function () {
                                history.back();
                            });

                        });
                    });

                    // Save promise on page so the transition handler can find it.
                    $(this).data('promise', promise);
                } else {
                    //new profile
                    handleDisplayProfileData({
                        "Avatar": { "base64Data": null },
                        "Difficulty": 0,
                        "IsEditable": true,
                        "PlayerName": i18n.t("YourName") || "YourName",
                        "ProfileId": -1,
                        "Type": 1
                    });
                    $('#playerType').prop("value", 0);
                    $('#playerDifficulty').prop("value", 0);

                    $('#playerSaveButton').click(function () {
                        var dataToUpload = {};

                        dataToUpload["ProfileId"] = -1;
                        dataToUpload["PlayerName"] = $('#playerName').prop("value");
                        dataToUpload["Type"] = $('#playerType').prop("value");
                        dataToUpload["Difficulty"] = $('#playerDifficulty').prop("value");
                        dataToUpload["Avatar"] = $('#playerAvatar').data("changed") ? { "base64Data": $('#playerAvatar').prop("src") } : null;

                        var pass = $('#playerPassword').prop("value");
                        if (pass != "***__oldPassword__***") {
                            if (pass == "") {
                                dataToUpload["Password"] = "***__CLEAR_PASSWORD__***";
                            } else {
                                dataToUpload["Password"] = pass;
                            }
                        } else {
                            dataToUpload["Password"] = null;
                        }

                        request({
                            url: "sendProfile",
                            contentType: "application/json;charset=utf-8",
                            type: "POST",
                            data: JSON.stringify(dataToUpload)
                        }, 'Creating profile...').done(function () {
                            $.mobile.changePage("#login", { transition: "slidefade" });
                        });

                    });
                }
            };

            var handleDisplayProfileData = function (data) {
                $('#playerName').prop("value", data.PlayerName);

                imageLoader.addImage($('#playerAvatar')[0], data.Avatar, "img/profile.png");

                $('#playerAvatar').data("changed", false);
                $('#playerType').prop("selectedIndex", data.Type).selectmenu("refresh");
                $('#playerDifficulty').prop("selectedIndex", data.Difficulty).selectmenu("refresh");
                if (data.IsEditable) {
                    $('#playerName').prop('disabled', false);
                    $('#playerType').prop('disabled', false);
                    $('#playerDifficulty').prop('disabled', false);
                    $('#playerSaveButton').show().unbind("click");
                    $('#playerAvatar').unbind("click");
                    $('#playerPassword').prop('disabled', false).prop("value", "***__oldPassword__***").parent().show();
                    $('#playerPasswordLabel').show();

                    $('#playerAvatar').click(function () {
                        if ($('#captureContainer').length > 0) {
                            $('#captureContainer').remove();
                        }

                        if (document.location.protocol == "file:"
                            && typeof (navigator) != 'undefined'
                            && typeof (navigator.camera) != 'undefined'
                            && typeof (navigator.camera.getPicture) != 'undefined') {
                            navigator.camera.getPicture(function (imageData) {
                                $('#playerAvatar').prop("src", "data:image/jpeg;base64," + imageData);
                                $('#playerAvatar').data("changed", true);
                            }, function () {
                                //Fail - do nothing
                            }, {
                                destinationType: navigator.camera.DestinationType.DATA_URL,
                                allowEdit: true,
                                correctOrientation: true,
                                saveToPhotoAlbum: true,
                                quality: 50
                            });

                        } else {
                            $(document.body).append('<div id="captureContainer" style="height: 0px;width:0px; overflow:hidden;"> <input type="file" accept="image/*" id="capture" capture> </div>');

                            $('#capture').change(function (eventData) {
                                if (eventData && eventData.target && eventData.target.files && eventData.target.files.length == 1) {
                                    var file = eventData.target.files[0];
                                    var reader = new FileReader();
                                    reader.onloadend = function (e) {
                                        $('#playerAvatar').prop("src", e.target.result);
                                        $('#playerAvatar').data("changed", true);
                                        $('#captureContainer').remove();
                                    };
                                    reader.readAsDataURL(file);
                                }
                            });

                            $('#capture').click();
                        }
                    });
                } else {
                    $('#playerName').prop('disabled', true);
                    $('#playerType').prop('disabled', true);
                    $('#playerDifficulty').prop('disabled', true);
                    $('#playerSaveButton').hide().unbind("click");
                    $('#playerAvatar').unbind("click");
                    $('#playerPassword').prop('disabled', true).parent().hide();
                    $('#playerPasswordLabel').hide();
                }
            };

            var pagebeforeshowSelectProfile = function () {
                var promise = request({
                    url: "getProfileList"
                }).done(function (data) {
                    $('#selectProfileList').children().remove();

                    function handleProfileSelectLineClick(e) {
                        pageHandler.profileIdRequest = parseInt(e.currentTarget.id.replace("ProfileSelectLine_", ""));
                        $.mobile.changePage("#displayProfile", { transition: "slidefade" });
                    }

                    for (var profile in data) {
                        var img = $('<li id="ProfileSelectLine_' + data[profile].ProfileId + '"> <a href="#"> <img> <h2>' + data[profile].PlayerName + '</h2> <p>Click here to show the profile of ' + data[profile].PlayerName + '</p> </a> </li>')
                            .appendTo('#selectProfileList')
                            .click(handleProfileSelectLineClick)
                            .find("img")[0];

                        imageLoader.addImage(img, data[profile].Avatar, "img/profile.png");
                    }

                    $('#selectProfileList').listview('refresh');
                });

                // Save promise on page so the transition handler can find it.
                $(this).data('promise', promise);
            };

            var pagebeforeshowSelectUserAdmin = function () {
                var promise = request({
                    url: "getProfileList"
                }).done(function (data) {
                    $('#selectUserAdminList').children().remove();

                    function handleSelectUserAdminLineClick(e) {
                        pageHandler.profileIdRequest = parseInt(e.currentTarget.id.replace("SelectUserAdminLine_", ""));
                        $.mobile.changePage("#displayUserAdmin", { transition: "slidefade" });
                    }

                    for (var profile in data) {
                        $('<li id="SelectUserAdminLine_' + data[profile].ProfileId + '"> <a href="#"> <img src="' + ((data[profile].Avatar && data[profile].Avatar.base64Data) ? data[profile].Avatar.base64Data : "img/profile.png") + '"> <h2>' + data[profile].PlayerName + '</h2> <p>Click here to edit roles for ' + data[profile].PlayerName + '</p> </a> </li>')
                            .appendTo('#selectUserAdminList')
                            .click(handleSelectUserAdminLineClick);
                    }

                    $('#selectUserAdminList').listview('refresh');
                });

                // Save promise on page so the transition handler can find it.
                $(this).data('promise', promise);
            };

            var pagebeforeshowDisplayUserAdmin = function () {
                var promise = request({
                    url: "getUserRole?profileId=" + pageHandler.profileIdRequest
                }).done(function (result) {
                    var userRoles = {
                        TR_USERROLE_ADMIN: 2,
                        TR_USERROLE_KEYBOARDUSER: 4,
                        TR_USERROLE_ADDSONGSUSER: 8,
                        TR_USERROLE_PLAYLISTEDITOR: 16,
                        TR_USERROLE_PROFILEEDITOR: 32
                    };

                    for (var roleName in userRoles) {
                        $('#' + roleName).prop("checked", ((result & userRoles[roleName]) != 0)).checkboxradio("refresh");
                    }


                    $('#btnRoleSave').unbind('click').click(function () {
                        var role = 0;

                        for (var roleName2 in userRoles) {
                            if ($('#' + roleName2).prop("checked")) {
                                role = (role | userRoles[roleName2]);
                            }
                        }

                        request({
                            url: "setUserRole?profileId=" + pageHandler.profileIdRequest + "&userRole=" + role,
                            headers: { "session": sessionHandler.sessionId }
                        }, "Saving...").done(function (result) {
                            history.back();
                        });
                    });
                });

                // Save promise on page so the transition handler can find it.
                $(this).data('promise', promise);
            };

            init();
        };
    }

    function SongPageHandler() {
        var allSongsCache = null;

        var init = function () {
            //pageLoadHandler for displaySong

            $(document).on('pagebeforeshow', '#displaySong', pagebeforeshowDisplaySong);


            //pageLoadHandler for selectSong
            $(document).on('pagebeforeshow', '#selectSong', pagebeforeshowSelectSong);

        };

        var pagebeforeshowDisplaySong = function () {
            var promise = request({
                url: "getSong?songId=" + pageHandler.songIdRequest
            }).done(function (result) {
                $('#displaySongAddPlaylist').hide();

                if (result.Title != null) {
                    $('#displaySongTitle').text(result.Title);
                } else {
                    $('#displaySongTitle').text("No current song");
                }

                imageLoader.addImage($('#displaySongCover')[0], result.Cover, "img/noCover.png");

                if (result.Artist != null) {
                    $('#displaySongArtist').text(result.Artist);
                } else {
                    $('#displaySongArtist').text("-");
                }

                if (result.Genre != null) {
                    $('#displaySongGenre').text(result.Genre);
                } else {
                    $('#displaySongGenre').text("-");
                }

                if (result.Year != null && result.Year != "") {
                    $('#displaySongYear').text(result.Year);
                } else {
                    $('#displaySongYear').text("-");
                }

                if (result.Language != null) {
                    $('#displaySongLanguage').text(result.Language);
                } else {
                    $('#displaySongLanguage').text("-");
                }

                $('#displaySongIsDuet').text(result.IsDuet ? "Yes" : "No");

                if (result.Title != null || result.Artist != null) {
                    $('#displaySongLinks').show();

                    $('#displaySongAddPlaylist').unbind('click').click(function () {
                        pageHandler.customSelectPlaylistSongCallback = function (playlistId) {
                            request({ url: "addSongToPlaylist?songId=" + result.SongId + "&playlistId=" + playlistId + "&duplicates=false" }, "Add to playlist...");
                            history.back();
                        };
                        $.mobile.changePage("#selectPlaylist", { transition: "slidefade" });
                    });

                    $('#displaySongLinkYoutube').unbind('click').click(function () {
                        externalServices.showYoutube(result.Artist, result.Title);
                    });

                    $('#displaySongLinkSpotify').unbind('click').click(function () {
                        externalServices.showSpotify(result.Artist, result.Title);
                    });

                    $('#displaySongLinkWikipedia').unbind('click').click(function () {
                        externalServices.showWikipedia(result.Artist);
                    });
                } else {
                    $('#displaySongLinks').hide();
                }

                request({
                    url: "hasUserRight?right=" + 32
                }).done(function (result2) {
                    if (result2) {
                        $('#displaySongAddPlaylist').show();
                    } else {
                        $('#displaySongAddPlaylist').hide();
                    }
                });
            });

            // Save promise on page so the transition handler can find it.
            $(this).data('promise', promise);
        };

        var pagebeforeshowSelectSong = function () {

            function handleGetAllSongs() {
                $('#selectSongList').children().remove();

                function handleSelectSongLineClick(e) {
                    pageHandler.songIdRequest = parseInt(e.currentTarget.id.replace("selectSongLine_", ""));
                    $.mobile.changePage("#displaySong", { transition: "slidefade" });
                }

                for (var id in allSongsCache) {
                    $('<li id="selectSongLine_' + allSongsCache[id].SongId + '"> <a href="#"> '/*+'<img src="' + ((data[profile].Avatar && data[profile].Avatar.base64Data) ? data[id].Avatar.base64Data : "img/profile.png") + '"> '*/ + ' <h2>' + allSongsCache[id].Artist + '</h2> <p>' + allSongsCache[id].Title + '</p> </a> </li>')
                        .appendTo('#selectSongList')
                        .click(handleSelectSongLineClick);
                }

                $('#selectSongList').listview('refresh');
            }

            if (allSongsCache == null) {
                var promise = request({
                    url: "getAllSongs"
                }).done(function (data) {
                    allSongsCache = data;
                    handleGetAllSongs();
                });

                // Save promise on page so the transition handler can find it.
                $(this).data('promise', promise);
            } else {
                handleGetAllSongs();
            }
        };

        init();
    }

    function PlaylistPageHandler() {
        var playlistIdRequest = -1;
        var playlistRequestName = "";

        var init = function () {
            //pageLoadHandler for selectPlaylist
            $(document).on('pagebeforeshow', '#selectPlaylist', pagebeforeshowSelectPlaylist);

            //pageLoadHandler for displayPlaylist
            $(document).on('pagebeforeshow', '#displayPlaylist', pagebeforeshowDisplayPlaylist);
        };

        var pagebeforeshowSelectPlaylist = function () {

            function handleGetAllPlaylists(data) {
                $('#selectPlaylistContentList').children().remove();
                $('#selectPlaylistAddPlaylistButton').hide();

                function handleSelectSongLineClick(e) {
                    playlistIdRequest = parseInt(e.currentTarget.parentElement.parentElement.parentElement.id.replace("selectPlaylistLine_", ""));
                    playlistRequestName = $(e.currentTarget.parentElement.parentElement.parentElement).find('h2').text();
                    if (pageHandler.customSelectPlaylistSongCallback != null) {
                        pageHandler.customSelectPlaylistSongCallback(playlistIdRequest, playlistRequestName);
                        pageHandler.customSelectPlaylistSongCallback = null;
                    } else {

                        $.mobile.changePage("#displayPlaylist", { transition: "slidefade" });
                    }
                }

                function handleSelectSongLineDeleteClick(e) {
                    var playlistToDeleteId = parseInt(e.currentTarget.parentElement.id.replace("selectPlaylistLine_", ""));
                    var playlistToDeleteName = $(e.currentTarget.parentElement).find('h2').text();
                    if (window.confirm("Do you really want to delete this playlist:\n" + playlistToDeleteName)) {
                        request({ url: "removePlaylist?playlistId=" + playlistToDeleteId }, "Loading...").done(function () {
                            request({
                                url: "getPlaylists"
                            }).done(function (data2) {
                                handleGetAllPlaylists(data2);
                            });
                        });
                    }
                }

                for (var id in data) {
                    var line = $('<li id="selectPlaylistLine_'
                        + data[id].PlaylistId
                        + '"> <a href="#"> '/*+'<img src="' + ((data[profile].Avatar && data[profile].Avatar.base64Data) ? data[id].Avatar.base64Data : "img/profile.png") + '"> '*/
                        + ' <h2>' + data[id].PlaylistName + '</h2> <p>'
                        + data[id].SongCount
                        + ' ' + i18n.t('songs') + '</p> </a> <a href="#" class="delete" data-icon="delete">Delete</a> </li>')
                        .appendTo('#selectPlaylistContentList');
                    line.find('a:not(.delete)').click(handleSelectSongLineClick);
                    line.find('a.delete').click(handleSelectSongLineDeleteClick);
                }

                $('#selectPlaylistContentList').listview('refresh');

                request({
                    url: "hasUserRight?right=" + 128
                }).done(function (result) {
                    if (result) {
                        $('#selectPlaylistContentList').find('.delete').show();
                        $('#selectPlaylistContentList').listview('refresh');
                    } else {
                        $('#selectPlaylistContentList').find('.delete').hide();
                        $('#selectPlaylistContentList').listview('refresh');
                    }
                });

                $('#selectPlaylistAddPlaylistButton').unbind('click').hide().click(function () {
                    var name = prompt("Name of the new playlist:", "NewPlaylistName");
                    if (name != null
                        && name.replace(" ", "") != ""
                        && $('h2').filter(function () { return this.textContent == name; }).length == 0) {
                        request({ url: "addPlaylist?playlistName=" + name }, "Creating...").done(function () {
                            request({
                                url: "getPlaylists"
                            }).done(function (data2) {
                                handleGetAllPlaylists(data2);
                            });
                        });
                    } else {
                        alert(i18n.t("This is not a valid name."));
                    }
                });

                request({
                    url: "hasUserRight?right=" + 64
                }).done(function (result) {
                    if (result) {
                        $('#selectPlaylistAddPlaylistButton').show();
                    } else {
                        $('#selectPlaylistAddPlaylistButton').hide();
                    }
                });
            }

            var promise = request({
                url: "getPlaylists"
            }).done(function (data) {
                handleGetAllPlaylists(data);
            });

            // Save promise on page so the transition handler can find it.
            $(this).data('promise', promise);

        };

        var pagebeforeshowDisplayPlaylist = function () {

            function handleGetAllPlaylistSongs(data) {
                $('#displayPlaylistHeader').find('h1').text(playlistRequestName);

                $('#displayPlaylistSaveButton').hide().unbind('click').click(function () {
                    var promises = [];
                    $('#displayPlaylistContentList').find('li').each(function (indx, elem) {
                        var newPos = $(elem).index();
                        var oldPos = $(elem).data("oldPos");
                        if (newPos != oldPos) {
                            var movedId = elem.id.replace("selectSongLine_", "");

                            promises.push(request({
                                url: "moveSongInPlaylist?&newPosition=" + newPos + "&playlistId=" + playlistIdRequest + "&songId=" + movedId
                            }, "Resorting..."));
                        }
                    });

                    $.when.apply(promises).done(function () {
                        //reload data
                        request({
                            url: "getPlaylistSongs?playlistId=" + playlistIdRequest
                        }).done(function (data2) {
                            handleGetAllPlaylistSongs(data2);
                        });
                    });
                });

                $('#displayPlaylistContentList').children().remove();

                function handleSelectPlaylistSongLineClick(e) {
                    pageHandler.songIdRequest = parseInt(e.currentTarget.parentElement.parentElement.parentElement.id.replace("selectSongLine_", ""));
                    $.mobile.changePage("#displaySong", { transition: "slidefade" });
                }

                function handleSelectPlaylistSongLineDeleteClick(e) {
                    var songToDeleteId = parseInt(e.currentTarget.parentElement.id.replace("selectSongLine_", ""));
                    var songToDeleteName = $(e.currentTarget.parentElement).find('h2').text();

                    if (window.confirm("Do you really want to delete this song from playlist:\n" + songToDeleteName)) {
                        request({
                            url: "/removeSongFromPlaylist?position=" + $('#selectSongLine_' + songToDeleteId).index()
                                + "&playlistId=" + playlistIdRequest
                                + "&songId=" + songToDeleteId
                        }, "Loading...").done(function () {
                            //reload data
                            request({
                                url: "getPlaylistSongs?playlistId=" + playlistIdRequest
                            }).done(function (data2) {
                                handleGetAllPlaylistSongs(data2);
                            });
                        });
                    }


                }

                var sortedData = [];

                for (var id1 in data) {
                    sortedData[data[id1].PlaylistPosition] = data[id1].Song;
                }
                var i = 0;
                for (var id in sortedData) {
                    var line = $('<li id="selectSongLine_'
                        + sortedData[id].SongId
                        + '"> <a href="#"> <img> <h2>'
                        + sortedData[id].Artist
                        + '</h2> <p>'
                        + sortedData[id].Title
                        + '</p> </a> <a href="#" class="delete" data-icon="delete">Delete</a> </li>')
                        .appendTo('#displayPlaylistContentList').data("oldPos", i++);

                    line.find('a:not(.delete)').click(handleSelectPlaylistSongLineClick);
                    line.find('a.delete').click(handleSelectPlaylistSongLineDeleteClick);

                    var img = line.find("img")[0];

                    imageLoader.addImage(img, sortedData[id].Cover, "img/noCover.png");
                }

                $('#displayPlaylistContentList').listview('refresh');

                request({
                    url: "hasUserRight?right=" + 256
                }).done(function (result) {
                    if (result) {
                        $('#displayPlaylistContentList').find('.delete').show();
                        $('#displayPlaylistContentList').listview('refresh');
                    } else {
                        $('#displayPlaylistContentList').find('.delete').hide();
                        $('#displayPlaylistContentList').listview('refresh');
                    }
                });

                request({
                    url: "hasUserRight?right=" + 16
                }).done(function (result) {
                    if (result) {
                        $('#displayPlaylistContentList').sortable({
                            axis: 'y',
                            sort: function () {
                                $('#displayPlaylistSaveButton').show();

                                var $lis = $(this).children('li');
                                $lis.each(function () {
                                    var $li = $(this);
                                    var hindex = $lis.filter('.ui-sortable-helper').index();
                                    if (!$li.is('.ui-sortable-helper')) {
                                        var index = $li.index();
                                        index = index < hindex ? index + 1 : index;

                                        $li.val(index);

                                        if ($li.is('.ui-sortable-placeholder')) {
                                            $lis.filter('.ui-sortable-helper').val(index);
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }

            var promise = request({
                url: "getPlaylistSongs?playlistId=" + playlistIdRequest
            }).done(function (data) {
                handleGetAllPlaylistSongs(data);
            });

            // Save promise on page so the transition handler can find it.
            $(this).data('promise', promise);

        };

        init();
    }

    function SessionHandler() {
        this.ownProfileId = -1;
        this.sessionId = "";
        this.serverBaseAddress = "";

        var t = this;

        var init = function () {
          
        };

        this.logout = function () {
            t.ownProfileId = -1;

            t.sessionId = "";

            pageHandler.reset();
			
			playerComunication.reset();

            if (window.localStorage) {
                window.localStorage.setItem("VocaluxeSessionKey", "");
            }
            $.mobile.changePage("#login", { transition: "slidefade" });
        };


        var checkSession = function () {
            if (t.ownProfileId == -1
                && pageHandler.profileIdRequest == -1
                && ($.mobile.activePage.attr("id") == "displayProfile" || $.mobile.activePage.attr("id") == "login" || $.mobile.activePage.attr("id") == "discover")) {
                return;
            }
            request({
                url: "getOwnProfileId"
            }, "noOverlay").done(function (result) {
                if (result == -1) {
                    t.logout();
                }
            }).fail(function (result) {
                t.logout();
            });
        };

        init();
    }

	function PlayerComunication() {
		var playerComunicationToServer = [];
		var playerComunicationFromServerHandler = {};
		var defaultHeartbeatIntervall = 5000;
		var heartbeatIntervalls = [];
		var heartbeatIntervallId;

		var init = function () {
			startHeartbeat();
		};

		var checkPlayerMessages = function () {
			if (sessionHandler.ownProfileId == -1
				&& PageHandler.profileIdRequest == -1
				&& ($.mobile.activePage.attr("id") == "displayProfile"
					|| $.mobile.activePage.attr("id") == "login"
					|| $.mobile.activePage.attr("id") == "discover")) {
				return;
			}

			request({
				url: "playerComunication",
				type: "POST",
				dataType: "json",
				contentType: "application/json",
				data: JSON.stringify(playerComunicationToServer)
			}, "noOverlay").done(function (result) {
				if (result.length > 0) {
					handlePlayerComunicationFromServer(result);
				}
			}).fail(function (result) {
				if (result.status == 403 || result.status == 0) {
					sessionHandler.logout();
				}
			});

			if (playerComunicationToServer.length > 0) {
				setTimeout(checkPlayerMessages, 50);
			}

			playerComunicationToServer = [];
		};

		var handlePlayerComunicationFromServer = function (items) {
			for (var i = 0; i < items.length; i++) {
				if (items[i].ProfileId == sessionHandler.ownProfileId && playerComunicationFromServerHandler[items[i].Type]) {
				    if (new Date() - new Date(parseInt(items[i].ValidTill.match(/[0-9]+/)[0])) <= 0) {
						var deserializedData = JSON.parse(items[i].Data);
						for (var j = 0; j < playerComunicationFromServerHandler[items[i].Type].length; j++) {
							playerComunicationFromServerHandler[items[i].Type][j].Handler(deserializedData);
						}
					}
				}
			}
		};

		var startHeartbeat = function () {
			var interv = defaultHeartbeatIntervall;
			for (var i = 0; i < heartbeatIntervalls.length; i++) {
				if (interv > heartbeatIntervalls[i] && heartbeatIntervalls[i] >= 50) {
					interv = heartbeatIntervalls[i];
				}
			}

			if (interv == defaultHeartbeatIntervall && heartbeatIntervalls.length != 0) {
				heartbeatIntervalls = [];
			}

			clearInterval(heartbeatIntervallId);
			heartbeatIntervallId = setInterval(checkPlayerMessages, interv);
		};

		var sendPlayerComunicationToServer = function (packet) {
			playerComunicationToServer.push(packet);
		};

		/*this.registerPlayerComunicationFromServerHandler = function (type, handler) {
			if (!playerComunicationFromServerHandler[type]) {
				playerComunicationFromServerHandler[type] = [];
			}
		    playerComunicationFromServerHandler[type].push(
		        {
		            "handler": handler,
		            "id": 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		                var r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8;
		                return v.toString(16);
		            }),
		            "type": type
		        }
		    );
		};*/
	

		this.sendDataToServer = function (data, type) {
			sendPlayerComunicationToServer({
				"ProfileId": sessionHandler.ownProfileId,
				"ValidTill": "\/Date(" + (((new Date())).getTime() + 60000) + ")\/",
				"Type": type,
				"Data": JSON.stringify(data)
			});
		};

		//mim 50ms
		this.requestIntervall = function (newIntervall) {
			heartbeatIntervalls.push(newIntervall);
		};

		this.removeIntervall = function (oldIntervall) {
			var index = heartbeatIntervalls.indexOf(oldIntervall);
			if (index > -1) {
				heartbeatIntervalls.splice(oldIntervall, 1);
			}
		};

		this.reset = function () {
			playerComunicationToServer = [];
			playerComunicationFromServerHandler = {};
			heartbeatIntervalls = [];
		};

		this.subscribe = function (type, handler) {
		    var newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		        var r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8;
		        return v.toString(16);
		    });

		    if (!playerComunicationFromServerHandler[type]) {
		        playerComunicationFromServerHandler[type] = [];
		    }

		    playerComunicationFromServerHandler[type].push(
		        {
		            "Handler": handler,
		            "Id": newId,
		            "Type": type
		        }
		    );

			this.sendDataToServer({
				"Type": type,
				"PlayerId": sessionHandler.ownProfileId
			},
			this.EPlayerComunicationType["RegisterSubscription"]);

		    return newId;
		};
		
		this.unsubscribe = function (id) {
		    var deletedItemType = null;
		    for (var type in playerComunicationFromServerHandler) {
		        if (playerComunicationFromServerHandler[type]) {
		            for (var i = 0; i < playerComunicationFromServerHandler[type].length; i++) {
		                if (playerComunicationFromServerHandler[type][i].Id == id) {
		                    debugger;
		                    deletedItemType = playerComunicationFromServerHandler[type][i].Id;
		                    playerComunicationFromServerHandler[type].splice(i,1);
		                    break;
		                }
		            }
		        }
		    }


		    if (deletedItemType != null) {
		        this.sendDataToServer({
		                "Type": type,
		                "PlayerId": sessionHandler.ownProfileId
		            },
		            this.EPlayerComunicationType["UnregisterSubscription"]);
		    }
		    return "";
		};

		this.EPlayerComunicationType = {
			"RegisterSubscription": 0,
			"UnregisterSubscription": 1
		};

		init();
	}
	
    initMain();
})();