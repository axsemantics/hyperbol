const util = require('util')
const WebSocket = require('ws')
const { Delta, applyOpsToState } = require('quidditch')
const jwt = require('jsonwebtoken')
const JwksClient = require('jwks-rsa')
require('../shared/delta-types')
const { User, Board } = require('./db')

const config = require('./config.js')

const jwksClient = JwksClient({
	jwksUri: `https://${config.auth.domain}/.well-known/jwks.json`,
	cache: true
})

const app = {
	state: {
		users: {},
		boards: {
			// test: new Delta().insert({_t: 'board', _id: 'test', name: 'Test', cards: {}}).ops
		}
	},
	channels: {},
	async init () {
		app.server = new WebSocket.Server({port: 8000, clientTracking: true})
		app.server.on('connection', (client, upgradeReq) => {
			console.log('new client')
			client.on('message', app.handleMessage.bind(this, client))
		})
		Board.scan().exec().then(results => {
			console.log('loaded boards', results)
			app.state.boards = results.reduce((acc, board) => {
				acc[board.id] = JSON.parse(board.delta)
				return acc
			}, {})
		})
		User.scan().exec().then(results => {
			console.log('loaded users', results)
			app.state.users = results.reduce((acc, user) => {
				acc[user.id] = {id: user.id, profile: JSON.parse(user.profile)}
				return acc
			}, {})
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
	async handleMessage (client, rawMessage) {
		console.log('=>', rawMessage)
		const message = JSON.parse(rawMessage)
		const specialHandlers = {
			auth: app.handleAuth,
			ping: app.handlePing,
			'ot:delta': app.handleOtDelta
		}
		const normalHandlers = {
			'user:update': app.handleUserUpdate,
			'board:create': app.handleBoardCreate
		}
		if (specialHandlers[message[0]]) {
			specialHandlers[message[0]](client, message)
		}
		if (normalHandlers[message[0]]) {
			// TODO error handling
			const result = await normalHandlers[message[0]](client, message)
			app.send(client, ['success', message[1], result])
			app.broadcast(client, [message[0], result])
		}
	},
	async handleAuth (client, message) {
		const token = message[1].token
		const getKey = function (header, callback) {
			jwksClient.getSigningKey(header.kid, function (err, key) {
				if (err) callback(err)
				var signingKey = key.publicKey || key.rsaPublicKey
				callback(null, signingKey)
			})
		}
		const decodedToken = await util.promisify(jwt.verify)(token, getKey, {
			algorithms: ['RS256'],
			audience: config.auth.audience,
			issuer: config.auth.issuer
		})
		client.userId = decodedToken.sub
		app.send(client, ['authenticated'])
		const payload = ['joined', {
			users: Object.values(app.state.users),
			boards: Object.values(app.state.boards),
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
	async handleUserUpdate (client, message) {
		const id = client.userId
		const profile = message[2].profile
		const user = new User({
			id,
			profile: JSON.stringify(profile)
		})
		await user.save()
		app.state.users[id] = {id, profile}
		return app.state.users[id]
	},
	handleBoardChange (boardId, delta) {
		const board = app.state.boards[boardId]
		applyOpsToState(board, delta.ops)
		// just fire off a save
		Board.update({
			id: boardId,
			delta: JSON.stringify(board)
		})
	},
	async handleBoardCreate (client, message) {
		const data = message[2]
		const id = data[0].insert._id
		if (app.state.boards[id]) throw new Error('id already taken!')
		const board = new Board({
			id,
			delta: JSON.stringify(data)
		})
		await board.save()
		app.state.boards[id] = data
		return app.state.boards[id]
	}
}

app.init()
