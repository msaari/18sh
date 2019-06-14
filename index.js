const inquirer = require("inquirer")
const Configstore = require("configstore")

const conf = new Configstore("18sh")
const gameState = {
	sharesOwned: [],
	cash: [],
	values: []
}

const buy = (buyer, object, count = 1, silent = false) => {
	object = object.toUpperCase()
	buyer = buyer.toUpperCase()

	if (!gameState.sharesOwned[buyer]) gameState.sharesOwned[buyer] = []
	if (!gameState.sharesOwned[buyer][object])
		gameState.sharesOwned[buyer][object] = 0

	gameState.sharesOwned[buyer][object] += parseInt(count)

	if (!silent) {
		console.log(
			`${buyer} buys ${object} and now has ${
				gameState.sharesOwned[buyer][object]
			}.`
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
			console.log(
				`${seller} only has ${
					gameState.sharesOwned[seller][object]
				}, selling all.`
			)
		}
		count = gameState.sharesOwned[seller][object]
	}

	gameState.sharesOwned[seller][object] -= parseInt(count)

	if (!silent) {
		console.log(
			`${seller} sells ${object} and now has ${
				gameState.sharesOwned[seller][object]
			}.`
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
	console.log(holdings)
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
				console.log(
					`${payingCompany} pays ${owner} $${moneyEarned} for ${
						gameState.sharesOwned[owner][payingCompany]
					} shares.`
				)
			}
		})
	})
}

const value = (company, value, silent = false) => {
	company = company.toUpperCase()
	gameState.values[company] = value
	if (!silent) {
		console.log(`${company} value set to ${value}.`)
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
	console.log(values)
}

const updateGameState = commandHistory => {
	gameState.sharesOwned = []
	gameState.cash = []
	gameState.values = []
	const silent = true
	commandHistory.map(command => perform(command, silent))
}

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
			default:
				console.log("Unrecognized command!")
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
				console.log("Unrecognized command!")
		}
	}
	return addToHistory
}

const commandPrompt = () => {
	const question = [
		{
			type: "input",
			name: "command",
			message: ">"
		}
	]
	inquirer.prompt(question).then(answers => {
		if (answers.command === "undo") {
			var commandHistory = conf.get("commandHistory")
			commandHistory.pop()
			updateGameState(commandHistory)
			conf.set("commandHistory", commandHistory)
			commandPrompt()
		} else if (answers.command !== "quit" && answers.command !== "exit") {
			var commandHistory = conf.get("commandHistory")
			if (!commandHistory) commandHistory = new Array()
			if (perform(answers.command)) {
				commandHistory.push(answers.command)
				conf.set("commandHistory", commandHistory)
			}
			commandPrompt()
		}
	})
}

conf.clear()
commandPrompt()
