"use strict"

const Configstore = require("configstore")
const term = require("terminal-kit").terminal
const nameGenerator = require("./generateName")
const parser = require("./parser")
const commandHistory = require("./commandHistory")
const tables = require("./tables")
const statusBar = require("./statusBar")

/* eslint-disable no-process-env */
const configstoreName = process.env.NODE_ENV === "test" ? "18sh-test" : "18sh"
const conf = new Configstore(configstoreName)

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

const createOrLoadGame = () => {
	let currentGameName = conf.get("currentGameName")
	let feedback = ""
	if (!currentGameName) {
		currentGameName = nameGenerator.generateName()
		setName(currentGameName)
		feedback = `Your game name is ^y'${getName()}'^\n`
		conf.set("currentGameName", currentGameName)
	} else if (currentGameName) {
		feedback = `Continuing game ^y'${currentGameName}'^\n`
		setName(currentGameName)
		updateGameState(conf.get(getName()))
	}
	return feedback
}

const initialize = () => {
	term.fullscreen()
	term.nextLine()
	term(createOrLoadGame())
	statusBar(gameState)
}

const getSharesOwned = () => gameState.sharesOwned

const setSharesOwned = sharesOwned => {
	gameState.sharesOwned = sharesOwned
}

const changeSharesOwned = (actor, company, quantity) => {
	let feedback = ""
	const sharesOwned = getSharesOwned()
	if (!sharesOwned[actor]) sharesOwned[actor] = []
	if (!sharesOwned[actor][company]) sharesOwned[actor][company] = 0

	const quantityInt = parseInt(quantity)
	if (quantityInt < 0 && Math.abs(quantityInt) > sharesOwned[actor][company]) {
		feedback = `${actor} only has ${
			sharesOwned[actor][company]
		}, selling all.\n`
		sharesOwned[actor][company] = 0
	} else if (!isNaN(quantityInt)) {
		sharesOwned[actor][company] += quantityInt
		if (quantityInt > 0)
			feedback = `${actor} buys ${company} and now has ${
				sharesOwned[actor][company]
			}.\n`
		if (quantityInt < 0)
			feedback = `${actor} sells ${company} and now has ${
				sharesOwned[actor][company]
			}.\n`
	}

	setSharesOwned(sharesOwned)
	return feedback
}

const buy = (buyer, object, count = 1) => {
	const feedback = changeSharesOwned(buyer, object, count)
	if (!updateMode) {
		term(feedback)
	}
}

const sell = (seller, object, count = 1) => {
	count *= -1
	const feedback = changeSharesOwned(seller, object, count)
	if (!updateMode) {
		term(feedback)
	}
}

const holdings = () => {
	term(tables.holdingsTable(gameState) + "\n")
}

const values = () => {
	term(tables.valuesTable(gameState) + "\n")
}

const dividend = (payingCompany, value) => {
	if (value.substring(0, 2) === "PR") {
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
	perform,
	createOrLoadGame,
	getSharesOwned,
	changeSharesOwned
}
