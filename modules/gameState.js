"use strict"

const configstore = require("./configstore")
const tables = require("./tables")
const stockHoldings = require("./stockHoldings")

const gameState = {
	gameName: "",
	cash: [],
	companyCash: [],
	values: [],
	bankSize: null,
	undid: "",
	currency: "$",
	parameters: [],
	income: []
}

/* Reset game state. */

const resetGameState = () => {
	stockHoldings.resetHoldings()
	gameState.cash = []
	gameState.companyCash = []
	gameState.values = []
	gameState.bankSize = null
	gameState.round = null
	gameState.parameters = []
	gameState.income = []
	_setCurrency("$")
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

/* Currency. */

const _getCurrency = () => gameState.currency

const _setCurrency = newCurrency => {
	gameState.currency = newCurrency
}

/* Buy and sell shares. */

const buyShares = (actor, company, quantity, price, source) => {
	let feedback = stockHoldings.changeSharesOwned(actor, company, quantity)
	const sum = price * quantity
	if (source) {
		feedback +=
			"\n" + stockHoldings.changeSharesOwned(source, company, quantity * -1)
		if (price > 0) {
			feedback += "\n" + moveCash(actor, source, sum)
		}
	} else if (price > 0) {
		feedback += "\n" + changeCash(actor, sum * -1)
	}
	return feedback
}

const sellShares = (actor, company, quantity, price) => {
	let feedback = stockHoldings.changeSharesOwned(actor, company, quantity * -1)
	const sum = price * quantity
	if (price > 0) {
		feedback += "\n" + changeCash(actor, sum)
	}
	return feedback
}

const _getSharesOwned = () => stockHoldings.getSharesOwned()

/* Sets and gets player or company cash. */

const _getCash = (target = null) => {
	if (target) {
		if (gameState.companyCash[target] || gameState.companyCash[target] === 0)
			return gameState.companyCash[target]
		if (gameState.cash[target] || gameState.cash[target] === 0)
			return gameState.cash[target]
		return null
	}
	return gameState.cash
}

const _getCompanyCash = () => gameState.companyCash

const _getAllCash = () => {
	const cash = {
		..._getCash(),
		..._getCompanyCash()
	}
	return cash
}

const changeCash = (target, sum) => {
	let feedback = ""
	if (typeof gameState.companyCash[target] === "undefined") {
		if (isNaN(gameState.cash[target])) gameState.cash[target] = 0
		gameState.cash[target] += parseInt(sum)
		feedback = `${target} now has ^y${_getCurrency()}${
			gameState.cash[target]
		}^\n`
	} else {
		gameState.companyCash[target] += parseInt(sum)
		feedback = `${target} now has ^y${_getCurrency()}${
			gameState.companyCash[target]
		}^\n`
	}
	return feedback
}

const moveCash = (source, target, amount) => {
	changeCash(source, amount * -1)
	changeCash(target, amount)
	return `${source} pays ^y${_getCurrency()}${amount}^: to ${target}.\n`
}

/* Gets all players in the game. */

const _getPlayers = () => {
	let players = []
	const sharesOwned = stockHoldings.getSharesOwned()
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
	if (isNaN(value)) value = 0

	let feedback = ""
	const sharesOwned = stockHoldings.getCompanyOwners(payingCompany)
	Object.keys(sharesOwned).forEach(player => {
		const moneyEarned = Math.floor(sharesOwned[player] * value)
		if (moneyEarned > 0) {
			changeCash(player, moneyEarned)
			feedback += `${payingCompany} pays ${player} ^y${_getCurrency()}${moneyEarned}^ for ${
				sharesOwned[player]
			} shares.\n`
		}
	})
	return feedback
}

const payHalfDividends = (payingCompany, totalSum) => {
	let feedback = ""
	if (isNaN(totalSum)) totalSum = 0

	const rounding = _getParameter("rounding")
	let companyRetains = 0
	let perShare = 0
	switch (rounding) {
		case "UP": {
			const halfFloored = Math.ceil(totalSum / 20)
			companyRetains = halfFloored * 10
			perShare = (totalSum - companyRetains) / 10
			break
		}
		case "1837": {
			companyRetains = totalSum / 2
			perShare = (totalSum - companyRetains) / 10
			break
		}
		default: {
			const halfFloored = Math.floor(totalSum / 20)
			companyRetains = halfFloored * 10
			perShare = (totalSum - companyRetains) / 10
		}
	}

	changeCash(payingCompany, companyRetains)

	feedback = `${payingCompany} retains ^y${_getCurrency()}${companyRetains}^:.\n`
	feedback += payDividends(payingCompany, perShare)

	return feedback
}

/* Advance round count. */

const nextRound = roundType => {
	let feedback = `It's now ^y${_getRound()}^:.\n`
	if (!gameState.round)
		gameState.round = {
			type: "SR",
			srNumber: 0,
			orNumber: 0
		}
	if (roundType === "SR") {
		gameState.round.type = "SR"
		gameState.round.srNumber += 1
		gameState.round.orNumber = 0
	}
	if (roundType === "OR") {
		gameState.round.type = "OR"
		gameState.round.orNumber += 1
		feedback += _payIncome()
	}
	return feedback
}

const _getRound = () => {
	if (!gameState.round) return ""
	if (gameState.round.type === "SR") {
		return `${gameState.round.type} ${gameState.round.srNumber}`
	}
	return `${gameState.round.type} ${gameState.round.srNumber}.${gameState.round.orNumber}`
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
	const sharesOwned = stockHoldings.getSharesOwned(player)
	let playerValue = _getCash(player)
	if (sharesOwned) {
		playerValue = Object.keys(sharesOwned).reduce((value, company) => {
			const companyValue = sharesOwned[company] * _getValue(company)
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
		round: "",
		players: "",
		companies: ""
	}
	if (_getRound()) {
		barContent.round = _getRound()
	}
	if (gameState.bankSize) {
		const bank = _getBankRemains()
		barContent.players += `\tBANK ${_getCurrency()}${bank}`
	} else {
		const totalCash = Object.keys(_getAllCash()).reduce((total, player) => {
			total += _getCash(player)
			return total
		}, 0)
		barContent.players += `\tTOTAL ${_getCurrency()}${totalCash}`
	}
	_getPlayers().forEach(player => {
		const value = _calculatePlayerValue(player)
		const cash = _getCash(player)
		barContent.players += `\t${player} ${_getCurrency()}${cash}`
		if (value !== cash) barContent.players += ` (${_getCurrency()}${value})`
	})
	_getAllCompanies().forEach(company => {
		const value = _getValue(company)
		const cash = _getCash(company)
		barContent.companies += `\t${company} ${_getCurrency()}${cash}`
		if (value !== 0) barContent.companies += ` (${_getCurrency()}${value})`
	})
	return barContent
}

const displayContent = () => {
	let displayContent = {
		round: _getRound(),
		cash: {},
		currency: _getCurrency()
	}
	if (gameState.bankSize) {
		displayContent.cash.bank = _getBankRemains()
	} else {
		const totalCash = Object.keys(_getAllCash()).reduce((total, player) => {
			total += _getCash(player)
			return total
		}, 0)
		displayContent.cash.total = totalCash
	}
	_getPlayers().forEach(player => {
		const cash = _getCash(player)
		displayContent.cash[player] = cash
	})
	_getAllCompanies().forEach(company => {
		const cash = _getCash(company)
		displayContent.cash[company] = cash
	})
	return displayContent
}

/* Floats and closes a company. */

const float = (company, cash) => {
	gameState.companyCash[company] = cash
	return `Floated ^y${company}^ with ^y${_getCurrency()}${cash}^:.\n`
}

const close = company => {
	Reflect.deleteProperty(gameState.companyCash, company)
	Reflect.deleteProperty(gameState.cash, company)
	stockHoldings.closeCompany(company)
	return `Closed ^y${company}^:.\n`
}

/* Gets all companies in play. */

const _getAllCompanies = () => {
	const allCompanies = stockHoldings.getCompanies()

	Object.keys(gameState.companyCash).forEach(company => {
		allCompanies.push(company)
	})

	return Array.from(new Set(allCompanies))
}

/* Generate data for holdings and values tables. */

const getHoldingsTable = () => {
	const companies = _getAllCompanies()
	const sharesOwned = stockHoldings.getSharesOwned()
	const cash = _getAllCash()

	return tables.holdingsTable(companies, sharesOwned, cash)
}

const getValuesTable = () => {
	const players = _getPlayers()
	const companies = _getAllCompanies()
	const sharesOwned = stockHoldings.getSharesOwned()
	const values = _getValue()
	const cash = _getCash()

	return tables.valuesTable(players, companies, sharesOwned, values, cash)
}

const getCompanyTable = () => {
	const companies = _getAllCompanies()
	const sharesOwned = stockHoldings.getSharesOwned()
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

const setBankSize = (size, currency = "$") => {
	gameState.bankSize = parseInt(size)
	_setCurrency(currency)
	return `Bank size set to ^y${_getCurrency()}${size}^\n`
}

const _getBankRemains = () => {
	const cashReserves = _getParameter("companycredits")
		? {
				..._getCash()
		  }
		: {
				..._getCash(),
				..._getCompanyCash()
		  }
	const cashInPlay = Object.keys(cashReserves).reduce((total, player) => {
		total += cashReserves[player]
		return total
	}, 0)
	return gameState.bankSize - cashInPlay
}

const getBankRemains = () => {
	const bankRemains = _getBankRemains()
	return `Bank has ^y${_getCurrency()}${bankRemains}^:.\n`
}

/* Income management. */

const setIncome = (target, amount) => {
	if (isNaN(parseInt(amount)))
		return `^rCan't set income: "${amount}" is not a number.^:\n`
	gameState.income[target] = amount
	return `Income for ^y${target}^: is ^y${_getCurrency()}${amount}^:.\n`
}

const _getIncome = target => gameState.income[target]

const _payIncome = () => {
	const allParties = _getPlayers().concat(_getAllCompanies())

	let feedback = ""
	allParties.forEach(target => {
		const income = _getIncome(target)
		if (income > 0) {
			changeCash(target, income)
			feedback += `${target} earns ^y${_getCurrency()}${income}^: income.\n`
		}
	})

	return feedback
}

/* Parameter adjustment. */

const setParameter = (parameter, value = null) => {
	if (value) gameState.parameters[parameter] = value
}

const _getParameter = parameter => gameState.parameters[parameter]

module.exports = {
	getName,
	getCommandHistory,
	setCommandHistory,
	addToHistory,
	buyShares,
	sellShares,
	payDividends,
	payHalfDividends,
	deleteGame,
	newGame,
	listGames,
	createOrLoadGame,
	open,
	statusBarContent,
	displayContent,
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
	close,
	nextRound,
	setParameter,
	setIncome,
	_getBankRemains,
	_getCash,
	_getCompanyCash,
	_getAllCash,
	_setName,
	_getValue,
	_getPlayers,
	_calculatePlayerValue,
	_getRound,
	_getSharesOwned,
	_getAllCompanies,
	_getCurrency,
	_getParameter,
	_getIncome
}
