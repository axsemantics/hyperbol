<template lang="pug">
.c-app-bar(v-if="boards")
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
		...mapState(['boards'])
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
	.boards
		display: flex
		flex-direction: column
</style>
