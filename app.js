var fs = require('fs');
var assert = require('assert');
var demofile = require('demofile');

var teams = {
	0: 'none',
	1: 'spectator',
	2: 'terrorists',
	3: 'cts'
}

var reasons = {
	1: 'target_bombed', // t win
	7: 'bomb_defused', // ct win
	8: 'terrorists_killed', // ct win
	9: 'cts_killed', // t win
	12: 'target_saved', // ct win
	17: 'terrorists_surrender', // ct win
	18: 'ct_surrender' // t win
	/*
	TargetBombed = 1 // Target Successfully Bombed!
	// 2/3 not in use in CSGO
	TerroristsEscaped = 4 // The terrorists have escaped!
	CTStoppedEscape = 5 // The CTs have prevented most of the terrorists from escaping!
	TerroristsStopped = 6 // Escaping terrorists have all been neutralized!
	BombDefused = 7 // The bomb has been defused!
	CTWin = 8 // Counter-Terrorists Win!
	TerroristWin = 9 // Terrorists Win!
	Draw = 10 // Round Draw!
	HostagesRescued = 11 // All Hostages have been rescued!
	TargetSaved = 12 // Target has been saved!
	HostagesNotRescued = 13 // Hostages have not been rescued!
	TerroristsNotEscaped = 14 // Terrorists have not escaped!
	GameStart = 16 // Game Commencing!
	// 15 not in use in CSGO
	TerroristsSurrender = 17 // Terrorists Surrender
	CTSurrender = 18 // CTs Surrender
	TerroristsPlanted = 19 // Terrorists Planted the bomb
	CTsReachedHostage = 20 // CTs Reached the hostage
	*/
}

var demoPath;

/*
 * @info
 * This method parses all data for the round selector visualization
 * The visualization consists of the following info per round:
 * 	1. Winner
 *  2. Reason
 *
 * @update
 * 1. round_end
 * 2. round_end
 *
 * @returns
 *	{
 *		time: [
 *			{
 *				roundNumber,
 *				winner,
 *				reason
 *			},
 *		]
 *	}
 */
function parseRounds() {
	let json = {};
	fs.readFile(demoPath, function (err, buffer) {
		assert.ifError(err);

    let demoFile = new demofile.DemoFile();
		let rounds = [];

		json['0'] = [];

		demoFile.gameEvents.on('round_end', e => {
			let time = Math.ceil(demoFile.currentTime);
			rounds.push({
				'roundNumber': demoFile.gameRules.roundsPlayed,
				'winner': teams[e.winner],
				'reason': reasons[e.reason]
			});
			json[time] = rounds.slice(0);
		});

		demoFile.on('end', () => {
			let fileName = demoPath.substring(0, demoPath.length-4) + '-rounds.json';
			let dir = fileName.split('-', 3).join('-');
			fs.writeFile('json/' + dir + '/' + fileName, JSON.stringify(json, null, 2), (err) => {
				if (err) throw err;
				console.log(fileName + ' has been saved.');
			});
    });

		demoFile.parse(buffer);
	});
}

/*
 * @info
 * This method parses all data for the scoreboard visualization
 * The visualization consists of the following info per player:
 * 	1. PLayer name
 *  2. Current account
 *	3. K/A/D
 *	4. Accuracy & HS accuracy
 *
 * @update
 * 1. round_announce_match_start
 * 2. player_death
 *		bomb_planted
 *		bomb_defused
 *		round_officially_ended
 *		buy NOTE not possible
 * 3. player_death
 * 4. weapon_fire
 *
 * @returns
 *	{
 *		time: {
 *			terrorists/cts: {
 *				teamName,
 *				score,
 *				players: [
 *					{
 *						name,
 *						account,
 *						kills,
 *						assists,
 *						deaths,
 *						accuracy,
 *						hsAccuracy
 *					},
 *				]
 *			},
 *		},
 *	}
 */
function parseScoreboard() {
	let json = {};
	function logScoreboardInfo(demoFile) {
		let teamT = demoFile.teams[demofile.TEAM_TERRORISTS];
		let teamCT = demoFile.teams[demofile.TEAM_CTS];
		if (teamT == undefined || teamCT == undefined) return;

		let time = Math.ceil(demoFile.currentTime);
		json[time] = {};
		json[time]['terrorists'] = {};
		json[time]['terrorists']['teamName'] = teamT.clanName;
		json[time]['terrorists']['score'] = teamT.score;
		json[time]['terrorists']['players'] = [];
		for (p of teamT.members) {
			json[time]['terrorists']['players'].push({
				'name': p.name,
				'account': p.account,
				'kills': p.kills,
				'assists': p.assists,
				'deaths': p.deaths,
				'accuracy': 0,
				'hsAccuracy': 0
			});
		}
		json[time]['cts'] = {};
		json[time]['cts']['teamName'] = teamCT.clanName;
		json[time]['cts']['score'] = teamCT.score;
		json[time]['cts']['players'] = [];
		for (p of teamCT.members) {
			json[time]['cts']['players'].push({
				'name': p.name,
				'account': p.account,
				'kills': p.kills,
				'assists': p.assists,
				'deaths': p.deaths,
				'accuracy': 0,
				'hsAccuracy': 0
			});
		}
	}

	fs.readFile(demoPath, function (err, buffer) {
		assert.ifError(err);

    let demoFile = new demofile.DemoFile();

		demoFile.gameEvents.on('round_announce_match_start', () => {
			let teamT = demoFile.teams[demofile.TEAM_TERRORISTS];
			let teamCT = demoFile.teams[demofile.TEAM_CTS];
			json['0'] = {};
			json['0']['terrorists'] = {};
			json['0']['terrorists']['teamName'] = teamT.clanName;
			json['0']['terrorists']['score'] = 0;
			json['0']['terrorists']['players'] = [];
			for (p of teamT.members) {
				json['0']['terrorists']['players'].push({
					'name': p.name,
					'account': 800,
					'kills': 0,
					'assists': 0,
					'deaths': 0,
					'accuracy': 0,
					'hsAccuracy': 0
				});
			}
			json['0']['cts'] = {};
			json['0']['cts']['teamName'] = teamCT.clanName;
			json['0']['cts']['score'] = 0;
			json['0']['cts']['players'] = [];
			for (p of teamCT.members) {
				json['0']['cts']['players'].push({
					'name': p.name,
					'account': 800,
					'kills': 0,
					'assists': 0,
					'deaths': 0,
					'accuracy': 0,
					'hsAccuracy': 0
				});
			}
			logScoreboardInfo(demoFile);
		});

		demoFile.gameEvents.on('player_death', () => {
			logScoreboardInfo(demoFile);
		});

		demoFile.gameEvents.on('bomb_planted', () => {
			logScoreboardInfo(demoFile);
		});

		demoFile.gameEvents.on('bomb_defused', () => {
			logScoreboardInfo(demoFile);
		});

		demoFile.gameEvents.on('round_officially_ended', () => {
			logScoreboardInfo(demoFile);
		});

		demoFile.on('end', () => {
			let fileName = demoPath.substring(0, demoPath.length-4) + '-scores.json';
			let dir = fileName.split('-', 3).join('-');
			fs.writeFile('json/' + dir + '/' + fileName, JSON.stringify(json, null, 2), (err) => {
				if (err) throw err;
				console.log(fileName + ' has been saved.');
			});
		});

		demoFile.parse(buffer);
	});
}

/*
 * @info
 * This method parses all data for the money visualization
 * The visualization consists of the following info:
 * 	1. A bar that shows current cash distribution of the teams
 * 	2. A bar that shows current equipment value distribution of the teams
 *
 * @update
 * 1. player_death
 *		bomb_planted
 *		bomb_defused
 *		round_officially_ended
 *		buy NOTE not possible
 * 2.	player_death
 *		buy NOTE not possible
 *		inferno_startburn
 *		item_remove
 *		item_pickup
 *
 * @returns
 *	{
 *		time: {
 *			terroristsAccount,
 *			terroristsEquipment,
 *			ctAccount,
 *			ctEquipment
 *		},
 *	}
 */
function parseMoney() {
	let json = {};
	function getCurrentMoney(demoFile) {
		let teamT = demoFile.teams[demofile.TEAM_TERRORISTS];
		let teamCT = demoFile.teams[demofile.TEAM_CTS];
		if (teamT == undefined || teamCT == undefined) return;

		let terroristsAccount = 0;
		let terroristsEquipment = 0;
		let ctAccount = 0;
		let ctEquipment = 0;

		for (p of teamT.members) {
			terroristsAccount += p.account;
			terroristsEquipment += p.currentEquipmentValue;
		}

		for (p of teamCT.members) {
			ctAccount += p.account;
			ctEquipment += p.currentEquipmentValue;
		}

		let time = Math.ceil(demoFile.currentTime);
		json[time] = {};
		json[time]['terroristsAccount'] = terroristsAccount;
		json[time]['terroristsEquipment'] = terroristsEquipment;
		json[time]['ctAccount'] = ctAccount;
		json[time]['ctEquipment'] = ctEquipment;
	}

	fs.readFile(demoPath, function (err, buffer) {
		assert.ifError(err);

		let demoFile = new demofile.DemoFile();

		demoFile.gameEvents.on('round_announce_match_start', () => {
			json['0'] = {
        "terroristsAccount": 4000,
        "terroristsEquipment": 0,
        "ctAccount": 4000,
        "ctEquipment": 0
      }
			getCurrentMoney(demoFile);
		});

		demoFile.gameEvents.on('player_death', () => {
			getCurrentMoney(demoFile);
		});

		demoFile.gameEvents.on('bomb_planted', () => {
			getCurrentMoney(demoFile);
		});

		demoFile.gameEvents.on('bomb_defused', () => {
			getCurrentMoney(demoFile);
		});

		demoFile.gameEvents.on('round_officially_ended', () => {
			getCurrentMoney(demoFile);
		});

		demoFile.gameEvents.on('inferno_startburn', () => {
			getCurrentMoney(demoFile);
		});

		demoFile.gameEvents.on('item_remove', () => {
			getCurrentMoney(demoFile);
		});

		demoFile.gameEvents.on('item_pickup', () => {
			getCurrentMoney(demoFile);
		});

		demoFile.on('end', () => {
			let fileName = demoPath.substring(0, demoPath.length-4) + '-money.json';
			let dir = fileName.split('-', 3).join('-');
			fs.writeFile('json/' + dir + '/' + fileName, JSON.stringify(json, null, 2), (err) => {
				if (err) throw err;
				console.log(fileName + ' has been saved.');
			});
		});

		demoFile.parse(buffer);
	});
}

/*
 * @info
 * This method parses all data for the damage and ADR visualization
 * The visualization consists of the following info:
 * 	1. A bar chart with for each player the ammount of damage dealt
 * 	2. A bar chart with for each player the average damage per round (ADR)
 *
 * @update
 * 1+2.	player_death
 *			player_hurt || weapon_fire NOTE ok for now
 *			hegrenade_detonate
 *			molotov_detonate
 *
 * @returns
 *	{
 *		time: {
 *			team: {
 *				players: [
 *					{
 *						name,
 *						damage
 *					},
 *				]
 *			},
 *		},
 *	}
 *
 * NOTE Due to log restrictions, might need to update on round_end
 */
function parseDamage() {
	let json = {};
	fs.readFile(demoPath, function (err, buffer) {
		assert.ifError(err);

		let demoFile = new demofile.DemoFile();
		let teamT;
		let teamCT;
		let totalDamages = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

		demoFile.gameEvents.on('round_announce_match_start', () => {
			teamT = demoFile.teams[demofile.TEAM_TERRORISTS];
			teamCT = demoFile.teams[demofile.TEAM_CTS];
			json['0'] = {};
			json['0']['terrorists'] = {};
			json['0']['terrorists']['teamName'] = teamT.clanName;
			json['0']['terrorists']['players'] = [];
			for (p of teamT.members) {
				json['0']['terrorists']['players'].push({
					'name': p.name,
					'damage': 0,
					'adr': 0
				});
			}
			json['0']['cts'] = {};
			json['0']['cts']['teamName'] = teamCT.clanName;
			json['0']['cts']['players'] = [];
			for (p of teamCT.members) {
				json['0']['cts']['players'].push({
					'name': p.name,
					'damage': 0,
					'adr': 0
				});
			}
		});

		demoFile.gameEvents.on('round_end', () => {
			if (teamT == undefined || teamCT == undefined) return;
			let roundNumber = demoFile.gameRules.roundsPlayed;
			if (roundNumber > 30) return;
			let time = Math.ceil(demoFile.currentTime);
			let i = 0;
			json[time] = {};
			json[time]['terrorists'] = {};
			json[time]['terrorists']['teamName'] = teamT.clanName;
			json[time]['terrorists']['players'] = [];
			for (p of teamT.members) {
				totalDamages[i] += p.matchStats[roundNumber-1].damage;
				json[time]['terrorists']['players'].push({
					'name': p.name,
					'damage': totalDamages[i],
					'adr': totalDamages[i]/(roundNumber)
				});
				i++;
			}
			json[time]['cts'] = {};
			json[time]['cts']['teamName'] = teamCT.clanName;
			json[time]['cts']['players'] = [];
			for (p of teamCT.members) {
				totalDamages[i] += p.matchStats[roundNumber-1].damage;
				json[time]['cts']['players'].push({
					'name': p.name,
					'damage': totalDamages[i],
					'adr': totalDamages[i]/(roundNumber)
				});
				i++;
			}
    });

		demoFile.on('end', () => {
			let fileName = demoPath.substring(0, demoPath.length-4) + '-damage.json';
			let dir = fileName.split('-', 3).join('-');
			fs.writeFile('json/' + dir + '/' + fileName, JSON.stringify(json, null, 2), (err) => {
				if (err) throw err;
				console.log(fileName + ' has been saved.');
			});
    });

		demoFile.parse(buffer);
	});
}

/*
 * @info
 * This method parses all data for the economy visualization
 * The visualization consists of a line chart with the following info for each round:
 * 	1. An indication of the current money on each time
 * 	2. An indication of how much money was spent that round
 *
 * @update
 * 1.	round_end NOTE should probably only be updated once every round, at buytime_ended
 * 2. buytime_ended NOTE not possible
 *
 * @returns
 *	{
 *		time: [
 *			{
 *				roundNumber,
 *				terroristsRoundStartAccount,
 *				terroristsRoundSpendValue,
 *				ctRoundStartAccount,
 *				ctRoundSpendValue
 *			},
 *		]
 *	}
 *
 */
function parseEconomy() {
	let json = {};
	json['0'] = [];
	let rounds = [];
	function getEconomy(demoFile) {
		let teamT = demoFile.teams[demofile.TEAM_TERRORISTS];
		let teamCT = demoFile.teams[demofile.TEAM_CTS];
		if (teamT == undefined || teamCT == undefined) return;
		let terroristsRoundStartAccount = 0;
		let terroristsRoundSpendValue = 0;
		let ctRoundStartAccount = 0;
		let ctRoundSpendValue = 0;
		for (p of teamT.members) {
			terroristsRoundStartAccount += p.account;
			terroristsRoundSpendValue += p.cashSpendThisRound;
		}
		for (p of teamCT.members) {
			ctRoundStartAccount += p.account;
			ctRoundSpendValue += p.cashSpendThisRound;
		}

		let time = Math.ceil(demoFile.currentTime);
		rounds.push({
			'roundNumber': demoFile.gameRules.roundsPlayed+1,
			'terroristsRoundStartAccount': terroristsRoundStartAccount,
			'terroristsRoundSpendValue': terroristsRoundSpendValue,
			'ctRoundStartAccount': ctRoundStartAccount,
			'ctRoundSpendValue': ctRoundSpendValue
		});
		json[time] =  rounds.slice(0);
		/*
		json[time] = {};
		json[time]['roundNumber'] = demoFile.gameRules.roundsPlayed+1;
		json[time]['terroristsRoundStartAccount'] = terroristsRoundStartAccount;
		json[time]['terroristsRoundSpendValue'] = terroristsRoundSpendValue;
		json[time]['ctRoundStartAccount'] = ctRoundStartAccount;
		json[time]['ctRoundSpendValue'] = ctRoundSpendValue;
		*/
	}

	fs.readFile(demoPath, function (err, buffer) {
		assert.ifError(err);

    let demoFile = new demofile.DemoFile();
		let teamT;
		let teamCT;

		demoFile.gameEvents.on('round_announce_match_start', () => {
			getEconomy(demoFile);
		});

		demoFile.gameEvents.on('round_end', () => {
			getEconomy(demoFile);
		});

		demoFile.on('end', () => {
			let fileName = demoPath.substring(0, demoPath.length-4) + '-economy.json';
			let dir = fileName.split('-', 3).join('-');
			fs.writeFile('json/' + dir + '/' + fileName, JSON.stringify(json, null, 2), (err) => {
				if (err) throw err;
				console.log(fileName + ' has been saved.');
			});
    });

		demoFile.parse(buffer);
	});
}

/*
 * @info
 * This method parses all data for the map visualization
 * The visualization consists of the following info:
 *	1. Heatmap information on kills, deaths, grenades, smokes, flashbangs, molotovs, decoys
 *
 * @update
 * 1.	player_death
 *		hegrenade_detonate
 *		smokegrenade_detonate
 *		flashbang_detonate
 *		molotov_detonate
 *		decoy_detonate
 *
 * @returns
 *	{
 *		time: {
 *			terroristKills,
 *			terroristDeaths,
 *			terroristGrenades,
 *			ctKills,
 *			ctDeaths,
 *			ctGrenades
 *		},
 *	}
 */
function parseMap() {
	let json = {};
	fs.readFile(demoPath, function (err, buffer) {
		assert.ifError(err);

		let demoFile = new demofile.DemoFile();
		let teamT;
		let teamCT;

		let terroristKills = [];
		let terroristDeaths = [];
		let terroristGrenades = [];
		let terroristSmokes = [];
		let terroristFlashbangs = [];
		let terroristDecoys = [];
		let terroristMolotovs = [];
		let ctKills = [];
		let ctDeaths = [];
		let ctGrenades = [];
		let ctSmokes = [];
		let ctFlashbangs = [];
		let ctDecoys = [];
		let ctMolotovs = [];

		function logLocations() {
			let time = Math.ceil(demoFile.currentTime);
			json[time] =  {};
			json[time]['terroristKills'] =  terroristKills.slice(0);
			json[time]['terroristDeaths'] =  terroristDeaths.slice(0);
			json[time]['terroristGrenades'] =  terroristGrenades.slice(0);
			json[time]['terroristSmokes'] =  terroristSmokes.slice(0);
			json[time]['terroristFlashbangs'] =  terroristFlashbangs.slice(0);
			json[time]['terroristDecoys'] =  terroristDecoys.slice(0);
			json[time]['terroristMolotovs'] =  terroristMolotovs.slice(0);
			json[time]['ctKills'] =  ctKills.slice(0);
			json[time]['ctDeaths'] =  ctDeaths.slice(0);
			json[time]['ctGrenades'] =  ctGrenades.slice(0);
			json[time]['ctSmokes'] =  ctSmokes.slice(0);
			json[time]['ctFlashbangs'] =  ctFlashbangs.slice(0);
			json[time]['ctDecoys'] =  ctDecoys.slice(0);
			json[time]['ctMolotovs'] =  ctMolotovs.slice(0);
		}

		demoFile.on('start', () => {
      json['map'] = demoFile.header.mapName;
    });

		demoFile.gameEvents.on('round_announce_match_start', () => {
			teamT = demoFile.teams[demofile.TEAM_TERRORISTS];
			teamCT = demoFile.teams[demofile.TEAM_CTS];
			json['0'] = {};
			json['0']['terroristKills'] = [];
			json['0']['terroristDeaths'] = [];
			json['0']['terroristGrenades'] = [];
			json['0']['terroristSmokes'] = [];
			json['0']['terroristFlashbangs'] = [];
			json['0']['terroristDecoys'] = [];
			json['0']['terroristMolotovs'] = [];
			json['0']['ctKills'] = [];
			json['0']['ctDeaths'] = [];
			json['0']['ctGrenades'] = [];
			json['0']['ctSmokes'] = [];
			json['0']['ctFlashbangs'] = [];
			json['0']['ctDecoys'] = [];
			json['0']['ctMolotovs'] = [];
		});

		demoFile.gameEvents.on('player_death', e => {
			if (teamT == undefined || teamCT == undefined) return;
			let attacker = demoFile.entities.getByUserId(e.attacker);
			let victim = demoFile.entities.getByUserId(e.userid);
			if (victim && attacker) {
				if (teamT.members.indexOf(attacker) != -1) {
					terroristKills.push(attacker.position);
					ctDeaths.push(victim.position);
				} else {
					ctKills.push(attacker.position);
					terroristDeaths.push(victim.position);
				}
				logLocations();
				//console.log('%s at (%s, %s, %s) killed %s at (%s, %s, %s)', attacker.name, victim.name, victim.position.x, victim.position.y, victim.position.z);
			}
    });

		demoFile.gameEvents.on('hegrenade_detonate', e => {
			if (teamT == undefined || teamCT == undefined) return;
			let thrower = demoFile.entities.getByUserId(e.userid);
			let grenade = demoFile.entities.entities[e.entityid];
			if (thrower && grenade) {
				if (teamT.members.indexOf(thrower) != -1) {
					terroristGrenades.push(grenade.position);
				} else {
					ctGrenades.push(grenade.position);
				}
				logLocations();
				//console.log('%s threw a grenade at position (%s, %s, %s)', thrower.name,  grenade.position.x.toFixed(2), grenade.position.y.toFixed(2), grenade.position.z.toFixed(2));
			}
    });

		demoFile.gameEvents.on('smokegrenade_detonate', e => {
			if (teamT == undefined || teamCT == undefined) return;
			let thrower = demoFile.entities.getByUserId(e.userid);
			let grenade = demoFile.entities.entities[e.entityid];
			if (thrower && grenade) {
				if (teamT.members.indexOf(thrower) != -1) {
					terroristSmokes.push(grenade.position);
				} else {
					ctSmokes.push(grenade.position);
				}
				logLocations();
				//console.log('%s threw a smoke at position (%s, %s, %s)', thrower.name,  grenade.position.x.toFixed(2), grenade.position.y.toFixed(2), grenade.position.z.toFixed(2));
			}
    });

		demoFile.gameEvents.on('flashbang_detonate', e => {
			if (teamT == undefined || teamCT == undefined) return;
			let thrower = demoFile.entities.getByUserId(e.userid);
			let grenade = demoFile.entities.entities[e.entityid];
			if (thrower && grenade) {
				if (teamT.members.indexOf(thrower) != -1) {
					terroristFlashbangs.push(grenade.position);
				} else {
					ctFlashbangs.push(grenade.position);
				}
				logLocations();
				//console.log('%s threw a flashbang at position (%s, %s, %s)', thrower.name,  grenade.position.x.toFixed(2), grenade.position.y.toFixed(2), grenade.position.z.toFixed(2));
			}
    });

		demoFile.gameEvents.on('decoy_detonate', e => {
			if (teamT == undefined || teamCT == undefined) return;
			let thrower = demoFile.entities.getByUserId(e.userid);
			let grenade = demoFile.entities.entities[e.entityid];
			if (thrower && grenade) {
				if (teamT.members.indexOf(thrower) != -1) {
					terroristDecoys.push(grenade.position);
				} else {
					ctDecoys.push(grenade.position);
				}
				logLocations();
				//console.log('%s threw a decoy at position (%s, %s, %s)', thrower.name,  grenade.position.x.toFixed(2), grenade.position.y.toFixed(2), grenade.position.z.toFixed(2));
			}
    });

		demoFile.gameEvents.on('inferno_startburn', e => {
			if (teamT == undefined || teamCT == undefined) return;
			let grenade = demoFile.entities.entities[e.entityid];
			let grenadePosition = grenade.position;
			let thrower = grenade.owner;
			if (grenade && thrower && grenade.serverClass.name === 'CInferno') {
				if (teamT.members.indexOf(thrower) != -1) {
					terroristMolotovs.push(grenade.position);
				} else {
					ctMolotovs.push(grenade.position);
				}
				logLocations();
				//console.log('%s threw a molotov at position (%s, %s, %s)', thrower.name,  grenade.position.x.toFixed(2), grenade.position.y.toFixed(2), grenade.position.z.toFixed(2));
			}
    });

		demoFile.on('end', () => {
			/*
			let allPositions = terroristKills.concat(terroristDeaths, terroristGrenades, terroristSmokes, terroristFlashbangs, terroristDecoys, terroristMolotovs, ctKills, ctDeaths, ctGrenades, ctSmokes, ctFlashbangs, ctDecoys, ctMolotovs);
			let minX = null;
			let maxX = null;
			let minY = null;
			let maxY = null;
			let minZ = null;
			let maxZ = null;
			for (let position of allPositions) {
				if (minX == null || position.x < minX) {
					minX = position.x;
				}
				if (maxX == null || position.x > maxX) {
					maxX = position.x;
				}
				if (minY == null || position.y < minY) {
					minY = position.y;
				}
				if (maxY == null || position.y > maxY) {
					maxY = position.y;
				}
				if (minZ == null || position.z < minZ) {
					minZ = position.z;
				}
				if (maxZ == null || position.z > maxZ) {
					maxZ = position.z;
				}
			}
			console.log('minX: %s', minX);
			console.log('maxX: %s', maxX);
			console.log('minY: %s', minY);
			console.log('maxY: %s', maxY);
			console.log('minZ: %s', minZ);
			console.log('maxZ: %s', maxZ);
			*/
			let fileName = demoPath.substring(0, demoPath.length-4) + '-map.json';
			let dir = fileName.split('-', 3).join('-');
			fs.writeFile('json/' + dir + '/' + fileName, JSON.stringify(json, null, 2), (err) => {
				if (err) throw err;
				console.log(fileName + ' has been saved.');
			});
    });

		demoFile.parse(buffer);
	});
}

/*
 * @info
 * This method parses all data for the map visualization
 * The visualization consists of the following info:
 *	1. Pathing information on the players
 *
 * @update
 * 1.	tick_start || tick_end TODO
 *
 * @returns
 *	[
 *		tick: {
 *			team: {
 *				players: [
 *					{
 *						name,
 *						x,
 *						y,
 *						z
 *					},
 *				]
 *			},
 *		},
 *	]
 */
function parsePathingMap() {
	fs.readFile(demoPath, function (err, buffer) {
		assert.ifError(err);

		let demoFile = new demofile.DemoFile();

		demoFile.gameEvents.on('buymenu_close', e => {
			console.log('buymenu_close');
    });

		demoFile.gameEvents.on('buytime_ended', e => {
			console.log('buytime_ended');
    });

		demoFile.gameEvents.on('exit_buyzone', e => {
			console.log('exit_buyzone');
    });

		demoFile.gameEvents.on('inspect_weapon', e => {
			console.log('inspect_weapon');
    });

		demoFile.gameEvents.on('item_purchase', e => {
			console.log('item_purchase');
    });

		demoFile.gameEvents.on('round_poststart', e => {
			console.log('round_poststart');
    });

		demoFile.parse(buffer);
	});
}

function parseAll() {
	if (process.argv[2] === undefined) {
		console.log('Please provide a path to your replay file.');
	} else {
		demoPath = process.argv[2];
		parseRounds();
		parseScoreboard();
		parseMoney();
		parseDamage();
		parseEconomy();
		parseMap();
		//parsePathingMap();
	}
}

parseAll();
