/* eslint-disable max-lines */

"use strict"

const expect = require("chai").expect
const gameState = require("../modules/gameState")

const Configstore = require("configstore")
const conf = new Configstore("18sh-test")

describe("GameState", () => {
	describe("setName and getName", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()
		})

		it("should return the set name", () => {
			const name = "test-name"
			gameState._setName(name)
			expect(gameState.getName()).to.deep.equal(name)
		})
	})

	describe("createOrLoadGame", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()
		})

		it("should create a new game", () => {
			const response = gameState.createOrLoadGame()
			expect(response.feedback).to.have.string("Your game name is")
			expect(response.mode).to.equal("create")
		})
		it("should continue an existing game", () => {
			const response = gameState.createOrLoadGame()
			expect(response.feedback).to.have.string("Continuing game")
			expect(response.mode).to.equal("load")
		})
	})

	describe("buyShares, sellShares", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()
		})

		const actor = "MIKKO"
		const company = "LSWR"
		const quantity = 3

		it("should increase the share count", () => {
			let sharesOwned = gameState._getSharesOwned()
			let feedback = gameState.buyShares(actor, company, quantity)
			sharesOwned = gameState._getSharesOwned()
			expect(sharesOwned[actor][company]).to.equal(quantity)
			expect(feedback).to.have.string(
				`${actor} buys ${quantity} ${company} and now has ${quantity}.`
			)
		})

		it("should decrease the share count and increase money", () => {
			gameState.changeCash(actor, 1000)
			const sellQuantity = 2
			const newTotal = quantity - sellQuantity
			let feedback = gameState.sellShares(actor, company, sellQuantity, 100)
			let sharesOwned = gameState._getSharesOwned()
			expect(sharesOwned[actor][company]).to.equal(newTotal)
			expect(feedback).to.have.string(
				`${actor} sells ${Math.abs(
					sellQuantity
				)} ${company} and now has ${newTotal}.`
			)
			expect(gameState._getCash(actor)).to.equal(1200)
		})

		it("should handle overselling", () => {
			const startCash = gameState._getCash(actor)
			const sellQuantity = 2 // Actor only has 1 share to sell.
			const newTotal = quantity - sellQuantity
			let feedback = gameState.sellShares(actor, company, sellQuantity, 100)
			let sharesOwned = gameState._getSharesOwned()
			expect(sharesOwned[actor][company]).to.equal(0)
			expect(feedback).to.have.string(
				`${actor} only has ${newTotal}, selling all.`
			)
			expect(gameState._getCash(actor)).to.equal(startCash + 100)
		})

		it("should handle buying too many shares from a source", () => {
			const startCash = gameState._getCash(actor)
			gameState.buyShares("COMPANY", "COMPANY", 10, 0)
			expect(gameState._getSharesOwned().COMPANY.COMPANY).to.equal(10)
			gameState.buyShares(actor, "COMPANY", 11, 10, "COMPANY")
			expect(gameState._getSharesOwned()[actor].COMPANY).to.equal(10)
			expect(gameState._getSharesOwned().COMPANY.COMPANY).to.equal(0)
			expect(gameState._getCash(actor)).to.equal(startCash - 100)
		})
	})

	describe("dividend", () => {
		const mikkoShares = 4
		const nooaShares = 2

		before(() => {
			conf.clear()
			gameState.resetGameState()
			gameState.buyShares("MIKKO", "CR", mikkoShares)
			gameState.buyShares("NOOA", "CR", nooaShares)
			gameState.buyShares("ANNI", "NBR", nooaShares)
			gameState.buyShares("CR", "CR", nooaShares)
		})

		let mikkoCash = 0
		let nooaCash = 0

		const dividend = 10

		it("should pay correct dividends", () => {
			gameState.payDividends("CR", dividend)
			gameState.addToHistory("CR dividend 10")

			mikkoCash += dividend * mikkoShares
			nooaCash += dividend * nooaShares

			expect(gameState._getCash("MIKKO")).to.equal(mikkoCash)
			expect(gameState._getCash("NOOA")).to.equal(nooaCash)
		})

		it("should handle non-number values correctly (ie. 0)", () => {
			gameState.payDividends("CR", "NOT_A_NUMBER")

			expect(gameState._getCash("MIKKO")).to.equal(mikkoCash)
			expect(gameState._getCash("NOOA")).to.equal(nooaCash)
		})

		const halfDividendTotal = 230

		it("should handle half dividends with default rounding", () => {
			const halfDividendPerShare = 12
			const halfDividendForCompany = 110

			gameState.payHalfDividends("CR", halfDividendTotal)
			gameState.addToHistory("CR halfdividend 230")

			mikkoCash += halfDividendPerShare * mikkoShares
			nooaCash += halfDividendPerShare * nooaShares

			expect(gameState._getCash("CR", halfDividendForCompany))
			expect(gameState._getCash("MIKKO")).to.equal(mikkoCash)
			expect(gameState._getCash("NOOA")).to.equal(nooaCash)
		})

		it("should handle half dividends with UP rounding", () => {
			const halfDividendPerShare = 11
			const halfDividendForCompany = 120

			gameState.setParameter("rounding", "UP")
			gameState.payHalfDividends("CR", halfDividendTotal)
			gameState.addToHistory("CR halfdividend 230")

			mikkoCash += halfDividendPerShare * mikkoShares
			nooaCash += halfDividendPerShare * nooaShares

			expect(gameState._getCash("CR", halfDividendForCompany))
			expect(gameState._getCash("MIKKO")).to.equal(mikkoCash)
			expect(gameState._getCash("NOOA")).to.equal(nooaCash)
		})

		it("should handle half dividends with 1837 rounding", () => {
			// Example from 1837 rules.
			conf.clear()
			gameState.resetGameState()
			gameState.buyShares("MIKKO", "TISZA", 3)

			gameState.setParameter("rounding", "1837")
			gameState.payHalfDividends("TISZA", 50)

			expect(gameState._getCash("TISZA", 25))
			expect(gameState._getCash("MIKKO")).to.equal(7)
		})
	})

	describe("setValue and getValue", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()
		})

		it("should set the value correctly", () => {
			const company = "LNWR"
			const value = 134
			let feedback = gameState.setValue(company, value)
			expect(feedback).to.have.string(`${company} value set to ^y${value}`)
			expect(gameState._getValue(company)).to.equal(value)
			expect(gameState._getValue()[company]).to.equal(value)
		})

		it("should handle non-numeric values correctly", () => {
			const company = "LNWR"
			const value = "word"
			let feedback = gameState.setValue(company, value)
			expect(feedback).to.have.string("Value is not a number")
		})

		it("should return 0 for non-existing company", () => {
			const company = "NON_EXISTING_COMPANY"
			expect(gameState._getValue(company)).to.equal(0)
		})
	})

	describe("newGame, listGames, open and deleteGame", () => {
		const gameName1 = "whoops-incident"
		const gameName2 = "rusty-trains"

		before(() => {
			conf.clear()
			gameState.resetGameState()
		})

		it("should create a new game", () => {
			let feedback = gameState.newGame(gameName1)
			expect(feedback).to.have.string(
				`Game ^y'${gameName1}'^ generated and active.`
			)
			expect(gameState.getName()).to.equal(gameName1)

			/* Add to history to save the game. */
			gameState.addToHistory("MIKKO buys CR")
		})

		it("should not create a duplicate game", () => {
			let feedback = gameState.newGame(gameName1)
			expect(feedback).to.have.string(
				`^rGame ^y'${gameName1}'^ already exists!`
			)
		})

		it("should list all games", () => {
			gameState.newGame(gameName2)
			gameState.addToHistory("NOOA buys GER")

			let feedback = gameState.listGames()
			expect(feedback).to.have.string(gameName1)
			expect(feedback).to.have.string(gameName2)
		})

		it("should open the correct game", () => {
			let feedback = gameState.open(gameName1)
			expect(feedback).to.have.string(`Opened game ^y'${gameName1}'^`)
			expect(gameState.getName()).to.equal(gameName1)
		})

		it("should not open a non-existing game", () => {
			const notAGameName = "attractive-milkshake"
			let feedback = gameState.open(notAGameName)
			expect(feedback).to.have.string(
				`Game ^y'${notAGameName}'^ doesn't exist.`
			)
		})

		it("should be able to delete a non-active game", () => {
			gameState.open(gameName1)
			let feedback = gameState.deleteGame(gameName2)
			expect(feedback).to.have.string(`Deleted ^y'${gameName2}'^`)
		})

		it("should be able to delete the active game", () => {
			gameState.open(gameName1)
			let feedback = gameState.deleteGame(gameName1)
			expect(feedback).to.have.string(`Deleted ^y'${gameName1}'^`)
			expect(feedback).to.have.string(
				`Deleted the active game, no game active at the moment.`
			)
			expect(gameState.getName()).to.be.null
		})

		it("should not delete a non-existing game", () => {
			const notAGameName = "attractive-milkshake"
			let feedback = gameState.deleteGame(notAGameName)
			expect(feedback).to.have.string(
				`^rGame ^y'${notAGameName}'^r doesn't exist.`
			)
		})
	})

	describe("getHoldingsTable", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()

			gameState.buyShares("MIKKO", "CR", 4)
			gameState.addToHistory("MIKKO buys CR 4")
			gameState.buyShares("NOOA", "CR", 2)
			gameState.addToHistory("NOOA buys CR 2")
			gameState.buyShares("MIKKO", "NBR", 2)
			gameState.addToHistory("MIKKO buys NBR 2")
			gameState.buyShares("ANNI", "NBR", 1)
			gameState.addToHistory("ANNI buys NBR")

			gameState.payDividends("CR", 10)
			gameState.addToHistory("CR dividend 10")
		})

		it("should create a correct holdings table", () => {
			const table = gameState.getHoldingsTable()
			expect(table[0]).to.deep.equal(["Owner", "Cash", "CR", "NBR"])
			expect(table[1]).to.deep.equal(["MIKKO", 40, 4, 2])
			expect(table[2]).to.deep.equal(["NOOA", 20, 2, 0])
			expect(table[3]).to.deep.equal(["ANNI", 0, 0, 1])
		})
	})

	describe("getValuesTable", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()

			gameState.buyShares("MIKKO", "CR", 4)
			gameState.addToHistory("MIKKO buys CR 4")
			gameState.buyShares("NOOA", "CR", 2)
			gameState.addToHistory("NOOA buys CR 2")
			gameState.buyShares("MIKKO", "NBR", 2)
			gameState.addToHistory("MIKKO buys NBR 2")
			gameState.buyShares("ANNI", "NBR", 1)
			gameState.addToHistory("ANNI buys NBR")

			gameState.payDividends("CR", 10)
			gameState.addToHistory("CR dividend 10")

			gameState.setValue("CR", 100)
			gameState.addToHistory("CR value 100")
		})

		it("should create a correct values table", () => {
			const table = gameState.getValuesTable()
			expect(table[0]).to.deep.equal(["Player", "Cash", "CR", "NBR", "Total"])
			expect(table[1]).to.deep.equal(["MIKKO", 40, 400, 0, 440])
			expect(table[2]).to.deep.equal(["NOOA", 20, 200, 0, 220])
			expect(table[3]).to.deep.equal(["ANNI", 0, 0, 0, 0])
		})
	})

	describe("float and close", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()
		})

		it("should float a company correctly", () => {
			const startingCash = 710
			gameState.float("NBR", startingCash)
			expect(gameState._getCash("NBR")).to.equal(startingCash)

			gameState.float("CR", startingCash)
			expect(gameState._getCash("CR")).to.equal(startingCash)
		})

		it("should close a company correctly", () => {
			gameState.float("TEST", 1000)
			expect(gameState._getCash("TEST")).to.equal(1000)
			gameState.buyShares("MIKKO", "TEST", 10)
			expect(gameState._getSharesOwned().MIKKO.TEST).to.equal(10)
			gameState.close("TEST")
			expect(gameState._getCash("TEST")).to.equal(null)
			expect(gameState._getSharesOwned().MIKKO.TEST).to.be.undefined
		})

		it("should close a company with shares correctly", () => {
			gameState.float("GT", 0)
			gameState.buyShares("GT", "GT", 10, 0)
			gameState.buyShares("PIOTR", "GT", 5, 80, "GT")
			gameState.buyShares("LIOR", "GT", 5, 80, "GT")
			gameState.close("GT")
			expect(gameState._getSharesOwned().PIOTR.GT).to.be.undefined
			expect(gameState._getSharesOwned().GT).to.be.undefined
			expect(gameState._getCash("GT")).to.equal(null)
		})
	})

	describe("remove", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()
			gameState.float("TEST", 1000)
		})

		it("should remove a player correctly", () => {
			gameState.setBankSize(2000)
			expect(gameState._getBankRemains()).to.equal(1000)

			gameState.changeCash("MIKKO", 100)
			expect(gameState._getCash("MIKKO")).to.equal(100)
			gameState.buyShares("MIKKO", "TEST", 1, 100)
			expect(gameState._getCash("MIKKO")).to.equal(0)
			expect(gameState._getSharesOwned().MIKKO.TEST).to.equal(1)
			gameState.remove("MIKKO")
			expect(gameState._getCash("MIKKO")).to.equal(null)
			expect(gameState._getSharesOwned().MIKKO).to.be.undefined
			expect(gameState._getBankRemains()).to.equal(1000)
		})

		it("should not remove a company", () => {
			expect(gameState._getCash("TEST")).to.equal(1000)
			gameState.remove("TEST")
			expect(gameState._getCash("TEST")).to.equal(1000)
			expect(gameState._getBankRemains()).to.equal(1000)
		})
	})

	describe("getCompanyTable", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()

			gameState.buyShares("MIKKO", "CR", 4)
			gameState.addToHistory("MIKKO buys CR 4")
			gameState.buyShares("NOOA", "CR", 2)
			gameState.addToHistory("NOOA buys CR 2")
			gameState.buyShares("MIKKO", "NBR", 2)
			gameState.addToHistory("MIKKO buys NBR 2")
			gameState.buyShares("ANNI", "NBR", 1)
			gameState.addToHistory("ANNI buys NBR")

			const startingCash = 710
			gameState.float("NBR", startingCash)
			gameState.float("CR", startingCash)

			gameState.setValue("NBR", 134)
			gameState.addToHistory("NBR value 134")

			gameState.setValue("CR", 100)
			gameState.addToHistory("CR value 100")
		})

		it("should create a correct company values table", () => {
			const table = gameState.getCompanyTable()
			expect(table[0]).to.deep.equal([
				"Company",
				"Cash",
				"Value",
				"MIKKO",
				"NOOA",
				"ANNI",
			])
			expect(table[1]).to.deep.equal(["NBR", 710, 134, 2, 0, 1])
			expect(table[2]).to.deep.equal(["CR", 710, 100, 4, 2, 0])
		})

		it("should work with an unfloated comapny", () => {
			gameState.buyShares("MIKKO", "M&C", 4)
			gameState.addToHistory("MIKKO buys M&C 4")

			const table = gameState.getCompanyTable()
			expect(table[3]).to.deep.equal(["M&C", 0, 0, 4, 0, 0])
		})
	})

	describe("statusBarContent and calculatePlayerValue", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()
		})

		it("should return correct content for status bar", () => {
			const statusBar = gameState.statusBarContent()

			const players = gameState._getPlayers()
			players.forEach((player) => {
				const value = gameState._calculatePlayerValue(player)
				const cash = gameState._getCash(player)
				expect(cash).not.to.be.null
				expect(value).not.to.be.null
				expect(statusBar.players).to.include(`${player} $${cash} ($${value})`)
			})
		})
	})

	describe("give and take cash", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()
		})

		it("should handle cash addition correctly", () => {
			const cashBefore = gameState._getCash("MIKKO")
			let cashChange = 10
			gameState.changeCash("MIKKO", cashChange)
			expect(gameState._getCash("MIKKO")).to.equal(cashBefore + cashChange)
		})

		it("should handle cash substraction correctly", () => {
			const cashBefore = gameState._getCash("MIKKO")
			let cashChange = -10
			gameState.changeCash("MIKKO", cashChange)
			expect(gameState._getCash("MIKKO")).to.equal(cashBefore + cashChange)
		})

		it("should handle company cash addition correctly", () => {
			const cashBefore = gameState._getCash("NBR")
			let cashChange = 10
			gameState.changeCash("NBR", cashChange)
			expect(gameState._getCash("NBR")).to.equal(cashBefore + cashChange)
		})

		it("should handle company cash substraction correctly", () => {
			const cashBefore = gameState._getCash("NBR")
			let cashChange = -10
			gameState.changeCash("NBR", cashChange)
			expect(gameState._getCash("NBR")).to.equal(cashBefore + cashChange)
		})

		it("should handle moving cash", () => {
			const sourceCashBefore = gameState._getCash("MIKKO")
			const targetCashBefore = gameState._getCash("NBR")
			const cashChange = 100

			gameState.moveCash("MIKKO", "NBR", cashChange)

			expect(gameState._getCash("MIKKO")).to.equal(
				sourceCashBefore - cashChange
			)
			expect(gameState._getCash("NBR")).to.equal(targetCashBefore + cashChange)
		})
	})

	describe("getBankRemains and setBankSize", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()
		})

		const bankSize = 4000

		it("should set the bank size correctly", () => {
			gameState.setBankSize(bankSize)
			expect(gameState._getBankRemains()).to.equal(bankSize)

			const statusBar = gameState.statusBarContent()
			expect(statusBar.players).to.include(`BANK $${bankSize}`)
		})

		it("should adjust the bank size based on player cash", () => {
			const takeFromBank = 1000
			gameState.changeCash("MIKKO", takeFromBank)
			expect(gameState._getBankRemains()).to.equal(bankSize - takeFromBank)

			const statusBar = gameState.statusBarContent()
			expect(statusBar.players).to.include(`BANK $${bankSize - takeFromBank}`)
		})

		it("floating should adjust the bank size", () => {
			const bankBefore = gameState._getBankRemains()
			const floatMoney = 670
			gameState.float("LSWR", floatMoney)

			expect(gameState._getBankRemains()).to.equal(bankBefore - floatMoney)
		})

		it("should set the currency correctly", () => {
			gameState.setBankSize(bankSize)
			expect(gameState._getCurrency()).to.equal("$")

			gameState.setBankSize(bankSize, "£")
			expect(gameState._getCurrency()).to.equal("£")
		})

		it("should work correctly with company credits", () => {
			conf.clear()
			gameState.resetGameState()
			gameState.setBankSize(1000)

			expect(gameState._getBankRemains()).to.equal(1000)
			gameState.float("SECR", 500)
			expect(gameState._getBankRemains()).to.equal(500)
			gameState.setParameter("companycredits", true)
			expect(gameState._getBankRemains()).to.equal(1000)
		})
	})

	describe("next", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()
		})

		it("should advance the round correctly", () => {
			let feedback = gameState.nextRound("SR")
			expect(gameState._getRound()).to.equal("SR 1")
			expect(feedback).to.equal("It's now ^ySR 1^:.\n")
			feedback = gameState.nextRound("OR")
			expect(gameState._getRound()).to.equal("OR 1.1")
			expect(feedback).to.equal("It's now ^yOR 1.1^:.\n")
			feedback = gameState.nextRound("OR")
			expect(gameState._getRound()).to.equal("OR 1.2")
			expect(feedback).to.equal("It's now ^yOR 1.2^:.\n")
			feedback = gameState.nextRound("SR")
			expect(gameState._getRound()).to.equal("SR 2")
			expect(feedback).to.equal("It's now ^ySR 2^:.\n")
		})
	})

	describe("income", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()
		})

		it("should set the income correctly", () => {
			gameState.setIncome("MIKKO", 25)
			expect(gameState._getIncome("MIKKO")).to.equal(25)

			const feedback = gameState.setIncome("MIKKO", "NaN")
			expect(feedback).to.equal(
				`^rCan't set income: "NaN" is not a number.^:\n`
			)

			gameState.setIncome("MIKKO", 0)
			expect(gameState._getIncome("MIKKO")).to.equal(0)
		})

		it("should pay out the income correctly", () => {
			gameState.changeCash("MIKKO", 10)
			const cashBefore = gameState._getCash("MIKKO")
			gameState.setIncome("MIKKO", 25)
			expect(gameState._getIncome("MIKKO")).to.equal(25)
			const feedback = gameState.nextRound("OR")
			expect(feedback).to.include("MIKKO earns ^y$25^: income")
			const cashAfter = gameState._getCash("MIKKO")
			expect(cashAfter).to.equal(cashBefore + 25)
		})
	})

	describe("setParameter, getParameter", () => {
		before(() => {
			conf.clear()
			gameState.resetGameState()
		})

		it("should set and get parameters correctly", () => {
			gameState.setParameter("rounding", "UP")
			expect(gameState._getParameter("rounding")).to.equal("UP")

			gameState.setParameter("companycredits", true)
			expect(gameState._getParameter("companycredits")).to.be.true
		})
	})
})
