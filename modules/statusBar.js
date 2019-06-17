"use strict"

const term = require("terminal-kit").terminal

const showStatus = gameState => {
	term.saveCursor()
	term.eraseLineAfter()
	term.moveTo(1, 1)
	term.bgYellow()
	term.black()
	term(new Array(term.width + 1).join(" "))
	term.moveTo(1, 1)
	term("18SH")

	let values = ""
	Object.keys(gameState.sharesOwned).forEach(owner => {
		if (!gameState.cash[owner]) gameState.cash[owner] = 0
		let money = gameState.cash[owner]
		Object.keys(gameState.sharesOwned[owner]).forEach(company => {
			let companyValue =
				gameState.sharesOwned[owner][company] * gameState.values[company]
			if (companyValue > 0) {
				money += parseInt(companyValue)
			}
		})
		values += `\t${owner} $${money}`
	})
	term(values)

	term.restoreCursor()
}

module.exports = showStatus
