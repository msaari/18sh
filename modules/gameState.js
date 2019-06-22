"use strict"

const Configstore = require("configstore")
const nameGenerator = require("./generateName")
const commandHistory = require("./commandHistory")
const tables = require("./tables")

/* eslint-disable no-process-env */
const configstoreName = process.env.NODE_ENV === "test" ? "18sh-test" : "18sh"
const conf = new Configstore(configstoreName)

const gameState = {
	gameName: "",
	sharesOwned: [],
	cash: [],
	values: [],
	bankSize: null,
	undid: ""
}

/* Set and get the game name */

const _setName = name => {
	gameState.gameName = name
}

const getName = () => gameState.gameName

/* Set, get and add to the command history. */

const setCommandHistory = newCommandHistory => {
	commandHistory.saveCommandHistory(newCommandHistory, gameState)
}

const getCommandHistory = () => {
	const history = commandHistory.getCommandHistory(gameState)
	return history
}

const addToHistory = command => {
	commandHistory.addCommandToHistory(command, gameState)
}

/* Sets, gets and changes the share ownership data. */

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

const _getCompanyOwners = company => {
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

/* Sets and gets player cash. */

const _getCash = (player = null) => {
	if (player) {
		return gameState.cash[player] ? gameState.cash[player] : 0
	}
	return gameState.cash
}

const changeCash = (player, sum) => {
	if (isNaN(gameState.cash[player])) gameState.cash[player] = 0
	gameState.cash[player] += parseInt(sum)
	return `${player} now has ^y$${gameState.cash[player]}^\n`
}

/* Gets all players in the game. */

const _getPlayers = () => {
	let players = []
	const sharesOwned = getSharesOwned()
	Object.keys(gameState.cash).forEach(player => {
		if (!players[player]) players.push(player)
	})
	Object.keys(sharesOwned).forEach(owner => {
		if (!players[owner]) players.push(owner)
	})
	return players
}

/* Dividend payments. */

const payDividends = (payingCompany, value) => {
	if (typeof value === "string" && value.substring(0, 2) === "PR") {
		value = commandHistory.getPreviousDividend(payingCompany, gameState)
	}
	if (isNaN(value)) {
		value = 0
	}

	let feedback = ""
	const sharesOwned = _getCompanyOwners(payingCompany)
	Object.keys(sharesOwned).forEach(player => {
		const moneyEarned = sharesOwned[player] * value
		changeCash(player, moneyEarned)
		feedback += `${payingCompany} pays ${player} ^y$${moneyEarned}^ for ${
			gameState.sharesOwned[player][payingCompany]
		} shares.\n`
	})
	return feedback
}

/* Reset game state. */

const resetGameState = () => {
	gameState.sharesOwned = []
	gameState.cash = []
	gameState.values = []
	gameState.bankSize = null
}

/* Set and get company values. */

const setValue = (company, value) => {
	if (isNaN(value)) {
		return `^rValue is not a number!^\n`
	}
	gameState.values[company] = value
	return `${company} value set to ^y${value}^\n`
}

const _getValue = (company = null) => {
	if (company) {
		if (!gameState.values[company]) gameState.values[company] = 0
		return gameState.values[company]
	}
	return gameState.values
}

/* Calculate player value. */

const _calculatePlayerValue = player => {
	const sharesOwned = getSharesOwned()
	let playerValue = _getCash(player)
	if (sharesOwned[player]) {
		playerValue = Object.keys(sharesOwned[player]).reduce((value, company) => {
			const companyValue = sharesOwned[player][company] * _getValue(company)
			return value + companyValue
		}, playerValue)
	}
	return playerValue
}

/* Game management: list, open, delete, create. */

const open = name => {
	let feedback = ""
	if (conf.has(name)) {
		gameState.gameName = name
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

const createOrLoadGame = () => {
	let currentGameName = conf.get("currentGameName")
	let feedback = ""
	let mode = ""
	if (!currentGameName) {
		currentGameName = nameGenerator.generateName()
		_setName(currentGameName)
		conf.set("currentGameName", currentGameName)
		mode = "create"
		feedback = `Your game name is ^y'${getName()}'^\n`
	} else if (currentGameName) {
		feedback = `Continuing game ^y'${currentGameName}'^\n`
		mode = "load"
		_setName(currentGameName)
	}
	return {
		feedback,
		mode
	}
}

/* Generates the status bar contents. */

const statusBarContent = () => {
	let barContent = ""
	if (gameState.bankSize) {
		const bank = _getBankRemains()
		barContent += `\tBANK $${bank}`
	} else {
		const totalCash = Object.keys(_getCash()).reduce((total, player) => {
			total += _getCash(player)
			return total
		}, 0)
		barContent += `\tTOTAL $${totalCash}`
	}
	Object.keys(gameState.sharesOwned).forEach(owner => {
		const value = _calculatePlayerValue(owner)
		const cash = _getCash(owner)
		barContent += `\t${owner} $${cash} ($${value})`
	})
	return barContent
}

/* Gets all companies in play. */

const _getAllCompanies = () => {
	const allCompanies = []

	Object.keys(gameState.sharesOwned).forEach(owner => {
		Object.keys(gameState.sharesOwned[owner]).forEach(company => {
			allCompanies.push(company)
		})
	})

	return Array.from(new Set(allCompanies))
}

/* Generate data for holdings and values tables. */

const getHoldingsTable = () => {
	const companies = _getAllCompanies()
	const sharesOwned = getSharesOwned()
	const cash = _getCash()

	return tables.holdingsTable(companies, sharesOwned, cash)
}

const getValuesTable = () => {
	const companies = _getAllCompanies()
	const sharesOwned = getSharesOwned()
	const values = _getValue()
	const cash = _getCash()

	return tables.valuesTable(companies, sharesOwned, values, cash)
}

/* Bank size management. */

const setBankSize = size => {
	if (!isNaN(parseInt(size))) gameState.bankSize = parseInt(size)
	return `Bank size set to ^y$${size}^\n`
}

const _getBankRemains = () => {
	const cashReserves = _getCash()
	const playerCash = Object.keys(cashReserves).reduce((total, player) => {
		total += cashReserves[player]
		return total
	}, 0)

	return gameState.bankSize - playerCash
}

const getBankRemains = () => {
	const bankRemains = _getBankRemains()
	return `Bank has ^y$${bankRemains}^\n`
}

module.exports = {
	getName,
	getCommandHistory,
	setCommandHistory,
	addToHistory,
	getSharesOwned,
	changeSharesOwned,
	payDividends,
	deleteGame,
	newGame,
	listGames,
	createOrLoadGame,
	open,
	statusBarContent,
	getHoldingsTable,
	getValuesTable,
	resetGameState,
	changeCash,
	setBankSize,
	getBankRemains,
	setValue,
	_getBankRemains,
	_getCash,
	_setName,
	_getValue,
	_getPlayers,
	_calculatePlayerValue
}
