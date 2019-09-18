import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
	state: {
		user: {
			authenticated: false,
			token: null,
			profile: null
		}
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
		authenticate () {

		},
		setProfile () {

		}
	}
})
