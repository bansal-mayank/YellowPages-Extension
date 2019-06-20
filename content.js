let messages = [
    'collectData',
    'download'
]

let domain = 'https://www.yellowpages.com';

var collectedData;
chrome.runtime.onMessage.addListener(
    async function(request, sender, sendResponse){
        console.log(request)
        switch(request.type) {
            case 'dataReady': 
                sendResponse({status: true, message: 'Data ready'});
                doStuff().then(function(re){
                    makeCSV(re);
                    alert('Data is ready to download');
                }).catch(function(){
                    sendResponse({status: false, message: 'Error occured'});
                })
            default: 
                sendResponse({status: false, message: 'Error occured'});
                
        }

    }
);

function doStuff(){
    return new Promise(async function(resolve, reject){
        let time = Date.now();
        // console.log(urls.length)
        // console.log(urls);
        let urls = await getTotalResults();
        collectedData = await getServiceProvidersDetails(urls);
        resolve(collectedData)
    })
}

async function getTotalResults () {
    let currenUrl = location.href;
    let totalNumberOfPagesString = $('.pagination p').text();
    let numberOfPages;
    let resultsUrls  = [];
    if (totalNumberOfPagesString) {
        numberOfPages = parseInt(totalNumberOfPagesString.match(/(\d+)/));
        // numberOfPages/30
        for (let i =1;i<numberOfPages/30;i++) {
            if (i == 1) {
                resultsUrls.push(currenUrl);
            } else {
                resultsUrls.push(currenUrl + `&page=${i}`)
            }
        }
    } else {
        console.log('Error occured');
    }

    if (resultsUrls) {
        let urlPromiseArray = resultsUrls.map(function(url){
            return getUrlsFromEachPage(url);
        })
        let urls = await Promise.all(urlPromiseArray);
        if (urls) {
            let finalUrls = [];
            urls.map(function(urlArray){
                return urlArray.map(function(url){
                    finalUrls.push(url)
                    return url
                })
            })
            return finalUrls;
        }
    }
}

function makeCSV(data) {
    console.log(data);
    var csv = "Name,Address,Phone,Email,Links\n";
    for(let i =0;i<data.length; i++) {
        var sep = "";
        let item  = data[i];
        console.log(item);
        let a = item.address.replace(/,/g, ' ');
        let n = item.name.replace(/,/g, ' ');
        let email = '';
        if (item.email && item.email.match(/:(.*)/)[1]) {
            email = item.email.match(/:(.*)/)[1];
        }

        csv += `${n},${a},${item.phone},${email},${item.links}`;
        csv += "\n";
    }
    console.log('CSV DATA',csv);
    window.URL = window.URL || window.webkiURL;
    let blob = new Blob([csv]);
    var blobURL = window.URL.createObjectURL(blob);
    var tempElem = document.createElement('a');
    tempElem.setAttribute('href', blobURL);
    tempElem.setAttribute('download', 'data.csv');
    tempElem.click();
}

function getAllUrls(html) {
    const $resultDiv = $(html).find('.scrollable-pane');
    let urlsArray = [];
    $resultDiv.find('.search-results.organic .result').each(function(result){
        let url = $(this).find('.srp-listing div.v-card div.info h2.n a.business-name').attr('href')
        urlsArray.push(domain + url);
    })
    return urlsArray;
}

async function getServiceProvidersDetails(urls) {
    if(!urls) {
        return [];
    }
    let promiseArrayOfEachUrlData = urls.map(function(url){
        return getPageContent(url);
    });
    let serviceProvidersDetails = await Promise.all(promiseArrayOfEachUrlData);
    return serviceProvidersDetails;
}

function getUrlsFromEachPage (url) {
    return new Promise(function(resolve, reject){
        fetch(url)
        .then(function(response) {
            return response.text()
        })
        .then(function(html) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, "text/html");
            let urlsFromPage  = getAllUrls(doc);
            resolve(urlsFromPage);
            
        })
        .catch(function(err) {  
            console.log('Failed to fetch page: ', err);  
            reject('Error aa gyi bhai')
        });
    })
}

function getPageContent (url) {
    console.log(url)
    return new Promise(function(resolve, reject){
        fetch(url)
        .then(function(response) {
            return response.text()
        })
        .then(function(html) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, "text/html");
            try {
                let data = {
                    name: '',
                    address: '',
                    phone: '',
                    email: '',
                    links: ''
                }

                if(doc.querySelector('.sales-info')) {
                    data.name = doc.querySelector('.sales-info').textContent           
                }

                if(doc.querySelector('.address')) {
                    data.address = doc.querySelector('.address').textContent     
                }

                if(doc.querySelector('.phone')) {
                    data.phone = doc.querySelector('.phone').textContent
                }

                if(doc.querySelector('.email-business')) {
                    data.email = doc.querySelector('.email-business').href           
                }

                if (doc.querySelector('dd.social-links')) {
                    let links = '';
                    let $doc = $(doc.querySelector('dd.social-links'));
                    $doc.find('a').each(function(){
                        links += $(this).attr('href') + ';;;';
                    })
                    data.links = links;
                }
                resolve(data);
            } catch(e){
                console.log('Error occured at ', e);
            }
            
            
        })
        .catch(function(err) {  
            console.log('Failed to fetch page: ', err);  
            reject('Error aa gyi bhai')
        });
    })
}   