"use strict"

var sharesOwned = {}

const getSharesOwned = (player = null) => {
	if (player) return sharesOwned[player]
	return sharesOwned
}

const setSharesOwned = newSharesOwned => {
	sharesOwned = newSharesOwned
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
			feedback = `${actor} buys ${quantityInt} ${company} and now has ${sharesOwned[actor][company]}.\n`
		if (quantityInt < 0) {
			const quantityAbs = Math.abs(quantityInt)
			feedback = `${actor} sells ${quantityAbs} ${company} and now has ${sharesOwned[actor][company]}.\n`
		}
	}

	setSharesOwned(sharesOwned)
	return feedback
}

const getCompanyOwners = company => {
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

const closeCompany = company => {
	const sharesOwned = getSharesOwned()
	Object.keys(sharesOwned).forEach(owner => {
		Reflect.deleteProperty(sharesOwned[owner], company)
	})
	setSharesOwned(sharesOwned)
}

const getCompanies = () => {
	const companyList = []
	const sharesOwned = getSharesOwned()
	Object.keys(sharesOwned).forEach(owner => {
		Object.keys(sharesOwned[owner]).forEach(company => {
			companyList.push(company)
		})
	})
	return companyList
}

const resetHoldings = () => {
	setSharesOwned({})
}

module.exports = {
	getSharesOwned,
	getCompanyOwners,
	changeSharesOwned,
	closeCompany,
	getCompanies,
	resetHoldings
}
