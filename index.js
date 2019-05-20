/*
    Import Data
*/
const http = require('http');
const https = require('https');
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');

/*
    Init Module
*/
var app = express();

/*
    Load Config
*/
dotenv.config();

/*
    Affectation APP
*/
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use('/web', express.static(__dirname + '/web'));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/web/index.html'));
});

/*
    League API
*/
app.get('/rank', async function (req, res) {
    try {
        var info = {
            summonerName: req.query.summonername,
            region: req.query.region,
            id: '',
            apiKey: process.env.apiKey
        }
      if (process.env.DEBUG) { console.log(info) } 

        // Validation
        if (info.summonerName.trim().length === 0) {
            res.send("Vous devez spécifier le nom de l'invocateur 'summonerName=TEST'")
            return;
        }
        if (info.region.trim().length === 0) {
            res.send("Vous devez spécifier la région 'region=NA1'")
            return;
        }

        // Obtenir les informations
        var leagueUserData = await getSummonerInfo(info.region, info.summonerName, info.apiKey);
        if (process.env.DEBUG) { console.info(`Summoner : ${JSON.stringify(leagueUserData)}`) } 
        if (leagueUserData.status && leagueUserData.status.status_code !== 200) {      
            throw new Error(`Une erreur s'est produite: ${leagueUserData.status.message} (${leagueUserData.status.status_code})`)
        } else {
            info.id = leagueUserData.id
        }

        var summonerLeagueData = await getLeagueUser(info.region, info.id, info.apiKey);
        if (process.env.DEBUG) { console.info(`League : ${JSON.stringify(summonerLeagueData)}`) } 


        // Préparer les informations sur le rank
            var rankInfo = {
                username: leagueUserData.name,
                rank: summonerLeagueData[0].rank,
                tier: summonerLeagueData[0].tier,
                lp: summonerLeagueData[0].leaguePoints
            }

            if (summonerLeagueData[0].miniSeries) {
                rankInfo.series = {
                    wins: summonerLeagueData[0].miniSeries.wins,
                    losses: summonerLeagueData[0].miniSeries.losses,
                    target: summonerLeagueData[0].miniSeries.target,
                    progress: summonerLeagueData[0].miniSeries.progress,
                }
            }


            var returnTxt = '';
            if (rankInfo.series) {
                returnTxt = `${rankInfo.username} est actuellement  ${rankInfo.tier} ${rankInfo.rank}. (${rankInfo.lp} LP) - Promo: [${rankInfo.series.progress}]`;
            } else {
                returnTxt = `${rankInfo.username} est actuellement  ${rankInfo.tier} ${rankInfo.rank}. (${rankInfo.lp} LP)`;
            } console.log(returnTxt);

            res.send(returnTxt);
     
    } catch (ex) {
        console.error(ex);
        res.send(ex);
    }
});

// Step 2
function getLeagueUser(region, userid, apiKey) {
    return new Promise(resolve => {
        var summonerRankURL = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${userid}?api_key=${apiKey}`

        console.log(` Traitement 2 : ${summonerRankURL}`)

        https.get(summonerRankURL, (resp) => {
            let ChunkData1 = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                ChunkData1 += chunk;
            });

            resp.on('end', () => {
                leagueJson = JSON.parse(ChunkData1);
                //  console.log(leagueJson);

                resolve(leagueJson);
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });

    })
}

// Step 1
function getSummonerInfo(region, username, apiKey) {
    return new Promise(resolve => {
        var UserAPIurl = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${username}?api_key=${apiKey}`;
        var jsonData = '';

        console.log(` Traitement 1 : ${UserAPIurl}`)

        https.get(UserAPIurl, (resp) => {
            let ChunkData = '';

            resp.on('data', (chunk) => {
                ChunkData += chunk;
            });

            resp.on('end', () => {
                jsonData = JSON.parse(ChunkData)
                resolve(jsonData);
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });

    })
}

/* Démarrage du serveur */
app.listen(process.env.PORT, function () {
    var port = process.env.PORT;
    console.log(`Démarrage du serveur le '${new Date().toString()}' sur le port ${port}`)
})

app.on('close', function () {
    console.log(`Serveur Close at '${new Date().toString()}'`);
})