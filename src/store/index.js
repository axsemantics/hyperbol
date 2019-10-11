import Vue from 'vue'
import Vuex from 'vuex'
import uuid from 'uuid/v4'
import api from 'lib/api'
import { Delta, applyOpsToState } from 'quidditch'
Vue.use(Vuex)

const OT_CHANNEL_REGEX = /(.*):(.*)/

export default new Vuex.Store({
	state: {
		user: {
			authenticated: false,
			token: null,
			profile: null
		},
		boards: null
	},
	mutations: {
		authenticate (state, token) {
			state.user.authenticated = true
			state.user.token = token
		},
		setProfile (state, profile) {
			state.user.profile = profile
		}
	},
	actions: {
		'quidditch::joined' ({state}, serverState) {
			state.boards = serverState.boards
		},
		'quidditch::ot:delta' ({state}, {channel, delta}) {
			const [matched, type, id] = channel.match(OT_CHANNEL_REGEX)
			if (!matched) return
			console.log(delta)
			switch (type) {
				case 'board':
					applyOpsToState(state.boards[id], delta.ops, Vue.set, Vue.delete)
					break
			}
		},
		addCard ({state}, {board, lane, order}) {
			const id = uuid()
			const card = {
				_t: 'card',
				lane,
				text: [],
				order
			}
			const delta = new Delta().retain(1, {subOps: {cards: new Delta().insert(id, {set: card}).ops}})
			applyOpsToState(state.boards[board._id], delta.ops, Vue.set, Vue.delete)
			api.quidditch.sendDelta(`board:${board._id}`, delta)
			return Promise.resolve(id)
		},
		updateCard ({state}, {board, card, update}) {
			const boardDelta = new Delta().retain(1, {subOps: {cards: new Delta().retain(card._id, {set: update}).ops}})
			console.log(boardDelta)
			api.quidditch.sendDelta(`board:${board._id}`, boardDelta)
			applyOpsToState(state.boards[board._id], boardDelta.ops, Vue.set, Vue.delete)
		},
		updateCardText ({state}, {board, card, delta}) {
			const boardDelta = new Delta().retain(1, {subOps: {cards: new Delta().retain(card._id, {subOps: {text: delta.ops}}).ops}})
			api.quidditch.sendDelta(`board:${board._id}`, boardDelta)
			applyOpsToState(state.boards[board._id], boardDelta.ops, Vue.set, Vue.delete)
		},
		deleteCard ({state}, {board, card}) {
			const boardDelta = new Delta().retain(1, {subOps: {cards: new Delta().delete(card._id).ops}})
			api.quidditch.sendDelta(`board:${board._id}`, boardDelta)
			applyOpsToState(state.boards[board._id], boardDelta.ops, Vue.set, Vue.delete)
		}
	}
})
