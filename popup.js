var sTabURL = "";
var sDomain = "";

$(function()
{
    chrome.tabs.getSelected(null, function(tab) {
        handleSelectedTab(tab.url);
    });

    function handleSelectedTab(_TabURL) {
      console.log("handleSelectedTab");
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
        console.log("RequestUsers");
        var sFilter = (sViewId != "") ? "fcf="+sViewId+"&" : "";
        var sUsersPage = sDomain+"/005?"+sFilter+"rowsperpage=1000";
        $.get(sUsersPage, function(data)
        {
            html = (new DOMParser()).parseFromString(data, "text/html");
            console.log(html);
            DisplayUsers(html);
        });
    }

    function HideColumns($table) {
        console.log("HideColumns");
        //only show first x columns?
        $("tr", $table).each(function(){
            // use a class so we can hide these while toggling rows on/off
            $(this).children(':gt(6)').addClass('off');
        });
    }
    
    function DisplayUsers(data)
    {
        console.log("DisplayUsers");
        var $ddlView = $("select#fcf", data);
        $ddlView.attr("onchange", "");
        $("#viewDropdown").empty().append($ddlView);
        $ddlView.change(function()
        {
            $("#loading").show();                   
            RequestUsers($(this).val());
        });
        
        var $table = $("div.setupBlock table.list", data);
        HideColumns($table);
        //button to show all columns
        $("#toggleAllColumns").click(function()
        {
            // Make this a toggle
            if($(".off").length > 0) {
                $(".off").removeClass('off');
                $(this).text("Some Columns");
            } else {
                HideColumns($table);
                $(this).text("All Columns");
            }
            return false;
        });
        $("#toggleAllUsers").click(function()
        {
            $("td.actionColumn:not('.loginRow')").parent().toggle();
            if ($('#toggleAllUsers:contains("Login")').length > 0) {
                $(this).text("All Users");
            } else {
                $(this).text("Login Users");
            }
            return false;
        });
        $("#users").empty().append($table);
        
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
        
        //disable all links except login link
        $("a:not('.loginLink')", $table).click(function()
        {
            return false;
        });
        
        $("#loading").hide();
        $("#views, #users").show();
        
        //set width of table to try and prevent the popup from squishing the table
        $("body").width("800");
        $table.width($table.outerWidth());
        $("body").width("auto");
    }
});