// Called when the url of a tab changes.
function checkForValidUrl(tabId, changeInfo, tab) {
	//matches examples
	//na4.salesforce.com
	//cs13.salesforce.com
	//company.my.salesforce.com
	//emea.salesforce.com
	if (tab.url.match(/(ap|eu|na|cs|emea|.*\.my)[0-9]*\.(visual\.force\.com|salesforce.com)/) !== null) {
		chrome.pageAction.show(tabId);
	}
}

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);