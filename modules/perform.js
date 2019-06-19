"use strict"

const parser = require("./parser")
const term = require("terminal-kit").terminal

var updateMode = false
var gameStateObject = Object()

/**
 * Takes in the raw command string, parses it, then performs the required
 * action by calling the gameState method that changes the game state and
 * then prints out the results to the terminal.
 *
 * @param {string} command The raw command string.
 * @param {object} gameState The gameState object.
 * @param {boolean} silent If true, no output to terminal.
 *
 * @returns {void}
 */
const perform = (command, gameState, silent = false) => {
	if (silent) updateMode = true
	gameStateObject = gameState
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
		gameStateObject.addToHistory(normalizedCommand)
		gameStateObject.updateStatusBar()
	}
}

const buy = (buyer, object, count = 1) => {
	const feedback = gameStateObject.changeSharesOwned(buyer, object, count)
	if (!updateMode) {
		term(feedback)
	}
}

const sell = (seller, object, count = 1) => {
	count *= -1
	const feedback = gameStateObject.changeSharesOwned(seller, object, count)
	if (!updateMode) {
		term(feedback)
	}
}

const holdings = () => {
	term(gameStateObject.getHoldingsTable() + "\n")
}

const values = () => {
	term(gameStateObject.getValuesTable() + "\n")
}

const dividend = (payingCompany, value) => {
	const feedback = gameStateObject.payDividends(payingCompany, value)

	if (!updateMode) {
		term(feedback)
	}
}

const value = (company, value) => {
	const feedback = gameStateObject.setValue(company, value)
	if (!updateMode) {
		term(feedback)
	}
}

const listGames = () => {
	const feedback = gameStateObject.listGames()
	term(feedback)
}

const deleteGame = name => {
	const feedback = gameStateObject.deleteGame(name)
	term(feedback)
}

const newGame = name => {
	const feedback = gameStateObject.newGame(name)
	term(feedback)
}

const open = name => {
	const feedback = gameStateObject.open(name)
	term(feedback)
}

module.exports = perform
