"use strict"

const Table = require("cli-table")

const getAllCompanies = gameState => {
	const allCompanies = []

	Object.keys(gameState.sharesOwned).forEach(owner => {
		Object.keys(gameState.sharesOwned[owner]).forEach(company => {
			allCompanies.push(company)
		})
	})

	return Array.from(new Set(allCompanies))
}

const holdingsTable = gameState => {
	const table = new Table()
	const companies = getAllCompanies(gameState)

	const headerRow = ["Player", "Cash"].concat(companies)
	table.push(headerRow)

	Object.keys(gameState.sharesOwned).forEach(owner => {
		if (!gameState.cash[owner]) gameState.cash[owner] = 0
		let row = [owner, gameState.cash[owner]]
		companies.forEach(company => {
			if (gameState.sharesOwned[owner][company] > 0) {
				row.push(gameState.sharesOwned[owner][company])
			} else {
				row.push("0")
			}
		})
		table.push(row)
	})
	return table
}

const valuesTable = gameState => {
	const table = new Table()
	const companies = getAllCompanies(gameState)
	const headerRow = ["Player", "Cash"].concat(companies).concat(["Total"])
	table.push(headerRow)

	Object.keys(gameState.sharesOwned).forEach(owner => {
		if (!gameState.cash[owner]) gameState.cash[owner] = 0
		let row = [owner, gameState.cash[owner]]
		let money = gameState.cash[owner]
		companies.forEach(company => {
			let companyValue =
				gameState.sharesOwned[owner][company] * gameState.values[company]
			if (companyValue > 0) {
				money += parseInt(companyValue)
				row.push(companyValue)
			} else {
				row.push("0")
			}
		})
		row.push(money)
		table.push(row)
	})
	return table
}

module.exports = {
	holdingsTable,
	valuesTable
}
