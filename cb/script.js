let token = window.location.hash.replace("#token=", "")
// i originally was not caching this but realised i probably should, yes i vibecoded the caching in gemini. Soz.
let userCache = JSON.parse(localStorage.getItem("userCache")) || {};
let userChannelCount = {};
// vibe codedd
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let lastRequest;
let rows = {
    "row1": [], // 8
    "row2": [], // 15
    "row3": [] // 26
}
let rowRadius = { "row1": 120, "row2": 210, "row3": 280 }
function arrangeAround(items, parent, radius = 100, voffset = 0, hoffset = 0) {
    parent.style.position = 'relative';

    const centerX = parent.offsetWidth / 2 + hoffset;
    const centerY = parent.offsetHeight / 2 + voffset;

    items.forEach((it, i) => {
        const angle = (i / items.length) * 2 * Math.PI;

        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        it.style.position = 'absolute';
        it.style.left = `${x - it.offsetWidth / 2}px`;
        it.style.top = `${y - it.offsetHeight / 2}px`;
    });
}

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

async function getUserInfo(id) {
    const now = Date.now();

    if (id in userCache && (now - userCache[id].timestamp < 24 * 60 * 60 * 1000)) {
        return userCache[id].data
    }
    else {
        const response = await rateLimitedFetch("https://slackle-auth.novafurry.workers.dev/api/users.info?user=" + id, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const resp = await response.json();

        userCache[id] = {
            data: resp,
            timestamp: now
        };
        localStorage.setItem("userCache", JSON.stringify(userCache));

        return resp;
    }
}

async function start() {
    try {
        const uresponse = await fetch("https://slackle-auth.novafurry.workers.dev/api/auth.test", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const uresp = await uresponse.json();
        console.log(uresp)
        window.user = uresp.user_id;
        const response = await fetch("https://slackle-auth.novafurry.workers.dev/api/users.conversations?types=public_channel,im&limit=999", {
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
        prog.min = 0;
        prog.max = resp.channels.length;
        prog.value = 0;
        progcount.innerText = `0 / ${resp.channels.length} Channels processed`
        for (const c of resp.channels) {
            let t = c.is_im ? c.user : c.creator;
            if (t !== user) {
                const user = await getUserInfo(t);
                if (t in userChannelCount) {
                    userChannelCount[t] = userChannelCount[t] + 1;
                }
                else {
                    userChannelCount[t] = 1;
                }
                if (co < 8) {
                    rows.row1.push(t);
                } else if (co < 23) {
                    rows.row2.push(t);
                } else if (co < 49) {
                    rows.row3.push(t);
                }
                co++;
                prog.value = co;
                progcount.innerText = `${co} / ${resp.channels.length} Channels processed`
            }
        }
        userChannelCount = Object.fromEntries(
            Object.entries(userChannelCount).sort((a, b) => b[1] - a[1])
        )
        document.querySelector(".grabbing").remove();
        document.querySelector(".main").style.display = "block"
        let ourUser = document.createElement("img")
        ourUser.src = (await getUserInfo(user)).user.profile.image_512.replace("avatars.slack-edge.com", "slackle-auth.novafurry.workers.dev/av").replace("secure.gravatar.com", "slackle-auth.novafurry.workers.dev")
        ourUser.classList.add("ourUser")
        document.querySelector('.circle').appendChild(ourUser)
        let rowCounts = {
            row1: {},
            row2: {},
            row3: {}
        };

        for (const [userId, count] of Object.entries(userChannelCount)) {
            if (rows.row1.includes(userId)) {
                rowCounts.row1[userId] = count;
            } else if (rows.row2.includes(userId)) {
                rowCounts.row2[userId] = count;
            } else if (rows.row3.includes(userId)) {
                rowCounts.row3[userId] = count;
            }
        }
        co = 0;
        for (userId of Object.keys(rowCounts.row1)) {
            let u = document.createElement("img")
            let ud = (await getUserInfo(userId)).user;
            u.src = ud.profile.image_512.replace("avatars.slack-edge.com", "slackle-auth.novafurry.workers.dev/av").replace("secure.gravatar.com", "slackle-auth.novafurry.workers.dev")
            u.classList.add("row1")
            u.classList.add("rpos" + co)
            u.title = `${ud.profile.display_name}\n${userChannelCount[userId]} channels`
            document.querySelector('.rows1').appendChild(u)
            co++;
        };
        arrangeAround([...document.querySelectorAll('.row1')], document.querySelector('.rows1'), rowRadius.row1)

        co = 0;
        for (userId of Object.keys(rowCounts.row2)) {
            let u = document.createElement("img")
            let ud = (await getUserInfo(userId)).user;
            u.src = ud.profile.image_512.replace("avatars.slack-edge.com", "slackle-auth.novafurry.workers.dev/av").replace("secure.gravatar.com", "slackle-auth.novafurry.workers.dev")
            u.classList.add("row2")
            u.classList.add("rpos" + co)
            u.title = `${ud.profile.display_name}\n${userChannelCount[userId]} channels`
            document.querySelector('.rows2').appendChild(u)
            co++;
        };
        arrangeAround([...document.querySelectorAll('.row1')], document.querySelector('.rows1'), rowRadius.row1)
        arrangeAround([...document.querySelectorAll('.row2')], document.querySelector('.rows2'), rowRadius.row2)

        co = 0;
        for (userId of Object.keys(rowCounts.row3)) {
            let u = document.createElement("img")
            let ud = (await getUserInfo(userId)).user;
            u.src = ud.profile.image_512.replace("avatars.slack-edge.com", "slackle-auth.novafurry.workers.dev/av").replace("secure.gravatar.com", "slackle-auth.novafurry.workers.dev")
            u.classList.add("row3")
            u.classList.add("rpos" + co)
            u.title = `${ud.profile.display_name}\n${userChannelCount[userId]} channels`
            document.querySelector('.rows3').appendChild(u)
            co++;
        };
        arrangeAround([...document.querySelectorAll('.row2')], document.querySelector('.rows2'), rowRadius.row2)
        arrangeAround([...document.querySelectorAll('.row3')], document.querySelector('.rows3'), rowRadius.row3)
        setTimeout(() => {
            arrangeAround([...document.querySelectorAll('.row1')], document.querySelector('.rows1'), rowRadius.row1)
            arrangeAround([...document.querySelectorAll('.row2')], document.querySelector('.rows2'), rowRadius.row2)
            arrangeAround([...document.querySelectorAll('.row3')], document.querySelector('.rows3'), rowRadius.row3)
        }, 50)
        setTimeout(() => {
            const element = document.querySelector(".circle");

            html2canvas(element, {
                useCORS: true,
                allowTaint: false,
            }).then(canvas => {
                canvas.classList.add("balls")
                document.querySelector(".ch").appendChild(canvas);
                // Your canvas is ready here
                element.style.display = "none";
                document.querySelector(".buttons").style.display = "block";
            });

        }, 100)

    }
    catch (e) {
        throw e
    }
}
start()


async function copycanvastoclip() {
    canvas = document.querySelector("canvas")
    try {
        canvas.toBlob(async (blob) => {
            data = [new ClipboardItem({ [blob.type]: blob })];
            await navigator.clipboard.write(data)
        })
    }
    catch (err) {
        alert(`Failed to copy!
Error: ${e}`)
    }
}
function dlcanvas() {
    canvas = document.querySelector("canvas")
    img = canvas.toDataURL();
    link = document.createElement("a");
    link.download = `Slackle for ${userCache[window.user].data.user.profile.display_name.replace(/[\x00-\x1F\x7F/\\?%*:|"<>]/g, '').trim().replace(/^\.+|\.+$/g, '')}.png`
    link.href = img;
    link.click();
}