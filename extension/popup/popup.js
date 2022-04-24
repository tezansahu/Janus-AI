// URL at which the API server is running
base_url = "http://localhost:8000";

// Inject _getSelectedTextFromTab into current page and 
// populate the textarea for user input in the popup with the selected text
function getSelectedText() {
    // Get information about the currently active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let tab = tabs[0];

        // Inject JavaScript into the active tab to get the text selected by the user
        chrome.scripting.executeScript(
            {
                target: { tabId: tab.id },              // Specify a target to inject JavaScript
                function: _getSelectedTextFromTab,      // Function to be injected into the target
            },
            ([res]) => {
                // If selection is not empty, populate the input textarea
                if (res["result"] !== "") {
                    document.getElementById("input_text").value = res["result"];
                }
            }
        );
    });
};

// Get the selected text from the current page
function _getSelectedTextFromTab() {
    var selection = window.getSelection().toString();
    return selection;
}


// Issue a POST request with a request body
function doPost(url, body, callback){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("POST", url, true); // true for asynchronous 
    xmlHttp.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xmlHttp.send(body);
}


// Obtain the paraphrased result from the API server
function getParaphrasedResult() {
    document.getElementById("paraphrased_result").style.display = "none";

    let error_box = document.getElementById("error_box");
    let text = document.getElementById("input_text").value;
    let loading_text = document.getElementById("loading_text");
    
    // If there is no input text, throw error 
    if (text == "") {
        error_box.innerHTML = "No text available to rephrase! Please enter something";
        error_box.style.display = "block";
    }
    else {
        error_box.style.display = "none";

        // Start displaying the spinner
        loading_text.innerHTML = "Fetching paraphrased results...";
        document.getElementById("loading").style.display = "block";

        // Create the JSON request body as specified in the API endpoint
        var body = JSON.stringify({
            paragraph: text
        })

        let paraphrase_url = `${base_url}/paraphrase/`;     // POST endpoint to be hit

        doPost(paraphrase_url, body, (res, err) => {
            // Stop displaying the spinner on receiving a response
            document.getElementById("loading").style.display = "none";
            if(err){
                error_box.innerHTML = "Sorry! Error in paraphrasing input text";
                error_box.style.display = "block";
            }
            else {
                res = JSON.parse(res)
                // Populate the output textarea with the paraphrased text
                document.getElementById("paraphrased_text").value = res["paraphrased"];
                // Populate the synonyms of keywords
                populateSynonyms(res["keywords_synonyms"]);
                // Display the output in the popup
                document.getElementById("paraphrased_result").style.display = "block";
            }
        })
    }
}

// Dynamically populate the synonyms of keywords
function populateSynonyms(kw_syn) {
    // String to display the keywords and synonyms in a tabular fashion
    kw_syn_str = `
    <hr>
    <table class="table m-2" style="font-size: small;">
        <thead>
            <tr>
                <th scope="col">Keyword</th>
                <th scope="col">Syonyms</th>
            </tr>
        </thead>
        <tbody>
    `
    // Dynamically populate the rows with keywords and their corresponding synonyms
    for(var kw in kw_syn) {
        syns = kw_syn[kw];
        kw_syn_str += `
            <tr>
                <th scope="row" style="text-align: right">${kw}</th>
                <td style="text-align: left">${syns.join(", ")}<td>
            </tr>
        `
    }
    kw_syn_str += `
        </tbody>
    </table>
    `
    // Inject the entire string with dynamically populated content within the required <div> tags
    document.getElementById("kw_syn_div").innerHTML = kw_syn_str;
}

// Trigger the injection of script to get user selected text and 
// populate the input textarea whenever the DOM content is loaded
// (without waiting for images and stylesheets to finish loading)
document.addEventListener("DOMContentLoaded", getSelectedText);

// When the 'Rephrase' button is clicked, send the POST request to the API server to obtain
// the paraphrased text along with the synonyms for keywords and populate the results dynamically
document.getElementById("submit_text").addEventListener("click", getParaphrasedResult);