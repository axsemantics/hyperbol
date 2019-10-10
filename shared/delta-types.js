const { setSubtypes, BASE_TYPES } = require('quidditch')

setSubtypes({
	board: {
		name: String,
		cards: BASE_TYPES.DELTA_MAP
	},
	card: {
		text: BASE_TYPES.DELTA,
		assignee: String,
		lane: String,
		order: String
	},
})
