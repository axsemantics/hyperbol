import EventEmitter from 'events'
import jwtDecode from 'jwt-decode'
import moment from 'moment'
import config from 'config'

const SCOPES = 'email openid profile http://api.hyperbol/email'

const auth = {
	error: null,
	init () {
		// try parsing hash
		const queryParams = new URLSearchParams(window.location.hash.substring(1))
		const accessToken = queryParams.get('access_token')
		const idToken = queryParams.get('id_token')
		const error = queryParams.has('error') ? new Error(queryParams.get('error_description')) : null
		// don't show "login required" as error
		if (!['login_required', 'consent_required', 'interaction_required'].includes(queryParams.get('error'))) {
			auth.error = error
		}

		if (accessToken && idToken) {
			// TODO clear url
			console.log(jwtDecode(accessToken))

			localStorage.setItem('access_token', accessToken)
			localStorage.setItem('id_token', idToken)
			auth.token = idToken
			auth.accessToken = accessToken
			history.pushState('', document.title, window.location.pathname)
		} else if (!error && 'access_token' in localStorage) {
			const accessToken = localStorage.access_token
			const decodedToken = jwtDecode(accessToken)
			// check expiry
			const expiry = moment.unix(decodedToken.exp)
			const soon = moment().add(30, 'minutes')
			if (soon.isAfter(expiry)) {
				console.log('expired')
				debugger
				localStorage.removeItem('id_token')
				localStorage.removeItem('access_token')
				auth.silentAuth()
			} else {
				auth.token = localStorage.id_token
				auth.accessToken = accessToken
			}
		}
	},
	socialAuth (connection) {
		const params = {
			response_type: 'id_token token',
			client_id: config.auth.clientID,
			connection: connection,
			redirect_uri: window.location.origin,
			scope: SCOPES,
			audience: 'api.hyperbol',
			nonce: 'NOOONCE'
		}
		const url = `https://${config.auth.domain}/authorize?${new URLSearchParams(params).toString()}`
		window.location = url
	},
	silentAuth () {
		localStorage.setItem('redirectPath', `${window.location.pathname}${window.location.search}`)
		const params = new URLSearchParams({
			response_type: 'token',
			client_id: config.auth.clientID,
			redirect_uri: window.location.origin,
			scope: SCOPES,
			prompt: 'none'
		})
		const url = `https://${config.auth.domain}/authorize?${params.toString()}`
		window.location = url
	},
	getProfile () {
		return window.fetch(`https://${config.auth.domain}/userinfo`, {
			headers: {
				'content-type': 'application/json',
				'authorization': `Bearer ${auth.accessToken}`
			},
			method: 'POST'
		}).then((response) => {
			if (response.status === 200) {
				return response.json().then((profile) => {
					localStorage.setItem('profile', JSON.stringify(profile))
					return profile
				})
			} else if (response.status === 429) { // Too Many Requests, serve profile from localhost
				return localStorage.profile ? JSON.parse(localStorage.profile) : null
			} else {
				return Promise.reject(new Error(response.statusText))
			}
		})
	},
	logout (redirectUrl) {
		localStorage.removeItem('id_token')
		localStorage.removeItem('access_token')
		localStorage.removeItem('profile')
		let returnUrl = window.location.origin
		if (redirectUrl) {
			returnUrl += redirectUrl
		}
		window.location.href = `https://${config.auth.domain}/v2/logout?client_id=bufw8P1GSHgOO5g1QVn7U3hq2HoZJSHW&returnTo=${encodeURIComponent(returnUrl)}`
	}
}

Object.assign(auth, EventEmitter.prototype)
export default auth
