'use strict'

// Verify user is logged in and load app

$(function () {
    const myToken = sessionStorage.getItem("token");
    let myDestination;
    function verifyLogin() {
        $.ajax({
            url: `/api/auth/app_protected`,
            type: 'GET',
            headers: { 'authorization': `Bearer ${myToken}` },
            success: function (data) {
                console.log("Token valid.");
                console.log(myToken);
                loadApp();
            },

            // If no logged in user, display the login screen 

            error: function () {
                console.log("Token invalid!");
                $(".login-modal").removeClass("hide-me");
            }
        });
    }

    // Clear session token to sign the user out and redirect to the homepage

    $(".sign-out-button ").on("click", function (e) {
        e.preventDefault();
        sessionStorage.setItem("token", "");
        window.location.replace("/");
    })

    // Open help modal

    $("body").on("click", ".help-button", function (e) {
        e.preventDefault();
        $(".help-modal").removeClass("hide-me");
    });    

    // Close help modal

    $("body").on("click", ".help-modal button", function (e) {
        e.preventDefault();
        $(".help-modal").addClass("hide-me");
    });

    verifyLogin();

    // Get destinations and create cards

    function loadApp() {

        $(".container").html("");

        $(".sign-out-button").removeClass("hide-me");

        $("main").append(newCard());

        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": "/api/destinations",
            "method": "GET",
            "headers": {
                "Authorization": `Bearer ${myToken}`
            }
        }).done(function (DESTINATIONS) {
            function getMyDestinations(callbackFn) {
                setTimeout(function () { callbackFn(DESTINATIONS) }, 100);
            };

            function displayMyDestinations(destinations) {
                let returnStr = "";
                for (let destination of destinations) {
                    $('main').append(createCard(destination));
                }
            };

            function getAndDisplayMyDestinations() {
                getMyDestinations(displayMyDestinations);
            }
            $(function () {
                getAndDisplayMyDestinations();
            })
        })
    }

    // New destination card structure

    const newCard = function () {
        return `<div class="card new-dest-card shadow">
            <div class="close-card-button hide-me">
                <a href="#">
                    <i class="fa fa-times-circle"></i>
                </a>
            </div>
            <div class="card-button hide-me">
                <button class="save-button">Save</button>
                <button class="complete-button">Complete</button>
            </div>
            <input type="text" class="dest-title" placeholder="Where would you like to go!?" />
            <ul class="activities-list">
                <li><input type="text" class="activity" placeholder="What should we do there?" value="" /><span class="delete-activity hide-me"><i class="fa fa-minus-circle"></i></span></li>
            </ul>
            <div class="card-button hide-me">
                <a href="#">
                    <i class="fa check-circle"></i>
                </a>
            </div>
        </div>`
    };


    // Destination card structure

    function createCard(destination) {
        let activityStr = "";
        destination.activities.forEach(activity => {
            activityStr += `<li id="i${activity._id}"><input type="text" value="${activity.name}" /><span class="delete-activity hide-me"><i class="fa fa-minus-circle"></i></li>`;
        })
        return `
    <div class="card dest-card shadow hawaii-card" id="i${destination._id}">
        <div class="close-card-button hide-me">
            <a href="#"><i class="fa fa-times-circle"></i></a>
        </div>
        <div class="card-button hide-me">
            <button class="update-button">Save</button> <button class="complete-button">Complete</button>
        </div>
        <input type="text" class="dest-title" value="${destination.name}" />
        <ul class="activities-list">${activityStr}</ul>
        <div class="card-button hide-me">
        <a href="#">
            <i class="fa check-circle"></i>
        </a>
    </div>
    </div>`
    };

    // Open a destination card

    $("body").on("click", ".card", function (e) {
        e.preventDefault();
        $(this).addClass("card-open").removeClass("card");
        $(".close-card-button, .card-button, .delete-activity").removeClass("hide-me");
        $(".card, .h1").addClass("hide-me");
    });

    // Close a card 

    $("body").on("click", ".close-card-button", function (e) {
        e.preventDefault();
        $(".close-card-button, .card-button, .delete-activity").addClass("hide-me");
        $(".card-open").removeClass("card-open").addClass("card");
        $(".card").removeClass("hide-me");
    });

    // Create a new activity

    const newListItem = `<li><input type="text" class="activity"  value="" /><span class="delete-activity"><i class="fa fa-minus-circle"></i></span></li>`
    $("body").on("keydown", ".activities-list", function (e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            $(this).append(newListItem);
            $(".card-open .activities-list input").last().focus();
        }
    });

    // Delete an activity

    $("body").on("click", ".delete-activity", function(e) {
        e.preventDefault();
        $(this).parent().remove();
    });

    // Save a new destination by POST

    $("body").on("click", ".save-button", function (e) {
        e.preventDefault();
        let name = $(this).parent().siblings(".dest-title").val();
        let complete = false;
        let published = false;

        let activities = [];
        $(this).parent().siblings('.activities-list').each(function () {
            let activity = {};
            $(this).find('li > input').each(function () {
                var current = $(this).val();
                // Skip empty activities
                if (current.length > 0) {
                    let activity = {
                        "name": current,
                        "url": ""
                    }
                    activities.push(activity);
                }
            });
        });

        myDestination = { name, complete, published, activities };
        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": "/api/destinations",
            "method": "POST",
            "data": myDestination,
            "headers": {
                "Authorization": `Bearer ${myToken}`
            },
            "success": function () {
                loadApp()
            },
            "error": function (err) {
                alert(err.responseText);
            }
        });
    })

    // Update a destination by PUT

    $("body").on("click", ".update-button", function (e) {
        e.preventDefault();
        let cardID = $(".card-open").attr("id");
        let id = cardID.slice(1);
        let name = $(`#${cardID} .dest-title`).val();
        let complete = false;
        let published = false;

        let activities = [];
        $(this).parent().siblings('.activities-list').each(function () {
            let activity = {};
            $(this).find('li > input').each(function () {
                var current = $(this).val();
                // Skip empty activities
                if (current.length > 0) {
                    let activity = {
                        "name": current,
                        "url": ""
                    }
                    activities.push(activity);
                }
            });
        });

        myDestination = { name, complete, published, activities };
        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": `/api/destinations/id/${id}`,
            "method": "PUT",
            "data": myDestination,
            "headers": {
                "Authorization": `Bearer ${myToken}`
            },
            "success": function () {
                alert("Destination saved!");
            },
            "error": function (err) {
                alert(err.responseText);
            }
        });
    })

    // Complete destination card structure

    function completeCard() {
        return `
            <h3>${myDestination.name}</h3>
            <div class="close-card-button">
                <a href="#"><i class="fa fa-times-circle"></i></a>
            </div>
            <div class="upload-wizard">
                <p>Great job! Now add photos of your activities and share your adventure!</p>
                <button class="upload-wizard-start">Start</button>
            </div>`
    }

    // Complete a destination on PUT and display photo upload wizard

    $("body").on("click", ".complete-button", function (e) {
        e.preventDefault();
        let cardID = $(".card-open").attr("id");
        let name = $(`#${cardID} .dest-title`).val();
        let id = cardID.slice(1);
        let complete = true;
        let published = false;
        let activities = [];
        let lis = $(this).parent().siblings('.activities-list').children();
        lis.each(function (i, v) {
            var currentActivity = $(this).find("input").val();
            var currentActivityID = $(this).attr('id');
            currentActivityID = currentActivityID.slice('1');
            console.log(currentActivityID);
            // Skip empty activities
            if (currentActivity.length > 0) {
                let activity = {
                    "name": currentActivity,
                    "url": "",
                    "id": currentActivityID
                }
                activities.push(activity);
            }
        });

        myDestination = { id, name, complete, published, activities };
        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": `/api/destinations/id/${myDestination.id}`,
            "method": "PUT",
            "data": myDestination,
            "headers": {
                "Authorization": `Bearer ${myToken}`
            },
            "success": function () {
                myDestination.name = $(`#${cardID} .dest-title`).val();
                $(".card-open").children().hide();
                $(".card-open").append(completeCard());
            },
            "error": function (err) {
                alert(err.responseText);
            }
        });
    });

    // Photo Upload Wizard Structure

    function uploadWizard() {
        console.log("Upload wizard called");
        let tempActivity;
        for (let activity of myDestination.activities) {
            if (activity.url === "") {
                tempActivity = activity;
                break;
            }
        }
        if (!tempActivity) {


            // Allow publishing destination when all activities have photos

            return `
            <div class="close-card-button">
                <a href="#"><i class="fa fa-times-circle"></i></a>
            </div>
            <div class="upload-wizard">
                <p>Congratulations! Let's publish your destination album to the homepage for all to see!</p>
                <p>Note: this is permanent!</p>
                <button class="upload-wizard-publish-button">Publish</button>
            </div>`

        }

        // Loop through upload form until all activities have photos

        return `
                <h5>${tempActivity.name}</h5>
            <form ref='uploadForm' id='uploadForm' name='uploadForm'
                action='api/destinations/upload/${myDestination.name}' method='post' 
                encType="multipart/form-data">
                  <input type="hidden" name="activityID" value="${tempActivity.id}" />
                  <input type="hidden" name="activityName" value="${tempActivity.name}" />
                  <input type="file" name="file" id="file" required />
                  <button type='submit'>Upload</button>
                </form>`

    }

    // Start upload wizard

    $('body').on('click', '.upload-wizard-start', function (e) {
        e.preventDefault();
        $('.upload-wizard').html(uploadWizard());
    })

    // Upload photo and add url to activity

    $("body").on("submit", "#uploadForm", function (e) {
        e.preventDefault();
        let formdata = new FormData();
        formdata.append('activityID', $('input[name=activityID]').val());
        formdata.append('activityName', $('input[name=activityName]').val());
        formdata.append('file', $('#file')[0].files[0]);
        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": `/api/destinations/upload/${myDestination.name}`,
            "method": "POST",
            "data": formdata,
            "processData": false,
            "contentType": false,
            "headers": {
                "Authorization": `Bearer ${myToken}`
            },
            "success": function (data) {
                console.log(`updated activity object`, data);
                for (let activity of myDestination.activities) {
                    if (activity.id === data._id) {
                        activity.url = data.url;
                        break;
                    }
                }

                $('.upload-wizard').html(uploadWizard());
            },
            "error": function (err) {
                alert(`error`, err.responseText);
            }
        });
    })

    // Publish destination 

    $("body").on("click", ".upload-wizard-publish-button", function (e) {
        e.preventDefault();
        myDestination.published = true;
        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": `/api/destinations/id/${myDestination.id}`,
            "method": "PUT",
            "data": myDestination,
            "headers": {
                "Authorization": `Bearer ${myToken}`
            },
            "success": function () {
                alert('Your destination has been published! Check it out on the homepage!');
            },
            "error": function (err) {
                alert(err.responseText);
            }
        });
    })



})
