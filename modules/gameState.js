"use strict"

const configstore = require("./configstore")
const tables = require("./tables")

const gameState = {
	gameName: "",
	sharesOwned: [],
	cash: [],
	companyCash: [],
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
	configstore.saveCommandHistory(newCommandHistory, gameState)
}

const getCommandHistory = () => {
	const history = configstore.getCommandHistory(gameState)
	return history
}

const addToHistory = command => {
	configstore.addCommandToHistory(command, gameState)
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
		feedback = `${actor} only has ${sharesOwned[actor][company]}, selling all.\n`
		sharesOwned[actor][company] = 0
	} else if (!isNaN(quantityInt)) {
		sharesOwned[actor][company] += quantityInt
		if (quantityInt > 0)
			feedback = `${actor} buys ${company} and now has ${sharesOwned[actor][company]}.\n`
		if (quantityInt < 0)
			feedback = `${actor} sells ${company} and now has ${sharesOwned[actor][company]}.\n`
	}

	setSharesOwned(sharesOwned)
	return feedback
}

const buyShares = (actor, company, quantity, price, source) => {
	let feedback = changeSharesOwned(actor, company, quantity)
	feedback += "\n" + changeSharesOwned(source, company, quantity * -1)
	if (price > 0) {
		feedback += "\n" + moveCash(actor, source, price)
	}
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

/* Sets and gets player or company cash. */

const _getCash = (target = null) => {
	if (target) {
		if (gameState.companyCash[target]) return gameState.companyCash[target]
		if (gameState.cash[target]) return gameState.cash[target]
		return 0
	}
	return gameState.cash
}

const _getAllCash = () => {
	const cash = {
		..._getCash(),
		...gameState.companyCash
	}
	return cash
}

const changeCash = (target, sum) => {
	let feedback = ""
	if (gameState.companyCash[target]) {
		gameState.companyCash[target] += parseInt(sum)
		feedback = `${target} now has ^y$${gameState.companyCash[target]}^\n`
	} else {
		if (isNaN(gameState.cash[target])) gameState.cash[target] = 0
		gameState.cash[target] += parseInt(sum)
		feedback = `${target} now has ^y$${gameState.cash[target]}^\n`
	}
	return feedback
}

const moveCash = (source, target, amount) => {
	changeCash(source, amount * -1)
	changeCash(target, amount)
	return `${source} pays ^y$${amount}^: to ${target}.\n`
}

/* Gets all players in the game. */

const _getPlayers = () => {
	let players = []
	const sharesOwned = getSharesOwned()
	Object.keys(gameState.cash).forEach(player => {
		players.push(player)
	})
	Object.keys(sharesOwned).forEach(owner => {
		players.push(owner)
	})
	let playerSet = new Set(players)
	_getAllCompanies().forEach(company => {
		playerSet.delete(company)
	})
	return Array.from(playerSet)
}

/* Dividend payments. */

const payDividends = (payingCompany, value) => {
	if (typeof value === "string" && value.substring(0, 2) === "PR") {
		value = configstore.getPreviousDividend(payingCompany, gameState)
	}
	if (isNaN(value)) value = 0

	let feedback = ""
	const sharesOwned = _getCompanyOwners(payingCompany)
	Object.keys(sharesOwned).forEach(player => {
		const moneyEarned = sharesOwned[player] * value
		changeCash(player, moneyEarned)
		feedback += `${payingCompany} pays ${player} ^y$${moneyEarned}^ for ${sharesOwned[player]} shares.\n`
	})
	return feedback
}

const payHalfDividends = (payingCompany, totalSum) => {
	let feedback = ""
	if (typeof totalSum === "string" && totalSum.substring(0, 2) === "PR") {
		totalSum = configstore.getPreviousHalfDividend(payingCompany, gameState)
	}
	if (isNaN(totalSum)) totalSum = 0

	const halfFloored = Math.floor(totalSum / 20)
	const companyRetains = halfFloored * 10
	const perShare = (totalSum - companyRetains) / 10

	changeCash(payingCompany, companyRetains)

	feedback = `${payingCompany} retains ^y$${companyRetains}^:.\n`
	feedback += payDividends(payingCompany, perShare)

	return feedback
}

/* Reset game state. */

const resetGameState = () => {
	gameState.sharesOwned = []
	gameState.cash = []
	gameState.companyCash = []
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
	const response = configstore.open(name)
	if (response.success) gameState.gameName = name
	return response.feedback
}

const listGames = () => configstore.listGames()

const deleteGame = name => {
	const response = configstore.deleteGame(name)
	if (response.success) gameState.gameName = null
	return response.feedback
}

const newGame = name => {
	const response = configstore.newGame(name)
	if (response.success) {
		gameState.gameName = name
		resetGameState()
	}
	return response.feedback
}

const createOrLoadGame = () => {
	const response = configstore.createOrLoadGame()
	_setName(response.currentGameName)
	return response
}

/* Generates the status bar contents. */

const statusBarContent = () => {
	let barContent = {
		players: "",
		companies: ""
	}
	if (gameState.bankSize) {
		const bank = _getBankRemains()
		barContent.players += `\tBANK $${bank}`
	} else {
		const totalCash = Object.keys(_getAllCash()).reduce((total, player) => {
			total += _getCash(player)
			return total
		}, 0)
		barContent.players += `\tTOTAL $${totalCash}`
	}
	_getPlayers().forEach(player => {
		const value = _calculatePlayerValue(player)
		const cash = _getCash(player)
		barContent.players += `\t${player} $${cash} ($${value})`
	})
	_getAllCompanies().forEach(company => {
		const value = _getValue(company)
		const cash = _getCash(company)
		barContent.companies += `${company} $${cash} ($${value})\t`
	})
	return barContent
}

/* Floats a company. */

const float = (company, cash) => {
	gameState.companyCash[company] = cash
	return `Floated ^y${company}^ with ^y${cash}^:.\n`
}

/* Gets all companies in play. */

const _getAllCompanies = () => {
	const allCompanies = []

	Object.keys(gameState.sharesOwned).forEach(owner => {
		Object.keys(gameState.sharesOwned[owner]).forEach(company => {
			allCompanies.push(company)
		})
	})

	Object.keys(gameState.companyCash).forEach(company => {
		allCompanies.push(company)
	})

	return Array.from(new Set(allCompanies))
}

/* Generate data for holdings and values tables. */

const getHoldingsTable = () => {
	const companies = _getAllCompanies()
	const sharesOwned = getSharesOwned()
	const cash = _getAllCash()

	return tables.holdingsTable(companies, sharesOwned, cash)
}

const getValuesTable = () => {
	const players = _getPlayers()
	const companies = _getAllCompanies()
	const sharesOwned = getSharesOwned()
	const values = _getValue()
	const cash = _getCash()

	return tables.valuesTable(players, companies, sharesOwned, values, cash)
}

const getCompanyTable = () => {
	const companies = _getAllCompanies()
	const sharesOwned = getSharesOwned()
	const values = _getValue()
	const players = _getPlayers()
	const companyCash = gameState.companyCash

	return tables.companyTable(
		companies,
		sharesOwned,
		values,
		players,
		companyCash
	)
}

/* Bank size management. */

const setBankSize = size => {
	if (!isNaN(parseInt(size))) gameState.bankSize = parseInt(size)
	return `Bank size set to ^y$${size}^\n`
}

const _getBankRemains = () => {
	const cashReserves = {
		..._getCash(),
		...gameState.companyCash
	}
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
	buyShares,
	payDividends,
	payHalfDividends,
	deleteGame,
	newGame,
	listGames,
	createOrLoadGame,
	open,
	statusBarContent,
	getHoldingsTable,
	getValuesTable,
	getCompanyTable,
	resetGameState,
	changeCash,
	moveCash,
	setBankSize,
	getBankRemains,
	setValue,
	float,
	_getBankRemains,
	_getCash,
	_setName,
	_getValue,
	_getPlayers,
	_calculatePlayerValue
}
