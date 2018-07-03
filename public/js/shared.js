'use strict'

// Modal

$("body").on("click", ".close-card-button", function (e) {
    e.preventDefault();
    $(".modal").addClass("hide-me");
    $(".login-modal input").val("");
    $("#register-success").addClass("hide-me");
    $("#login-error, #register-error").html("");
});

// Clear session token to sign the user out and redirect to the homepage

$(".sign-out-button ").on("click", function (e) {
    e.preventDefault();
    sessionStorage.setItem("token", "");
    window.location.replace("/");
})

// Login modal

$("body").on("click", ".sign-in-button", function (e) {
    e.preventDefault();
    $(".login-modal").removeClass("hide-me");
});

$("body").on("click", ".register-tab", function (e) {
    e.preventDefault();
    $("#login-form").addClass("hide-me");
    $("#register-form").removeClass("hide-me");
    $(".register-tab").addClass("login-menu-active").removeClass("login-menu-passive");
    $(".login-tab").removeClass("login-menu-active").addClass("login-menu-passive");
    $("#register-success").addClass("hide-me");

});
$("body").on("click", ".login-tab", function (e) {
    e.preventDefault();
    $("#register-form").addClass("hide-me");
    $("#login-form").removeClass("hide-me");
    $(".login-tab").addClass("login-menu-active").removeClass("login-menu-passive");
    $(".register-tab").removeClass("login-menu-active").addClass("login-menu-passive");
    $("#register-success").addClass("hide-me");
});
$("body").on("click", "#register-success > button", function (e) {
    e.preventDefault();
    $("#register-success").addClass("hide-me");
    $("#login-form").removeClass("hide-me");
    $(".login-tab").addClass("login-menu-active").removeClass("login-menu-passive");
    $(".register-tab").removeClass("login-menu-active").addClass("login-menu-passive");
});

// Registration form

$("#register-form").submit(function (e) {
    e.preventDefault();
    if ($("#new-password").val() !== $("#confirm-password").val()) {
        $("#register-error").html("Passwords do not match. Try again.");
        $("#new-password").val("");
        $("#confirm-password").val("");
    } else {
        let newUser = {
            "username": $("#new-username").val(),
            "password": $("#new-password").val(),
            "name": $("#new-name").val()
        };

        $.ajax({
            type: "POST",
            url: "/api/users",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(newUser),
            success: function (data, textStatus, jqXHR) {
                $("#register-form input").val("");
                $("#register-form").addClass("hide-me");
                $("#register-success").removeClass("hide-me");
            },
            error: function (data, textStatus, errorThrown) {
                $("#register-error").html(`${data.responseJSON.location} - ${data.responseJSON.message}`);
            }
        });
    }
});

// Login form

$("#login-form").submit(function (e) {
    e.preventDefault();
    $("#login-error").html(``);
    let aUser = {
        "username": $("#username").val(),
        "password": $("#password").val()
    };

    $.ajax({
        type: "POST",
        url: "/api/auth/login",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify(aUser),
        success: function (data, textStatus, jqXHR) {
            sessionStorageManager("token", data.authToken, true);
            window.location.replace("/app.html");
        },
        error: function (data, textStatus, errorThrown) {
            $("#login-error").html(`Incorrect username or password`);
        }
    })

    function sessionStorageManager(key, value, check) {
        sessionStorage.setItem(key, value);
        if (check) {
            console.log(sessionStorage.getItem(key));
        }
    }
})

// Help modal

$("body").on("click", ".help-button", function (e) {
    e.preventDefault();
    $(".help-modal").removeClass("hide-me");
});