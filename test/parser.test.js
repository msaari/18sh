"use strict"

const expect = require("chai").expect
const parser = require("../modules/parser")

describe("Parser", () => {
	describe("parse", () => {
		it("should return correct for holdings", () => {
			expect(parser("holdings")).to.include({
				verb: "holdings"
			})
			expect(parser("h")).to.include({
				verb: "holdings"
			})
		})
		it("should return correct for values", () => {
			expect(parser("values")).to.include({
				verb: "values"
			})
			expect(parser("v")).to.include({
				verb: "values"
			})
		})
		it("should return correct for list", () => {
			expect(parser("list")).to.include({
				verb: "listGames"
			})
			expect(parser("l")).to.include({
				verb: "listGames"
			})
		})
		it("should return correct for open", () => {
			expect(parser("open sesame")).to.include({
				verb: "open",
				object: "SESAME"
			})
			expect(parser("open")).to.include({
				verb: null,
				object: null
			})
			expect(parser("o two-words")).to.include({
				verb: "open",
				object: "TWO-WORDS"
			})
		})
		it("should return correct for delete", () => {
			expect(parser("delete sesame")).to.include({
				verb: "delete",
				object: "SESAME"
			})
			expect(parser("delete")).to.include({
				verb: null,
				object: null
			})
			expect(parser("d sesame")).to.include({
				verb: null,
				object: null
			})
		})
		it("should return correct for start", () => {
			expect(parser("start sesame")).to.include({
				verb: "start",
				object: "SESAME"
			})
			expect(parser("start")).to.include({
				verb: null,
				object: null
			})
			expect(parser("s sesame")).to.include({
				verb: null,
				object: null
			})
		})
		it("should return correct for buy", () => {
			expect(parser("mikko buys ger")).to.include({
				verb: "buy",
				object: "GER",
				subject: "MIKKO",
				quantity: 1,
				price: 0,
				source: null
			})
			expect(parser("mikko b 2 ger")).to.include({
				verb: "buy",
				object: "GER",
				subject: "MIKKO",
				quantity: 2,
				price: 0,
				source: null
			})
			expect(parser("mikko buys ger @100")).to.include({
				verb: "buy",
				object: "GER",
				subject: "MIKKO",
				quantity: 1,
				price: 100,
				source: null
			})
			expect(parser("mikko buys 2 ger 100 from nooa")).to.include({
				verb: "buy",
				object: "GER",
				subject: "MIKKO",
				quantity: 2,
				price: 100,
				source: "NOOA"
			})
			expect(parser("mikko b 2 ger 100 nooa")).to.include({
				verb: "buy",
				object: "GER",
				subject: "MIKKO",
				quantity: 2,
				price: 100,
				source: "NOOA"
			})
		})
		it("should return correct for sell", () => {
			expect(parser("mikko sells ger")).to.include({
				verb: "sell",
				object: "GER",
				subject: "MIKKO",
				quantity: 1
			})
			expect(parser("mikko s 2 ger")).to.include({
				verb: "sell",
				object: "GER",
				subject: "MIKKO",
				quantity: 2
			})
		})
		it("should return correct for give", () => {
			expect(parser("mikko give 100 to nooa")).to.include({
				verb: "give",
				object: "NOOA",
				subject: "MIKKO",
				quantity: 100
			})
			expect(parser("mikko g 100 nooa")).to.include({
				verb: "give",
				object: "NOOA",
				subject: "MIKKO",
				quantity: 100
			})
		})
		it("should return correct for cash", () => {
			expect(parser("mikko cash 10")).to.include({
				verb: "cash",
				object: null,
				subject: "MIKKO",
				quantity: 10
			})
			expect(parser("mikko c -10")).to.include({
				verb: "cash",
				object: null,
				subject: "MIKKO",
				quantity: -10
			})
		})
		it("should return correct for float", () => {
			expect(parser("cr float 710")).to.include({
				verb: "float",
				object: null,
				subject: "CR",
				quantity: 710
			})
			expect(parser("cr f 710")).to.include({
				verb: "float",
				object: null,
				subject: "CR",
				quantity: 710
			})
		})
		it("should return correct for close", () => {
			expect(parser("close cr")).to.include({
				verb: "close",
				object: "CR",
				subject: null,
				quantity: 0
			})
		})
		it("should return correct for dividends", () => {
			expect(parser("ger dividends 10")).to.include({
				verb: "dividend",
				object: null,
				subject: "GER",
				quantity: 10
			})
			expect(parser("ger d 10")).to.include({
				verb: "dividend",
				object: null,
				subject: "GER",
				quantity: 10
			})
			expect(parser("ger halfdividends 100")).to.include({
				verb: "halfdividend",
				subject: "GER",
				object: null,
				quantity: 100
			})
			expect(parser("ger h 100")).to.include({
				verb: "halfdividend",
				subject: "GER",
				object: null,
				quantity: 100
			})
		})
		it("should return correct for value", () => {
			expect(parser("ger value 10")).to.include({
				verb: "value",
				object: null,
				subject: "GER",
				quantity: 10
			})
			expect(parser("ger v word")).property("quantity").to.be.NaN
		})
		it("should return correct for bank size", () => {
			expect(parser("banksize 4000")).to.include({
				verb: "banksize",
				object: null,
				subject: null,
				quantity: 4000
			})
			expect(parser("b 4000")).to.include({
				verb: "banksize",
				object: null,
				subject: null,
				quantity: 4000
			})
			expect(parser("banksize £4000")).to.include({
				verb: "banksize",
				object: "£",
				subject: null,
				quantity: 4000
			})
			expect(parser("banksize word")).to.include({
				verb: "banksize",
				object: "WORD",
				subject: null,
				quantity: 0
			})
		})
		it("should return correct for bank", () => {
			expect(parser("bank")).to.include({
				verb: "bank",
				object: null,
				subject: null,
				quantity: 0
			})
			expect(parser("b")).to.include({
				verb: "bank",
				object: null,
				subject: null,
				quantity: 0
			})
		})
		it("should return correct for companies", () => {
			expect(parser("companies")).to.include({
				verb: "companies",
				object: null,
				subject: null,
				quantity: 0
			})
			expect(parser("c")).to.include({
				verb: "companies",
				object: null,
				subject: null,
				quantity: 0
			})
		})
		it("should return null for unexpected command", () => {
			expect(parser("not_a_proper_command")).to.include({
				verb: null,
				object: null,
				subject: null,
				quantity: 0
			})
			expect(parser("not_a_proper_command parameter and_another")).to.include({
				verb: null,
				object: null,
				subject: null,
				quantity: 0
			})
		})
	})
})
