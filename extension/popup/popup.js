base_url = "http://localhost:8000";

function getSelectedText() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let tab = tabs[0];
        chrome.scripting.executeScript(
            {
                target: { tabId: tab.id },
                function: _getSelectedTextFromTab,
            },
            ([res]) => {
                console.log(res)
                if (res["result"] !== "") {
                    document.getElementById("input_text").value = res["result"];
                }
            }
        );
    });
};

function _getSelectedTextFromTab() {
    var selection = window.getSelection().toString();
    return selection;
}

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

function getParaphrasedResult() {
    document.getElementById("paraphrased_result").style.display = "none";

    let error_box = document.getElementById("error_box");
    let text = document.getElementById("input_text").value;
    let loading_text = document.getElementById("loading_text");
    
    if (text == "") {
        error_box.innerHTML = "No text available to rephrase! Please enter something";
        error_box.style.display = "block";
    }
    else {
        error_box.style.display = "none";
        loading_text.innerHTML = "Fetching paraphrased results...";
        document.getElementById("loading").style.display = "block";

        var body = JSON.stringify({
            paragraph: text
        })

        let paraphrase_url = `${base_url}/paraphrase/`;

        doPost(paraphrase_url, body, (res, err) => {
            document.getElementById("loading").style.display = "none";
            if(err){
                error_box.innerHTML = "Sorry! Error in paraphrasing input text";
                error_box.style.display = "block";
            }
            else {
                res = JSON.parse(res)
                document.getElementById("paraphrased_text").value = res["paraphrased"];
                populateSynonyms(res["keywords_synonyms"]);
                document.getElementById("paraphrased_result").style.display = "block";
            }
        })
    }
}

function populateSynonyms(kw_syn) {
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
    document.getElementById("kw_syn_div").innerHTML = kw_syn_str;
}

document.addEventListener("DOMContentLoaded", getSelectedText);
document.getElementById("submit_text").addEventListener("click", getParaphrasedResult);