module.exports = {
	presets: [
		'@vue/app'
	],
	plugins: [
		['@babel/plugin-proposal-optional-chaining', { 'loose': false }],
		['@babel/plugin-proposal-nullish-coalescing-operator', { 'loose': false }],
		'@babel/plugin-syntax-dynamic-import',
		'@babel/plugin-proposal-json-strings'
	]
}
