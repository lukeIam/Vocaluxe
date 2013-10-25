var ownProfileId = -1;
var profileIdRequest = -1;
var songIdRequest = -1;
var allSongsCache = null;
var sessionId = "";

$(document).ready(function () {
    replaceTransitionHandler();
    initPageLoadHandler();
    initKeyboardPageHandler();
    initMainPageHandler();
    initLoginPageHandler();
    initHeartbeat();
    initVideoPopup();
});

function replaceTransitionHandler() {
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
}

function initPageLoadHandler() {
    //pageLoadHandler for displayProfile
    $(document).on('pagebeforeshow', '#displayProfile', function () {
        if (profileIdRequest >= 0) {
            var promise = request({
                url: "getProfile?profileId=" + profileIdRequest
            }).done(function (result) {
                handleDisplayProfileData(result);

                $('#playerSaveButton').click(function () {
                    var dataToUpload = {};

                    dataToUpload["ProfileId"] = profileIdRequest;
                    dataToUpload["PlayerName"] = $('#playerName').prop("value");
                    dataToUpload["Type"] = $('#playerType').prop("value");
                    dataToUpload["Difficulty"] = $('#playerDifficulty').prop("value");
                    dataToUpload["Avatar"] = $('#playerAvatar').data("changed") ? { "base64Data": $('#playerAvatar').prop("src") } : null;
                    dataToUpload["Password"] = $('#playerPassword').prop("value") != "**oldPassword**" ? $('#playerPassword').prop("value") : null;

                    request({
                        url: "sendProfile",
                        dataType: "json",
                        contentType: "application/json;charset=utf-8",
                        type: "POST",
                        headers: { "session": sessionId },
                        data: JSON.stringify(dataToUpload),
                    }, "Uploading profile...").done(function () {
                        history.back();
                    });

                });
            });

            // Save promise on page so the transition handler can find it.
            $(this).data('promise', promise);
        }
        else {
            //new profile
            handleDisplayProfileData({
                "Avatar": { "base64Data": null },
                "Difficulty": 0,
                "IsEditable": true,
                "PlayerName": "YourName",
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
                dataToUpload["Password"] = $('#playerPassword').prop("value") != "**oldPassword**" ? $('#playerPassword').prop("value") : null;

                request({
                    url: "sendProfile",
                    dataType: "json",
                    contentType: "application/json;charset=utf-8",
                    type: "POST",
                    headers: { "session": sessionId },
                    data: JSON.stringify(dataToUpload)
                }, 'Creating profile...').done(function () {
                    $.mobile.changePage("#login", { transition: "slidefade" });
                });

            });
        }
    });

    function handleDisplayProfileData(data) {
        $('#playerName').prop("value", data.PlayerName);

        addImage($('#playerAvatar')[0], data.Avatar, "img/profile.png");

        $('#playerAvatar').data("changed", false);
        $('#playerType').prop("value", data.Type);
        $('#playerDifficulty').prop("value", data.Difficulty);
        if (data.IsEditable) {
            $('#playerName').prop('disabled', false);
            $('#playerType').prop('disabled', false);
            $('#playerDifficulty').prop('disabled', false);
            $('#playerSaveButton').show().unbind("click");
            $('#playerAvatar').unbind("click");
            $('#playerPassword').prop('disabled', false).parent().show();
            $('#playerPasswordLabel').show();

            $('#playerAvatar').click(function () {
                if ($('#captureContainer').length > 0) {
                    $('#captureContainer').remove();
                }

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
            });
        }
        else {
            $('#playerName').prop('disabled', true);
            $('#playerType').prop('disabled', true);
            $('#playerDifficulty').prop('disabled', true);
            $('#playerSaveButton').hide().unbind("click");
            $('#playerAvatar').unbind("click");
            $('#playerPassword').prop('disabled', true).parent().hide();
            $('#playerPasswordLabel').hide();
        }
    }

    //pageLoadHandler for selectProfile
    $(document).on('pagebeforeshow', '#selectProfile', function () {
        var promise = request({
            url: "getProfileList",
            headers: { "session": sessionId }
        }).done(function (data) {
            $('#selectProfileList').children().remove();

            function handleProfileSelectLineClick(e) {
                profileIdRequest = parseInt(e.currentTarget.id.replace("ProfileSelectLine_", ""));
                $.mobile.changePage("#displayProfile", { transition: "slidefade" });
            }

            for (var profile in data) {
                var img = $('<li id="ProfileSelectLine_' + data[profile].ProfileId + '"> <a href="#"> <img> <h2>' + data[profile].PlayerName + '</h2> <p>Click here to show the profile of ' + data[profile].PlayerName + '</p> </a> </li>')
                    .appendTo('#selectProfileList')
                    .click(handleProfileSelectLineClick)
                    .find("img")[0];

                addImage(img, data[profile].Avatar, "img/profile.png");
            }

            $('#selectProfileList').listview('refresh');
        });

        // Save promise on page so the transition handler can find it.
        $(this).data('promise', promise);
    });

    //pageLoadHandler for displaySong
    $(document).on('pagebeforeshow', '#displaySong', function () {
        var promise = request({
            url: "getSong?songId=" + songIdRequest,
            headers: { "session": sessionId }
        }).done(function (result) {
            if (result.Title != null) {
                $('#displaySongTitle').text(result.Title);
            }
            else {
                $('#displaySongTitle').text("No current song");
            }

            addImage($('#displaySongCover')[0], result.Cover, "img/noCover.png");

            if (result.Artist != null) {
                $('#displaySongArtist').text(result.Artist);
            }
            else {
                $('#displaySongArtist').text("-");
            }

            if (result.Genre != null) {
                $('#displaySongGenre').text(result.Genre);
            }
            else {
                $('#displaySongGenre').text("-");
            }

            if (result.Year != null && result.Year != "") {
                $('#displaySongYear').text(result.Year);
            }
            else {
                $('#displaySongYear').text("-");
            }

            if (result.Language != null) {
                $('#displaySongLanguage').text(result.Language);
            }
            else {
                $('#displaySongLanguage').text("-");
            }

            $('#displaySongIsDuet').text(result.IsDuet ? "Yes" : "No");

            if (result.Title != null || result.Artist != null) {
                $('#displaySongLinks').show();

                $('#displaySongLinkYoutube').unbind('click').click(function () {
                    showYoutube(result.Artist, result.Title);
                });

                $('#displaySongLinkSpotify').unbind('click').click(function () {
                    showSpotify(result.Artist, result.Title);
                });
            } else {
                $('#displaySongLinks').hide();
            }
        });

        // Save promise on page so the transition handler can find it.
        $(this).data('promise', promise);
    });

    //pageLoadHandler for selectSong
    $(document).on('pagebeforeshow', '#selectSong', function () {
        function handleGetAllSongs() {
            $('#selectSongList').children().remove();

            function handleSelectSongLineClick(e) {
                songIdRequest = parseInt(e.currentTarget.id.replace("selectSongLine_", ""));
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
                url: "getAllSongs",
                headers: { "session": sessionId }
            }).done(function (data) {
                allSongsCache = data;
                handleGetAllSongs();
            });

            // Save promise on page so the transition handler can find it.
            $(this).data('promise', promise);
        }
        else {
            handleGetAllSongs();
        }
    });

    //pageLoadHandler for selectUserAdmin
    $(document).on('pagebeforeshow', '#selectUserAdmin', function () {
        var promise = request({
            url: "getProfileList",
            headers: { "session": sessionId }
        }).done(function (data) {
            $('#selectUserAdminList').children().remove();

            function handleSelectUserAdminLineClick(e) {
                profileIdRequest = parseInt(e.currentTarget.id.replace("SelectUserAdminLine_", ""));
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
    });

    //pageLoadHandler for displayUserAdmin
    $(document).on('pagebeforeshow', '#displayUserAdmin', function () {
        var promise = request({
            url: "getUserRole?profileId=" + profileIdRequest,
            headers: { "session": sessionId }
        }).done(function (result) {
            $('#roleAdministrator').prop("checked", ((result & 0x01) != 0)).checkboxradio("refresh");

            $('#btnRoleSave').unbind('click').click(function () {
                var role = 0;
                if ($('#roleAdministrator').prop("checked")) {
                    role = (role | 0x01);
                }
                request({
                    url: "setUserRole?profileId=" + profileIdRequest + "&userRole=" + role,
                    headers: { "session": sessionId }
                }, "Saving...").done(function (result) {
                    history.back();
                });
            });
        });

        // Save promise on page so the transition handler can find it.
        $(this).data('promise', promise);
    });

    //pageLoadHandler for login
    $(document).on('pagebeforeshow', '#login', pagebeforeshowLogin);

}

function pagebeforeshowLogin() {
    if (window.localStorage) {
        var value = window.localStorage.getItem("VocaluxeSessionKey");
        if (value != null && value != "") {
            sessionId = value;
        }
    }

    if (sessionId != "") {
        if (ownProfileId != -1) {
            $.mobile.changePage("#main", { transition: "slidefade" });
        }
        else {
            request({
                url: "getOwnProfileId",
                headers: { "session": sessionId }
            }, 'Login...').done(function (result) {
                ownProfileId = result;
                $.mobile.changePage("#main", { transition: "slidefade" });
            });
        }
    }
}

function initLoginPageHandler() {
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
            sessionId = result;
            if (window.localStorage) {
                window.localStorage.setItem("VocaluxeSessionKey", sessionId);
            }
            request({
                url: "getOwnProfileId",
                headers: { "session": sessionId }
            }, 'Login...').done(function (result2) {
                ownProfileId = result2;
                $.mobile.changePage("#main", { transition: "slidefade" });
            });
        });
    });

    $('#registerButton').click(function () {
        ownProfileId = -1;
        profileIdRequest = -1;
        $.mobile.changePage("#displayProfile", { transition: "slidefade" });
    });

    //Fire pageLoadHandler for login
    pagebeforeshowLogin();
}

function initMainPageHandler() {
    $('#yourProfileLink').click(function () {
        profileIdRequest = ownProfileId;
        $.mobile.changePage("#displayProfile", { transition: "slidefade" });
    });

    $('#currentSongLink').click(function () {
        request({
            url: "getCurrentSongId",
            headers: { "session": sessionId }
        }, 'Getting current song...').done(function (result) {
            songIdRequest = parseInt(result);
            $.mobile.changePage("#displaySong", { transition: "slidefade" });
        });
    });

    $('#mainPageTakePhotoLink').click(function () {
        if ($('#captureContainer').length > 0) {
            $('#captureContainer').remove();
        }

        $(document.body).append('<div id="captureContainer" style="height: 0px;width:0px; overflow:hidden;"> <input type="file" accept="image/*" id="capture" capture="camera"> </div>');

        $('#capture').change(function (eventData) {
            if (eventData && eventData.target && eventData.target.files && eventData.target.files.length == 1) {
                var file = eventData.target.files[0];
                var reader = new FileReader();

                reader.onloadend = function (e) {
                    request({
                        url: "sendPhoto",
                        dataType: "json",
                        contentType: "application/json;charset=utf-8",
                        type: "POST",
                        headers: { "session": sessionId },
                        data: JSON.stringify({ Photo: { base64Data: e.target.result } })
                    }, 'Uploading photo...');
                };

                reader.readAsDataURL(file);
            }
        });

        $('#capture').click();
    });

    $('#mainPageLogoutLink').click(function () {
        logout();
    });
}

function initKeyboardPageHandler() {
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

    $('#keyboardButtonKeys').keyup(function (e) {
        var c = String.fromCharCode(e.keyCode);
        if (c.match(/\w/)) {
            c = e.keyCode >= 65 ? c.toLowerCase() : c;
            request({
                url: "sendKeyEvent?key=" + c
            });
        }
        var oldText = $('#keyboardButtonKeys')[0].value;
        if (oldText.length > 0) {
            $('#keyboardButtonKeys')[0].value = oldText.slice(1);
        }
    });
}

var cachedImages = {};

function delayedImageLoad(elem, id, fail) {
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
}

function addImage(img, base64Image, defaultImg) {
    if (base64Image && (base64Image.base64Data || base64Image.imageId)) {
        if (base64Image.base64Data) {
            $(img).prop("src", base64Image.base64Data);
        }
        else {
            delayedImageLoad(img, base64Image.imageId, defaultImg);
        }
    }
    else {
        $(img).prop("src", defaultImg);
    }
}

function logout() {
    ownProfileId = -1;
    profileIdRequest = -1;
    songIdRequest = -1;
    sessionId = "";
    if (window.localStorage) {
        window.localStorage.setItem("VocaluxeSessionKey", "");
    }
    $.mobile.changePage("#login", { transition: "slidefade" });
}

function checkSession() {
    request({
        url: "getOwnProfileId"
    }).done(function (result) {
        if (result == -1) {
            logout();
        }
    }, "noOverlay").fail(function (result) {
        logout();
    });
}

function initHeartbeat() {
    setInterval(checkSession, 20000);
}

function request(data, message) {
    if (!message) {
        message = "Loading...";
    }

    if (message != "noOverlay") {
        $('div[data-role="content"]').wrap('<div class="overlay" />');
        $.mobile.loading('show', {
            text: message,
            textVisible: true
        });
    }

    if (!data["headers"]) {
        data["headers"] = {};
    }

    if (message == "external") {
        message = "Loading (external)...";
    } else {
        data["headers"]["session"] = sessionId;
    }

    return $.ajax(data).always(function (result) {
        if (message != "noOverlay") {
            $.mobile.loading('hide');
            $('div[data-role="content"]').unwrap();
        }
    }).fail(function (result) {
        if (result.statusText.indexOf("No session") != -1) {
            logout();
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

var popupVideoHeight = 390;
var popupVideoWidth = 640;
function initVideoPopup() {
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
    };
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

function showYoutube(artist, title) {
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
}

function showSpotify(artist, title) {
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
}