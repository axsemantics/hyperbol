import Vue from 'vue'
import Router from 'vue-router'
import Login from 'views/login.vue'
import App from './App'
import Board from 'views/board'
Vue.use(Router)

export default new Router({
	mode: 'history',
	routes: [{
		path: '/login',
		component: Login,
		meta: {onlyUnauthorized: true}
	}, {
		path: '/',
		component: App,
		meta: {requiresAuth: true},
		children: [{
			path: '/',
			name: 'home',
			component: Board
		}]
	}]
})
