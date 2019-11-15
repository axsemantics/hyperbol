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
		users: {},
		boards: null,
		standups: null
	},
	getters: {
		userId (state) {
			return state.user.profile?.sub
		}
	},
	mutations: {
		authenticate (state, token) {
			state.user.authenticated = true
			state.user.token = token
		}
	},
	actions: {
		'quidditch::joined' ({state, getters}, serverState) {
			state.boards = serverState.boards.reduce((acc, board) => {
				acc[board[0].insert._id] = board
				return acc
			}, {})
			for (const user of serverState.users) {
				if (user.id === getters.userId) continue
				state.users[user.id] = user
			}
			state.standups = serverState.standups.reduce((acc, standup) => {
				acc[standup.board] = standup
				return acc
			}, {})
			if (state.user.profile) {
				api.quidditch.call('user:update', {profile: state.user.profile})
			}
		},
		'quidditch::ot:delta' ({state}, {channel, delta}) {
			const [matched, type, id] = channel.match(OT_CHANNEL_REGEX)
			if (!matched) return
			switch (type) {
				case 'board':
					applyOpsToState(state.boards[id], delta.ops, Vue.set, Vue.delete)
					break
			}
		},
		'quidditch::user:update' ({state}, user) {
			Vue.set(state.users, user.id, user)
		},
		'quidditch::standup:start' ({state}, standup) {
			Vue.set(state.standups, standup.board, standup)
		},
		'quidditch::standup:join' ({state}, {board, user, join}) {
			const participant = state.standups[board].participants.find(({user: userId}) => user === userId)
			participant.joined = join
		},
		setProfile ({state}, profile) {
			state.user.profile = profile
			state.users[profile.sub] = {
				id: profile.sub,
				profile
			}
			if (api.quidditch.socketState === 'open') {
				api.quidditch.call('user:update', {profile: state.user.profile})
			}
		},
		createBoard ({state, getters}) {
			api.quidditch.call('board:create',
				[{insert: {
					_t: 'board',
					_id: uuid(),
					name: 'New Board',
					users: [getters.userId],
					cards: {}
				}}]
			).then(board => {
				Vue.set(state.boards, board[0].insert._id, board)
			})
		},
		updateBoard ({state}, {board, update}) {
			const boardDelta = new Delta().retain(1, {set: update})
			api.quidditch.sendDelta(`board:${board._id}`, boardDelta)
			applyOpsToState(state.boards[board._id], boardDelta.ops, Vue.set, Vue.delete)
		},
		joinBoard ({state, getters}, {board}) {
			const users = board.users.slice()
			users.push(getters.userId) // TODO not multiplayer-safe
			const boardDelta = new Delta().retain(1, {set: {users}})
			api.quidditch.sendDelta(`board:${board._id}`, boardDelta)
			applyOpsToState(state.boards[board._id], boardDelta.ops, Vue.set, Vue.delete)
		},
		addCard ({state, getters}, {board, lane, order}) {
			const id = uuid()
			const card = {
				_t: 'card',
				lane,
				text: [],
				order,
				owner: getters.userId
			}
			const delta = new Delta().retain(1, {subOps: {cards: new Delta().insert(id, {set: card}).ops}})
			api.quidditch.sendDelta(`board:${board._id}`, delta)
			applyOpsToState(state.boards[board._id], delta.ops, Vue.set, Vue.delete)
			return Promise.resolve(id)
		},
		updateCard ({state}, {board, card, update}) {
			const boardDelta = new Delta().retain(1, {subOps: {cards: new Delta().retain(card._id, {set: update}).ops}})
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
			console.log(state.boards[board._id])
		},
		async startStandup ({state}, {board}) {
			const standup = await api.quidditch.call('standup:start', {board: board._id})
			Vue.set(state.standups, standup.board, standup)
		},
		async joinStandup ({state}, {board, user, join}) {
			await api.quidditch.call('standup:join', {board: board._id, user, join})
			const participant = state.standups[board._id].participants.find(({user: userId}) => user === userId)
			participant.joined = join
		}
	}
})
