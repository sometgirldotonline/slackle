let token = window.location.hash.replace("#token=","")
// i originally was not caching this but realised i probably should, yes i vibecoded the caching in gemini. Soz.
let userCache = JSON.parse(localStorage.getItem("userCache")) || {};

// vibe codedd
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let lastRequest;
async function rateLimitedFetch(url, options) {
    const now = Date.now();
    const wait = Math.max(0, lastRequest + 667 - now);

    if (wait > 0) {
        await delay(wait);
    }

    lastRequest = Date.now();

    return fetch(url, options);
}

// get user channels list

async function getUserInfo(id){
    const now = Date.now();
    
    if(id in userCache && (now - userCache[id].timestamp < 24 * 60 * 60 * 1000)){
        return userCache[id].data
    }
    const response = await rateLimitedFetch("https://slackle-auth.novafurry.workers.dev/api/users.info?user="+id,{
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    const resp = await response.json();
    console.log(resp)
    
    userCache[id] = {
        data: resp,
        timestamp: now
    };
    localStorage.setItem("userCache", JSON.stringify(userCache));
    
    return resp;
}

async function start(){
try {
    const response = await fetch("https://slackle-auth.novafurry.workers.dev/api/users.conversations?types=public_channel&limit=999",{
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    const resp = await response.json();
    console.log(resp)
    let co = 0;
    let prog = document.querySelector("#c-progress");
    let progcount = document.querySelector("#c-prog-count");
    prog.min=0;
    prog.max=resp.channels.length;
    prog.value=0;
    progcount.innerText = `0 / ${resp.channels.length} Channels processed`
    for (const c of resp.channels) {
        const user = await getUserInfo(c.creator);
        console.log(user);
        co++;
        prog.value=co;
        progcount.innerText = `${co} / ${resp.channels.length} Channels processed`
    }
}
catch (e){
    throw e
}}
start()