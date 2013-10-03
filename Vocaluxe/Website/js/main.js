var ownProfileId = 1;
var profileIdRequest = 1;

$(document).ready(function () {
    replaceTransitionHandler();
    initPageLoadHandler();
    initKeyboardPageHandler();
    initMainPageHandler();
    initLoginPageHandler();
});

function replaceTransitionHandler() {
    //Thx to http://stackoverflow.com/a/14096311
    var oldDefaultTransitionHandler = $.mobile.defaultTransitionHandler;

    $.mobile.defaultTransitionHandler = function (name, reverse, $to, $from) {
        var promise = $to.data('promise');
        if (promise) {
            $to.removeData('promise');
            $.mobile.loading('show');
            return promise.then(function () {
                $.mobile.loading('hide');
                return oldDefaultTransitionHandler(name, reverse, $to, $from);
            });
        }
        return oldDefaultTransitionHandler(name, reverse, $to, $from);
    };
}

function initPageLoadHandler() {
    $(document).on('pagebeforeshow', '#displayProfile', function () {
        var promise = $.ajax({
            url: "getProfile?profileId=" + profileIdRequest
        }).done(function (result) {
            $('#playerName').prop("value", result.PlayerName);
            if (result.Avatar && result.Avatar.base64Data) {
                $('#playerAvatar').prop("src", result.Avatar.base64Data);
            }
            $('#playerType').prop("value", result.Type);
            $('#playerDifficulty').prop("value", result.Difficulty);
            if (result.IsEditable) {
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

                $('#playerSaveButton').click(function () {
                    var dataToUpload = {};

                    dataToUpload["ProfileId"] = profileIdRequest;
                    dataToUpload["PlayerName"] = $('#playerName').prop("value");
                    dataToUpload["Type"] = $('#playerType').prop("value");
                    dataToUpload["Difficulty"] = $('#playerDifficulty').prop("value");
                    dataToUpload["Avatar"] = $('#playerAvatar').data("changed") ? { "base64Data": $('#playerAvatar').prop("src") } : null;

                    $('#content').wrap('<div class="overlay" />');
                    $.mobile.loading('show', {
                        text: 'Uploading profile...',
                        textVisible: true
                    });

                    $.ajax({
                        url: "sendProfile",
                        dataType: "json",
                        contentType: "application/json;charset=utf-8",
                        type: "POST",
                        data: JSON.stringify(dataToUpload),
                        success: function (msg) {

                        }
                    }).always(function () {
                        $.mobile.loading('hide');
                        $('#content').unwrap();
                    });

                });
            }
            else {
                $('#playerName').prop('disabled', true);
                $('#playerType').prop('disabled', true);
                $('#playerDifficulty').prop('disabled', true);
                $('#playerSaveButton').hide();
                $('#playerAvatar').unbind("click");
            }
        });

        // Save promise on page so the transition handler can find it.
        $(this).data('promise', promise);
    });

    $(document).on('pagebeforeshow', '#selectProfile', function () {
        var promise = $.ajax({
            url: "getProfileList"
        }).done(function (data) {
            $('#selectProfileList').children().remove();

            function handleProfileSelectLineClick(e) {
                profileIdRequest = parseInt(e.currentTarget.id.replace("ProfileSelectLine_", ""));
                $.mobile.changePage("#displayProfile", { transition: "slidefade" });
            }

            for (var profile in data) {
                $('<li id="ProfileSelectLine_' + data[profile].ProfileId + '"> <a href="#"> <img src="' + ((data[profile].Avatar && data[profile].Avatar.base64Data) ? data[profile].Avatar.base64Data : "img/profile.png") + '"> <h2>' + data[profile].PlayerName + '</h2> <p>Click here to show the profile of ' + data[profile].PlayerName + '</p> </a> </li>')
                    .appendTo('#selectProfileList')
                    .click(handleProfileSelectLineClick);
            }

            $('#selectProfileList').listview('refresh');
        });

        // Save promise on page so the transition handler can find it.
        $(this).data('promise', promise);
    });

}

function initLoginPageHandler() {
    $('#loginButton').click(function () {
        ownProfileId = parseInt($('#playerId').prop("value"));
        if (ownProfileId != "NaN") {
            $.mobile.changePage("#main", { transition: "slidefade" });
        }        
    });
}

function initMainPageHandler() {
    $('#yourProfileLink').click(function () {
        profileIdRequest = ownProfileId;        
        $.mobile.changePage("#displayProfile", { transition: "slidefade" });
    });

    $('#mainPageTakePhotoLink').click(function () {
        if ($('#captureContainer').length > 0) {
            $('#captureContainer').remove();
        }

        $(document.body).append('<div id="captureContainer" style="height: 0px;width:0px; overflow:hidden;"> <input type="file" accept="image/*" id="capture" capture="camera"> </div>');

        $('#capture').change(function (eventData) {
            if (eventData && eventData.target && eventData.target.files && eventData.target.files.length == 1) {
                $('#content').wrap('<div class="overlay" />');
                $.mobile.loading('show', {
                    text: 'Uploading photo...',
                    textVisible: true
                });

                var file = eventData.target.files[0];
                var reader = new FileReader();

                reader.onloadend = function (e) {
                    $.ajax({
                        url: "sendPhoto",
                        dataType: "json",
                        contentType: "application/json;charset=utf-8",
                        type: "POST",
                        data: JSON.stringify({ Photo: { base64Data: e.target.result } }),
                        success: function (msg) {

                        }
                    }).always(function () {
                        $.mobile.loading('hide');
                        $('#content').unwrap();
                    });
                };

                reader.readAsDataURL(file);
            }
        });

        $('#capture').click();
    });
}

function initKeyboardPageHandler() {
    $('#keyboardButtonUp').click(function () {
        $.ajax({
            url: "sendKeyEvent?key=up"
        })
    });

    $('#keyboardButtonDown').click(function () {
        $.ajax({
            url: "sendKeyEvent?key=down"
        })
    });

    $('#keyboardButtonLeft').click(function () {
        $.ajax({
            url: "sendKeyEvent?key=left"
        })
    });

    $('#keyboardButtonRight').click(function () {
        $.ajax({
            url: "sendKeyEvent?key=right"
        })
    });

    $('#keyboardButtonEscape').click(function () {
        $.ajax({
            url: "sendKeyEvent?key=escape"
        })
    });

    $('#keyboardButtonkeyboardButtonTab').click(function () {
        $.ajax({
            url: "sendKeyEvent?key=tab"
        })
    });

    $('#keyboardButtonReturn').click(function () {
        $.ajax({
            url: "sendKeyEvent?key=return"
        })
    });

    $('#keyboardButtonKeys').keyup(function (e) {
        var c = String.fromCharCode(e.keyCode);
        if (c.match(/\w/)) {
            c = e.keyCode >= 65 ? c.toLowerCase() : c;
            $.ajax({
                url: "sendKeyEvent?key=" + c
            })
        }
        var oldText = $('#keyboardButtonKeys')[0].value;
        if (oldText.length > 0) {
            $('#keyboardButtonKeys')[0].value = oldText.slice(1);
        }
    });
}
