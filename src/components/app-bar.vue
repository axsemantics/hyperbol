<template lang="pug">
.c-app-bar(v-if="boards && user.profile")
	img.avatar(:src="user.profile.picture")
	bunt-button(@click="$store.dispatch('createBoard')") new board
	.boards
		router-link.board(v-for="board in boards", :to="{name: 'board', params: {boardId: board[0].insert._id}}") {{ board[0].insert.name }}
</template>
<script>
import { mapState } from 'vuex'

export default {
	components: {},
	data () {
		return {
		}
	},
	computed: {
		...mapState(['user', 'boards'])
	},
	created () {},
	mounted () {
		this.$nextTick(() => {
		})
	},
	methods: {}
}
</script>
<style lang="stylus">
@import '~variables'

.c-app-bar
	width: 300px
	flex: none
	card()
	display: flex
	flex-direction: column
	align-items: center
	z-index: 1000
	.avatar
		height: 52px
		border-radius: 50%
		margin: 16px
	.boards
		margin: 16px
		display: flex
		flex-direction: column
		.board
			font-size: 18px
</style>
