var fetch = require('node-fetch');
var express = require('express');
var path = require('path');
var router = express.Router();

/* GET home page. */
router.get('/t', function (req, res, next) {
  //  res.render('index', { title: 'BedyAPI', layout: 'layouts\layout.hbs' });

  var model = {
    pageTitle: 'Bedy API',
    connected: false,
    title: "Bedy tunnel",
    region: ['NA', 'EUW', 'EUNE'],
    queue: ['SoloQ', 'FlexQ', 'TFT']
  }

  res.render('partials/index', {
    vm: model,
    bodyClass: 'welcome bg-dark',
    mainClass: 'fullWidth',
  });
});

router.get('/loltest', function (req, res, next) {
  var data = {
    mode: 1,
    summonerName: "Bohe",
    queue: "SoloQ",
    winrate: "56.1",
    win: 92,
    loose: 72,
    rank: {
      colorRank: "gold",
      tier: "GOLD",
      lp: 39,
      rank: "III",
    },
    image: {
      src: `${getEmbles('gold')}`,
      alt: "Gold 4"
    }
  };

  res.render('overlay/lol_mode1', { title: 'BedyAPI', data: data });
});

router.get('/discord', async function (req, res, next) {
  let { query, params, body } = req;
  const { code } = query;
  let myToken;

  if (code) {
    try {
      const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: '965719448952668190',
          client_secret: 'WlnvcPMWOC4hplpE4Kdof_kl3Jdah_-f',
          code,
          grant_type: 'authorization_code',
          redirect_uri: `http://localhost:3000/discord`,
          scope: 'identify',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const oauthData = await oauthResult.json();
      console.log('--------------------')
     console.log(oauthData);
     console.log('--------------------')

      myToken = oauthData.access_token;

    } catch (error) {
      // NOTE: An unauthorized token will not throw an error;
      // it will return a 401 Unauthorized response in the try block above
      console.error(error);
    }
  }

 // res.send(`Coucou Discord je m'authentifie`);

  const applicationId = "965719448952668190"  // static je l'ai
  const guildId = "858069045504507935" // oauthData.guild.id


  const commandId = "969764668535103561" // Set this as your application ID to set default permissions
  const getCommands = `/applications/{application.id}/guilds/{guild.id}/commands`;
  
  const url = `https://discord.com/api/v9/applications/${applicationId}/guilds/${guildId}/commands/${commandId}/permissions`
  // requires the user that the bearer token belongs to have used applications.commands.permissions.update scope and have manage guild/roles permission
  const token = "Bearer " + myToken; // replace {token} with what you copied from access_token
  const payload = {
    permissions: [
      {
        id: "969766463583973396", // role/user/channel ID
        type: 1, // 1 for role, 2 for user, and 3 for channel
        permission: true // whether or not that role/user can use the command or you can use the command in the channel
      }
    ]
  }
  const ret = await fetch(url, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: {
      Authorization: `${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
  }); // .then(f => { console.log(f) }); // .error(err => console.error(err));

  let reponase = await ret.json();

  console.log('');
  console.log('--------------------')
  console.log(reponase);
  console.log('--------------------')

  res.send(`Coucou Discord`);
});


function getEmbles(tiers) {
  // var folder = `/static/images/emblems`; 
  var folder = `/emblems`;
  switch (tiers.toUpperCase()) {
    case 'IRON':
      imgName = `/Emblem_Iron.png`
      break;

    case 'BRONZE':
      imgName = `/Emblem_Bronze.png`
      break;

    case 'SILVER':
      imgName = `/Emblem_Silver.png`
      break;

    case 'GOLD':
      imgName = `/Emblem_Gold.png`
      break;

    case 'PLATINUM':
      imgName = `/Emblem_Platinum.png`
      break;

    case 'DIAMOND':
      imgName = `/Emblem_Diamond.png`
      break;

    case 'MASTER':
      imgName = `/Emblem_Master.png`
      break;

    case 'GRANDMASTER':
      imgName = `/Emblem_GrandMaster.png`
      break;

    case 'CHALLENGER':
      imgName = `/Emblem_Challenger.png`
      break;
  }
  var t = path.join(folder, imgName);
  console.log(t);
  return t; // `${folder}/${imgName}`;
}


// try {
//   var fullUrl = `${protocol}://${req.get('host')}`;
//   //``req.protocol + '://' + req.get('host') + req.originalUrl;

//   var result = jsonData.queue.find(f => f.QueueType === locSummoner.queueType);
//   var imgName;

//   var queue = "SoloQ";
//   switch (result.QueueType.toUpperCase()) {
//       case 'SOLO5':
//           queue = "SoloQ";
//           break;
//       case 'FLEX':
//           queue = "Flex";
//           break;
//       case 'TFT':
//           queue = "TFT";
//           break;
//   }

//   if (result) {
//       var templateData = {
//           summonerName: locSummoner.summonerName,
//           queueType: queue,
//           rank: `${result.tiers} ${result.rank}`,
//           lp: `${result.LP}`,
//           stats: result.stats,
//           option: {
//               showLp: locSummoner.showLp,
//               showWR: locSummoner.showWinRate
//           },
//           image: {
//               src: `${folder}/${imgName}`,
//               alt: `${result.tiers} ${result.rank}`
//           },
//           series: result.series,
//           colorRank: result.tiers.toLowerCase()
//       }

//       var templateFilePath = path.join(__dirname, '../..', '/web/template/obs.hbs');
//       var templ = fs.readFileSync(templateFilePath, 'utf8');
//       var aTemplate = TemplateAPI.getTemplate(templ, templateData);

//       res.send(aTemplate);
//   } else {
//       res.json(jsonData);
//   }

// } catch (ex) {
//   console.error(ex);
// }


module.exports = router;
