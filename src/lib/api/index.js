/* global DEVELOPMENT */

import { QuidditchClient } from 'quidditch'
import '../../../shared/delta-types'
import config from 'config'
import store from 'store'
import auth from 'lib/api/auth'

const api = {
	init () {
		console.log('init quidditch')
		api.quidditch = new QuidditchClient(`${config.api.baseUrl}`, {token: auth.accessToken})
		api.quidditch.on('closed', () => {
			console.warn('quidditch socket closed')
		})

		api.quidditch.on('error', (error) => {
			console.error('quidditch', error)
		})

		api.quidditch.on('warning', (warning) => {
			console.warn('quidditch', warning)
		})

		api.quidditch.on('joined', (state) => {
			store.dispatch(`quidditch::joined`, state)
		})
		api.quidditch.on('message', (message) => {
			let [name, ...data] = message
			if (data.length === 1) data = data[0]
			if (store._actions[`quidditch::${name}`]) {
				store.dispatch(`quidditch::${name}`, data)
			}
		})
		api.quidditch.on('ot:delta', (channel, delta) => {
			store.dispatch(`quidditch::ot:delta`, {channel, delta})
		})
		api.quidditch.on('log', ({direction, data}) => {
			let payload = JSON.parse(data)
			const action = payload.shift()
			let correlationId
			if (Number.isInteger(payload[0])) {
				correlationId = payload.shift()
			}
			if (['ping', 'pong'].includes(action)) return // mute pingpong
			// logrocket.log('quidditch', direction === 'send' ? '<<=' : '=>>', action, correlationId, ...payload)
			if (DEVELOPMENT) {
				console.log(
					`%c${direction === 'send' ? '<<=' : '=>>'} %c${'quidditch'.padEnd(11)} %c${action.padEnd(32)} %c${String(correlationId || '').padEnd(6)}`,
					direction === 'send' ? 'color: blue' : 'color: green',
					'color: grey',
					'color: purple',
					'color: darkslategray',
					...payload
				)
			}
		})
	}
}

export default api
