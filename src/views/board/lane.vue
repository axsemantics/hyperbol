<template lang="pug">
.c-lane
	.lane-header {{ lane }}
		bunt-button(@click="addCard") add card
	.cards
		card(v-for="card of cards", :key="card.id", :card="card", :board="board")
</template>
<script>
import Card from './card'
export default {
	props: {
		lane: String,
		board: Object
	},
	components: { Card },
	data () {
		return {
		}
	},
	computed: {
		cards () {
			return Object.values(this.board.cards).filter(card => card.lane === this.lane)
		}
	},
	created () {},
	mounted () {
		this.$nextTick(() => {
		})
	},
	methods: {
		addCard () {
			this.$store.dispatch('addCard', {board: this.board, lane: this.lane})
		}
	}
}
</script>
<style lang="stylus">
@import '~variables'

.c-lane
	width: 300px
	padding-top: 32px
	.lane-header
		text-transform: uppercase
		color: $clr-secondary-text-light
		font-size: 18px
		display: flex
		justify-content: space-between
		align-items: center
		margin: 0 16px
	&:not(:last-child)
		border-right: border-separator()
	.bunt-button
		button-style(style: clear)
	.cards
		padding: 16px
</style>
