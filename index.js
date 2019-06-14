const inquirer = require("inquirer")
const Configstore = require("configstore")

const conf = new Configstore("18sh")
const gameState = {
	sharesOwned: []
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
		Object.keys(gameState.sharesOwned[owner]).forEach(company => {
			if (gameState.sharesOwned[owner][company] > 0) {
				holdings += `\t${company}: ${gameState.sharesOwned[owner][company]}`
			}
		})
		holdings += "\n"
	})
	console.log(holdings)
}

const updateGameState = commandHistory => {
	gameState.sharesOwned = []
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
			default:
				console.log("Unrecognized command!")
		}
	}
	if (parts.length > 2) {
		const count = parts[3] ? parts[3] : 1
		switch (parts[1]) {
			case "b":
			case "bu":
			case "buy":
			case "buys":
				buy(parts[0], parts[2], count, silent)
				addToHistory = true
				break
			case "s":
			case "se":
			case "sell":
			case "sells":
				sell(parts[0], parts[2], count, silent)
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
