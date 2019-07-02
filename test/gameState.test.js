/* eslint-disable max-lines */

"use strict"

const expect = require("chai").expect
const gameState = require("../modules/gameState")

const Configstore = require("configstore")
const conf = new Configstore("18sh-test")

describe("GameState", () => {
	describe("setName and getName", () => {
		it("should return the set name", () => {
			const name = "test-name"
			gameState._setName(name)
			expect(gameState.getName()).to.deep.equal(name)
		})
	})

	describe("createOrLoadGame", () => {
		conf.clear()
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

	describe("changeSharesOwned", () => {
		const actor = "MIKKO"
		const company = "LSWR"
		const quantity = 3

		it("should increase the share count", () => {
			let feedback = gameState.changeSharesOwned(actor, company, quantity)
			let sharesOwned = gameState.getSharesOwned()
			expect(sharesOwned[actor][company]).to.equal(quantity)
			expect(feedback).to.have.string(
				`${actor} buys ${company} and now has ${quantity}.`
			)
		})

		it("should decrease the share count", () => {
			const sellQuantity = -2
			const newTotal = quantity + sellQuantity
			let feedback = gameState.changeSharesOwned(actor, company, sellQuantity)
			let sharesOwned = gameState.getSharesOwned()
			expect(sharesOwned[actor][company]).to.equal(newTotal)
			expect(feedback).to.have.string(
				`${actor} sells ${company} and now has ${newTotal}.`
			)
		})

		it("should handle overselling", () => {
			const sellQuantity = -2
			const newTotal = quantity + sellQuantity
			let feedback = gameState.changeSharesOwned(actor, company, sellQuantity)
			let sharesOwned = gameState.getSharesOwned()
			expect(sharesOwned[actor][company]).to.equal(0)
			expect(feedback).to.have.string(
				`${actor} only has ${newTotal}, selling all.`
			)
		})
	})

	describe("dividend", () => {
		let mikkoCash = 0
		let nooaCash = 0

		const mikkoShares = 4
		const nooaShares = 2

		const dividend = 10

		gameState.changeSharesOwned("MIKKO", "CR", mikkoShares)
		gameState.changeSharesOwned("NOOA", "CR", nooaShares)
		gameState.changeSharesOwned("ANNI", "NBR", nooaShares)
		gameState.changeSharesOwned("CR", "CR", nooaShares)

		it("should pay correct dividends", () => {
			gameState.payDividends("CR", dividend)
			gameState.addToHistory("CR dividend 10")

			mikkoCash += dividend * mikkoShares
			nooaCash += dividend * nooaShares

			expect(gameState._getCash("MIKKO")).to.equal(mikkoCash)
			expect(gameState._getCash("NOOA")).to.equal(nooaCash)
		})

		it("should repay previous dividends correctly", () => {
			gameState.addToHistory("CR value 100")
			gameState.addToHistory("NBR value 100")
			gameState.addToHistory("NBR dividend 15")

			gameState.payDividends("CR", "PREV")
			gameState.addToHistory("CR dividend PREV")

			mikkoCash += dividend * mikkoShares
			nooaCash += dividend * nooaShares

			expect(gameState._getCash("MIKKO")).to.equal(mikkoCash)
			expect(gameState._getCash("NOOA")).to.equal(nooaCash)

			const feedback = gameState.payDividends("CR", "PREV")

			mikkoCash += dividend * mikkoShares
			nooaCash += dividend * nooaShares

			expect(gameState._getCash("MIKKO")).to.equal(mikkoCash)
			expect(gameState._getCash("NOOA")).to.equal(nooaCash)
			expect(feedback).to.not.include("undefined")
		})

		it("should handle non-number values correctly (ie. 0)", () => {
			gameState.payDividends("CR", "NOT_A_NUMBER")

			expect(gameState._getCash("MIKKO")).to.equal(mikkoCash)
			expect(gameState._getCash("NOOA")).to.equal(nooaCash)
		})

		const halfDividendTotal = 230
		const halfDividendPerShare = 12
		const halfDividendForCompany = 110

		it("should handle half dividends", () => {
			gameState.payHalfDividends("CR", halfDividendTotal)
			gameState.addToHistory("CR halfdividend 230")

			mikkoCash += halfDividendPerShare * mikkoShares
			nooaCash += halfDividendPerShare * nooaShares

			expect(gameState._getCash("CR", halfDividendForCompany))
			expect(gameState._getCash("MIKKO")).to.equal(mikkoCash)
			expect(gameState._getCash("NOOA")).to.equal(nooaCash)
		})

		it("should repay previous half dividends correctly", () => {
			gameState.payHalfDividends("CR", "PREV")
			gameState.addToHistory("CR halfdividend PREV")

			mikkoCash += halfDividendPerShare * mikkoShares
			nooaCash += halfDividendPerShare * nooaShares

			expect(gameState._getCash("CR", halfDividendForCompany))
			expect(gameState._getCash("MIKKO")).to.equal(mikkoCash)
			expect(gameState._getCash("NOOA")).to.equal(nooaCash)
		})
	})

	describe("setValue and getValue", () => {
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
		it("should create a correct holdings table", () => {
			conf.clear()
			gameState.resetGameState()

			gameState.changeSharesOwned("MIKKO", "CR", 4)
			gameState.addToHistory("MIKKO buys CR 4")
			gameState.changeSharesOwned("NOOA", "CR", 2)
			gameState.addToHistory("NOOA buys CR 2")
			gameState.changeSharesOwned("MIKKO", "NBR", 2)
			gameState.addToHistory("MIKKO buys NBR 2")
			gameState.changeSharesOwned("ANNI", "NBR", 1)
			gameState.addToHistory("ANNI buys NBR")

			gameState.payDividends("CR", 10)
			gameState.addToHistory("CR dividend 10")

			const table = gameState.getHoldingsTable()
			expect(table[0]).to.deep.equal(["Owner", "Cash", "CR", "NBR"])
			expect(table[1]).to.deep.equal(["MIKKO", 40, 4, 2])
			expect(table[2]).to.deep.equal(["NOOA", 20, 2, 0])
			expect(table[3]).to.deep.equal(["ANNI", 0, 0, 1])
		})
	})

	describe("getValuesTable", () => {
		it("should create a correct values table", () => {
			conf.clear()
			gameState.resetGameState()

			gameState.changeSharesOwned("MIKKO", "CR", 4)
			gameState.addToHistory("MIKKO buys CR 4")
			gameState.changeSharesOwned("NOOA", "CR", 2)
			gameState.addToHistory("NOOA buys CR 2")
			gameState.changeSharesOwned("MIKKO", "NBR", 2)
			gameState.addToHistory("MIKKO buys NBR 2")
			gameState.changeSharesOwned("ANNI", "NBR", 1)
			gameState.addToHistory("ANNI buys NBR")

			gameState.payDividends("CR", 10)
			gameState.addToHistory("CR dividend 10")

			gameState.setValue("CR", 100)
			gameState.addToHistory("CR value 100")

			const table = gameState.getValuesTable()
			expect(table[0]).to.deep.equal(["Player", "Cash", "CR", "NBR", "Total"])
			expect(table[1]).to.deep.equal(["MIKKO", 40, 400, 0, 440])
			expect(table[2]).to.deep.equal(["NOOA", 20, 200, 0, 220])
			expect(table[3]).to.deep.equal(["ANNI", 0, 0, 0, 0])
		})
	})

	describe("float", () => {
		it("should float a company correctly", () => {
			const startingCash = 710
			gameState.float("NBR", startingCash)
			expect(gameState._getCash("NBR")).to.equal(startingCash)

			gameState.float("CR", startingCash)
			expect(gameState._getCash("CR")).to.equal(startingCash)
		})
	})

	describe("getCompanyTable", () => {
		it("should create a correct company values table", () => {
			gameState.setValue("NBR", 134)
			gameState.addToHistory("NBR value 134")

			const table = gameState.getCompanyTable()
			expect(table[0]).to.deep.equal([
				"Company",
				"Cash",
				"Value",
				"MIKKO",
				"NOOA",
				"ANNI"
			])
			expect(table[1]).to.deep.equal(["NBR", 710, 134, 2, 0, 1])
			expect(table[2]).to.deep.equal(["CR", 710, 100, 4, 2, 0])
		})

		it("should work with an unfloated comapny", () => {
			gameState.changeSharesOwned("MIKKO", "M&C", 4)
			gameState.addToHistory("MIKKO buys M&C 4")

			const table = gameState.getCompanyTable()
			expect(table[3]).to.deep.equal(["M&C", 0, 0, 4, 0, 0])
		})
	})

	describe("statusBarContent and calculatePlayerValue", () => {
		it("should return correct content for status bar", () => {
			const statusBar = gameState.statusBarContent()

			const players = gameState._getPlayers()
			players.forEach(player => {
				const value = gameState._calculatePlayerValue(player)
				const cash = gameState._getCash(player)
				expect(statusBar.players).to.include(`${player} $${cash} ($${value})`)
			})
		})
	})

	describe("give and take cash", () => {
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
		const bankSize = 4000
		it("should set the bank size correctly", () => {
			gameState.resetGameState()
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
	})
})
