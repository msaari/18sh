"use strict"

const Configstore = require("configstore")
const term = require("terminal-kit").terminal
const nameGenerator = require("./generateName")
const commandHistory = require("./commandHistory")
const statusBar = require("./statusBar")
const perform = require("./perform")
const tables = require("./tables")

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

const setName = name => {
	gameState.gameName = name
}

const getName = () => gameState.gameName

const getCommandHistory = () => {
	const history = commandHistory.getCommandHistory(gameState)
	return history
}

const addToHistory = command => {
	commandHistory.addCommandToHistory(command, gameState)
}

const getCash = (player = null) => {
	if (player) {
		return gameState.cash[player]
	}
	return gameState.cash
}

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

const changeCash = (player, sum) => {
	if (isNaN(gameState.cash[player])) gameState.cash[player] = 0
	gameState.cash[player] += parseInt(sum)
	return gameState.cash[player]
}

const getCompanyOwners = company => {
	const sharesOwned = getSharesOwned()
	const owners = Object.keys(sharesOwned).reduce((accumulator, player) => {
		const shares = Object.keys(sharesOwned[player]).reduce(
			(companyShares, share) => {
				if (share === company) companyShares += sharesOwned[player][share]
				return companyShares
			},
			0
		)
		accumulator[player] = shares
		return accumulator
	}, [])
	return owners
}

const payDividends = (payingCompany, value) => {
	if (typeof value === "string" && value.substring(0, 2) === "PR") {
		value = commandHistory.getPreviousDividend(payingCompany, gameState)
	}
	if (isNaN(value)) {
		value = 0
	}

	let feedback = ""
	const sharesOwned = getCompanyOwners(payingCompany)
	Object.keys(sharesOwned).forEach(player => {
		const moneyEarned = sharesOwned[player] * value
		changeCash(player, moneyEarned)
		feedback += `${payingCompany} pays ${player} ^y$${moneyEarned}^ for ${
			gameState.sharesOwned[player][payingCompany]
		} shares.\n`
	})
	return feedback
}

const resetGameState = () => {
	gameState.sharesOwned = []
	gameState.cash = []
	gameState.values = []
}

const updateGameState = commandHistoryArray => {
	resetGameState()
	const silent = true
	if (commandHistoryArray) {
		commandHistoryArray.map(command => perform(command, module.exports, silent))
	}
}

const setValue = (company, value) => {
	if (isNaN(value)) {
		return `^rValue is not a number!^\n`
	}
	gameState.values[company] = value
	return `${company} value set to ^y${value}^\n`
}

const getValue = (company = null) => {
	if (company) {
		if (!gameState.values[company]) gameState.values[company] = 0
		return gameState.values[company]
	}
	return gameState.values
}

const open = name => {
	let feedback = ""
	if (conf.has(name)) {
		gameState.gameName = name
		updateGameState(conf.get(name))
		feedback = `Opened game ^y'${name}'^\n`
		conf.set("currentGameName", name)
	} else {
		feedback = `Game ^y'${name}'^ doesn't exist.\n`
	}
	return feedback
}

const listGames = () => {
	let feedback = ""
	Object.keys(conf.all).forEach(key => {
		if (key === "currentGameName") return
		feedback += `${key}\n`
	})
	return feedback
}

const deleteGame = name => {
	let feedback = ""
	if (conf.has(name)) {
		conf.delete(name)
		feedback = `Deleted ^y'${name}'^\n`
		if (conf.get("currentGameName") === name) {
			conf.delete("currentGameName")
			gameState.gameName = null
			feedback += `Deleted the active game, no game active at the moment.\n`
		}
	} else {
		feedback = `^rGame ^y'${name}'^r doesn't exist.\n`
	}
	return feedback
}

const newGame = gameName => {
	let feedback = ""
	if (conf.has(gameName)) {
		feedback = `^rGame ^y'${gameName}'^ already exists!\n`
	} else {
		resetGameState()
		gameState.gameName = gameName
		conf.set("currentGameName", gameName)
		feedback = `Game ^y'${gameName}'^ generated and active.\n`
	}
	return feedback
}

const updateStatusBar = () => {
	statusBar(gameState)
}

const getAllCompanies = () => {
	const allCompanies = []

	Object.keys(gameState.sharesOwned).forEach(owner => {
		Object.keys(gameState.sharesOwned[owner]).forEach(company => {
			allCompanies.push(company)
		})
	})

	return Array.from(new Set(allCompanies))
}

const getHoldingsTable = () => {
	const companies = getAllCompanies()
	const sharesOwned = getSharesOwned()
	const cash = getCash()

	return tables.holdingsTable(companies, sharesOwned, cash)
}

const getValuesTable = () => {
	const companies = getAllCompanies()
	const sharesOwned = getSharesOwned()
	const values = getValue()
	const cash = getCash()

	return tables.valuesTable(companies, sharesOwned, values, cash)
}

module.exports = {
	setName,
	getName,
	getCommandHistory,
	undo,
	initialize,
	setValue,
	getValue,
	createOrLoadGame,
	getSharesOwned,
	changeSharesOwned,
	payDividends,
	getCash,
	addToHistory,
	deleteGame,
	newGame,
	listGames,
	updateStatusBar,
	open,
	getHoldingsTable,
	getValuesTable,
	resetGameState
}
