var express = require('express');
var path = require('path');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'BedyAPI' });
});


router.get('/ow', function(req, res, next) {
  var data = {
    mode: 1,
    summonerName: "Bohe",
    queue: "SoloQ",
    winrate: "56.1",
    win: 92,
    loose: 72,
    rank: {
      colorRank: "gold",
      tier: "III",
      lp: 39,
      rank: "GOLD",
    },
    image: {
      src: `${getEmbles('gold')}`,
      alt: "Gold 4"
    }
  };

  res.render('overlay/lol_mode1', { title: 'BedyAPI', data: data  });
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
