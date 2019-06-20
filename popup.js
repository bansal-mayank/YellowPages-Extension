let message = [
    'dataReady',
    'download'
]

document.getElementById("run").addEventListener("click", async function(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {type:message[0]}, function(response){
            if (response) {
                $('#fetch').css({display: 'block'})
            } else {
                console.log('Error occured')
            }
            
        });
    }); 
});