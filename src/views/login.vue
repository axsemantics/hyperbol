<template lang="pug">
.view-login
	.auth-error(v-if="authError") {{ authError }}
	bunt-button.btn-social.btn-social-google(@click="socialAuth('google-oauth2')") Login with google
	bunt-button.btn-social.btn-social-github(@click="socialAuth('github')") Login with github
</template>
<script>
import auth from 'lib/api/auth'

export default {
	components: {},
	data () {
		return {
		}
	},
	computed: {
		authError () {
			return auth.error?.message
		},
	},
	created () {},
	mounted () {
		this.$nextTick(() => {
		})
	},
	methods: {
		socialAuth (connection) {
			auth.socialAuth(connection) // redirects automatically
		}
	}
}
</script>
<style lang="stylus">
@import '~variables'

.view-login
	height: 100%
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	padding-bottom: 48px
	> *
		flex: none
	.auth-error
		background-color: $clr-danger
		color: $clr-primary-text-dark
		font-size: 18px
		// font-weight: 600
		text-transform: uppercase
		align-self: stretch
		padding: 16px
		text-align: center
		margin-bottom: 16px
	.btn-social
		position: relative
		width: 240px
		height: 52px
		margin-bottom: 16px
		.bunt-button-content
			padding-left: 42px
		&::before
			position: absolute
			left: 8px
			height: 52px
			width: 52px
			content: ''
			display: block
			background-repeat: no-repeat
			background-size: 60%
			background-position: center center
	.btn-social-google
		button-style(color: #4285F4, text-color: $clr-primary-text-dark)
		&::before
			background-image: url('../assets/images/social-logos/google.svg')
	.btn-social-github
		button-style(color: #333)
		&::before
			background-image: url('../assets/images/social-logos/github.svg')
</style>
