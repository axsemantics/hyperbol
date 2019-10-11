<template lang="pug">
#app
	app-bar
	router-view
</template>
<script>
import 'styles/global.styl'
import AppBar from 'components/app-bar'
export default {
	components: { AppBar },
	data () {
		return {
		}
	},
	computed: {},
	created () {},
	mounted () {
		this.$nextTick(() => {
		})
	},
	methods: {}
}
</script>
<style lang="stylus">
#app
	display: flex
	width: 100vw
	height: 100vh
</style>
