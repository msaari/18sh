"use strict"

const Table = require("cli-table")

const holdingsTable = (companies, sharesOwned, cash) => {
	const table = new Table()
	const headerRow = ["Player", "Cash"].concat(companies)
	table.push(headerRow)

	Object.keys(sharesOwned).forEach(owner => {
		if (!cash[owner]) cash[owner] = 0
		let row = [owner, cash[owner]]
		companies.forEach(company => {
			if (sharesOwned[owner][company] > 0) {
				row.push(sharesOwned[owner][company])
			} else {
				row.push(0)
			}
		})
		table.push(row)
	})
	return table
}

const valuesTable = (companies, sharesOwned, values, cash) => {
	const table = new Table()
	const headerRow = ["Player", "Cash"].concat(companies).concat(["Total"])
	table.push(headerRow)

	Object.keys(sharesOwned).forEach(owner => {
		if (!cash[owner]) cash[owner] = 0
		let row = [owner, cash[owner]]
		let money = cash[owner]
		companies.forEach(company => {
			let companyValue = sharesOwned[owner][company] * values[company]
			if (companyValue > 0) {
				money += parseInt(companyValue)
				row.push(companyValue)
			} else {
				row.push(0)
			}
		})
		row.push(money)
		table.push(row)
	})
	return table
}

const companyTable = (companies, sharesOwned, values, players) => {
	const table = new Table()
	const headerRow = ["Company", "Value"].concat(players)
	table.push(headerRow)

	companies.sort((companyA, companyB) => values[companyB] - values[companyA])
	companies.forEach(company => {
		let row = [company, values[company]]
		players.forEach(player => {
			let companySharesOwned = sharesOwned[player][company]
			if (companySharesOwned) {
				row.push(companySharesOwned)
			} else {
				row.push(0)
			}
		})
		table.push(row)
	})
	return table
}

module.exports = {
	holdingsTable,
	valuesTable,
	companyTable
}
