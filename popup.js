var sTabURL = "";
var sDomain = "";

$(function()
{
    chrome.tabs.getSelected(null, function(tab) {
        handleSelectedTab(tab.url);
    });

    // Moved these out of the DisplayUsers() as new jQuery
    // will bind multiple click events causing odd behavior
    // for every other view selected...

    //button to show all columns
    $("#toggleAllColumns").click(function()
    {
        // Make this a toggle
        if($(".off").length > 0) {
            $(".off").removeClass('off');
            $(this).text("Some Columns");
        } else {
            HideColumns($("table.list"));
            $(this).text("All Columns");
        }
        return false;
    });

    $("#toggleAllUsers").click(function()
    {
        console.log("click");
        if ($('#toggleAllUsers:contains("Login")').length > 0) {
            $("td.actionColumn:not('.loginRow')").parent().hide();
            $(this).text("All Users");
        } else {
            $("td.actionColumn:not('.loginRow')").parent().show();
            $(this).text("Login Users");
        }
        return false;
    });

    function handleSelectedTab(_TabURL) {
      sTabURL = _TabURL;
      sDomain = sTabURL.substring(0, sTabURL.indexOf(".com")+4);
      if (sDomain.match(/\.visual\.force\.com/)) {
        sDomain = sDomain.match(/[^.]+\.([^.]+)\.visual\.force\.com/);
        sDomain = "https://" + sDomain[1] + ".salesforce.com";
      }
      RequestUsers("");
    }
    
    function RequestUsers(sViewId)
    {
        var sFilter = (sViewId !== "") ? "fcf="+sViewId+"&" : "";
        var sUsersPage = sDomain+"/005?"+sFilter+"rowsperpage=1000";
        $.get(sUsersPage, function(data)
        {
            html = (new DOMParser()).parseFromString(data, "text/html");
            $("img, #allBox", html).remove();
            // Removing the attributes prevents some errors in the console
            $("tr", html).removeAttr('onblur').removeAttr('onmouseout').
                removeAttr('onfocus').removeAttr('onmouseover').not(':first').hover(
                    function() {
                        $(this).addClass('highlight');
                    },
                    function() {
                        $(this).removeClass('highlight');
                    });
            DisplayUsers(html);
        });
    }

    function HideColumns($table) {
        //only show first x columns?
        $("tr", $table).each(function(){
            // use a class so we can hide these while toggling rows on/off
            // This should show name, email and action buttons (if you use
            // a standard layout)
            $(this).children(':gt(3)').addClass('off');
        });
    }
    
    function DisplayUsers(data)
    {
        var $ddlView = $("select#fcf", data);
        // Removing the attribute prevents some errors in the console
        $ddlView.removeAttr("onchange");
        $("#viewDropdown").empty().append($ddlView);
        $ddlView.change(function()
        {
            // When we select a new set of users, clear the display
            $("#users").empty();
            $("#loading").show();                   
            RequestUsers($(this).val());
        });
        
        var $table = $("div.setupBlock table.list", data);
        HideColumns($table);

        $("#users").append($table);
        
        //handle login links
        $("td.actionColumn a:contains('Login')", $table).each(function()
        {                   
            $login = $(this);
            
            //flag the login links and remove other action cell elements (edit link, checkbox)
            $login.addClass("loginLink")
            .parent().addClass("loginRow").html("").append($login);
            
            //update login url to set target and return URL to the current url
            var sLogin = $login.attr("href");
            //strip off the retURL and targetURL
            sLogin = sDomain + sLogin.substring(0, sLogin.indexOf("&retURL="));
            sLogin += "&retURL="+encodeURI(sTabURL)+"&targetURL="+encodeURI(sTabURL);
            $login.attr("href", sLogin);
        })
        .click(function()
        {
            //update the main browser tab (not the popup) and make the main browser tab
            //active which will close the popup
            chrome.tabs.update(null, {url: $(this).attr("href"), active: true});
            return false;
        });
        
        //Hide users who we can't login as and
        //clear out action column for users that didn't have login link
        $("td.actionColumn:not('.loginRow')").empty().parent().hide();
        $("#toggleAllUsers").text("All Users");
        $("#toggleAllColumns").text("All Columns");
        
        //disable all links except login link
        $("a:not('.loginLink')", $table).click(function()
        {
            return false;
        });
        
        $("#loading").hide();
        $("#menu, #users").show();
        
        //set width of table to try and prevent the popup from squishing the table
        $("body").width("800");
        $table.width($table.outerWidth());
        $("body").width("auto");
    }
});
