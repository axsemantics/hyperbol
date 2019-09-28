const WebSocket = require('ws')
const { Delta, applyOpsToState } = require('quidditch')
require('../shared/delta-types')

const app = {
	state: {
		boards: {
			test: new Delta().insert({_t: 'board', _id: 'test', cards: {}}).ops
		}
	},
	channels: {},
	init () {
		app.server = new WebSocket.Server({port: 8000, clientTracking: true})
		app.server.on('connection', (client, upgradeReq) => {
			console.log('new client')
			client.on('message', app.handleMessage.bind(this, client))
		})
	},
	destroy () {
		app.server.close()
	},
	send (client, payload) {
		if (client.readyState !== 1) // socket still open?
			return
		client.send(JSON.stringify(payload))
	},
	broadcast (sourceClient, payload) {
		for (const client of app.server.clients) {
			if (client === sourceClient || client.readyState !== 1) continue
			const message = JSON.stringify(payload)
			console.log('<=', message)
			client.send(message)
		}
	},
	handleMessage (client, rawMessage) {
		console.log('=>', rawMessage)
		const message = JSON.parse(rawMessage)
		const handlers = {
			auth: app.handleAuth,
			ping: app.handlePing,
			'ot:delta': app.handleOtDelta
		}
		if (handlers[message[0]]) {
			handlers[message[0]](client, message)
		}
	},
	handleAuth (client, message) {
		// TODO check token
		app.send(client, ['authenticated'])
		const payload = ['joined', {
			boards: app.state.boards,
			channels: Object.entries(app.channels).reduce((acc, [id, {lastRevision}]) => {
				acc[id] = {lastRevision}
				return acc
			}, {})
		}]
		app.send(client, payload)
	},
	handlePing (client, message) {
		app.send(client, ['pong', message[1]])
	},
	handleOtDelta (client, message) {
		const channelName = message[2]
		const {delta: deltaOps, rev} = message[3]
		let channel = app.channels[channelName]
		let delta = new Delta(deltaOps)
		if (!channel) {
			if (rev !== 0) return // TODO throw error
			app.channels[channelName] = {
				lastRevision: 0,
				deltas: []
			}
			channel = app.channels[channelName]
		} else {
			const revOffset = channel.lastRevision - rev
			if (revOffset > channel.deltas.length) return // TODO throw error
			for (let i = channel.deltas.length - revOffset; i < channel.deltas.length; i++) {
				delta = channel.deltas[i].transform(delta, true)
			}
		}

		// HERE ACTUAL THINGS HAPPEN
		if (channelName.startsWith('board:')) {
			app.handleBoardChange(channelName.substring(6), delta)
		}
		channel.lastRevision++
		channel.deltas.push(delta)
		if (channel.deltas.length > 100) {
			channel.deltas.shift()
		}
		app.send(client, ['success', message[1], {rev: channel.lastRevision}])
		app.broadcast(client, ['ot:delta', channelName, {delta: delta.ops, rev: channel.lastRevision}])
	},
	handleBoardChange (boardId, delta) {
		const board = app.state.boards[boardId]
		applyOpsToState(board, delta.ops)
	}
}

app.init()
