"use strict"

const Configstore = require("configstore")
const term = require("terminal-kit").terminal
const nameGenerator = require("./generateName.js")
const parser = require("./parser.js")

const conf = new Configstore("18sh")

const gameState = {
	gameName: "",
	sharesOwned: [],
	cash: [],
	values: [],
	undid: ""
}

var silentMode = false

const setName = name => {
	gameState.gameName = name
}

const getName = () => gameState.gameName

const getCommandHistory = () => {
	var commandHistory = conf.get(gameState.gameName)
	if (!commandHistory) commandHistory = new Array()
	return commandHistory
}

const saveCommandHistory = commandHistory => {
	conf.set(gameState.gameName, commandHistory)
}

const addCommandToHistory = command => {
	var commandHistory = getCommandHistory()
	commandHistory.push(command)
	saveCommandHistory(commandHistory)
}

const undo = () => {
	var commandHistory = getCommandHistory()
	var undid = commandHistory.pop()
	updateGameState(commandHistory)
	saveCommandHistory(commandHistory)
	return undid
}

const initialize = () => {
	let currentGameName = conf.get("currentGameName")
	if (!currentGameName) {
		currentGameName = nameGenerator.generateName()
		setName(currentGameName)
		term(`Your game name is ^y'${getName()}'^\n`)
		conf.set("currentGameName", currentGameName)
	} else if (currentGameName) {
		term(`Continuing game ^y'${currentGameName}'^\n`)
		setName(currentGameName)
		updateGameState(conf.get(getName()))
	}
}

const buy = (buyer, object, count = 1) => {
	object = object.toUpperCase()
	buyer = buyer.toUpperCase()

	if (!gameState.sharesOwned[buyer]) gameState.sharesOwned[buyer] = []
	if (!gameState.sharesOwned[buyer][object])
		gameState.sharesOwned[buyer][object] = 0

	gameState.sharesOwned[buyer][object] += parseInt(count)

	if (!silentMode) {
		term(
			`${buyer} buys ${object} and now has ${
				gameState.sharesOwned[buyer][object]
			}.\n`
		)
	}
}

const sell = (seller, object, count = 1) => {
	object = object.toUpperCase()
	seller = seller.toUpperCase()

	if (!gameState.sharesOwned[seller]) gameState.sharesOwned[seller] = []
	if (!gameState.sharesOwned[seller][object])
		gameState.sharesOwned[seller][object] = 0

	if (gameState.sharesOwned[seller][object] < count) {
		if (!silentMode) {
			term(
				`${seller} only has ${
					gameState.sharesOwned[seller][object]
				}, selling all.\n`
			)
		}
		count = gameState.sharesOwned[seller][object]
	}

	gameState.sharesOwned[seller][object] -= parseInt(count)

	if (!silentMode) {
		term(
			`${seller} sells ${object} and now has ${
				gameState.sharesOwned[seller][object]
			}.\n`
		)
	}
}

const holdings = () => {
	let holdings = ""
	Object.keys(gameState.sharesOwned).forEach(owner => {
		holdings += `${owner}:`
		if (!gameState.cash[owner]) gameState.cash[owner] = 0
		holdings += `\tCASH: $${gameState.cash[owner]}`
		Object.keys(gameState.sharesOwned[owner]).forEach(company => {
			if (gameState.sharesOwned[owner][company] > 0) {
				holdings += `\t${company}: ${gameState.sharesOwned[owner][company]}`
			}
		})
		holdings += "\n"
	})
	term(holdings)
}

const dividend = (payingCompany, value) => {
	payingCompany = payingCompany.toUpperCase()
	Object.keys(gameState.sharesOwned).forEach(owner => {
		Object.keys(gameState.sharesOwned[owner]).forEach(ownedCompany => {
			if (payingCompany !== ownedCompany) return
			const moneyEarned = gameState.sharesOwned[owner][payingCompany] * value
			if (isNaN(gameState.cash[owner])) gameState.cash[owner] = 0
			gameState.cash[owner] += parseInt(moneyEarned)
			if (!silentMode) {
				term(
					`${payingCompany} pays ${owner} $${moneyEarned} for ${
						gameState.sharesOwned[owner][payingCompany]
					} shares.\n`
				)
			}
		})
	})
}

const value = (company, value) => {
	company = company.toUpperCase()
	gameState.values[company] = value
	if (!silentMode) {
		term(`${company} value set to ${value}.`)
	}
}

const values = () => {
	let values = ""
	Object.keys(gameState.sharesOwned).forEach(owner => {
		values += `${owner}:\n`
		if (!gameState.cash[owner]) gameState.cash[owner] = 0
		let money = gameState.cash[owner]
		values += `\tCASH: $${gameState.cash[owner]}`
		Object.keys(gameState.sharesOwned[owner]).forEach(company => {
			let companyValue =
				gameState.sharesOwned[owner][company] * gameState.values[company]
			if (companyValue > 0) {
				money += parseInt(companyValue)
				values += `\t${company}: ${companyValue}`
			}
		})
		values += `\n\t	TOTAL: $${money}\n\n`
	})
	term(values)
}

const resetGameState = () => {
	gameState.sharesOwned = []
	gameState.cash = []
	gameState.values = []
}

const updateGameState = commandHistory => {
	resetGameState()
	silentMode = true
	if (commandHistory) {
		commandHistory.map(command => parser.parse(command))
	}
	silentMode = false
}

const open = name => {
	if (conf.has(name)) {
		gameState.gameName = name
		updateGameState(conf.get(name))
		term(`Opened game ^y'${name}'^\n`)
		conf.set("currentGameName", name)
	} else {
		term(`Game ^y'${name}'^ doesn't exist.\n`)
	}
}

const listGames = () => {
	Object.keys(conf.all).forEach(key => {
		if (key === "currentGameName") return
		term(`${key}\n`)
	})
}

const deleteGame = name => {
	if (conf.has(name)) {
		conf.delete(name)
		term(`Deleted ^y'${name}'^\n`)
		if (conf.get("currentGameName") === name) {
			conf.delete("currentGameName")
			gameState.gameName = null
			term(`Deleted the active game, no game active at the moment.\n`)
		}
	} else {
		term(`Game ^y'${name}'^ doesn't exist.\n`)
	}
}

const newGame = gameName => {
	if (conf.has(gameName)) {
		term(`^rGame ^y'${gameName}'^ already exists!\n`)
	} else {
		resetGameState()
		gameState.gameName = gameName
		conf.set("currentGameName", gameName)
		term(`Game ^y'${gameName}'^ generated and active.\n`)
	}
}

const parse = command => {
	const parts = command.split(" ")
	var addToHistory = false
	if (parts.length == 1) {
		switch (parts[0]) {
			case "h":
			case "ho":
			case "hol":
			case "hold":
			case "holdi":
			case "holdin":
			case "holding":
			case "holdings":
				holdings()
				addToHistory = false
				break
			case "v":
			case "va":
			case "val":
			case "valu":
			case "value":
			case "values":
				values()
				addToHistory = false
				break
			case "l":
			case "li":
			case "lis":
			case "list":
				listGames()
				addToHistory = false
				break
			default:
				term("^rUnrecognized command!^\n")
				addToHistory = false
		}
	}
	if (parts.length == 2) {
		let verb = parts[0]
		let object = parts[1]
		switch (verb) {
			case "o":
			case "op":
			case "ope":
			case "open":
				open(object)
				addToHistory = false
				break
			case "delete":
				deleteGame(object)
				addToHistory = false
				break
			case "start":
				newGame(object)
				addToHistory = false
				break
			default:
				term("^rUnrecognized command!^\n")
				addToHistory = false
		}
	}
	if (parts.length > 2) {
		let subject = parts[0]
		let verb = parts[1]
		let object = parts[2]
		let count = parts[3] ? parts[3] : 1
		if (isNaN(parseInt(count)) && !isNaN(parseInt(object))) {
			let temp = count
			count = object
			object = temp
		}
		switch (verb) {
			case "b":
			case "bu":
			case "buy":
			case "buys":
				buy(subject, object, count)
				addToHistory = true
				break
			case "s":
			case "se":
			case "sell":
			case "sells":
				sell(subject, object, count)
				addToHistory = true
				break
			case "d":
			case "di":
			case "div":
			case "divi":
			case "divid":
			case "divide":
			case "dividen":
			case "dividend":
			case "p":
			case "pa":
			case "pay":
			case "pays":
				dividend(subject, object)
				addToHistory = true
				break
			case "v":
			case "va":
			case "val":
			case "valu":
			case "value":
				value(subject, object)
				addToHistory = true
				break
			default:
				term("^rUnrecognized command!^\n")
				addToHistory = false
		}
	}

	if (addToHistory) {
		addCommandToHistory(command)
	}
}

module.exports = {
	setName,
	getName,
	getCommandHistory,
	undo,
	initialize,
	parse
}
