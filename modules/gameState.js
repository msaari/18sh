"use strict"

const Configstore = require("configstore")
const term = require("terminal-kit").terminal
const nameGenerator = require("./generateName")
const parser = require("./parser")
const commandHistory = require("./commandHistory")
const tables = require("./tables")
const statusBar = require("./statusBar")

const conf = new Configstore("18sh")

const gameState = {
	gameName: "",
	sharesOwned: [],
	cash: [],
	values: [],
	undid: ""
}

var updateMode = false

const setName = name => {
	gameState.gameName = name
}

const getName = () => gameState.gameName

const getCommandHistory = () => commandHistory.getCommandHistory(gameState)

const undo = () => {
	var commandHistoryArray = commandHistory.getCommandHistory(gameState)
	var undid = commandHistoryArray.pop()
	updateGameState(commandHistoryArray)
	commandHistory.saveCommandHistory(commandHistoryArray, gameState)
	return undid
}

const initialize = () => {
	term.fullscreen()
	term.nextLine()

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
	statusBar(gameState)
}

const buy = (buyer, object, count = 1) => {
	if (!gameState.sharesOwned[buyer]) gameState.sharesOwned[buyer] = []
	if (!gameState.sharesOwned[buyer][object])
		gameState.sharesOwned[buyer][object] = 0

	gameState.sharesOwned[buyer][object] += parseInt(count)

	if (!updateMode) {
		term(
			`${buyer} buys ${object} and now has ${
				gameState.sharesOwned[buyer][object]
			}.\n`
		)
	}
}

const sell = (seller, object, count = 1) => {
	if (!gameState.sharesOwned[seller]) gameState.sharesOwned[seller] = []
	if (!gameState.sharesOwned[seller][object])
		gameState.sharesOwned[seller][object] = 0

	if (gameState.sharesOwned[seller][object] < count) {
		if (!updateMode) {
			term(
				`${seller} only has ${
					gameState.sharesOwned[seller][object]
				}, selling all.\n`
			)
		}
		count = gameState.sharesOwned[seller][object]
	}

	gameState.sharesOwned[seller][object] -= parseInt(count)

	if (!updateMode) {
		term(
			`${seller} sells ${object} and now has ${
				gameState.sharesOwned[seller][object]
			}.\n`
		)
	}
}

const holdings = () => {
	term(tables.holdingsTable(gameState) + "\n")
}

const values = () => {
	term(tables.valuesTable(gameState) + "\n")
}

const dividend = (payingCompany, value) => {
	if (value.substring(0, 2).toLowerCase() === "pr") {
		value = commandHistory.getPreviousDividend(payingCompany, gameState)
	}
	if (isNaN(value)) {
		value = 0
	}
	Object.keys(gameState.sharesOwned).forEach(owner => {
		Object.keys(gameState.sharesOwned[owner]).forEach(ownedCompany => {
			if (payingCompany !== ownedCompany) return
			const moneyEarned = gameState.sharesOwned[owner][payingCompany] * value
			if (isNaN(gameState.cash[owner])) gameState.cash[owner] = 0
			gameState.cash[owner] += parseInt(moneyEarned)
			if (!updateMode) {
				term(
					`${payingCompany} pays ${owner} ^y$${moneyEarned}^ for ${
						gameState.sharesOwned[owner][payingCompany]
					} shares.\n`
				)
			}
		})
	})
}

const value = (company, value) => {
	gameState.values[company] = value
	if (!updateMode) {
		term(`${company} value set to ^y${value}^\n`)
	}
}

const resetGameState = () => {
	gameState.sharesOwned = []
	gameState.cash = []
	gameState.values = []
}

const updateGameState = commandHistoryArray => {
	resetGameState()
	updateMode = true
	if (commandHistoryArray) {
		commandHistoryArray.map(command => perform(command))
	}
	updateMode = false
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

const perform = command => {
	const action = parser(command)

	var addToHistory = false
	switch (action.verb) {
		case "holdings":
			holdings()
			addToHistory = false
			break
		case "values":
			values()
			addToHistory = false
			break
		case "listGames":
			listGames()
			addToHistory = false
			break
		case "open":
			open(action.object)
			addToHistory = false
			break
		case "delete":
			deleteGame(action.object)
			addToHistory = false
			break
		case "start":
			newGame(action.object)
			addToHistory = false
			break
		case "buy":
			buy(action.subject, action.object, action.quantity)
			addToHistory = true
			break
		case "sell":
			sell(action.subject, action.object, action.quantity)
			addToHistory = true
			break
		case "dividend":
			dividend(action.subject, action.object)
			addToHistory = true
			break
		case "value":
			value(action.subject, action.object)
			addToHistory = true
			break
		default:
			term("^rUnrecognized command!^\n")
			addToHistory = false
	}

	if (updateMode) addToHistory = false

	if (addToHistory) {
		let normalizedCommand = `${action.subject} ${action.verb} ${action.object}`
		if (action.quantity) normalizedCommand += ` ${action.quantity}`
		commandHistory.addCommandToHistory(normalizedCommand, gameState)
		statusBar(gameState)
	}
}

module.exports = {
	setName,
	getName,
	getCommandHistory,
	undo,
	initialize,
	perform
}
