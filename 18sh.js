"use strict"

const Configstore = require("configstore")
const generateName = require("./modules/generateName.js")
const term = require("terminal-kit").terminal

const conf = new Configstore("18sh")
const gameState = {
	gameName: "",
	sharesOwned: [],
	cash: [],
	values: [],
	undid: ""
}

const buy = (buyer, object, count = 1, silent = false) => {
	object = object.toUpperCase()
	buyer = buyer.toUpperCase()

	if (!gameState.sharesOwned[buyer]) gameState.sharesOwned[buyer] = []
	if (!gameState.sharesOwned[buyer][object])
		gameState.sharesOwned[buyer][object] = 0

	gameState.sharesOwned[buyer][object] += parseInt(count)

	if (!silent) {
		term(
			`${buyer} buys ${object} and now has ${
				gameState.sharesOwned[buyer][object]
			}.\n`
		)
	}
}

const sell = (seller, object, count = 1, silent = false) => {
	object = object.toUpperCase()
	seller = seller.toUpperCase()

	if (!gameState.sharesOwned[seller]) gameState.sharesOwned[seller] = []
	if (!gameState.sharesOwned[seller][object])
		gameState.sharesOwned[seller][object] = 0

	if (gameState.sharesOwned[seller][object] < count) {
		if (!silent) {
			term(
				`${seller} only has ${
					gameState.sharesOwned[seller][object]
				}, selling all.\n`
			)
		}
		count = gameState.sharesOwned[seller][object]
	}

	gameState.sharesOwned[seller][object] -= parseInt(count)

	if (!silent) {
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

const dividend = (payingCompany, value, silent = false) => {
	payingCompany = payingCompany.toUpperCase()
	Object.keys(gameState.sharesOwned).forEach(owner => {
		Object.keys(gameState.sharesOwned[owner]).forEach(ownedCompany => {
			if (payingCompany !== ownedCompany) return
			const moneyEarned = gameState.sharesOwned[owner][payingCompany] * value
			if (isNaN(gameState.cash[owner])) gameState.cash[owner] = 0
			gameState.cash[owner] += parseInt(moneyEarned)
			if (!silent) {
				term(
					`${payingCompany} pays ${owner} $${moneyEarned} for ${
						gameState.sharesOwned[owner][payingCompany]
					} shares.\n`
				)
			}
		})
	})
}

const value = (company, value, silent = false) => {
	company = company.toUpperCase()
	gameState.values[company] = value
	if (!silent) {
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
	const silent = true
	if (commandHistory) {
		commandHistory.map(command => perform(command, silent))
	}
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

const deleteGame = async name => {
	if (conf.has(name)) {
		term(`Are you sure you want to delete game ^y'${name}'^ [y|N] ?`)
		await term.yesOrNo(
			{
				yes: ["y"],
				no: ["n", "ENTER"]
			},
			(error, result) => {
				if (result) {
					conf.delete(name)
					term(`Deleted ^y'${name}'^\n`)
				}
			}
		)
	} else {
		term(`Game ^y'${name}' ^doesn't exist.\n`)
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

/**
 * Performs the given command.
 *
 * @param {string} command The command string.
 * @param {boolean} silent If true, don't output anything.
 * @returns {boolean} True, if command succeeded and should be logged.
 */
const perform = (command, silent = false) => {
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
				buy(subject, object, count, silent)
				addToHistory = true
				break
			case "s":
			case "se":
			case "sell":
			case "sells":
				sell(subject, object, count, silent)
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
				dividend(subject, object, silent)
				addToHistory = true
				break
			case "v":
			case "va":
			case "val":
			case "valu":
			case "value":
				value(subject, object, silent)
				addToHistory = true
				break
			default:
				term("^rUnrecognized command!^\n")
				addToHistory = false
		}
	}
	return addToHistory
}

const commandPrompt = () => {
	var commandHistory = conf.get(currentGameName)

	term("> ")

	term.inputField(
		{
			history: commandHistory
		},
		(error, input) => {
			term("\n")
			if (error) {
				term("An error occurred.\n")
				throw new Error("Something bad happened!")
			}
			switch (input) {
				case "undo":
					commandHistory = conf.get(gameState.gameName)
					gameState.undid = commandHistory.pop()
					updateGameState(commandHistory)
					conf.set(gameState.gameName, commandHistory)
					term(`Undid ^y"${gameState.undid}"^\n`)
					commandPrompt()
					break
				case "q":
				case "qu":
				case "qui":
				case "quit":
				case "e":
				case "ex":
				case "exi":
				case "exit":
					term("Exit!\n")
					process.exit()
					break
				default:
					commandHistory = conf.get(gameState.gameName)
					if (!commandHistory) commandHistory = new Array()
					if (perform(input)) {
						commandHistory.push(input)
						conf.set(gameState.gameName, commandHistory)
					}
					commandPrompt()
			}
		}
	)
}

let currentGameName = conf.get("currentGameName")
if (!currentGameName) {
	currentGameName = generateName()
	gameState.gameName = currentGameName
	term(`Your game name is ^y'${gameState.gameName}'^\n`)
	conf.set("currentGameName", currentGameName)
} else if (currentGameName) {
	term(`Continuing game ^y'${currentGameName}'^\n`)
	gameState.gameName = currentGameName
	updateGameState(conf.get(gameState.gameName))
}
commandPrompt()
