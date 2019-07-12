"use strict"

const usage = () => {
	const usage = `
^!18SH Commands^:

Player and company information:
\t^Wholdings^ – Show player cash and share holdings.
\t^Wvalues^ – Show player cash and share values.
\t^Wcompanies^ – Show company values and share ownership.
\t^Wbank^ – Show the money remaining in the bank.

Game actions:
\t<player> ^Wbuy^ <quantity> <company> – Have player buy company shares.
\t<player> ^Wbuy^ <quantity> <company> @<price> – Have player buy company shares at a specific price.
\t<player> ^Wbuy^ <quantity> <company> @<price> from <source> – Have player buy company shares at a specific price from specific source.
\t<player> ^Wsell^ <quantity> <company> @<price> – Have player sell company shares.
\t<company> ^Wdividend^ <amount per share> – Have company pay a dividend to shareholders.
\t<company> ^Whalfdividend^ <total amount> – Have company pay a half dividend to shareholders[1][2].
\t<company> ^Wvalue^ <amount> – Set company share value.
\t<company> ^Wfloat^ <amount> – Start a company and give it cash from the bank.
\t^Wclose^ <company> – Removes company cash and shares from play.
\t<player|company> ^Wgive^ <amount> to <player|company> – Give cash from someone to someone[2].
\t<player|company> ^Wcash^ <amount> – Adjust player or company[2] cash.
\t^Wnext^ <SR|OR> – Moves the game to next SR or OR.
\t^Wbanksize^ <currency symbol><amount> – Set the bank size and optionally set the currency.

1: Retain half (rounded down to nearest ten dollars) in company, distribute half to shares.
2: In order to adjust company cash, company must be floated first. Otherwise 18SH will assume the target is a player.

Game management:
\t^WlistGames^ – List all available games.
\t^Wopen^ <game> – Open a game.
\t^Wdelete^ <game> – Delete game permanently.
\t^Wstart^ <game> – Start a new game.

Other commands:
\t^Wquit^:, ^Wexit^ – Leave the game.
\t^Wundo^ – Undo the last game state changing command.
	`.trim()
	return `\n${usage}\n\n`
}

module.exports = usage
