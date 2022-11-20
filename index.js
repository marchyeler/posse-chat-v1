const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server);
app.use(express.static('public'))
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

//cookie prase
const cookieParser = require("cookie-parser");

//pocketbase config
const PocketBase = require('pocketbase/cjs');

app.use(async (req, res, next) => {
    req.pb = new PocketBase('http://127.0.0.1:8090');

    // load cookie
    req.pb.authStore.loadFromCookie(req.headers.cookie)
    console.log(req.headers.cookie);

    req.pb.authStore.onChange(() => {
        res.setHeader("Set-Cookie", req.pb.authStore.exportToCookie({ httpOnly: false }));
    })

    console.log(req.pb.authStore.isValid);
    try {
        //  auth state by refreshing the loaded auth model
        if (req.pb.authStore.isValid) {
            await req.pb.collection('users').authRefresh();
        }
    } catch (err) {
        console.log("REFRESH error (mostly likely due to expired token)", err);

        // clear auth store
        req.pb.authStore.clear();
    }

    next();
})

app.get("/", async function (req, res) {
    return res.sendFile(__dirname + '/src/index.html');

});

app.get("/app", async function (req, res) {
    if (!req.pb.authStore.isValid) {
        console.log(req.pb.authStore.isValid);
        return res.redirect('http://localhost:3000/');
    }
    console.log(req.pb.authStore.isValid);
    res.sendFile(__dirname + '/src/app.html');
});

app.get("/login", async function (req, res) {
    if (!req.pb.authStore.isValid) {
        return res.sendFile(__dirname + '/src/login.html');
    }

    res.redirect('http://localhost:3000/app');
});

app.get("/register", async function (req, res) {
    return res.sendFile(__dirname + '/src/register.html');

});

server.listen(3001, () => {
    console.log('listening on *:3000');
});
