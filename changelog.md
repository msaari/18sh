# Changelog for 18SH

## TODO
- Handling company cash.

## 1.1.1 – 2019-06-23
- Removed one console.log() that was left in the code.

## 1.1.0 – 2019-06-23
- Added: Instead of sum, dividends can be now paid as `prev` to repeat the
previous dividend payment for the company.
- Added: Automated tests.
- Added: Player cash can be adjusted with `give` and `take`.
- Added: Bank size can be set with `banksize 4000` and the remaining bank
checked with `bank`.
- Added: Status bar shows total cash in play. Once the bank size is set, the
status bar shows instead the remaining bank size.
- Added: `help` command.
- Added: `companies` shows a list of companies with their share values and
share ownership.
- Changed: The status bar now shows players with the format "NAME: $CASH
($VALUE)" instead of "NAME: $VALUE".

## 1.0.0 - 2019-06-17
- First released version!