import Vue from 'vue'
import router from 'router'
import store from 'store'
import Buntpapier from 'buntpapier'

import api from 'lib/api'
import auth from 'lib/api/auth'

Vue.config.productionTip = false
Vue.use(Buntpapier)

router.beforeEach((to, from, next) => {
	if (to.matched.some(record => record.meta.requiresAuth) && !store.state.user.authenticated) {
		// store the url for later redirect. this has to survive two hard navigations from auth0.
		if (window.location.pathname !== '/login') {
			localStorage.setItem('redirectPath', `${window.location.pathname}${window.location.search}`)
		}
		next(`/login${window.location.search}`)
	} else if (store.state.user.authenticated && to.matched.some(record => record.meta.onlyUnauthorized)) {
		next('/')
	} else {
		next()
	}
})

auth.init() // parse url to check for callback auth
if (auth.token) {
	store.commit('authenticate', auth.token)
	api.init()
	auth.getProfile().then(profile => {
		store.dispatch('setProfile', profile)
	})
}

const app = new Vue({
	router,
	store,
	render: h => h('router-view')
}).$mount('#app')

window.app = app
